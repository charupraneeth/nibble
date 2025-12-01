// import { UserProfile } from "@/services/storage/types"

export const ACTIVITY_MULTIPLIERS = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
}

export const GOAL_MODIFIERS = {
    lose: -500,
    maintain: 0,
    gain: 500,
}

export function calculateBMR(weight: number, height: number, age: number, gender: 'male' | 'female' | 'other'): number {
    // Mifflin-St Jeor Equation
    let bmr = 10 * weight + 6.25 * height - 5 * age
    if (gender === 'male') {
        bmr += 5
    } else if (gender === 'female') {
        bmr -= 161
    } else {
        // Average for 'other'
        bmr -= 78
    }
    return Math.round(bmr)
}

export function calculateTargets(
    weight: number,
    height: number,
    age: number,
    gender: 'male' | 'female' | 'other',
    activityLevel: keyof typeof ACTIVITY_MULTIPLIERS,
    goal: keyof typeof GOAL_MODIFIERS
) {
    const bmr = calculateBMR(weight, height, age, gender)
    const tdee = Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel])
    const targetCalories = tdee + GOAL_MODIFIERS[goal]

    // Standard Macro Split (40% Carbs, 30% Protein, 30% Fat)
    // Protein: 4 cal/g, Carbs: 4 cal/g, Fat: 9 cal/g
    const targetProtein = Math.round((targetCalories * 0.3) / 4)
    const targetCarbs = Math.round((targetCalories * 0.4) / 4)
    const targetFat = Math.round((targetCalories * 0.3) / 9)

    return {
        targetCalories,
        targetProtein,
        targetCarbs,
        targetFat,
    }
}
