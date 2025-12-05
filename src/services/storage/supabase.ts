import { supabase } from '@/lib/supabase'
import type { StorageService, UserProfile, DailyLog, FoodItem } from './types'

export class SupabaseStorageService implements StorageService {
    async getUserProfile(): Promise<UserProfile | null> {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return null
        const user = session.user

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (error || !data) return null

        return {
            name: data.name,
            height: data.height,
            weight: data.weight,
            age: data.age,
            gender: data.gender,
            goal: data.goal,
            activityLevel: data.activity_level,
            dietaryPreferences: data.dietary_preferences || [],
            targetCalories: data.target_calories,
            targetProtein: data.target_protein,
            targetCarbs: data.target_carbs,
            targetFat: data.target_fat,
        }
    }

    async saveUserProfile(profile: UserProfile): Promise<void> {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) throw new Error('User not authenticated')
        const user = session.user

        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                name: profile.name,
                height: profile.height,
                weight: profile.weight,
                age: profile.age,
                gender: profile.gender,
                goal: profile.goal,
                activity_level: profile.activityLevel,
                dietary_preferences: profile.dietaryPreferences,
                target_calories: profile.targetCalories,
                target_protein: profile.targetProtein,
                target_carbs: profile.targetCarbs,
                target_fat: profile.targetFat,
                updated_at: new Date().toISOString(),
            })

        if (error) throw error
    }

    async getDailyLog(date: string): Promise<DailyLog | null> {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return null
        const user = session.user

        const { data, error } = await supabase
            .from('food_logs')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', date)
            .order('timestamp', { ascending: true })

        if (error) throw error

        if (!data || data.length === 0) return null

        const foods: FoodItem[] = data.map(item => ({
            id: item.id,
            name: item.name,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
            weight: item.weight,
            timestamp: item.timestamp,
        }))

        return {
            date,
            foods,
        }
    }

    async saveDailyLog(log: DailyLog): Promise<void> {
        // This method is rarely used directly in our app flow, usually we use add/remove
        // But for completeness, we could implement it by deleting all for date and re-inserting
        // For now, let's leave it as a no-op or throw, since we verified it's not used.
        console.warn('saveDailyLog is not optimized for Supabase and should be avoided.')
    }

    async addFoodToLog(date: string, food: FoodItem): Promise<void> {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) throw new Error('User not authenticated')
        const user = session.user

        const { error } = await supabase
            .from('food_logs')
            .insert({
                user_id: user.id,
                date: date,
                id: food.id, // Use client-generated ID or let DB generate? Client ID is fine for now
                name: food.name,
                calories: food.calories,
                protein: food.protein,
                carbs: food.carbs,
                fat: food.fat,
                weight: food.weight,
                timestamp: food.timestamp,
            })

        if (error) throw error
    }

    async removeFoodFromLog(date: string, foodId: string): Promise<void> {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) throw new Error('User not authenticated')
        const user = session.user

        const { error } = await supabase
            .from('food_logs')
            .delete()
            .eq('user_id', user.id)
            .eq('id', foodId)

        if (error) throw error
    }

    async getAllLogs(): Promise<DailyLog[]> {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return []
        const user = session.user

        const { data, error } = await supabase
            .from('food_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .order('timestamp', { ascending: true })

        if (error) throw error
        if (!data) return []

        // Group by date
        const logsMap = new Map<string, FoodItem[]>()

        data.forEach(item => {
            const foods = logsMap.get(item.date) || []
            foods.push({
                id: item.id,
                name: item.name,
                calories: item.calories,
                protein: item.protein,
                carbs: item.carbs,
                fat: item.fat,
                weight: item.weight,
                timestamp: item.timestamp,
            })
            logsMap.set(item.date, foods)
        })

        return Array.from(logsMap.entries()).map(([date, foods]) => ({
            date,
            foods,
        }))
    }
}

export const supabaseStorage = new SupabaseStorageService()
