import XLSX from 'xlsx';
import fs from 'fs';

// Read the Excel file
const workbook = XLSX.readFile('INDIAN_FOOD_COMPOSITION.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log(`Processing ${data.length} food items...`);

// Convert to optimized format for the app
const optimizedFoods = data.map((item) => ({
    id: item.food_code,
    name: item.food_name,

    // Per 100g nutrition values
    calories: Math.round(item.energy_kcal || 0),
    protein: Math.round((item.protein_g || 0) * 10) / 10,
    carbs: Math.round((item.carb_g || 0) * 10) / 10,
    fat: Math.round((item.fat_g || 0) * 10) / 10,
    fiber: Math.round((item.fibre_g || 0) * 10) / 10,

    // Serving information
    servingUnit: item.servings_unit || 'serving',
    servingCalories: Math.round(item.unit_serving_energy_kcal || 0),
    servingProtein: Math.round((item.unit_serving_protein_g || 0) * 10) / 10,
    servingCarbs: Math.round((item.unit_serving_carb_g || 0) * 10) / 10,
    servingFat: Math.round((item.unit_serving_fat_g || 0) * 10) / 10,

    // Source
    source: item.primarysource || 'unknown',
}));

// Save full database
fs.writeFileSync(
    'src/data/indian-foods.json',
    JSON.stringify(optimizedFoods, null, 2)
);

console.log(`✅ Saved ${optimizedFoods.length} foods to src/data/indian-foods.json`);

// Create a search index (just names and IDs for quick lookup)
const searchIndex = optimizedFoods.map(f => ({
    id: f.id,
    name: f.name.toLowerCase(),
}));

fs.writeFileSync(
    'src/data/food-search-index.json',
    JSON.stringify(searchIndex, null, 2)
);

console.log(`✅ Created search index with ${searchIndex.length} entries`);

// Show some stats
const categories = {
    beverages: optimizedFoods.filter(f => f.name.toLowerCase().includes('tea') || f.name.toLowerCase().includes('coffee') || f.name.toLowerCase().includes('juice')).length,
    total: optimizedFoods.length,
};

console.log('\n📊 Database Stats:');
console.log(`Total foods: ${categories.total}`);
console.log(`\nSample foods:`);
optimizedFoods.slice(0, 5).forEach(f => {
    console.log(`  - ${f.name}: ${f.calories} cal (per 100g)`);
});
