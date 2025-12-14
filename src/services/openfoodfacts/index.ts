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

        // Defensive parsing for weight
        let weight = 100
        if (typeof product.serving_quantity === 'number') {
            weight = product.serving_quantity
        } else if (typeof product.serving_quantity === 'string') {
            // Try to parse string like "30.5" or "30g"
            const parsed = parseFloat(product.serving_quantity)
            if (!isNaN(parsed) && parsed > 0) {
                weight = parsed
            }
        }

        const nutriments = product.nutriments || {}

        const kCal100 = nutriments['energy-kcal_100g'] || 0
        const prot100 = nutriments['proteins_100g'] || 0
        const carb100 = nutriments['carbohydrates_100g'] || 0
        const fat100 = nutriments['fat_100g'] || 0

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
