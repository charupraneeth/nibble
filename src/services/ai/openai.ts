import OpenAI from 'openai'
import type { AIService, NutritionAnalysis } from './types'

export class OpenAIService implements AIService {
    private client: OpenAI

    constructor(apiKey: string) {
        this.client = new OpenAI({
            apiKey,
            dangerouslyAllowBrowser: true, // For client-side usage
        })
    }

    async analyzeImage(imageFile: File): Promise<NutritionAnalysis> {
        // Convert image to base64
        const base64Image = await this.fileToBase64(imageFile)

        const response = await this.client.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `Analyze this food image and provide detailed nutrition information. 

IMPORTANT: If this image does NOT contain food, return:
{"error": "No food detected in image"}

Otherwise, return ONLY a JSON object with this exact structure (no markdown, no code blocks, no explanations):
{
  "name": "descriptive food name",
  "weight": number (estimated total weight of the food in grams),
  "calories": number (total calories for the estimated weight),
  "protein": number (total protein in grams for the estimated weight),
  "carbs": number (total carbs in grams for the estimated weight),
  "fat": number (total fat in grams for the estimated weight),
  "confidence": number (0-1, your confidence in this analysis)
}

CRITICAL: Estimate the actual portion size you see in the image. For example:
- A chicken breast might be 150-200g
- A bowl of rice might be 200-300g
- A banana might be 120g
- A slice of pizza might be 150g

Provide nutrition values for the TOTAL estimated portion, not per 100g.`,
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
        if (!content) {
            throw new Error('No response from OpenAI')
        }

        // Parse the JSON response with error handling
        const analysis = this.parseJSONResponse(content)

        return analysis
    }

    async analyzeText(text: string): Promise<NutritionAnalysis> {
        const response = await this.client.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: `Analyze this food description and provide detailed nutrition information: "${text}"

Return ONLY a JSON object with this exact structure (no markdown, no code blocks):
{
  "name": "descriptive food name",
  "weight": number (estimated weight in grams based on typical serving),
  "calories": number (total calories for the estimated weight),
  "protein": number (total protein in grams for the estimated weight),
  "carbs": number (total carbs in grams for the estimated weight),
  "fat": number (total fat in grams for the estimated weight),
  "confidence": number (0-1, your confidence in this analysis)
}

Estimate a realistic portion size. For example:
- "A bowl of oatmeal" = ~250g
- "Grilled chicken breast" = ~150g
- "Large apple" = ~200g

Provide nutrition for the TOTAL estimated portion.`,
                },
            ],
            max_tokens: 500,
        })

        const content = response.choices[0]?.message?.content
        if (!content) {
            throw new Error('No response from OpenAI')
        }

        // Parse the JSON response with error handling
        const analysis = this.parseJSONResponse(content)
        return analysis
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
            throw new Error('Unable to analyze this image. Please ensure it contains food items.')
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
