import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { storage } from '@/services/storage/local'
import type { UserProfile, DailyLog } from '@/services/storage/types'

interface DashboardProps {
    profile: UserProfile
    onAddFood: () => void
}

export function Dashboard({ profile, onAddFood }: DashboardProps) {
    const [todayLog, setTodayLog] = useState<DailyLog | null>(null)
    const today = new Date().toISOString().split('T')[0]

    useEffect(() => {
        loadTodayLog()
    }, [])

    const loadTodayLog = async () => {
        const log = await storage.getDailyLog(today)
        setTodayLog(log)
    }

    const consumed = {
        calories: todayLog?.foods.reduce((sum, f) => sum + f.calories, 0) || 0,
        protein: todayLog?.foods.reduce((sum, f) => sum + f.protein, 0) || 0,
        carbs: todayLog?.foods.reduce((sum, f) => sum + f.carbs, 0) || 0,
        fat: todayLog?.foods.reduce((sum, f) => sum + f.fat, 0) || 0,
    }

    const progress = {
        calories: (consumed.calories / profile.targetCalories) * 100,
        protein: (consumed.protein / profile.targetProtein) * 100,
        carbs: (consumed.carbs / profile.targetCarbs) * 100,
        fat: (consumed.fat / profile.targetFat) * 100,
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="container mx-auto p-4 space-y-6 max-w-6xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight">Welcome back, {profile.name}</h1>
                        <p className="text-muted-foreground mt-1">Track your nutrition journey</p>
                    </div>
                    <Button onClick={onAddFood} size="lg" className="gap-2">
                        <Plus className="h-5 w-5" />
                        Log Food
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MacroCard
                        title="Calories"
                        consumed={consumed.calories}
                        target={profile.targetCalories}
                        progress={progress.calories}
                        color="from-orange-500 to-red-500"
                    />
                    <MacroCard
                        title="Protein"
                        consumed={consumed.protein}
                        target={profile.targetProtein}
                        progress={progress.protein}
                        color="from-blue-500 to-cyan-500"
                        unit="g"
                    />
                    <MacroCard
                        title="Carbs"
                        consumed={consumed.carbs}
                        target={profile.targetCarbs}
                        progress={progress.carbs}
                        color="from-green-500 to-emerald-500"
                        unit="g"
                    />
                    <MacroCard
                        title="Fat"
                        consumed={consumed.fat}
                        target={profile.targetFat}
                        progress={progress.fat}
                        color="from-purple-500 to-pink-500"
                        unit="g"
                    />
                </div>

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
                                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                    >
                                        <div>
                                            <h4 className="font-semibold">{food.name}</h4>
                                            <p className="text-sm text-muted-foreground">{food.weight}g</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">{food.calories} cal</p>
                                            <p className="text-xs text-muted-foreground">
                                                P: {food.protein}g • C: {food.carbs}g • F: {food.fat}g
                                            </p>
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
}: {
    title: string
    consumed: number
    target: number
    progress: number
    color: string
    unit?: string
}) {
    const clampedProgress = Math.min(progress, 100)

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{Math.round(consumed)}</span>
                    <span className="text-muted-foreground">/ {target} {unit}</span>
                </div>
                <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                        className={`absolute inset-y-0 left-0 bg-gradient-to-r ${color} rounded-full transition-all duration-500`}
                        style={{ width: `${clampedProgress}%` }}
                    />
                </div>
                <p className="text-xs text-muted-foreground">
                    {Math.round(progress)}% of daily goal
                </p>
            </CardContent>
        </Card>
    )
}
