import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, apiClient, User } from '../utils/supabase/client'
import { AuthSession, AuthUser } from '@supabase/supabase-js'
import { CacheManager } from '../utils/cacheManager'
import { BackgroundSync } from '../utils/backgroundSync'
import { projectId, publicAnonKey } from '../utils/supabase/info'

interface AuthState {
  user: AuthUser | null
  profile: User | null
  session: AuthSession | null
  loading: boolean
  error: string | null
  isOfflineMode: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    error: null,
    isOfflineMode: false
  })

  // Track active profile fetch to prevent duplicates
  const activeProfileFetch = useRef<Promise<any> | null>(null)

  // Shared profile fetch function to prevent race conditions
  const fetchUserProfile = useCallback(async (token: string, context: string) => {
    // If there's already an active fetch, wait for it
    if (activeProfileFetch.current) {
      console.log(`${context} - Profile fetch already in progress, waiting...`)
      try {
        return await activeProfileFetch.current
      } catch (error) {
        console.log(`${context} - Existing profile fetch failed, trying new fetch`)
        activeProfileFetch.current = null
      }
    }

    console.log(`${context} - Starting new profile fetch`)
    
    const fetchPromise = (async () => {
      try {
        const profilePromise = apiClient.getUserProfile(token)
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Profile timeout')), 10000) // Increased from 3s to 10s
        )
        
        const result = await Promise.race([profilePromise, timeoutPromise])
        console.log(`${context} - Profile fetch successful:`, {
          email: result.user?.email,
          firstName: result.user?.first_name,
          lastName: result.user?.last_name,
          displayName: result.user?.display_name,
          totalPoints: result.user?.total_points
        })
        
        activeProfileFetch.current = null
        return result
      } catch (error) {
        activeProfileFetch.current = null
        throw error
      }
    })()
    
    activeProfileFetch.current = fetchPromise
    return fetchPromise
  }, [])

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        // Check cache first for faster loading
        const cachedProfile = CacheManager.getUserProfile<User>()
        const authHint = CacheManager.getAuthHint()
        
        // Show cached profile immediately if available
        if (cachedProfile && authHint?.hasAuth) {
          setAuthState(prev => ({
            ...prev,
            profile: cachedProfile,
            loading: true, // Still loading to verify session
            isOfflineMode: false
          }))
        }

        // Add timeout to prevent hanging
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 2000) // Reduced timeout
        )
        
        // Get current session with timeout
        let session = null
        let sessionError = null
        
        try {
          const result = await Promise.race([sessionPromise, timeoutPromise])
          session = result.data?.session
          sessionError = result.error
        } catch (raceError: any) {
          // Handle timeout or other race errors
          if (raceError?.message === 'Auth timeout') {
            console.log('Auth session timeout - working offline')
          } else {
            console.log('Auth session race error:', raceError)
          }
        }
        
        // Handle session errors (including refresh token errors)
        if (sessionError) {
          console.log('Auth session error:', sessionError.message)
          
          // Silently handle refresh token errors - these are expected when tokens expire
          if (sessionError.message?.includes('Refresh Token') || 
              sessionError.message?.includes('refresh_token') ||
              sessionError.name === 'AuthApiError') {
            console.log('Refresh token expired/invalid - clearing session and local storage')
            
            // Clear ALL Supabase storage to remove stale tokens
            try {
              localStorage.removeItem('sb-sczqurjsiiaopszmuaof-auth-token')
              sessionStorage.clear()
            } catch (storageError) {
              console.log('Error clearing storage:', storageError)
            }
            
            // Sign out to clear invalid session
            try {
              await supabase.auth.signOut({ scope: 'local' })
            } catch (signOutError) {
              // Ignore signout errors
            }
          }
          
          // Clear auth cache on error
          CacheManager.remove('user_profile')
          CacheManager.clearUserProfile()
          CacheManager.setAuthHint(false)
          
          if (mounted) {
            setAuthState({
              user: null,
              profile: null,
              session: null,
              loading: false,
              error: null,
              isOfflineMode: false
            })
          }
          return
        }

        if (session?.user) {
          // Update auth hint
          CacheManager.setAuthHint(true)
          
          // Get user profile from database or cache
          try {
            let profile = cachedProfile
            
            // Fetch fresh profile if cache expired or missing
            if (!profile || CacheManager.isExpired('user_profile')) {
              console.log('INIT AUTH - Need fresh profile for:', session.user.email)
              console.log('INIT AUTH - Session details:', {
                hasSession: !!session,
                hasAccessToken: !!session.access_token,
                accessTokenLength: session.access_token?.length,
                userEmail: session.user.email
              })
              
              const token = session.access_token
              if (!token) {
                throw new Error('No access token in session during init')
              }
              
              const { user: freshProfile } = await fetchUserProfile(token, 'INIT AUTH')
              profile = freshProfile
              
              // Cache the fresh profile
              CacheManager.setUserProfile(profile)
            } else {
              console.log('INIT AUTH - Using cached profile:', { 
                email: profile?.email, 
                firstName: profile?.first_name, 
                lastName: profile?.last_name,
                displayName: profile?.display_name,
                totalPoints: profile?.total_points
              })
            }
            
            if (mounted) {
              setAuthState({
                user: session.user,
                profile,
                session,
                loading: false,
                error: null,
                isOfflineMode: false
              })

              // Start background sync for authenticated user
              BackgroundSync.startSync()
            }
          } catch (profileError) {
            console.log('INIT AUTH - Profile fetch failed, using auth without profile:', profileError)
            if (mounted) {
              setAuthState({
                user: session.user,
                profile: cachedProfile, // Use cached profile if available
                session,
                loading: false,
                error: null,
                isOfflineMode: false
              })
            }
          }
        } else {
          // Clear cache when no session
          CacheManager.remove('user_profile')
          CacheManager.setAuthHint(false)
          
          if (mounted) {
            setAuthState({
              user: null,
              profile: null,
              session: null,
              loading: false,
              error: null,
              isOfflineMode: false
            })
          }
        }
      } catch (error) {
        console.log('Auth initialization failed, working offline:', error instanceof Error ? error.message : 'Unknown error')
        // Don't show initialization errors to user - just work without auth
        if (mounted) {
          setAuthState({
            user: null,
            profile: null,
            session: null,
            loading: false,
            error: null,
            isOfflineMode: true
          })
        }
      }
    }

    initializeAuth()

    // Safety timeout - force loading to false after 5 seconds (increased from 3)
    // This only fires if initialization completely hangs
    const safetyTimeout = setTimeout(() => {
      if (mounted) {
        // Only trigger offline mode if we don't have a session at all
        setAuthState(prev => {
          // If we already have a session, don't override it
          if (prev.session && prev.user) {
            console.log('Auth initialization timeout, but session exists - keeping auth state')
            return { ...prev, loading: false }
          }
          
          console.log('Auth initialization timeout, no session - working offline')
          return { 
            ...prev, 
            loading: false,
            error: null,
            isOfflineMode: true
          }
        })
      }
    }, 5000) // Increased from 3s to 5s

    // Listen for auth changes (but only if not in offline mode)
    let subscription: any = { unsubscribe: () => {} }
    
    try {
      const authListener = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!mounted) return

          console.log('Auth state change event:', event)

          // Silently handle refresh token errors in auth state changes
          if (event === 'TOKEN_REFRESH_FAILED') {
            console.log('Token refresh failed - clearing session')
            try {
              await supabase.auth.signOut({ scope: 'local' })
            } catch (signOutError) {
              // Ignore signout errors
            }
            CacheManager.remove('user_profile')
            CacheManager.clearUserProfile()
            CacheManager.setAuthHint(false)
            setAuthState({
              user: null,
              profile: null,
              session: null,
              loading: false,
              error: null,
              isOfflineMode: false
            })
            // Clear safety timeout since we're handling auth state
            clearTimeout(safetyTimeout)
            return
          }

          // Handle INITIAL_SESSION event (existing session on mount)
          if (event === 'INITIAL_SESSION' && session?.user) {
            console.log('INITIAL_SESSION - Existing session detected:', session.user.email)
            // Clear safety timeout since we have a valid session
            clearTimeout(safetyTimeout)
            
            try {
              const token = session.access_token
              if (!token) {
                throw new Error('No access token in initial session')
              }
              
              // Check if we already have a fresh profile from cache
              const cachedProfile = CacheManager.getUserProfile<User>()
              
              let profile = cachedProfile
              if (!profile || CacheManager.isExpired('user_profile')) {
                console.log('INITIAL_SESSION - Fetching fresh profile')
                const { user: freshProfile } = await fetchUserProfile(token, 'INITIAL_SESSION')
                profile = freshProfile
                CacheManager.setUserProfile(profile)
              } else {
                console.log('INITIAL_SESSION - Using cached profile')
              }
              
              CacheManager.setAuthHint(true)
              
              setAuthState({
                user: session.user,
                profile,
                session,
                loading: false,
                error: null,
                isOfflineMode: false
              })
            } catch (error) {
              console.log('INITIAL_SESSION - Profile fetch failed:', error)
              CacheManager.setAuthHint(true)
              setAuthState({
                user: session.user,
                profile: null,
                session,
                loading: false,
                error: null,
                isOfflineMode: false
              })
            }
            return
          }

          if (event === 'SIGNED_IN' && session?.user) {
            console.log('SIGN_IN EVENT - User signed in:', session.user.email)
            console.log('SIGN_IN EVENT - Session details:', {
              hasSession: !!session,
              hasAccessToken: !!session.access_token,
              accessTokenLength: session.access_token?.length,
              accessTokenStart: session.access_token?.substring(0, 20) + '...',
              hasUser: !!session.user,
              userEmail: session.user.email
            })
            
            try {
              // Wait a moment for session to be fully established
              await new Promise(resolve => setTimeout(resolve, 100))
              
              const token = session.access_token
              if (!token) {
                throw new Error('No access token in session')
              }
              
              console.log('SIGN_IN EVENT - Using access token for profile fetch, length:', token.length)
              
              // Check if we already have a fresh profile from cache or active fetch
              const cachedProfile = CacheManager.getUserProfile<User>()
              
              let profile = cachedProfile
              if (!profile || CacheManager.isExpired('user_profile')) {
                console.log('SIGN_IN EVENT - Need to fetch profile')
                
                const { user: freshProfile } = await fetchUserProfile(token, 'SIGN_IN EVENT')
                profile = freshProfile
                
                // Cache the fresh profile
                CacheManager.setUserProfile(profile)
              } else {
                console.log('SIGN_IN EVENT - Using cached profile:', {
                  email: profile?.email,
                  firstName: profile?.first_name,
                  lastName: profile?.last_name,
                  displayName: profile?.display_name,
                  totalPoints: profile?.total_points
                })
              }
              
              // Cache auth state
              CacheManager.setAuthHint(true)
              
              setAuthState({
                user: session.user,
                profile,
                session,
                loading: false,
                error: null,
                isOfflineMode: false
              })
            } catch (error) {
              console.log('SIGN_IN EVENT - Profile fetch failed:', error)
              console.log('SIGN_IN EVENT - Error details:', {
                message: error instanceof Error ? error.message : 'Unknown error',
                hasSession: !!session,
                hasAccessToken: !!session?.access_token
              })
              CacheManager.setAuthHint(true)
              setAuthState({
                user: session.user,
                profile: null,
                session,
                loading: false,
                error: null,
                isOfflineMode: false
              })
            }
            return // ✅ CRITICAL: Return here to prevent falling through to other handlers
          } else if (event === 'SIGNED_UP') {
            // Handle signup event
            if (session?.user) {
              try {
                const token = session.access_token
                if (!token) {
                  throw new Error('No access token in signup session')
                }
                
                const { user: profile } = await fetchUserProfile(token, 'SIGN_UP EVENT')
                
                // Cache profile and auth state
                CacheManager.setUserProfile(profile)
                CacheManager.setAuthHint(true)
                
                setAuthState({
                  user: session.user,
                  profile,
                  session,
                  loading: false,
                  error: null,
                  isOfflineMode: false
                })
              } catch (error) {
                console.log('SIGN_UP EVENT - Profile fetch failed, using auth without profile:', error)
                CacheManager.setAuthHint(true)
                setAuthState({
                  user: session.user,
                  profile: null,
                  session,
                  loading: false,
                  error: null,
                  isOfflineMode: false
                })
              }
            }
          } else if (event === 'SIGNED_OUT') {
            // Stop background sync
            BackgroundSync.stopSync()
            
            // Clear all cache on sign out
            CacheManager.remove('user_profile')
            CacheManager.clearUserProfile() // Clear user-specific profile cache
            CacheManager.setAuthHint(false)
            CacheManager.clear() // Clear all app cache
          
            setAuthState({
              user: null,
              profile: null,
              session: null,
              loading: false,
              error: null,
              isOfflineMode: false
            })
          } else if (event === 'TOKEN_REFRESHED' && session) {
            console.log('TOKEN_REFRESHED - Refreshing session and profile')
          
            try {
              // Fetch fresh profile with new token
              const token = session.access_token
              if (token) {
                const { user: freshProfile } = await fetchUserProfile(token, 'TOKEN_REFRESHED')
                CacheManager.setUserProfile(freshProfile)
              
                setAuthState(prev => ({
                  ...prev,
                  session,
                  user: session.user,
                  profile: freshProfile
                }))
              
                console.log('TOKEN_REFRESHED - Profile refreshed successfully')
              } else {
                // No token in refreshed session, just update session
                setAuthState(prev => ({
                  ...prev,
                  session,
                  user: session.user
                }))
              }
            } catch (error) {
              console.log('TOKEN_REFRESHED - Profile refresh failed, keeping existing profile:', error)
              // Still update session even if profile fetch fails
              setAuthState(prev => ({
                ...prev,
                session,
                user: session.user
              }))
            }
          }
        }
      )
      subscription = authListener.data.subscription
    } catch (listenerError) {
      console.log('Auth listener setup failed, working in offline mode')
    }

    return () => {
      mounted = false
      subscription.unsubscribe()
      clearTimeout(safetyTimeout)
    }
  }, [])

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      
      // Add timeout to sign in - increased to 15 seconds
      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      })
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Sign in timeout')), 15000)
      )
      
      const { data, error } = await Promise.race([signInPromise, timeoutPromise])

      if (error) {
        setAuthState(prev => ({ 
          ...prev, 
          loading: false, 
          error: error.message 
        }))
        return { success: false, error: error.message }
      }

      // Auth state will be updated by the listener
      return { success: true, data }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? (error.message.includes('timeout') ? 'Connection timeout - please try again' : error.message)
        : 'Sign in failed'
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }))
      return { success: false, error: errorMessage }
    }
  }, [])

  // Sign up with email and password
  const signUp = useCallback(async (
    email: string, 
    password: string, 
    displayName: string,
    invitationToken?: string
  ) => {
    try {

      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      
      // Use the server signup endpoint which handles user creation AND welcome email
      const signupResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-91bdaa9f/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          email,
          password,
          displayName,
          invitationToken
        })
      })

      if (!signupResponse.ok) {
        const errorData = await signupResponse.json()
        const errorMessage = errorData.error || 'Signup failed'
        
        // Check if the error is due to duplicate email
        if (errorMessage.includes('already') || errorMessage.includes('exists') || errorMessage.includes('duplicate')) {
          throw new Error('Email already exists')
        }
        
        throw new Error(errorMessage)
      }

      const signupData = await signupResponse.json()
      console.log('✅ Server signup successful, user created and welcome email sent')

      // Now sign in with the created credentials to get a session
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setAuthState(prev => ({ 
          ...prev, 
          loading: false, 
          error: error.message 
        }))
        return { success: false, error: error.message }
      }

      // Submit to HubSpot after successful signup
      if (data.user && data.session) {
        try {
          // Submit to HubSpot form
          const hubspotFormData = new FormData()
          hubspotFormData.append('email', email)
          
          await fetch('https://api.hsforms.com/submissions/v3/integration/submit/139710685/4aa1b60a-6ede-4ecd-ae36-fddfc7c6686e', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fields: [
                {
                  name: 'email',
                  value: email
                }
              ],
              context: {
                pageUri: window.location.href,
                pageName: 'Gravalist Signup'
              }
            })
          })
          
          console.log('HubSpot form submission successful for:', email)
        } catch (hubspotError) {
          // Don't fail the signup if HubSpot submission fails
          console.error('HubSpot form submission failed:', hubspotError)
        }
      }

      // Auth state will be updated by the listener
      return { success: true, data }
      
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? (error.message.includes('timeout') ? 'Connection timeout - please try again' : error.message)
        : 'Sign up failed'
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }))
      return { success: false, error: errorMessage }
    }
  }, [])

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        setAuthState(prev => ({ 
          ...prev, 
          loading: false, 
          error: error.message 
        }))
        return { success: false, error: error.message }
      }

      // Auth state will be updated by the listener
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed'
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }))
      return { success: false, error: errorMessage }
    }
  }, [])

  // Update user profile
  const updateProfile = useCallback(async (updates: Partial<User>) => {
    try {
      const token = authState.session?.access_token
      console.log('Updating profile with auth state:', {
        hasUser: !!authState.user,
        hasSession: !!authState.session,
        hasToken: !!token,
        isAuthenticated: !!authState.user && !!authState.session
      })
      
      if (!token) {
        throw new Error('Authentication required. Please sign in to access this resource.')
      }
      
      const { user: updatedProfile } = await apiClient.updateUserProfile(updates, token)
      
      // Update cache with new profile
      CacheManager.setUserProfile(updatedProfile)
      
      setAuthState(prev => ({
        ...prev,
        profile: updatedProfile
      }))

      return { success: true, profile: updatedProfile }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed'
      console.error('Profile update error:', errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [authState.session, authState.user])

  // Refresh user profile
  const refreshProfile = useCallback(async () => {
    if (!authState.user || !authState.session) {
      console.log('Cannot refresh profile - no authenticated user')
      return { success: false, error: 'Not authenticated' }
    }
    
    try {
      console.log('Refreshing profile for user:', authState.user.email)
      const token = authState.session.access_token
      if (!token) {
        throw new Error('No access token in session for refresh')
      }
      
      const { user: profile } = await fetchUserProfile(token, 'REFRESH PROFILE')
      
      // Update cache with fresh profile
      CacheManager.setUserProfile(profile)
      
      setAuthState(prev => ({ ...prev, profile }))
      
      // Dispatch a custom event for components that need to react to profile updates
      window.dispatchEvent(new CustomEvent('profileRefreshed', { detail: profile }))
      
      return { success: true, profile }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile refresh failed'
      console.log('REFRESH PROFILE - Error:', errorMessage)
      
      // If auth error, clear the auth state
      if (errorMessage.includes('Authentication required')) {
        setAuthState({
          user: null,
          profile: null,
          session: null,
          loading: false,
          error: null,
          isOfflineMode: false
        })
      }
      
      return { success: false, error: errorMessage }
    }
  }, [authState.user, authState.session, fetchUserProfile])

  // Award points to user for specific activities
  const awardPoints = useCallback(async (
    activity: 'route_add' | 'route_complete' | 'route_start' | 'community_signup' | 'friend_invite' | 'social_share' | 'onboarding_complete',
    eventId?: string,
    description?: string
  ) => {
    if (!authState.session?.access_token) {
      return { success: false, error: 'Not authenticated' }
    }

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-91bdaa9f/user/award-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.session.access_token}`
        },
        body: JSON.stringify({
          activity,
          eventId,
          description
        })
      })

      if (!response.ok) {
        throw new Error('Failed to award points')
      }

      const result = await response.json()
      
      // Refresh profile to show updated points
      await refreshProfile()
      
      return { success: true, pointsAwarded: result.pointsAwarded, newTotal: result.newTotalPoints }
    } catch (error) {
      console.error('Error awarding points:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }, [authState.session, refreshProfile])

  // Clear auth error
  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }))
  }, [])

  // Check if user is authenticated
  const isAuthenticated = authState.user !== null && authState.session !== null

  // Check if user has completed profile setup
  const hasProfile = authState.profile !== null

  return {
    ...authState,
    isAuthenticated,
    hasProfile,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile,
    clearError,
    awardPoints
  }
}