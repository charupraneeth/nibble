import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, LogOut } from 'lucide-react'
import { getConfig, saveConfig } from '@/services/config'
import { supabase } from '@/lib/supabase'
import { calculateTargets } from '@/features/onboarding/utils'
import type { AppConfig } from '@/services/config'
import type { UserProfile } from '@/services/storage/types'
import packageJson from '../../../package.json'

interface SettingsProps {
    profile: UserProfile
    onBack: () => void
    onUpdate: (profile: UserProfile) => Promise<void>
}

export function Settings({ profile, onBack, onUpdate }: SettingsProps) {
    const [config, setConfig] = useState<AppConfig>(getConfig())
    const [apiKey, setApiKey] = useState(config.openaiApiKey || '')
    const [session, setSession] = useState<any>(null)

    // Profile State
    const [weight, setWeight] = useState(profile.weight.toString())
    const [goal, setGoal] = useState<UserProfile['goal']>(profile.goal)
    const [activityLevel, setActivityLevel] = useState<UserProfile['activityLevel']>(profile.activityLevel)

    useEffect(() => {
        setApiKey(config.openaiApiKey || '')
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
        })
    }, [config])

    const handleSave = async () => {
        // Save Config
        const newConfig: AppConfig = {
            aiProvider: config.aiProvider,
            openaiApiKey: config.aiProvider === 'openai' ? apiKey : undefined,
        }
        saveConfig(newConfig)
        setConfig(newConfig)

        // Calculate and Save Profile updates
        const newTargets = calculateTargets(
            Number(weight),
            profile.height,
            profile.age,
            profile.gender,
            activityLevel,
            goal
        )

        const newProfile: UserProfile = {
            ...profile,
            weight: Number(weight),
            goal,
            activityLevel,
            ...newTargets,
        }

        await onUpdate(newProfile)

        alert('Settings saved! Your nutritional targets have been updated.')
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        onBack()
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="container mx-auto p-4 space-y-6 max-w-2xl">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Account</CardTitle>
                        <CardDescription>Manage your account and data</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">{profile.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {session ? session.user.email : 'Guest User (Local Storage)'}
                                </p>
                            </div>
                            {session && (
                                <Button variant="destructive" size="sm" onClick={handleLogout}>
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Sign Out
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Your Plan</CardTitle>
                        <CardDescription>Update your goals and stats</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="weight">Weight (kg)</Label>
                            <Input
                                id="weight"
                                type="number"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Goal</Label>
                            <Select value={goal} onValueChange={(v: any) => setGoal(v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select goal" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="lose">Lose Weight</SelectItem>
                                    <SelectItem value="maintain">Maintain Weight</SelectItem>
                                    <SelectItem value="gain">Gain Muscle</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label>Activity Level</Label>
                            <Select value={activityLevel} onValueChange={(v: any) => setActivityLevel(v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select activity level" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sedentary">Sedentary (Office job)</SelectItem>
                                    <SelectItem value="light">Lightly Active (1-3 days/week)</SelectItem>
                                    <SelectItem value="moderate">Moderately Active (3-5 days/week)</SelectItem>
                                    <SelectItem value="active">Active (6-7 days/week)</SelectItem>
                                    <SelectItem value="very_active">Very Active (Physical job)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>AI Provider</CardTitle>
                        <CardDescription>
                            AI-powered food analysis using GPT-4 Vision
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
                                <div className="flex">
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                            Active Analysis Mode
                                        </h3>
                                        <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                                            <ul className="list-disc pl-5 space-y-1">
                                                <li>
                                                    <strong>10 Free Scans/Day:</strong> Automatic if you are signed in (no key needed).
                                                </li>
                                                <li>
                                                    <strong>Unlimited Scans:</strong> If you provide your own OpenAI Key below, you'll bypass daily limits.
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="apiKey">Custom OpenAI API Key (Optional)</Label>
                                <Input
                                    id="apiKey"
                                    type="password"
                                    placeholder="sk-..."
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Only required if you want unlimited usage. Get one from{' '}
                                    <a
                                        href="https://platform.openai.com/api-keys"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline hover:text-foreground"
                                    >
                                        platform.openai.com
                                    </a>
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <p className="text-sm text-muted-foreground text-center">
                                Version {packageJson.version}
                            </p>
                        </div>

                        <Button onClick={handleSave} className="w-full" size="lg">
                            Save Settings
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
