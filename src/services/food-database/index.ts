import foodsData from '@/data/indian-foods.json'
import type { IndianFoodItem, FoodSearchResult } from './types'

class FoodDatabaseService {
    private foods: IndianFoodItem[]

    constructor() {
        this.foods = foodsData as IndianFoodItem[]
    }

    /**
     * Search for foods by name
     */
    search(query: string, limit = 10): FoodSearchResult[] {
        if (!query || query.trim().length < 2) {
            return []
        }

        const searchTerm = query.toLowerCase().trim()
        const results: FoodSearchResult[] = []

        for (const food of this.foods) {
            const foodName = food.name.toLowerCase()

            // Exact match gets highest score
            if (foodName === searchTerm) {
                results.push({ food, relevance: 100 })
                continue
            }

            // Starts with query
            if (foodName.startsWith(searchTerm)) {
                results.push({ food, relevance: 90 })
                continue
            }

            // Contains query
            if (foodName.includes(searchTerm)) {
                results.push({ food, relevance: 70 })
                continue
            }

            // Word boundary match (e.g., "chai" matches "Garam Chai")
            const words = foodName.split(/\s+/)
            for (const word of words) {
                if (word.startsWith(searchTerm)) {
                    results.push({ food, relevance: 80 })
                    break
                }
            }
        }

        // Sort by relevance and limit results
        return results
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, limit)
    }

    /**
     * Get food by ID
     */
    getById(id: string): IndianFoodItem | null {
        return this.foods.find(f => f.id === id) || null
    }

    /**
     * Get random popular foods
     */
    getPopular(count = 10): IndianFoodItem[] {
        // For now, just return first N items
        // In future, could track usage and return actually popular items
        return this.foods.slice(0, count)
    }

    /**
     * Get total count
     */
    getCount(): number {
        return this.foods.length
    }
}

export const foodDatabase = new FoodDatabaseService()
