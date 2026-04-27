import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Settings as SettingsIcon, Trash2, Calendar, LogIn, Pencil } from 'lucide-react'
import { storage } from '@/services/storage'
import { SuggestionsCard } from '@/features/suggestions/SuggestionsCard'
import type { UserProfile, DailyLog, FoodItem } from '@/services/storage/types'

interface DashboardProps {
    profile: UserProfile
    onAddFood: () => void
    onSettings: () => void
    onHistory: () => void
    onLogin: () => void
    isAuthenticated: boolean
    onEdit?: (item: FoodItem) => void
}

export function Dashboard({ profile, onAddFood, onSettings, onHistory, onLogin, isAuthenticated, onEdit }: DashboardProps) {
    const [todayLog, setTodayLog] = useState<DailyLog | null>(null)
    const today = new Date().toISOString().split('T')[0]

    // Reload when mounted
    useEffect(() => {
        loadTodayLog()
    }, [])

    const loadTodayLog = async () => {
        const log = await storage.getDailyLog(today)
        setTodayLog(log)
    }

    const handleQuickAdd = async (food: FoodItem) => {
        const newFood: FoodItem = {
            ...food,
            id: Date.now().toString(),
            timestamp: Date.now(),
        }
        await storage.addFoodToLog(today, newFood)
        await loadTodayLog()
    }

    const handleDelete = async (foodId: string) => {
        if (confirm('Are you sure you want to delete this item?')) {
            await storage.removeFoodFromLog(today, foodId)
            await loadTodayLog()
        }
    }

    const consumed = useMemo(() => ({
        calories: todayLog?.foods.reduce((sum, f) => sum + f.calories, 0) || 0,
        protein: todayLog?.foods.reduce((sum, f) => sum + f.protein, 0) || 0,
        carbs: todayLog?.foods.reduce((sum, f) => sum + f.carbs, 0) || 0,
        fat: todayLog?.foods.reduce((sum, f) => sum + f.fat, 0) || 0,
        fiber: todayLog?.foods.reduce((sum, f) => sum + (f.fiber ?? 0), 0) || 0,
        fiberHasData: todayLog?.foods.some(f => f.fiber != null) || false,
        fiberHasEstimates: todayLog?.foods.some(f => f.fiber != null && f.fiberEstimated) || false,
    }), [todayLog])

    const progress = useMemo(() => ({
        calories: (consumed.calories / profile.targetCalories) * 100,
        protein: (consumed.protein / profile.targetProtein) * 100,
        carbs: (consumed.carbs / profile.targetCarbs) * 100,
        fat: (consumed.fat / profile.targetFat) * 100,
        fiber: profile.targetFiber ? (consumed.fiber / profile.targetFiber) * 100 : 0,
    }), [consumed, profile])

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="container mx-auto p-4 space-y-6 max-w-6xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">Welcome back, {profile.name}</h1>
                        <p className="text-muted-foreground mt-1 text-sm sm:text-base">Track your nutrition journey</p>
                    </div>
                    <div className="flex gap-2">
                        {!isAuthenticated && (
                            <Button variant="outline" size="lg" onClick={onLogin} className="gap-2 flex-1 sm:flex-none">
                                <LogIn className="h-5 w-5" />
                                <span className="hidden sm:inline">Sign In</span>
                            </Button>
                        )}
                        <Button onClick={onHistory} size="lg" variant="outline" className="gap-2 flex-1 sm:flex-none">
                            <Calendar className="h-5 w-5" />
                            <span className="hidden sm:inline">History</span>
                        </Button>
                        <Button onClick={onSettings} size="lg" variant="outline" className="gap-2 flex-1 sm:flex-none">
                            <SettingsIcon className="h-5 w-5" />
                            <span className="hidden sm:inline">Settings</span>
                        </Button>
                        <Button onClick={onAddFood} size="lg" className="gap-2 flex-1 sm:flex-none">
                            <Plus className="h-5 w-5" />
                            <span className="hidden sm:inline">Log Food</span>
                        </Button>
                    </div>
                </div>

                <div className={`grid gap-3 sm:gap-4 ${profile.targetFiber ? 'grid-cols-2 lg:grid-cols-5' : 'grid-cols-2 lg:grid-cols-4'}`}>
                    <MacroCard
                        title="Calories"
                        consumed={consumed.calories}
                        target={profile.targetCalories}
                        progress={progress.calories}
                        color="bg-primary"
                    />
                    <MacroCard
                        title="Protein"
                        consumed={consumed.protein}
                        target={profile.targetProtein}
                        progress={progress.protein}
                        color="bg-blue-500 dark:bg-blue-400"
                        unit="g"
                    />
                    <MacroCard
                        title="Carbs"
                        consumed={consumed.carbs}
                        target={profile.targetCarbs}
                        progress={progress.carbs}
                        color="bg-orange-500 dark:bg-orange-400"
                        unit="g"
                    />
                    <MacroCard
                        title="Fat"
                        consumed={consumed.fat}
                        target={profile.targetFat}
                        progress={progress.fat}
                        color="bg-purple-500 dark:bg-purple-400"
                        unit="g"
                    />
                    {profile.targetFiber && (
                        <MacroCard
                            title="Fiber"
                            consumed={Math.round(consumed.fiber * 10) / 10}
                            target={profile.targetFiber}
                            progress={progress.fiber}
                            color="bg-green-500 dark:bg-green-400"
                            unit="g"
                            estimated={consumed.fiberHasEstimates}
                            noData={!consumed.fiberHasData}
                        />
                    )}
                </div>

                <SuggestionsCard
                    profile={profile}
                    consumed={consumed}
                    onAddFood={handleQuickAdd}
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Today's Meals</CardTitle>
                        <CardDescription>
                            {todayLog?.foods.length || 0} items logged
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!todayLog || todayLog.foods.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <p className="text-lg">No meals logged yet today</p>
                                <p className="text-sm mt-2">Click "Log Food" to get started</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {todayLog.foods.map((food) => (
                                    <div
                                        key={food.id}
                                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-primary/10 transition-colors group"
                                    >
                                        <div className="flex-1 min-w-0 mr-4">
                                            <h4 className="font-semibold truncate">{food.name}</h4>
                                            <p className="text-sm text-muted-foreground">{food.weight}g</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="font-semibold">{food.calories} cal</p>
                                                <p className="text-xs text-muted-foreground">
                                                    P: {food.protein}g • C: {food.carbs}g • F: {food.fat}g
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => onEdit?.(food)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleDelete(food.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function MacroCard({
    title,
    consumed,
    target,
    progress,
    color,
    unit = 'kcal',
    estimated = false,
    noData = false,
}: {
    title: string
    consumed: number
    target: number
    progress: number
    color: string
    unit?: string
    estimated?: boolean
    noData?: boolean
}) {
    const clampedProgress = Math.min(progress, 100)

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {noData ? (
                    <>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-muted-foreground">—</span>
                            <span className="text-muted-foreground">/ {target} {unit}</span>
                        </div>
                        <div className="relative h-2 bg-secondary rounded-full overflow-hidden" />
                        <p className="text-xs text-muted-foreground">No data logged yet</p>
                    </>
                ) : (
                    <>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold">{Math.round(consumed)}</span>
                            <span className="text-muted-foreground">/ {target} {unit}</span>
                            {estimated && (
                                <span className="text-xs text-muted-foreground" title="Some values estimated from AI analysis">est.</span>
                            )}
                        </div>
                        <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                                className={`absolute inset-y-0 left-0 ${color} rounded-full transition-all duration-500`}
                                style={{ width: `${clampedProgress}%` }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {Math.round(progress)}% of daily goal
                        </p>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
