import Redis from "ioredis";
import fs from "fs-extra";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const filePath = "public/meals.json";
const MEAL_LIST_KEY = "meals";

async function migrateMeals() {
  try {
    const meals = await fs.readJSON(filePath);
    
    if (!Array.isArray(meals) || meals.length === 0) {
      console.log("No meals found in meals.json.");
      redis.quit();
      return;
    }

    await redis.del(MEAL_LIST_KEY); // Clear existing meal list
    await redis.set("meal:id", "0"); // Reset meal ID counter

    for (const meal of meals) {
      const id = await redis.incr("meal:id"); // Auto-increment ID
      const mealData = { id, ...meal };

      await redis.hset(`meal:${id}`, mealData);
      await redis.sadd(MEAL_LIST_KEY, id.toString());

      console.log(`Migrated meal [ID ${id}]: ${meal.meal}`);
    }

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Error migrating meals:", error);
  } finally {
    redis.quit();
  }
}

migrateMeals();
