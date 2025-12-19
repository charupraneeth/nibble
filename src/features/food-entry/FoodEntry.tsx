
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Camera, Loader2, ArrowLeft, Search, ScanBarcode } from 'lucide-react'
import { getAIService } from '@/services/ai'
import { getConfig } from '@/services/config'
import { storage } from '@/services/storage'
import { FoodDatabaseSearch } from '@/features/food-database/FoodDatabaseSearch'
import { BarcodeScanner } from '@/features/scanner/BarcodeScanner'
import { openFoodFactsService } from '@/services/openfoodfacts'
import type { NutritionAnalysis } from '@/services/ai/types'
import type { FoodItem } from '@/services/storage/types'

interface FoodEntryProps {
    onComplete: () => void
    onCancel: () => void
    onSettings: () => void
    onLogin: () => void
    isAuthenticated: boolean

    initialData?: FoodItem | null
}

export function FoodEntry({ onComplete, onCancel, onSettings, onLogin, isAuthenticated, initialData }: FoodEntryProps) {
    const [mode, setMode] = useState<'select' | 'ai' | 'edit' | 'database' | 'scanner'>('select')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [analysis, setAnalysis] = useState<NutritionAnalysis | null>(null)
    const [originalWeight, setOriginalWeight] = useState<number>(0)
    const [editData, setEditData] = useState({
        name: initialData?.name || '',
        calories: initialData?.calories.toString() || '',
        protein: initialData?.protein.toString() || '',
        carbs: initialData?.carbs.toString() || '',
        fat: initialData?.fat.toString() || '',
        weight: initialData?.weight.toString() || '',
    })

    // Set initial mode if editing
    useEffect(() => {
        if (initialData) {
            setMode('edit')
            setOriginalWeight(initialData.weight)
        }
    }, [initialData])

    // Scale nutrition values when weight changes
    const handleWeightChange = (newWeight: string) => {
        if (!analysis || !originalWeight) {
            setEditData({ ...editData, weight: newWeight })
            return
        }

        const weightNum = Number(newWeight)
        if (isNaN(weightNum) || weightNum <= 0) {
            setEditData({ ...editData, weight: newWeight })
            return
        }

        // Scale all nutrition values proportionally
        const ratio = weightNum / originalWeight
        setEditData({
            ...editData,
            weight: newWeight,
            calories: Math.round(analysis.calories * ratio).toString(),
            protein: Math.round(analysis.protein * ratio).toString(),
            carbs: Math.round(analysis.carbs * ratio).toString(),
            fat: Math.round(analysis.fat * ratio).toString(),
        })
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Optimistic UI: Show edit screen with skeleton immediately
        setMode('edit')
        setLoading(true)
        setError(null)

        try {
            const aiService = getAIService()
            const result = await aiService.analyzeImage(file)
            setAnalysis(result)
            setOriginalWeight(result.weight)
            setEditData({
                name: result.name,
                calories: result.calories.toString(),
                protein: result.protein.toString(),
                carbs: result.carbs.toString(),
                fat: result.fat.toString(),
                weight: result.weight.toString(),
            })
            // Already in edit mode, just turn off loading
        } catch (error) {
            console.error('Analysis failed:', error)
            setError(error instanceof Error ? error.message : 'Failed to analyze image')
            // Go back to select mode on error so they can try again
            setMode('select')
        } finally {
            setLoading(false)
        }
    }

    const handleTextAnalysis = async (text: string) => {
        // Optimistic UI: Show edit screen with skeleton immediately
        setMode('edit')
        setLoading(true)
        setError(null)

        try {
            const aiService = getAIService()
            const result = await aiService.analyzeText(text)
            setAnalysis(result)
            setOriginalWeight(result.weight)
            setEditData({
                name: result.name,
                calories: result.calories.toString(),
                protein: result.protein.toString(),
                carbs: result.carbs.toString(),
                fat: result.fat.toString(),
                weight: result.weight.toString(),
            })
            // Already in edit mode, loading will flip to false
        } catch (error) {
            console.error('Analysis failed:', error)
            setError(error instanceof Error ? error.message : 'Failed to analyze text')
            // Go back to select mode on error
            setMode('select')
        } finally {
            setLoading(false)
        }
    }

    const handleBarcodeScan = async (barcode: string) => {
        setMode('select') // Close scanner first or show loading
        setLoading(true)
        setError(null)
        try {
            const product = await openFoodFactsService.getProductByBarcode(barcode)
            if (!product) {
                throw new Error('Product not found in OpenFoodFacts database')
            }

            // Populate edit data
            setAnalysis({
                name: product.name,
                calories: product.calories,
                protein: product.protein,
                carbs: product.carbs,
                fat: product.fat,
                weight: product.weight, // default serving size or 100g
                confidence: 1.0
            })
            setOriginalWeight(product.weight)
            setEditData({
                name: product.name,
                calories: product.calories.toString(),
                protein: product.protein.toString(),
                carbs: product.carbs.toString(),
                fat: product.fat.toString(),
                weight: product.weight.toString(),
            })
            setLoading(false)
            setMode('edit')
        } catch (error) {
            console.error('Scan failed:', error)
            setError(error instanceof Error ? error.message : 'Failed to fetch product data')
            setLoading(false)
        }
    }

    const handleSave = async () => {
        const today = new Date().toISOString().split('T')[0]
        const foodItem: FoodItem = {
            id: initialData?.id || Date.now().toString(),
            name: editData.name,
            calories: Number(editData.calories),
            protein: Number(editData.protein),
            carbs: Number(editData.carbs),
            fat: Number(editData.fat),
            weight: Number(editData.weight),
            timestamp: initialData?.timestamp || Date.now(),
        }

        await storage.addFoodToLog(today, foodItem)
        onComplete()
    }

    const handleDatabaseSelect = async (food: FoodItem) => {
        const today = new Date().toISOString().split('T')[0]
        await storage.addFoodToLog(today, food)
        onComplete()
    }

    if (loading && mode !== 'edit') {
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
        if (loading) {
            return (
                <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                    <Card className="w-full max-w-2xl">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" disabled>
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                                <div className="space-y-2">
                                    <div className="h-6 w-32 bg-primary/10 rounded animate-pulse" />
                                    <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Food Name</Label>
                                <div className="h-10 w-full bg-muted rounded animate-pulse" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Weight (g)</Label>
                                    <div className="h-10 w-full bg-muted rounded animate-pulse" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Calories</Label>
                                    <div className="h-10 w-full bg-muted rounded animate-pulse" />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Protein (g)</Label>
                                    <div className="h-10 w-full bg-muted rounded animate-pulse" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Carbs (g)</Label>
                                    <div className="h-10 w-full bg-muted rounded animate-pulse" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Fat (g)</Label>
                                    <div className="h-10 w-full bg-muted rounded animate-pulse" />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <div className="h-11 flex-1 bg-primary/10 rounded animate-pulse" />
                                <div className="h-11 w-24 bg-muted rounded animate-pulse" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )
        }

        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                <Card className="w-full max-w-2xl">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => initialData ? onCancel() : setMode('select')}>
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
                                    onChange={(e) => handleWeightChange(e.target.value)}
                                    placeholder="Adjust portion size"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Nutrition values will scale automatically
                                </p>
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

    if (mode === 'ai') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                <Card className="w-full max-w-2xl">
                    <CardHeader className="px-4 sm:px-6">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={() => setMode('select')}>
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                                <div>
                                    <CardTitle className="text-xl sm:text-2xl">AI Analysis</CardTitle>
                                    <CardDescription>Upload a photo or describe your food</CardDescription>
                                </div>
                            </div>

                        </div>
                    </CardHeader>
                    {error && (
                        <div className="px-4 sm:px-6 pb-4">
                            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
                                <p className="text-sm font-medium">{error}</p>
                            </div>
                        </div>
                    )}
                    <CardContent className="px-4 sm:px-6 space-y-6">
                        {/* Photo Upload Option */}
                        <div className="space-y-2">
                            <Label>Upload Photo</Label>
                            <label className="cursor-pointer block">
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                                <div className="border-2 border-dashed rounded-lg p-8 hover:bg-accent/50 transition-colors text-center">
                                    <Camera className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                                    <p className="font-medium">Click to take photo or upload</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        AI will analyze the nutrition
                                    </p>
                                </div>
                            </label>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">Or</span>
                            </div>
                        </div>

                        {/* Text Description Option */}
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
                                <Label htmlFor="description">Describe Your Food</Label>
                                <Input
                                    id="description"
                                    name="description"
                                    placeholder="e.g., A bowl of dal with 2 rotis"
                                    className="h-12"
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

    if (mode === 'scanner') {
        return <BarcodeScanner onResult={handleBarcodeScan} onCancel={() => setMode('select')} />
    }

    const hasApiKey = !!getConfig().openaiApiKey
    const canUseAI = hasApiKey || isAuthenticated

    if (mode === 'database') {
        return <FoodDatabaseSearch onSelect={handleDatabaseSelect} onCancel={() => setMode('select')} />
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <Card className="w-full max-w-4xl">
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
                <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-4 sm:px-6">
                    <Card
                        className={`transition-colors border-2 cursor-pointer ${canUseAI
                            ? 'hover:bg-accent hover:border-primary'
                            : 'opacity-80 border-muted'
                            }`}
                        onClick={() => canUseAI && setMode('ai')}
                    >
                        <CardContent className="flex flex-col items-center justify-center py-8">
                            <Camera className="h-12 w-12 mb-4 text-primary" />
                            <h3 className="font-semibold text-lg text-center">AI Analysis</h3>
                            <p className="text-sm text-muted-foreground mt-2 text-center">
                                Photo or Description
                            </p>
                            {!canUseAI && (
                                <div className="flex flex-col items-center mt-4 gap-2 text-center">
                                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full font-medium">
                                        Free Scans require Sign In
                                    </span>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="h-8"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onLogin()
                                            }}
                                        >
                                            Sign In
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onSettings()
                                            }}
                                        >
                                            Settings
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card
                        className="hover:bg-accent transition-colors border-2 hover:border-primary cursor-pointer"
                        onClick={() => setMode('scanner')}
                    >
                        <CardContent className="flex flex-col items-center justify-center py-8">
                            <ScanBarcode className="h-12 w-12 mb-4 text-primary" />
                            <h3 className="font-semibold text-lg text-center">Scan Barcode</h3>
                            <p className="text-sm text-muted-foreground mt-2 text-center">
                                Packaged Foods
                            </p>
                        </CardContent>
                    </Card>

                    <Card
                        className="hover:bg-accent transition-colors border-2 hover:border-primary cursor-pointer"
                        onClick={() => setMode('database')}
                    >
                        <CardContent className="flex flex-col items-center justify-center py-8">
                            <Search className="h-12 w-12 mb-4 text-primary" />
                            <h3 className="font-semibold text-lg text-center">Search Database</h3>
                            <p className="text-sm text-muted-foreground mt-2 text-center">
                                1,000+ Indian Foods
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
