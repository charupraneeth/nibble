import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lightbulb, TrendingUp } from 'lucide-react'
import { storage } from '@/services/storage/local'
import { calculateRemainingNeeds, generateSuggestions, getAllFoodHistory } from './suggestionEngine'
import type { UserProfile, FoodItem } from '@/services/storage/types'
import type { FoodSuggestion } from './suggestionEngine'

interface SuggestionsCardProps {
    profile: UserProfile
    consumed: { calories: number; protein: number; carbs: number; fat: number }
    onAddFood: (food: FoodItem) => void
}

export function SuggestionsCard({ profile, consumed, onAddFood }: SuggestionsCardProps) {
    const [suggestions, setSuggestions] = useState<FoodSuggestion[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadSuggestions()
    }, [consumed])

    const loadSuggestions = async () => {
        setLoading(true)
        try {
            const remaining = calculateRemainingNeeds(profile, consumed)
            const history = await getAllFoodHistory(storage, 30)
            const suggested = generateSuggestions(remaining, history, 3)
            setSuggestions(suggested)
        } catch (error) {
            console.error('Failed to load suggestions:', error)
        } finally {
            setLoading(false)
        }
    }

    const remaining = calculateRemainingNeeds(profile, consumed)
    const hasRemainingNeeds = remaining.calories > 100

    if (!hasRemainingNeeds) {
        return (
            <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <CardTitle className="text-green-900 dark:text-green-100">Goals Met!</CardTitle>
                    </div>
                    <CardDescription className="text-green-700 dark:text-green-300">
                        You've reached your daily nutrition targets. Great job!
                    </CardDescription>
                </CardHeader>
            </Card>
        )
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5" />
                        Smart Suggestions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Loading suggestions...</p>
                </CardContent>
            </Card>
        )
    }

    if (suggestions.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5" />
                        Smart Suggestions
                    </CardTitle>
                    <CardDescription>
                        Log more meals to get personalized suggestions
                    </CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    Smart Suggestions
                </CardTitle>
                <CardDescription>
                    Based on your remaining needs: {Math.round(remaining.calories)} cal, {Math.round(remaining.protein)}g protein
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {suggestions.map((suggestion, index) => (
                    <div
                        key={index}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                        <div className="flex-1">
                            <h4 className="font-semibold">{suggestion.food.name}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{suggestion.reason}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {suggestion.food.calories} cal • P: {suggestion.food.protein}g • C: {suggestion.food.carbs}g • F: {suggestion.food.fat}g
                            </p>
                        </div>
                        <Button
                            onClick={() => onAddFood(suggestion.food)}
                            size="sm"
                            variant="outline"
                        >
                            Add
                        </Button>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
