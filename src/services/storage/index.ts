import { supabase } from '@/lib/supabase'
import { localStorageService } from './local'
import { supabaseStorage } from './supabase'
import type { StorageService, UserProfile, DailyLog, FoodItem } from './types'

export const storage: StorageService = {
    async getUserProfile(): Promise<UserProfile | null> {
        const { data: { session } } = await supabase.auth.getSession()
        return session ? supabaseStorage.getUserProfile() : localStorageService.getUserProfile()
    },

    async saveUserProfile(profile: UserProfile): Promise<void> {
        const { data: { session } } = await supabase.auth.getSession()
        return session ? supabaseStorage.saveUserProfile(profile) : localStorageService.saveUserProfile(profile)
    },

    async getDailyLog(date: string): Promise<DailyLog | null> {
        const { data: { session } } = await supabase.auth.getSession()
        return session ? supabaseStorage.getDailyLog(date) : localStorageService.getDailyLog(date)
    },

    async saveDailyLog(log: DailyLog): Promise<void> {
        const { data: { session } } = await supabase.auth.getSession()
        return session ? supabaseStorage.saveDailyLog(log) : localStorageService.saveDailyLog(log)
    },

    async addFoodToLog(date: string, food: FoodItem): Promise<void> {
        const { data: { session } } = await supabase.auth.getSession()
        return session ? supabaseStorage.addFoodToLog(date, food) : localStorageService.addFoodToLog(date, food)
    },

    async removeFoodFromLog(date: string, foodId: string): Promise<void> {
        const { data: { session } } = await supabase.auth.getSession()
        return session ? supabaseStorage.removeFoodFromLog(date, foodId) : localStorageService.removeFoodFromLog(date, foodId)
    },

    async getAllLogs(): Promise<DailyLog[]> {
        const { data: { session } } = await supabase.auth.getSession()
        return session ? supabaseStorage.getAllLogs() : localStorageService.getAllLogs()
    }
}
