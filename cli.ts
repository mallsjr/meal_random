import { Command } from "commander";
import Redis from "ioredis";

const program = new Command();
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

const MEAL_LIST_KEY = "meals"; // Key for storing meal IDs

// Generate a unique ID for meals
const generateId = async (): Promise<number> => {
  return await redis.incr("meal:id"); // Auto-incrementing ID
};

// Add a meal
program
  .command("add <meal> <image_url>")
  .description("Add a new meal")
  .action(async (meal, image_url) => {
    const id = await generateId();
    const mealData = { id, meal, image_url };

    await redis.hset(`meal:${id}`, mealData);
    await redis.sadd(MEAL_LIST_KEY, id.toString());

    console.log(`Added meal [ID ${id}]: ${meal}`);
    redis.quit();
  });

// Remove a meal
program
  .command("remove <id>")
  .description("Remove a meal by ID")
  .action(async (id) => {
    const exists = await redis.exists(`meal:${id}`);
    if (!exists) {
      console.log(`Meal with ID ${id} not found.`);
      redis.quit();
      return;
    }

    await redis.del(`meal:${id}`);
    await redis.srem(MEAL_LIST_KEY, id);

    console.log(`Removed meal with ID ${id}`);
    redis.quit();
  });

// List all meals
program
  .command("list")
  .description("List all meals")
  .action(async () => {
    const mealIds = await redis.smembers(MEAL_LIST_KEY);
    const meals = await Promise.all(
      mealIds.map(async (id) => redis.hgetall(`meal:${id}`))
    );

    console.log(meals);
    redis.quit();
  });

// Modify a meal
program
  .command("modify <id> <newMeal> <newImageUrl>")
  .description("Modify a meal by ID")
  .action(async (id, newMeal, newImageUrl) => {
    const exists = await redis.exists(`meal:${id}`);
    if (!exists) {
      console.log(`Meal with ID ${id} not found.`);
      redis.quit();
      return;
    }

    await redis.hset(`meal:${id}`, { id, meal: newMeal, image_url: newImageUrl });

    console.log(`Updated meal [ID ${id}]: ${newMeal}`);
    redis.quit();
  });

program.parse(process.argv);
