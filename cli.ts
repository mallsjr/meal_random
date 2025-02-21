import { Command } from "commander";
import fs from "fs-extra";

const program = new Command();
const filePath = "public/meals.json";

// Load meals data
const loadMeals = () => {
  try {
    return fs.readJSONSync(filePath);
  } catch (err) {
    return [];
  }
};

// Save meals data
const saveMeals = (meals: any) => {
  fs.writeJSONSync(filePath, meals, { spaces: 2 });
};

// Generate a new unique ID
const getNextId = (meals: any[]) => {
  return meals.length > 0 ? Math.max(...meals.map(m => m.id)) + 1 : 1;
};

// Add a meal
program
  .command("add <meal> <image_url>")
  .description("Add a new meal")
  .action((meal, image_url) => {
    const meals = loadMeals();
    const newMeal = { id: getNextId(meals), meal, image_url };
    meals.push(newMeal);
    saveMeals(meals);
    console.log(`Added: ${meal} (ID: ${newMeal.id})`);
  });

// Remove a meal by ID
program
  .command("remove <id>")
  .description("Remove a meal by ID")
  .action((id) => {
    let meals = loadMeals();
    const newMeals = meals.filter((m: any) => m.id !== parseInt(id));
    saveMeals(newMeals);
    console.log(`Removed meal with ID: ${id}`);
  });

// List all meals
program
  .command("list")
  .description("List all meals")
  .action(() => {
    const meals = loadMeals();
    console.log(meals);
  });

// Modify a meal by ID
program
  .command("modify <id> <newMeal> <newImageUrl>")
  .description("Modify a meal by ID")
  .action((id, newMeal, newImageUrl) => {
    let meals = loadMeals();
    const index = meals.findIndex((m: any) => m.id === parseInt(id));
    if (index !== -1) {
      meals[index] = { id: parseInt(id), meal: newMeal, image_url: newImageUrl };
      saveMeals(meals);
      console.log(`Updated meal with ID ${id} -> ${newMeal}`);
    } else {
      console.log(`Meal with ID ${id} not found.`);
    }
  });

program.parse(process.argv);
