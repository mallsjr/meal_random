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

// Add a meal
program
  .command("add <meal> <image_url>")
  .description("Add a new meal")
  .action((meal, image_url) => {
    const meals = loadMeals();
    meals.push({ meal, image_url });
    saveMeals(meals);
    console.log(`Added: ${meal}`);
  });

// Remove a meal
program
  .command("remove <meal>")
  .description("Remove a meal")
  .action((meal) => {
    let meals = loadMeals();
    const newMeals = meals.filter((m: any) => m.meal !== meal);
    saveMeals(newMeals);
    console.log(`Removed: ${meal}`);
  });

// List all meals
program
  .command("list")
  .description("List all meals")
  .action(() => {
    const meals = loadMeals();
    console.log(meals);
  });

// Modify a meal
program
  .command("modify <oldMeal> <newMeal> <newImageUrl>")
  .description("Modify a meal")
  .action((oldMeal, newMeal, newImageUrl) => {
    let meals = loadMeals();
    const index = meals.findIndex((m: any) => m.meal === oldMeal);
    if (index !== -1) {
      meals[index] = { meal: newMeal, image_url: newImageUrl };
      saveMeals(meals);
      console.log(`Updated: ${oldMeal} -> ${newMeal}`);
    } else {
      console.log("Meal not found.");
    }
  });

program.parse(process.argv);
