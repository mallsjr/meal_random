import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import Redis from "ioredis";

const PORT = 3000;
// const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const redis = new Redis("redis://meal-redis:6379");

const app = new Hono();

// Function to fetch meals from Redis
async function getMeals() {
  const mealIds = await redis.smembers("meals");
  const meals = await Promise.all(
    mealIds.map(async (id) => {
      const meal = await redis.hgetall(`meal:${id}`);

      return {
        ...meal,
        ingredients: JSON.parse(meal.ingredients || "[]"), // Parse stored ingredients
      };
    })
  );
  return meals;
}

// Function to get a random meal with ingredients
async function getRandomMeal() {
  const meals = await getMeals();
  if (meals.length === 0) {
    return "<h2>No meals available</h2>";
  }

  const meal = meals[Math.floor(Math.random() * meals.length)];
  
  // Create an ingredients list
  const ingredientsList = meal.ingredients
    .map((ing) => `<li>${ing.measure} ${ing.ingredient}</li>`)
    .join("");

  return `
    <h2>${meal.meal}</h2>
    <img src="${meal.image_url}" alt="${meal.meal}" id="meal-img">
    <h3>Ingredients:</h3>
    <ul>${ingredientsList}</ul>
  `;
}

// Serve the main HTML page
app.get("/", serveStatic({ path: "./views/index.html" }));

// Serve all meals from Redis
app.get("/meals.json", async (c) => {
  try {
    const meals = await getMeals();
    return c.json(meals);
  } catch (error) {
    console.error("Error fetching meals from Redis:", error);
    return c.json({ error: "Failed to fetch meals" }, 500);
  }
});

// Handle random meal request (HTMX)
app.get("/random-meal", async (c) => {
  try {
    const mealHTML = await getRandomMeal();
    return c.html(mealHTML);
  } catch (error) {
    console.error("Error fetching random meal:", error);
    return c.html("<h2>Error fetching meal</h2>", 500);
  }
});

// Start the server
console.log(`Server running on http://localhost:${PORT}`);
export default {
  port: PORT,
  fetch: app.fetch,
};