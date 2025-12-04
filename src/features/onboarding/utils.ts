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

    // ICMR-NIN 2020 & Indian Context Adjustments
    // Traditional Indian diet is carb-heavy. We aim for a "Balanced Indian" split
    // that is achievable but healthier than the typical 70% carb diet.

    let proteinRatio = 0.20
    let fatRatio = 0.25
    // Carb ratio is implicit based on remainder

    if (goal === 'lose') {
        // Higher protein for satiety, lower carbs for deficit
        proteinRatio = 0.25
        fatRatio = 0.25
    } else if (goal === 'gain') {
        // Higher protein for muscle growth
        proteinRatio = 0.25
        fatRatio = 0.25
    }

    // Calculate raw targets
    let targetProtein = Math.round((targetCalories * proteinRatio) / 4)
    const targetFat = Math.round((targetCalories * fatRatio) / 9)

    // Safety Check: ICMR RDA Protein Floor (0.83g/kg)
    // Ensure we never recommend less than the safe minimum
    const minProtein = Math.round(weight * 0.83)
    if (targetProtein < minProtein) {
        targetProtein = minProtein
    }

    // Carbs take the remaining calories
    const proteinCals = targetProtein * 4
    const fatCals = targetFat * 9
    const remainingCals = targetCalories - proteinCals - fatCals
    const targetCarbs = Math.round(remainingCals / 4)

    return {
        targetCalories,
        targetProtein,
        targetCarbs,
        targetFat,
    }
}
