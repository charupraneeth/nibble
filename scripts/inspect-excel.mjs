import XLSX from 'xlsx';
import fs from 'fs';

// Read the Excel file
const workbook = XLSX.readFile('INDIAN_FOOD_COMPOSITION.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const data = XLSX.utils.sheet_to_json(worksheet);

console.log('Total rows:', data.length);
console.log('\nColumn names:', Object.keys(data[0]));
console.log('\nFirst 3 rows:');
console.log(JSON.stringify(data.slice(0, 3), null, 2));

// Save sample to file for inspection
fs.writeFileSync('food-data-sample.json', JSON.stringify(data.slice(0, 10), null, 2));
console.log('\nSaved first 10 rows to food-data-sample.json');
