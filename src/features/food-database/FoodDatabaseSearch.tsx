import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, ArrowLeft } from 'lucide-react'
import { foodDatabase } from '@/services/food-database'
import type { IndianFoodItem } from '@/services/food-database/types'
import type { FoodItem } from '@/services/storage/types'

interface FoodDatabaseSearchProps {
    onSelect: (food: FoodItem) => void
    onCancel: () => void
}

export function FoodDatabaseSearch({ onSelect, onCancel }: FoodDatabaseSearchProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<IndianFoodItem[]>([])

    const handleSearch = (searchQuery: string) => {
        setQuery(searchQuery)
        if (searchQuery.trim().length >= 2) {
            const searchResults = foodDatabase.search(searchQuery, 20)
            setResults(searchResults.map(r => r.food))
        } else {
            setResults([])
        }
    }

    const handleSelect = (food: IndianFoodItem) => {
        // Convert to FoodItem format
        const foodItem: FoodItem = {
            id: Date.now().toString(),
            name: food.name,
            weight: 100, // Default to 100g
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fat: food.fat,
            timestamp: Date.now(),
        }
        onSelect(foodItem)
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <Card className="w-full max-w-2xl">
                <CardHeader className="px-4 sm:px-6">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={onCancel}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <CardTitle className="text-xl sm:text-2xl">Search Food Database</CardTitle>
                            <CardDescription>
                                {foodDatabase.getCount()} Indian foods available
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search for food (e.g., chai, roti, dal)..."
                            value={query}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-10"
                            autoFocus
                        />
                    </div>

                    {query.trim().length > 0 && query.trim().length < 2 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Type at least 2 characters to search
                        </p>
                    )}

                    {query.trim().length >= 2 && results.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            No foods found matching "{query}"
                        </p>
                    )}

                    {results.length > 0 && (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {results.map((food) => (
                                <div
                                    key={food.id}
                                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-primary/10 transition-colors cursor-pointer"
                                    onClick={() => handleSelect(food)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-sm sm:text-base truncate">{food.name}</h4>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Per 100g: {food.calories} cal • P: {food.protein}g • C: {food.carbs}g • F: {food.fat}g
                                        </p>
                                        {food.servingUnit && (
                                            <p className="text-xs text-muted-foreground">
                                                Per {food.servingUnit}: {food.servingCalories} cal
                                            </p>
                                        )}
                                    </div>
                                    <Button size="sm" variant="outline">
                                        Add
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    {query.trim().length === 0 && (
                        <div className="text-center py-8">
                            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-sm text-muted-foreground">
                                Start typing to search from {foodDatabase.getCount()} Indian foods
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                                Database includes traditional dishes, beverages, snacks, and more
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
