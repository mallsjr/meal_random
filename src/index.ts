import { readFile } from "fs/promises";
import { serve } from "bun";

const PORT = 3000;

// Load meals from the JSON file
const meals = JSON.parse(await readFile("./public/meals.json", "utf-8"));

// Function to get a random meal
function getRandomMeal() {
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
      return new Response(Bun.file("./views/index.html"), { headers: { "Content-Type": "text/html" } });
    }

    // Serve meals JSON file
    if (url.pathname === "/meals.json") {
      return new Response(JSON.stringify(meals), { headers: { "Content-Type": "application/json" } });
    }

    // Handle random meal request (HTMX)
    if (url.pathname === "/random-meal") {
      return new Response(getRandomMeal(), { headers: { "Content-Type": "text/html" } });
    }

    return new Response("404 Not Found", { status: 404 });
  },
});

console.log(`Server running on http://localhost:${PORT}`);
