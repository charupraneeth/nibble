export interface AppConfig {
    aiProvider: 'mock' | 'openai'
    openaiApiKey?: string
}

const CONFIG_KEY = 'nibble_config'

export function getConfig(): AppConfig {
    const stored = localStorage.getItem(CONFIG_KEY)
    if (stored) {
        return JSON.parse(stored)
    }
    return {
        aiProvider: 'openai',
    }
}

export function saveConfig(config: AppConfig): void {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
}
