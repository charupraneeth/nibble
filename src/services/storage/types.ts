export interface UserProfile {
    name: string
    height: number // cm
    weight: number // kg
    age: number
    gender: 'male' | 'female' | 'other'
    goal: 'lose' | 'maintain' | 'gain'
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
    dietaryPreferences: string[]
    targetCalories: number
    targetProtein: number
    targetCarbs: number
    targetFat: number
    targetFiber?: number // g/day — 14g per 1000 kcal (DRV standard)
}

export interface DailyLog {
    date: string // YYYY-MM-DD
    foods: FoodItem[]
}

export interface FoodItem {
    id: string
    name: string
    calories: number
    protein: number
    carbs: number
    fat: number
    weight: number // grams
    timestamp: number
    fiber?: number          // g — optional; null means data not available
    fiberEstimated?: boolean // true when sourced from AI analysis
}

export interface StorageService {
    getUserProfile(): Promise<UserProfile | null>
    saveUserProfile(profile: UserProfile): Promise<void>
    getDailyLog(date: string): Promise<DailyLog | null>
    saveDailyLog(log: DailyLog): Promise<void>
    addFoodToLog(date: string, food: FoodItem): Promise<void>
    removeFoodFromLog(date: string, foodId: string): Promise<void>
    getAllLogs(): Promise<DailyLog[]>
}
