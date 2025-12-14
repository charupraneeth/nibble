import OpenAI from 'openai'
import { supabase } from '@/lib/supabase'
import type { AIService, NutritionAnalysis } from './types'

export class OpenAIService implements AIService {
    private client: OpenAI | null = null

    constructor(apiKey?: string) {
        if (apiKey) {
            this.client = new OpenAI({
                apiKey,
                dangerouslyAllowBrowser: true, // For client-side usage
            })
        }
    }

    async analyzeImage(imageFile: File): Promise<NutritionAnalysis> {
        // Convert image to base64
        const base64Image = await this.fileToBase64(imageFile)

        // 1. If Custom Key exists, use Direct OpenAI
        if (this.client) {
            return this.analyzeImageDirect(base64Image)
        }

        // 2. If no Key, try Edge Function (Authentication required)
        return this.analyzeImageEdge(base64Image)
    }

    async analyzeText(text: string): Promise<NutritionAnalysis> {
        // 1. If Custom Key exists, use Direct OpenAI
        if (this.client) {
            return this.analyzeTextDirect(text)
        }

        // 2. If no Key, try Edge Function (Authentication required)
        return this.analyzeTextEdge(text)
    }

    // --- EDGE FUNCTION METHODS ---

    private async analyzeImageEdge(base64Image: string): Promise<NutritionAnalysis> {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            throw new Error('Please sign in to use the AI features (5 free scans/day) or provide your own OpenAI API key in Settings.')
        }

        const { data, error } = await supabase.functions.invoke('analyze-food', {
            body: { image: base64Image },
        })

        if (error) {
            // Handle specific Edge Function errors
            if (error instanceof Error) {
                // Supabase functions js client wraps the response error in 'context' if available
                const context = (error as any).context
                if (context && context.json) {
                    const errorBody = await context.json().catch(() => ({}))
                    if (errorBody.error) {
                        throw new Error(errorBody.error)
                    }
                }
            }

            if (error.status === 429) {
                throw new Error('Daily limit reached. Add your own API Key in Settings for unlimited scans.')
            }

            throw new Error(error.message || 'Failed to connect to AI service')
        }

        if (data.error) {
            throw new Error(data.error)
        }

        return this.parseJSONResponse(JSON.stringify(data))
    }

    private async analyzeTextEdge(text: string): Promise<NutritionAnalysis> {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            throw new Error('Please sign in to use the AI features (5 free scans/day) or provide your own OpenAI API key in Settings.')
        }

        const { data, error } = await supabase.functions.invoke('analyze-food', {
            body: { text },
        })

        if (error) {
            if (error instanceof Error) {
                const context = (error as any).context
                if (context && context.json) {
                    const errorBody = await context.json().catch(() => ({}))
                    if (errorBody.error) {
                        throw new Error(errorBody.error)
                    }
                }
            }

            if (error.status === 429) {
                throw new Error('Daily limit reached. Add your own API Key in Settings for unlimited scans.')
            }
            throw new Error(error.message || 'Failed to connect to AI service')
        }

        if (data.error) {
            throw new Error(data.error)
        }

        return this.parseJSONResponse(JSON.stringify(data))
    }

    // --- DIRECT OPENAI METHODS ---

    private async analyzeImageDirect(base64Image: string): Promise<NutritionAnalysis> {
        if (!this.client) throw new Error('OpenAI client not initialized')

        const response = await this.client.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: this.getSystemPrompt(),
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: base64Image,
                            },
                        },
                    ],
                },
            ],
            max_tokens: 500,
        })

        const content = response.choices[0]?.message?.content
        if (!content) throw new Error('No response from OpenAI')
        return this.parseJSONResponse(content)
    }

    private async analyzeTextDirect(text: string): Promise<NutritionAnalysis> {
        if (!this.client) throw new Error('OpenAI client not initialized')

        const response = await this.client.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: `Analyze this food description and provide detailed nutrition information: "${text}"\n\n${this.getSystemPrompt()}`,
                },
            ],
            max_tokens: 500,
        })

        const content = response.choices[0]?.message?.content
        if (!content) throw new Error('No response from OpenAI')
        return this.parseJSONResponse(content)
    }

    // --- HELPERS ---

    private getSystemPrompt(): string {
        return `IMPORTANT: If the input does NOT contain/describe food, return: {"error": "No food detected"}
Otherwise, return ONLY a JSON object with this exact structure (no markdown):
{
  "name": "descriptive food name",
  "weight": number (estimated total grams),
  "calories": number (total kcals),
  "protein": number (total protein g),
  "carbs": number (total carbs g),
  "fat": number (total fat g),
  "confidence": number (0-1)
}
Estimate realistic portion sizes.`
    }

    private parseJSONResponse(content: string): NutritionAnalysis {
        let cleaned = content.trim()

        // Remove markdown code blocks if present
        if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
        }

        try {
            const parsed = JSON.parse(cleaned)

            // Check if it's an error response (non-food image)
            if (parsed && typeof parsed === 'object' && 'error' in parsed) {
                throw new Error(parsed.error)
            }

            return parsed as NutritionAnalysis
        } catch (error) {
            // If JSON parsing fails, it might be a natural language response
            if (error instanceof Error && error.message.includes('error')) {
                throw error
            }
            throw new Error('Unable to analyze result. Please try again.')
        }
    }

    private async fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
                const base64 = reader.result as string
                resolve(base64)
            }
            reader.onerror = reject
            reader.readAsDataURL(file)
        })
    }
}
