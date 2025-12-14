import { useState, useEffect } from 'react'
import { OnboardingForm } from './features/onboarding/OnboardingForm'
import { Dashboard } from './features/dashboard/Dashboard'
import { FoodEntry } from './features/food-entry/FoodEntry'
import { Settings } from './features/settings/Settings'
import { History } from './features/history/History'
import { Login } from './features/auth/Login'
import { storage } from '@/services/storage'
import { supabase } from '@/lib/supabase'
import type { UserProfile } from './services/storage/types'

type AppView = 'onboarding' | 'dashboard' | 'food-entry' | 'settings' | 'history' | 'login'

function App() {
  const [view, setView] = useState<AppView>('dashboard')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      // Reload profile when auth changes
      loadProfile()
      if (session && view === 'login') {
        setView('dashboard')
      }
    })

    return () => subscription.unsubscribe()
  }, [view])

  useEffect(() => {
    loadProfile()
  }, [session]) // Reload when session changes

  const loadProfile = async () => {
    try {
      const userProfile = await storage.getUserProfile()
      if (userProfile) {
        setProfile(userProfile)
        // If we're on onboarding but have a profile, go to dashboard
        if (view === 'onboarding') {
          setView('dashboard')
        }
      } else {
        // If no profile, go to onboarding (unless we are logging in)
        if (view !== 'login') {
          setView('onboarding')
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOnboardingComplete = async (newProfile: UserProfile) => {
    await storage.saveUserProfile(newProfile)
    setProfile(newProfile)
    setView('dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (view === 'login') {
    return <Login />
  }

  if (view === 'onboarding') {
    return <OnboardingForm onComplete={handleOnboardingComplete} />
  }

  if (view === 'food-entry' && profile) {
    return (
      <FoodEntry
        onComplete={() => setView('dashboard')}
        onCancel={() => setView('dashboard')}
        onSettings={() => setView('settings')}
        isAuthenticated={!!session}
        onLogin={() => setView('login')}
      />
    )
  }

  const handleProfileUpdate = async (updatedProfile: UserProfile) => {
    await storage.saveUserProfile(updatedProfile)
    setProfile(updatedProfile)
  }

  if (view === 'settings' && profile) {
    return (
      <Settings
        profile={profile}
        onBack={() => setView('dashboard')}
        onUpdate={handleProfileUpdate}
      />
    )
  }

  if (view === 'history' && profile) {
    return <History profile={profile} onBack={() => setView('dashboard')} />
  }

  if (profile) {
    return (
      <Dashboard
        profile={profile}
        onAddFood={() => setView('food-entry')}
        onHistory={() => setView('history')}
        onSettings={() => setView('settings')}
        onLogin={() => setView('login')}
        isAuthenticated={!!session}
      />
    )
  }

  return null
}

export default App
