import type { AIService, NutritionAnalysis } from './types'

export class MockAIService implements AIService {
    async analyzeImage(imageFile: File): Promise<NutritionAnalysis> {
        console.log('Analyzing image:', imageFile.name)
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500))

        return {
            name: "Grilled Chicken Salad",
            calories: 450,
            protein: 40,
            carbs: 15,
            fat: 20,
            confidence: 0.95
        }
    }

    async analyzeText(text: string): Promise<NutritionAnalysis> {
        console.log('Analyzing text:', text)
        await new Promise(resolve => setTimeout(resolve, 1000))

        return {
            name: "Oatmeal with Blueberries",
            calories: 300,
            protein: 10,
            carbs: 50,
            fat: 6,
            confidence: 0.85
        }
    }
}

export const aiService = new MockAIService()
