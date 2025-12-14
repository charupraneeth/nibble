import type { FoodItem } from '../storage/types'
import type { OFFProductResponse } from './types'

export class OpenFoodFactsService {
    private static readonly API_URL = 'https://world.openfoodfacts.org/api/v2/product'

    async getProductByBarcode(barcode: string): Promise<FoodItem | null> {
        try {
            const response = await fetch(`${OpenFoodFactsService.API_URL}/${barcode}.json`)

            if (!response.ok) {
                if (response.status === 404) return null
                throw new Error('Failed to fetch product data')
            }

            const data: OFFProductResponse = await response.json()

            if (data.status !== 1 || !data.product) {
                return null
            }

            return this.mapToFoodItem(data.product, barcode)
        } catch (error) {
            console.error('OpenFoodFacts fetch error:', error)
            return null
        }
    }

    private mapToFoodItem(product: OFFProductResponse['product'], barcode: string): FoodItem {
        const name = product.product_name_en || product.product_name || 'Unknown Product'
        const brand = product.brands ? ` (${product.brands})` : ''

        // Prefer per 100g values as base, but serving size is useful context
        // We will default to storing per 100g or per serving?
        // Our app usually edits 'weight' so storing per 100g (or normalised) is often easier,
        // but if we have serving size, that's a better default 'weight'.

        const weight = product.serving_quantity || 100

        // Helper to get value prefer serving if available and weight matches serving, else 100g
        // Actually, let's just grab 100g values and calculate total based on default weight

        const kCal100 = product.nutriments['energy-kcal_100g'] || 0
        const prot100 = product.nutriments['proteins_100g'] || 0
        const carb100 = product.nutriments['carbohydrates_100g'] || 0
        const fat100 = product.nutriments['fat_100g'] || 0

        const ratio = weight / 100

        return {
            id: `off_${barcode}`, // explicit ID prefix
            name: `${name}${brand}`,
            calories: Math.round(kCal100 * ratio),
            protein: Math.round(prot100 * ratio),
            carbs: Math.round(carb100 * ratio),
            fat: Math.round(fat100 * ratio),
            weight: Number(weight),
            timestamp: Date.now()
        }
    }
}

export const openFoodFactsService = new OpenFoodFactsService()
