import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Camera, FileText, Loader2, ArrowLeft } from 'lucide-react'
import { getAIService } from '@/services/ai'
import { storage } from '@/services/storage/local'
import type { NutritionAnalysis } from '@/services/ai/types'
import type { FoodItem } from '@/services/storage/types'

interface FoodEntryProps {
    onComplete: () => void
    onCancel: () => void
}

export function FoodEntry({ onComplete, onCancel }: FoodEntryProps) {
    const [mode, setMode] = useState<'select' | 'image' | 'text' | 'edit'>('select')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [analysis, setAnalysis] = useState<NutritionAnalysis | null>(null)
    const [editData, setEditData] = useState({
        name: '',
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
        weight: '',
    })

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setLoading(true)
        setError(null)
        try {
            const aiService = getAIService()
            const result = await aiService.analyzeImage(file)
            setAnalysis(result)
            setEditData({
                name: result.name,
                calories: result.calories.toString(),
                protein: result.protein.toString(),
                carbs: result.carbs.toString(),
                fat: result.fat.toString(),
                weight: '100',
            })
            setMode('edit')
        } catch (error) {
            console.error('Analysis failed:', error)
            setError(error instanceof Error ? error.message : 'Failed to analyze image')
        } finally {
            setLoading(false)
        }
    }

    const handleTextAnalysis = async (text: string) => {
        setLoading(true)
        setError(null)
        try {
            const aiService = getAIService()
            const result = await aiService.analyzeText(text)
            setAnalysis(result)
            setEditData({
                name: result.name,
                calories: result.calories.toString(),
                protein: result.protein.toString(),
                carbs: result.carbs.toString(),
                fat: result.fat.toString(),
                weight: '100',
            })
            setMode('edit')
        } catch (error) {
            console.error('Analysis failed:', error)
            setError(error instanceof Error ? error.message : 'Failed to analyze text')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        const today = new Date().toISOString().split('T')[0]
        const foodItem: FoodItem = {
            id: Date.now().toString(),
            name: editData.name,
            calories: Number(editData.calories),
            protein: Number(editData.protein),
            carbs: Number(editData.carbs),
            fat: Number(editData.fat),
            weight: Number(editData.weight),
            timestamp: Date.now(),
        }

        await storage.addFoodToLog(today, foodItem)
        onComplete()
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                <Card className="w-full max-w-md">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                        <p className="text-lg font-medium">Analyzing your food...</p>
                        <p className="text-sm text-muted-foreground mt-2">This may take a moment</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (mode === 'edit') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                <Card className="w-full max-w-2xl">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setMode('select')}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                                <CardTitle>Review & Edit</CardTitle>
                                <CardDescription>
                                    {analysis && `Confidence: ${Math.round(analysis.confidence * 100)}%`}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="food-name">Food Name</Label>
                            <Input
                                id="food-name"
                                value={editData.name}
                                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="weight">Weight (g)</Label>
                                <Input
                                    id="weight"
                                    type="number"
                                    value={editData.weight}
                                    onChange={(e) => setEditData({ ...editData, weight: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="calories">Calories</Label>
                                <Input
                                    id="calories"
                                    type="number"
                                    value={editData.calories}
                                    onChange={(e) => setEditData({ ...editData, calories: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="protein">Protein (g)</Label>
                                <Input
                                    id="protein"
                                    type="number"
                                    value={editData.protein}
                                    onChange={(e) => setEditData({ ...editData, protein: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="carbs">Carbs (g)</Label>
                                <Input
                                    id="carbs"
                                    type="number"
                                    value={editData.carbs}
                                    onChange={(e) => setEditData({ ...editData, carbs: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="fat">Fat (g)</Label>
                                <Input
                                    id="fat"
                                    type="number"
                                    value={editData.fat}
                                    onChange={(e) => setEditData({ ...editData, fat: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button onClick={handleSave} className="flex-1" size="lg">
                                Save to Log
                            </Button>
                            <Button onClick={onCancel} variant="outline" size="lg">
                                Cancel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (mode === 'text') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                <Card className="w-full max-w-2xl">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setMode('select')}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                                <CardTitle>Describe Your Food</CardTitle>
                                <CardDescription>Tell us what you ate</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault()
                                const formData = new FormData(e.currentTarget)
                                const text = formData.get('description') as string
                                if (text) handleTextAnalysis(text)
                            }}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    id="description"
                                    name="description"
                                    placeholder="e.g., A bowl of oatmeal with blueberries and honey"
                                    required
                                />
                            </div>
                            <div className="flex gap-3">
                                <Button type="submit" className="flex-1" size="lg">
                                    Analyze
                                </Button>
                                <Button type="button" onClick={onCancel} variant="outline" size="lg">
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <Card className="w-full max-w-2xl">
                <CardHeader className="px-4 sm:px-6">
                    <CardTitle className="text-xl sm:text-2xl">Log Your Food</CardTitle>
                    <CardDescription>Choose how you'd like to add your meal</CardDescription>
                </CardHeader>
                {error && (
                    <div className="px-4 sm:px-6 pb-4">
                        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    </div>
                )}
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 sm:px-6">
                    <label className="cursor-pointer">
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                        <Card className="hover:bg-accent transition-colors border-2 hover:border-primary">
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Camera className="h-16 w-16 mb-4 text-primary" />
                                <h3 className="font-semibold text-lg">Take Photo</h3>
                                <p className="text-sm text-muted-foreground mt-2 text-center">
                                    Snap a picture of your meal
                                </p>
                            </CardContent>
                        </Card>
                    </label>

                    <Card
                        className="hover:bg-accent transition-colors border-2 hover:border-primary cursor-pointer"
                        onClick={() => setMode('text')}
                    >
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <FileText className="h-16 w-16 mb-4 text-primary" />
                            <h3 className="font-semibold text-lg">Describe Food</h3>
                            <p className="text-sm text-muted-foreground mt-2 text-center">
                                Type what you ate
                            </p>
                        </CardContent>
                    </Card>
                </CardContent>
                <div className="px-6 pb-6">
                    <Button onClick={onCancel} variant="outline" className="w-full">
                        Cancel
                    </Button>
                </div>
            </Card>
        </div>
    )
}
