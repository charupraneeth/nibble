export interface NutritionAnalysis {
    name: string
    weight: number // estimated weight in grams
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber?: number // g — AI estimated
    confidence: number
}



export interface AIService {
    analyzeImage(imageFile: File): Promise<NutritionAnalysis>
    analyzeText(text: string): Promise<NutritionAnalysis>
}
