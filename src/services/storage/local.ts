import type { StorageService, UserProfile, DailyLog, FoodItem } from './types'

const KEYS = {
    PROFILE: 'nibble_profile',
    LOGS: 'nibble_logs_',
}

export class LocalStorageService implements StorageService {
    async getUserProfile(): Promise<UserProfile | null> {
        const data = localStorage.getItem(KEYS.PROFILE)
        return data ? JSON.parse(data) : null
    }

    async saveUserProfile(profile: UserProfile): Promise<void> {
        localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile))
    }

    async getDailyLog(date: string): Promise<DailyLog | null> {
        const data = localStorage.getItem(KEYS.LOGS + date)
        return data ? JSON.parse(data) : null
    }

    async saveDailyLog(log: DailyLog): Promise<void> {
        localStorage.setItem(KEYS.LOGS + log.date, JSON.stringify(log))
    }

    async addFoodToLog(date: string, food: FoodItem): Promise<void> {
        const log = await this.getDailyLog(date) || { date, foods: [] }
        log.foods.push(food)
        await this.saveDailyLog(log)
    }

    async removeFoodFromLog(date: string, foodId: string): Promise<void> {
        const log = await this.getDailyLog(date)
        if (log) {
            log.foods = log.foods.filter(f => f.id !== foodId)
            await this.saveDailyLog(log)
        }
    }

    async getAllLogs(): Promise<DailyLog[]> {
        const logs: DailyLog[] = []
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && key.startsWith(KEYS.LOGS)) {
                const data = localStorage.getItem(key)
                if (data) {
                    logs.push(JSON.parse(data))
                }
            }
        }
        // Sort by date descending (newest first)
        return logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }
}

export const localStorageService = new LocalStorageService()
