/**
 * Enrichment script: adds fiber data from INDIAN_FOOD_COMPOSITION.xlsx to indian-foods.json
 *
 * Usage:
 *   npx tsx scripts/enrich-foods.ts
 *
 * Requirements:
 *   npm install xlsx (or pnpm add xlsx)
 *
 * The script reads the ICMR xlsx, extracts food name + dietary fiber columns,
 * fuzzy-matches them against indian-foods.json entries, and writes the enriched
 * JSON back. Unmatched entries are left unchanged (fiber field absent = "—" in UI).
 */

import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// --- Config ---
const XLSX_PATH = path.join(ROOT, 'INDIAN_FOOD_COMPOSITION.xlsx')
const FOODS_PATH = path.join(ROOT, 'src/data/indian-foods.json')
const OUTPUT_PATH = FOODS_PATH // overwrite in place

// Minimum similarity score (0-1) to accept a match
const MATCH_THRESHOLD = 0.65

// --- Helpers ---

/** Normalise a food name for comparison */
function normalise(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
}

/** Simple Dice coefficient similarity between two strings */
function diceSimilarity(a: string, b: string): number {
    if (a === b) return 1
    if (a.length < 2 || b.length < 2) return 0

    const getBigrams = (str: string) => {
        const bigrams = new Map<string, number>()
        for (let i = 0; i < str.length - 1; i++) {
            const bigram = str.slice(i, i + 2)
            bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1)
        }
        return bigrams
    }

    const aBigrams = getBigrams(a)
    const bBigrams = getBigrams(b)

    let intersection = 0
    for (const [bigram, count] of aBigrams) {
        const bCount = bBigrams.get(bigram) || 0
        intersection += Math.min(count, bCount)
    }

    return (2 * intersection) / (a.length - 1 + b.length - 1)
}

// --- Main ---

async function main() {
    console.log('Reading ICMR xlsx...')
    const workbook = XLSX.readFile(XLSX_PATH)
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: null })

    if (rows.length === 0) {
        console.error('No rows found in xlsx. Check the sheet structure.')
        process.exit(1)
    }

    // Identify column names by looking at the first row's keys
    const sampleRow = rows[0]
    console.log('Available columns:', Object.keys(sampleRow).join(', '))

    // Find the food name column and fiber column
    // ICMR-NIN 2017 uses headers like "Food Name", "Dietary Fibre(g)" or similar
    const colKeys = Object.keys(sampleRow)
    const nameCol = colKeys.find(k =>
        /food.?name/i.test(k) || /name.?of.?food/i.test(k) || k.toLowerCase() === 'food'
    )
    const fiberCol = colKeys.find(k =>
        /dietary.?fib/i.test(k) || /total.?fib/i.test(k) || /fibre/i.test(k) || /fiber/i.test(k)
    )

    if (!nameCol || !fiberCol) {
        console.error(`Could not identify columns. nameCol=${nameCol}, fiberCol=${fiberCol}`)
        console.error('Please check column names above and update the script if needed.')
        process.exit(1)
    }

    console.log(`Using columns: name="${nameCol}", fiber="${fiberCol}"`)

    // Build ICMR lookup: normalised name → fiber value (per 100g)
    const icmrMap = new Map<string, number>()
    for (const row of rows) {
        const rawName = row[nameCol]
        const rawFiber = row[fiberCol]
        if (rawName && rawFiber !== null && !isNaN(Number(rawFiber))) {
            icmrMap.set(normalise(String(rawName)), Number(rawFiber))
        }
    }
    console.log(`ICMR entries loaded: ${icmrMap.size}`)

    // Read indian-foods.json
    console.log('Reading indian-foods.json...')
    const foods: any[] = JSON.parse(fs.readFileSync(FOODS_PATH, 'utf-8'))
    console.log(`Food DB entries: ${foods.length}`)

    const icmrEntries = Array.from(icmrMap.entries())

    let matched = 0
    let unmatched = 0

    for (const food of foods) {
        const normFoodName = normalise(food.name)

        // Find best match in ICMR
        let bestScore = 0
        let bestFiber: number | null = null

        for (const [icmrName, fiber] of icmrEntries) {
            const score = diceSimilarity(normFoodName, icmrName)
            if (score > bestScore) {
                bestScore = score
                bestFiber = fiber
            }
        }

        if (bestScore >= MATCH_THRESHOLD && bestFiber !== null) {
            // Scale fiber per 100g to the food's weight field
            // indian-foods.json stores nutrition per 100g, so fiber is also per 100g
            food.fiber = Math.round(bestFiber * 10) / 10
            matched++
        } else {
            unmatched++
        }
    }

    console.log(`Matched: ${matched}, Unmatched: ${unmatched}`)

    // Write enriched JSON
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(foods, null, 2), 'utf-8')
    console.log(`Done! Enriched JSON written to ${OUTPUT_PATH}`)
}

main().catch(err => {
    console.error(err)
    process.exit(1)
})
