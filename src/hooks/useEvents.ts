import { useState, useEffect, useCallback } from 'react'
import { apiClient, Event, UserEvent, UserStepProgress, EventParticipant } from '../utils/supabase/client'
import { useAuth } from './useAuth'
import { CacheManager } from '../utils/cacheManager'

interface EventsState {
  events: Event[]
  currentEvent: Event | null
  userEventRegistration: UserEvent | null
  stepProgress: UserStepProgress[]
  allEventsProgress: Record<string, UserStepProgress[]>
  currentStepByEvent: Record<string, { step: number; phase: string }>
  eventParticipants: EventParticipant[]
  loading: boolean
  error: string | null
}

export function useEvents() {
  const { isAuthenticated, refreshProfile } = useAuth()
  const [eventsState, setEventsState] = useState<EventsState>({
    events: [],
    currentEvent: null,
    userEventRegistration: null,
    stepProgress: [],
    allEventsProgress: {},
    currentStepByEvent: {},
    eventParticipants: [],
    loading: false,
    error: null
  })

  // Fetch all events
  const fetchEvents = useCallback(async () => {
    try {
      // Check cache first
      const cachedEvents = CacheManager.getEvents<Event>()
      if (cachedEvents && cachedEvents.length > 0) {
        setEventsState(prev => ({
          ...prev,
          events: cachedEvents,
          loading: false
        }))
        
        // Skip aggressive progress fetching if using cached events
        // Progress will be fetched on-demand when needed
        
        return { success: true, events: cachedEvents }
      }

      setEventsState(prev => ({ ...prev, loading: true, error: null }))
      
      const { events } = await apiClient.getEvents()
      
      // Cache the events
      CacheManager.setEvents(events)
      
      setEventsState(prev => ({
        ...prev,
        events,
        loading: false
      }))

      // Skip aggressive progress fetching on initial load
      // Progress will be fetched on-demand when needed

      return { success: true, events }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch events'
      setEventsState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))
      return { success: false, error: errorMessage }
    }
  }, [isAuthenticated])

  // Fetch specific event by slug
  const fetchEvent = useCallback(async (slug: string) => {
    try {
      setEventsState(prev => ({ ...prev, loading: true, error: null }))
      
      const { event } = await apiClient.getEvent(slug)
      
      setEventsState(prev => ({
        ...prev,
        currentEvent: event,
        loading: false
      }))

      return { success: true, event }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch event'
      setEventsState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))
      return { success: false, error: errorMessage }
    }
  }, [])

  // Register for an event
  const registerForEvent = useCallback(async (
    eventId: string,
    registrationData: {
      emergencyContactName: string
      emergencyContactPhone: string
      equipmentChecklist?: Record<string, any>
    }
  ) => {
    if (!isAuthenticated) {
      return { success: false, error: 'Must be signed in to register' }
    }

    try {
      setEventsState(prev => ({ ...prev, loading: true, error: null }))
      
      const { registration, pointsAwarded } = await apiClient.registerForEvent(eventId, registrationData)
      
      setEventsState(prev => ({
        ...prev,
        userEventRegistration: registration,
        loading: false
      }))

      // Refresh profile to update points if points were awarded
      if (pointsAwarded && refreshProfile) {
        try {
          await refreshProfile()
          console.log('Profile refreshed after event registration, points awarded:', pointsAwarded)
        } catch (refreshError) {
          console.warn('Failed to refresh profile after registration:', refreshError)
        }
      }

      return { success: true, registration, pointsAwarded }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to register for event'
      setEventsState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))
      return { success: false, error: errorMessage }
    }
  }, [isAuthenticated])

  // Fetch user's step progress for an event
  const fetchStepProgress = useCallback(async (eventId: string) => {
    if (!isAuthenticated) {
      return { success: false, error: 'Must be signed in to fetch progress' }
    }

    try {
      // Check cache first
      const cachedProgress = CacheManager.getStepProgress<UserStepProgress>(eventId)
      if (cachedProgress && cachedProgress.length > 0) {
        setEventsState(prev => ({
          ...prev,
          stepProgress: cachedProgress,
          loading: false
        }))
        return { success: true, progress: cachedProgress }
      }

      setEventsState(prev => ({ ...prev, loading: true, error: null }))
      
      const { progress, currentStep, currentPhase } = await apiClient.getStepProgress(eventId)
      
      // Only log if there's actual progress
      if (progress && progress.length > 0) {
        console.log('📊 fetchStepProgress - Found progress:', {
          eventId,
          progressLength: progress.length,
          currentStep,
          currentPhase
        });
      }
      
      // Cache the progress
      CacheManager.setStepProgress(eventId, progress)
      
      setEventsState(prev => ({
        ...prev,
        stepProgress: progress,
        currentStepByEvent: {
          ...prev.currentStepByEvent,
          [eventId]: { step: currentStep, phase: currentPhase }
        },
        loading: false
      }))

      console.log('✅ fetchStepProgress - State updated with:', {
        eventId,
        currentStep,
        currentPhase
      });

      return { success: true, progress, currentStep, currentPhase }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch step progress'
      
      // Handle "User not registered" error gracefully
      if (errorMessage.includes('not registered')) {
        // User hasn't registered for this event yet, return empty progress
        setEventsState(prev => ({
          ...prev,
          stepProgress: [],
          loading: false,
          error: null // Don't set this as an error since it's expected
        }))
        return { success: true, progress: [] }
      }
      
      setEventsState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))
      return { success: false, error: errorMessage }
    }
  }, [isAuthenticated])

  // Update step progress
  const updateStepProgress = useCallback(async (
    eventId: string,
    stepData: {
      stepId: number
      phase: 'before' | 'start' | 'end'
      stepData?: Record<string, any>
      isCompleted: boolean
    }
  ) => {
    if (!isAuthenticated) {
      return { success: false, error: 'Must be signed in to update progress' }
    }

    try {
      const { progress } = await apiClient.updateStepProgress(eventId, stepData)
      
      // Update local state
      setEventsState(prev => ({
        ...prev,
        stepProgress: prev.stepProgress.map(p => 
          p.step_id === stepData.stepId && p.phase === stepData.phase 
            ? progress 
            : p
        ).concat(
          prev.stepProgress.find(p => 
            p.step_id === stepData.stepId && p.phase === stepData.phase
          ) ? [] : [progress]
        )
      }))

      return { success: true, progress }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update step progress'
      return { success: false, error: errorMessage }
    }
  }, [isAuthenticated])

  // Get step progress for specific step and phase
  const getStepProgress = useCallback((stepId: number, phase: 'before' | 'start' | 'end') => {
    return eventsState.stepProgress.find(p => p.step_id === stepId && p.phase === phase)
  }, [eventsState.stepProgress])

  // Check if step is completed
  const isStepCompleted = useCallback((stepId: number, phase: 'before' | 'start' | 'end') => {
    const progress = getStepProgress(stepId, phase)
    return progress?.is_completed || false
  }, [getStepProgress])

  // Get step data
  const getStepData = useCallback((stepId: number, phase: 'before' | 'start' | 'end') => {
    const progress = getStepProgress(stepId, phase)
    return progress?.step_data || {}
  }, [getStepProgress])

  // Fetch event participants
  const fetchEventParticipants = useCallback(async (eventId: string) => {
    try {
      setEventsState(prev => ({ ...prev, loading: true, error: null }))
      
      const { participants } = await apiClient.getEventParticipants(eventId)
      
      setEventsState(prev => ({
        ...prev,
        eventParticipants: participants,
        loading: false
      }))

      return { success: true, participants }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch participants'
      setEventsState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))
      return { success: false, error: errorMessage }
    }
  }, [])

  // Fetch progress for all events (but only if we have a health check first)
  const fetchAllEventsProgress = useCallback(async (events: Event[]) => {
    if (!isAuthenticated) return

    console.log('EVENTS HOOK - fetchAllEventsProgress called:', {
      eventCount: events.length,
      eventNames: events.map(e => e.name)
    })

    try {
      // First, do a health check to ensure server is accessible
      try {
        await apiClient.healthCheck()
        console.log('EVENTS HOOK - Server health check passed')
      } catch (healthError) {
        console.warn('EVENTS HOOK - Server health check failed, skipping progress fetching:', healthError)
        return // Don't attempt to fetch progress if server is not healthy
      }

      const progressMap: Record<string, UserStepProgress[]> = {}
      
      // Fetch progress sequentially with delays to avoid overwhelming the server
      for (const event of events) {
        try {
          console.log(`EVENTS HOOK - Fetching progress for event: ${event.name} (${event.id})`)
          const { progress } = await apiClient.getStepProgress(event.id)
          progressMap[event.id] = progress || []
          console.log(`EVENTS HOOK - Progress fetched for ${event.name}: ${progress?.length || 0} steps`)
          
          // Small delay between requests to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error) {
          console.log(`EVENTS HOOK - Error fetching progress for event ${event.name}:`, {
            error: error instanceof Error ? error.message : 'Unknown error',
            eventId: event.id
          })
          
          // Handle different types of errors silently (don't spam console)
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          
          if (errorMessage.includes('not registered') || 
              errorMessage.includes('Unauthorized') ||
              errorMessage.includes('User not found')) {
            // Expected errors for events user hasn't registered for
            progressMap[event.id] = []
          } else if (errorMessage.includes('Failed to fetch') || 
                     errorMessage.includes('fetch') ||
                     errorMessage.includes('Network connection failed')) {
            // Network/connection errors - don't log as warnings since they're expected
            progressMap[event.id] = []
          } else if (errorMessage.includes('Server error')) {
            // Server errors
            progressMap[event.id] = []
          } else {
            // Other unexpected errors
            progressMap[event.id] = []
          }
        }
      }

      console.log('EVENTS HOOK - Progress fetching completed:', {
        eventIds: Object.keys(progressMap),
        progressCounts: Object.fromEntries(
          Object.entries(progressMap).map(([id, progress]) => [
            events.find(e => e.id === id)?.name || id,
            progress.length
          ])
        )
      })

      setEventsState(prev => ({
        ...prev,
        allEventsProgress: progressMap
      }))
    } catch (error) {
      console.warn('EVENTS HOOK - Failed to fetch progress for all events:', error)
    }
  }, [isAuthenticated])

  // Get progress for a specific event
  const getEventProgress = useCallback((eventId: string) => {
    return eventsState.allEventsProgress[eventId] || []
  }, [eventsState.allEventsProgress])

  // Get the current step for an event (from user_events table)
  const getCurrentStepForEvent = useCallback((eventId: string) => {
    const currentStepInfo = eventsState.currentStepByEvent[eventId]
    
    if (currentStepInfo) {
      return currentStepInfo.step
    }

    // Fallback to calculating from progress if current step info not available
    const progress = getEventProgress(eventId)
    
    if (progress.length === 0) {
      // No progress is expected before registration - return 0 silently
      return 0
    }

    // Find the highest completed step
    const completedSteps = progress
      .filter(p => p.is_completed)
      .map(p => p.step_id)
      .sort((a, b) => b - a)

    const result = completedSteps.length > 0 ? completedSteps[0] + 1 : 1;
    
    return result;
  }, [eventsState.currentStepByEvent, getEventProgress])

  // Check if event is completed
  const isEventCompleted = useCallback((eventId: string) => {
    const progress = getEventProgress(eventId)
    // Consider event completed if user has reached final steps (step 10+ typically indicates completion)
    return progress.some(p => p.step_id >= 10 && p.is_completed)
  }, [getEventProgress])

  // Clear error
  const clearError = useCallback(() => {
    setEventsState(prev => ({ ...prev, error: null }))
  }, [])

  // Force refresh events (clears cache and refetches)
  const refreshEvents = useCallback(async () => {
    CacheManager.invalidateEvents()
    return await fetchEvents()
  }, [fetchEvents])

  // Initialize events on mount
  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Skip aggressive progress fetching on auth changes
  // Progress will be fetched on-demand when user enters specific events

  return {
    ...eventsState,
    fetchEvents,
    fetchEvent,
    registerForEvent,
    fetchStepProgress,
    updateStepProgress,
    getStepProgress,
    isStepCompleted,
    getStepData,
    fetchEventParticipants,
    fetchAllEventsProgress,
    getEventProgress,
    getCurrentStepForEvent,
    isEventCompleted,
    clearError,
    refreshEvents
  }
}