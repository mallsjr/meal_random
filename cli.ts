import { Command } from "commander";
import Redis from "ioredis";

const program = new Command();
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

// Generate a unique meal ID
const generateId = async () => {
  return await redis.incr("meal_id_counter");
};

// Add a meal
program
  .command("add <meal> <image_url>")
  .description("Add a new meal")
  .action(async (meal, image_url) => {
    const id = await generateId();
    const mealData = { id, meal, image_url };

    await redis.hset(`meal:${id}`, mealData);
    await redis.sadd("meals", id.toString());

    console.log(`Added meal: ${meal} with ID ${id}`);
  });

// Remove a meal by ID
program
  .command("remove <id>")
  .description("Remove a meal by ID")
  .action(async (id) => {
    const exists = await redis.sismember("meals", id);
    if (!exists) {
      console.log(`Meal with ID ${id} not found.`);
      return;
    }

    await redis.del(`meal:${id}`);
    await redis.srem("meals", id);
    console.log(`Removed meal with ID ${id}`);
  });

// List all meals
program
  .command("list")
  .description("List all meals")
  .action(async () => {
    const mealIds = await redis.smembers("meals");
    const meals = await Promise.all(
      mealIds.map(async (id) => await redis.hgetall(`meal:${id}`))
    );

    console.log(meals);
  });

// Modify a meal by ID
program
  .command("modify <id> <newMeal> <newImageUrl>")
  .description("Modify a meal by ID")
  .action(async (id, newMeal, newImageUrl) => {
    const exists = await redis.sismember("meals", id);
    if (!exists) {
      console.log(`Meal with ID ${id} not found.`);
      return;
    }

    await redis.hset(`meal:${id}`, { meal: newMeal, image_url: newImageUrl });
    console.log(`Updated meal with ID ${id}`);
  });

// Close Redis connection on exit
program.parseAsync(process.argv).finally(() => redis.quit());
