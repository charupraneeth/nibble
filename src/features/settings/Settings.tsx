import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ArrowLeft, LogOut } from 'lucide-react'
import { getConfig, saveConfig } from '@/services/config'
import { supabase } from '@/lib/supabase'
import type { AppConfig } from '@/services/config'
import type { UserProfile } from '@/services/storage/types'

interface SettingsProps {
    profile: UserProfile
    onBack: () => void
}

export function Settings({ profile, onBack }: SettingsProps) {
    const [config, setConfig] = useState<AppConfig>(getConfig())
    const [apiKey, setApiKey] = useState(config.openaiApiKey || '')
    const [session, setSession] = useState<any>(null)

    useEffect(() => {
        setApiKey(config.openaiApiKey || '')
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
        })
    }, [config])

    const handleSave = () => {
        const newConfig: AppConfig = {
            aiProvider: config.aiProvider,
            openaiApiKey: config.aiProvider === 'openai' ? apiKey : undefined,
        }
        saveConfig(newConfig)
        setConfig(newConfig)
        alert('Settings saved! Changes will take effect on next food analysis.')
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
                        <CardTitle>AI Provider</CardTitle>
                        <CardDescription>
                            Choose between mock data or real AI analysis
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <RadioGroup
                            value={config.aiProvider}
                            onValueChange={(value) => setConfig({ ...config, aiProvider: value as 'mock' | 'openai' })}
                        >
                            <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                                <RadioGroupItem value="mock" id="mock" />
                                <div className="space-y-1 leading-none">
                                    <Label htmlFor="mock" className="font-medium cursor-pointer">
                                        Mock AI (Demo)
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Returns sample nutrition data for testing
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                                <RadioGroupItem value="openai" id="openai" />
                                <div className="space-y-1 leading-none">
                                    <Label htmlFor="openai" className="font-medium cursor-pointer">
                                        OpenAI (Real Analysis)
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Uses GPT-4 Vision for accurate food analysis
                                    </p>
                                </div>
                            </div>
                        </RadioGroup>

                        {config.aiProvider === 'openai' && (
                            <div className="space-y-2 pt-4 border-t">
                                <Label htmlFor="api-key">OpenAI API Key</Label>
                                <Input
                                    id="api-key"
                                    type="password"
                                    placeholder="sk-..."
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Get your API key from{' '}
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
                        )}

                        <Button onClick={handleSave} className="w-full" size="lg">
                            Save Settings
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
