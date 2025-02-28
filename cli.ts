import { Command } from "commander";
import Redis from "ioredis";

const program = new Command();
const redis = new Redis("redis://localhost:6379");

// Generate a unique meal ID
const generateId = async () => {
  return await redis.incr("meal_id_counter");
};

// Fetch a random meal from TheMealDB API
async function fetchRandomMeal() {
  try {
    const response = await fetch("https://www.themealdb.com/api/json/v1/1/random.php");
    const data = await response.json();

    if (!data.meals || data.meals.length === 0) {
      console.log("Failed to fetch a random meal.");
      return null;
    }

    const meal = data.meals[0];

    // Extract ingredients and measurements dynamically
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ingredient && ingredient.trim()) {
        ingredients.push({ ingredient, measure: measure || "" });
      }
    }

    return {
      name: meal.strMeal,
      image_url: meal.strMealThumb,
      ingredients,
    };
  } catch (error) {
    console.error("Error fetching meal from TheMealDB:", error);
    return null;
  }
}

// Add a meal manually
program
  .command("add <meal> <image_url> [ingredients...]")
  .description("Add a new meal with optional ingredients")
  .action(async (meal, image_url, ingredientsArr) => {
    const id = await generateId();
    const ingredients = ingredientsArr.map((ing) => ({ ingredient: ing, measure: "" }));

    const mealData = {
      id,
      meal,
      image_url,
      ingredients: JSON.stringify(ingredients), // Store as JSON string
    };

    await redis.hset(`meal:${id}`, mealData);
    await redis.sadd("meals", id.toString());

    console.log(`Added meal: ${meal} with ID ${id}`);
  });

// Add a random meal from TheMealDB API
program
  .command("add-random")
  .description("Fetch a random meal from TheMealDB and add it to Redis")
  .action(async () => {
    const meal = await fetchRandomMeal();
    if (!meal) return;

    const id = await generateId();
    const mealData = {
      id,
      meal: meal.name,
      image_url: meal.image_url,
      ingredients: JSON.stringify(meal.ingredients),
    };

    await redis.hset(`meal:${id}`, mealData);
    await redis.sadd("meals", id.toString());

    console.log(`Added random meal: ${meal.name} (ID: ${id})`);
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
      mealIds.map(async (id) => {
        const meal = await redis.hgetall(`meal:${id}`);
        return {
          ...meal,
          ingredients: JSON.parse(meal.ingredients || "[]"), // Parse back ingredients
        };
      })
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