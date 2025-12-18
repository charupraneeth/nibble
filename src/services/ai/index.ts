import { OpenAIService } from './openai'
import { getConfig } from '../config'
import type { AIService } from './types'

export function getAIService(): AIService {
    const config = getConfig()
    return new OpenAIService(config.openaiApiKey)
}
