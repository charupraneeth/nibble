import { MockAIService } from './mock'
import { OpenAIService } from './openai'
import { getConfig } from '../config'
import type { AIService } from './types'

export function getAIService(): AIService {
    const config = getConfig()

    if (config.aiProvider === 'openai') {
        return new OpenAIService(config.openaiApiKey)
    }

    return new MockAIService()
}
