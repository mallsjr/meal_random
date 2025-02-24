import { serve } from "bun";
import Redis from "ioredis";

const PORT = 3000;
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

// Function to fetch meals from Redis
async function getMeals() {
  const mealIds = await redis.smembers("meals");
  const meals = await Promise.all(
    mealIds.map(async (id) => await redis.hgetall(`meal:${id}`))
  );
  return meals;
}

// Function to get a random meal
async function getRandomMeal() {
  const meals = await getMeals();
  if (meals.length === 0) {
    return "<h2>No meals available</h2>";
  }

  const meal = meals[Math.floor(Math.random() * meals.length)];
  return `<h2>${meal.meal}</h2>
          <img src="${meal.image_url}" alt="${meal.meal}" id="meal-img">`;
}

// Create Bun server
serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // Serve HTML page
    if (url.pathname === "/") {
      return new Response(Bun.file("./views/index.html"), {
        headers: { "Content-Type": "text/html" },
      });
    }

    // Serve meals from Redis
    if (url.pathname === "/meals.json") {
      try {
        const meals = await getMeals();
        return new Response(JSON.stringify(meals), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error fetching meals from Redis:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch meals" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Handle random meal request (HTMX)
    if (url.pathname === "/random-meal") {
      try {
        const mealHTML = await getRandomMeal();
        return new Response(mealHTML, { headers: { "Content-Type": "text/html" } });
      } catch (error) {
        console.error("Error fetching random meal:", error);
        return new Response("<h2>Error fetching meal</h2>", {
          status: 500,
          headers: { "Content-Type": "text/html" },
        });
      }
    }

    return new Response("404 Not Found", { status: 404 });
  },
});

console.log(`Server running on http://localhost:${PORT}`);
