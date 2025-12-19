import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { OnboardingForm } from './features/onboarding/OnboardingForm'
import { Dashboard } from './features/dashboard/Dashboard'
import { FoodEntry } from './features/food-entry/FoodEntry'
import { Settings } from './features/settings/Settings'
import { History } from './features/history/History'
import { Login } from './features/auth/Login'
import { storage } from '@/services/storage'
import { supabase } from '@/lib/supabase'

import type { UserProfile, FoodItem } from './services/storage/types'


type AppView = 'onboarding' | 'dashboard' | 'food-entry' | 'settings' | 'history' | 'login'

function App() {
  const [view, setView] = useState<AppView>('dashboard')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)

  // Ghost Card State

  const [editingItem, setEditingItem] = useState<FoodItem | null>(null)
  const [shouldAnimate, setShouldAnimate] = useState(false)

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system'
    }
    return 'system'
  })

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
    localStorage.setItem('theme', theme)
  }, [theme])

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
    // Reset animation flag after transition
    if (shouldAnimate) {
      const timer = setTimeout(() => setShouldAnimate(false), 500)
      return () => clearTimeout(timer)
    }
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



  const handleEdit = (item: FoodItem) => {
    setEditingItem(item)
    setView('food-entry')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }



  const handleProfileUpdate = async (updatedProfile: UserProfile) => {
    await storage.saveUserProfile(updatedProfile)
    setProfile(updatedProfile)
  }

  const renderContent = () => {
    if (view === 'login') return <Login />
    if (view === 'onboarding') return <OnboardingForm onComplete={handleOnboardingComplete} />

    if (view === 'food-entry' && profile) {
      return (
        <FoodEntry
          onComplete={() => {
            setEditingItem(null)
            setShouldAnimate(true)
            setView('dashboard')
          }}
          onCancel={() => {
            setEditingItem(null)
            setView('dashboard')
          }}
          onSettings={() => setView('settings')}
          isAuthenticated={!!session}
          onLogin={() => setView('login')}
          initialData={editingItem}
        />
      )
    }

    if (view === 'settings' && profile) {
      return (
        <Settings
          profile={profile}
          onBack={() => setView('dashboard')}
          onUpdate={handleProfileUpdate}
          theme={theme}
          onThemeChange={setTheme}
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
          onAddFood={() => {
            setEditingItem(null)
            setView('food-entry')
          }}
          onHistory={() => setView('history')}
          onSettings={() => setView('settings')}
          onLogin={() => setView('login')}
          isAuthenticated={!!session}
          onEdit={handleEdit}
        />
      )
    }

    return null
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: shouldAnimate ? 0.3 : 0 }}
          className="min-h-screen"
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </>
  )
}

export default App
