import { useEffect, useState } from 'react'
import { OnboardingForm } from './features/onboarding/OnboardingForm'
import { Dashboard } from './features/dashboard/Dashboard'
import { FoodEntry } from './features/food-entry/FoodEntry'
import { storage } from './services/storage/local'
import type { UserProfile } from './services/storage/types'

type AppView = 'onboarding' | 'dashboard' | 'food-entry'

function App() {
  const [view, setView] = useState<AppView>('onboarding')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const userProfile = await storage.getUserProfile()
    if (userProfile) {
      setProfile(userProfile)
      setView('dashboard')
    }
    setLoading(false)
  }

  const handleOnboardingComplete = async () => {
    await loadProfile()
  }

  const handleFoodEntryComplete = () => {
    setView('dashboard')
    // Force dashboard to reload
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (view === 'onboarding') {
    return <OnboardingForm onComplete={handleOnboardingComplete} />
  }

  if (view === 'food-entry' && profile) {
    return (
      <FoodEntry
        onComplete={handleFoodEntryComplete}
        onCancel={() => setView('dashboard')}
      />
    )
  }

  if (profile) {
    return <Dashboard profile={profile} onAddFood={() => setView('food-entry')} />
  }

  return null
}

export default App
