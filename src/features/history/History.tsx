import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import { storage } from '@/services/storage'
import type { DailyLog, UserProfile } from '@/services/storage/types'

interface HistoryProps {
    profile: UserProfile
    onBack: () => void
}

export function History({ profile, onBack }: HistoryProps) {
    const [logs, setLogs] = useState<DailyLog[]>([])
    const [expandedDate, setExpandedDate] = useState<string | null>(null)

    useEffect(() => {
        loadLogs()
    }, [])

    const loadLogs = async () => {
        const allLogs = await storage.getAllLogs()
        setLogs(allLogs)
    }

    const toggleExpand = (date: string) => {
        if (expandedDate === date) {
            setExpandedDate(null)
        } else {
            setExpandedDate(date)
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        }).format(date)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="container mx-auto p-4 space-y-6 max-w-4xl">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">History</h1>
                        <p className="text-muted-foreground text-sm">Your nutrition journey</p>
                    </div>
                </div>

                {logs.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold">No logs yet</h3>
                            <p className="text-muted-foreground mt-1">
                                Start logging your meals to see your history here.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {logs.map((log) => {
                            const calories = log.foods.reduce((sum, f) => sum + f.calories, 0)
                            const protein = log.foods.reduce((sum, f) => sum + f.protein, 0)
                            const carbs = log.foods.reduce((sum, f) => sum + f.carbs, 0)
                            const fat = log.foods.reduce((sum, f) => sum + f.fat, 0)

                            const isExpanded = expandedDate === log.date
                            const progress = Math.min((calories / profile.targetCalories) * 100, 100)

                            return (
                                <Card key={log.date} className="overflow-hidden transition-all">
                                    <div
                                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-primary/10 transition-colors"
                                        onClick={() => toggleExpand(log.date)}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold">{formatDate(log.date)}</h3>
                                                {log.date === new Date().toISOString().split('T')[0] && (
                                                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-medium">
                                                        Today
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span>{Math.round(calories)} / {profile.targetCalories} cal</span>
                                                <div className="h-1.5 w-24 bg-secondary rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary rounded-full"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="hidden sm:flex text-xs text-muted-foreground gap-3">
                                                <span>P: {Math.round(protein)}g</span>
                                                <span>C: {Math.round(carbs)}g</span>
                                                <span>F: {Math.round(fat)}g</span>
                                            </div>
                                            {isExpanded ? (
                                                <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                            ) : (
                                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                            )}
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="border-t bg-muted/30 px-4 py-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
                                            {log.foods.length === 0 ? (
                                                <p className="text-sm text-muted-foreground text-center py-2">No foods logged</p>
                                            ) : (
                                                log.foods.map((food) => (
                                                    <div key={food.id} className="flex justify-between text-sm py-1">
                                                        <span>{food.name} <span className="text-muted-foreground">({food.weight}g)</span></span>
                                                        <span className="font-medium">{food.calories} cal</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
