export interface IndianFoodItem {
    id: string
    name: string

    // Per 100g values
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number

    // Serving information
    servingUnit: string
    servingCalories: number
    servingProtein: number
    servingCarbs: number
    servingFat: number

    source: string
}

export interface FoodSearchResult {
    food: IndianFoodItem
    relevance: number
}
