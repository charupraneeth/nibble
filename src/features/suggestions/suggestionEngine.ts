import type { FoodItem, UserProfile, DailyLog } from '@/services/storage/types'

export interface RemainingNeeds {
    calories: number
    protein: number
    carbs: number
    fat: number
}

export interface FoodSuggestion {
    food: FoodItem
    score: number
    reason: string
}

export function calculateRemainingNeeds(
    profile: UserProfile,
    consumed: { calories: number; protein: number; carbs: number; fat: number }
): RemainingNeeds {
    return {
        calories: Math.max(0, profile.targetCalories - consumed.calories),
        protein: Math.max(0, profile.targetProtein - consumed.protein),
        carbs: Math.max(0, profile.targetCarbs - consumed.carbs),
        fat: Math.max(0, profile.targetFat - consumed.fat),
    }
}

export function generateSuggestions(
    remaining: RemainingNeeds,
    foodHistory: FoodItem[],
    maxSuggestions = 3
): FoodSuggestion[] {
    if (foodHistory.length === 0) {
        return []
    }

    // Score each food based on how well it fits remaining needs
    const scoredFoods = foodHistory.map((food) => {
        let score = 0
        let reasons: string[] = []

        // Check if food fits within remaining calories (important!)
        if (food.calories > remaining.calories * 1.2) {
            score -= 50 // Heavy penalty for exceeding calories
        }

        // Calculate macro percentages
        const totalRemaining = remaining.protein + remaining.carbs + remaining.fat
        if (totalRemaining > 0) {
            const proteinNeed = remaining.protein / totalRemaining
            const carbsNeed = remaining.carbs / totalRemaining
            const fatNeed = remaining.fat / totalRemaining

            const totalFood = food.protein + food.carbs + food.fat
            if (totalFood > 0) {
                const proteinRatio = food.protein / totalFood
                const carbsRatio = food.carbs / totalFood
                const fatRatio = food.fat / totalFood

                // Score based on macro alignment
                const proteinMatch = 1 - Math.abs(proteinRatio - proteinNeed)
                const carbsMatch = 1 - Math.abs(carbsRatio - carbsNeed)
                const fatMatch = 1 - Math.abs(fatRatio - fatNeed)

                score += (proteinMatch + carbsMatch + fatMatch) * 30

                // Identify primary macro
                if (proteinNeed > 0.4 && proteinRatio > 0.3) {
                    reasons.push('High protein')
                }
                if (carbsNeed > 0.4 && carbsRatio > 0.3) {
                    reasons.push('Good carbs')
                }
                if (fatNeed > 0.4 && fatRatio > 0.3) {
                    reasons.push('Healthy fats')
                }
            }
        }

        // Bonus for fitting well within calorie budget
        if (food.calories <= remaining.calories && food.calories > remaining.calories * 0.3) {
            score += 20
            reasons.push('Fits your budget')
        }

        // Determine primary reason
        let reason = 'Balanced meal'
        if (reasons.length > 0) {
            reason = reasons.join(', ')
        } else if (food.calories < remaining.calories * 0.3) {
            reason = 'Light option'
        }

        return {
            food,
            score,
            reason,
        }
    })

    // Sort by score and remove duplicates (same food name)
    const uniqueFoods = new Map<string, FoodSuggestion>()
    scoredFoods
        .sort((a, b) => b.score - a.score)
        .forEach((suggestion) => {
            if (!uniqueFoods.has(suggestion.food.name)) {
                uniqueFoods.set(suggestion.food.name, suggestion)
            }
        })

    return Array.from(uniqueFoods.values()).slice(0, maxSuggestions)
}

export async function getAllFoodHistory(
    storage: { getDailyLog: (date: string) => Promise<DailyLog | null> },
    daysBack = 30
): Promise<FoodItem[]> {
    const allFoods: FoodItem[] = []
    const today = new Date()

    for (let i = 0; i < daysBack; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]

        const log = await storage.getDailyLog(dateStr)
        if (log) {
            allFoods.push(...log.foods)
        }
    }

    return allFoods
}
