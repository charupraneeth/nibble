import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { calculateTargets } from './utils'
import { storage } from '@/services/storage'
import type { UserProfile } from '@/services/storage/types'

export function OnboardingForm({ onComplete }: { onComplete: (profile: UserProfile) => void }) {
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        height: '',
        weight: '',
        gender: 'male' as 'male' | 'female' | 'other',
        activityLevel: 'moderate' as UserProfile['activityLevel'],
        goal: 'maintain' as UserProfile['goal'],
        dietaryPreferences: [] as string[],
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const targets = calculateTargets(
            Number(formData.weight),
            Number(formData.height),
            Number(formData.age),
            formData.gender,
            formData.activityLevel,
            formData.goal
        )

        const profile: UserProfile = {
            name: formData.name,
            age: Number(formData.age),
            height: Number(formData.height),
            weight: Number(formData.weight),
            gender: formData.gender,
            activityLevel: formData.activityLevel,
            goal: formData.goal,
            dietaryPreferences: formData.dietaryPreferences,
            ...targets,
        }

        await storage.saveUserProfile(profile)
        onComplete(profile)
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <Card className="w-full max-w-2xl shadow-xl">
                <CardHeader className="space-y-1 px-4 sm:px-6">
                    <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight">Welcome to Nibble</CardTitle>
                    <CardDescription className="text-sm sm:text-base">
                        Let's personalize your nutrition journey
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                placeholder="Your name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="age">Age</Label>
                                <Input
                                    id="age"
                                    type="number"
                                    placeholder="25"
                                    value={formData.age}
                                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="height">Height (cm)</Label>
                                <Input
                                    id="height"
                                    type="number"
                                    placeholder="170"
                                    value={formData.height}
                                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="weight">Weight (kg)</Label>
                                <Input
                                    id="weight"
                                    type="number"
                                    placeholder="70"
                                    value={formData.weight}
                                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Gender</Label>
                            <RadioGroup
                                value={formData.gender}
                                onValueChange={(value) => setFormData({ ...formData, gender: value as typeof formData.gender })}
                                className="flex flex-col sm:flex-row sm:gap-6"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="male" id="male" />
                                    <Label htmlFor="male" className="font-normal cursor-pointer">Male</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="female" id="female" />
                                    <Label htmlFor="female" className="font-normal cursor-pointer">Female</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="other" id="other" />
                                    <Label htmlFor="other" className="font-normal cursor-pointer">Other</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="activity">Activity Level</Label>
                            <Select
                                value={formData.activityLevel}
                                onValueChange={(value) => setFormData({ ...formData, activityLevel: value as typeof formData.activityLevel })}
                            >
                                <SelectTrigger id="activity">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sedentary">Sedentary (little to no exercise)</SelectItem>
                                    <SelectItem value="light">Light (1-3 days/week)</SelectItem>
                                    <SelectItem value="moderate">Moderate (3-5 days/week)</SelectItem>
                                    <SelectItem value="active">Active (6-7 days/week)</SelectItem>
                                    <SelectItem value="very_active">Very Active (intense daily)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="goal">Goal</Label>
                            <Select
                                value={formData.goal}
                                onValueChange={(value) => setFormData({ ...formData, goal: value as typeof formData.goal })}
                            >
                                <SelectTrigger id="goal">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="lose">Lose Weight</SelectItem>
                                    <SelectItem value="maintain">Maintain Weight</SelectItem>
                                    <SelectItem value="gain">Gain Weight</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button type="submit" className="w-full" size="lg">
                            Get Started
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
