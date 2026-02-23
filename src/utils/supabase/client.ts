import { createClient } from '@supabase/supabase-js'
import { projectId, publicAnonKey } from './info'

// Create Supabase client instance with explicit session persistence
export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
  {
    auth: {
      // Explicitly enable session persistence in localStorage
      persistSession: true,
      // Enable automatic token refresh
      autoRefreshToken: true,
      // Store session in localStorage (default, but making it explicit)
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      // Detect session from URL on mount (for OAuth flows)
      detectSessionInUrl: true,
      // Configure token refresh settings
      storageKey: 'gravalist-auth-token',
    }
  }
)

// Types for our database tables
export interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  city?: string
  display_name?: string
  profile_image_url?: string
  total_points: number
  is_premium_subscriber: boolean
  subscription_status: string
  subscription_tier?: string
  subscription_started_at?: string
  subscription_expires_at?: string
  stripe_subscription_id?: string
  privacy_settings: {
    showOnLeaderboard: boolean
    allowDirectMessages: boolean
    showAchievements: boolean
    shareResults: boolean
  }
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  name: string
  slug: string
  description?: string
  location?: string
  timezone: string
  event_date: string
  start_time?: string
  distance_km?: number
  registration_opens_at?: string
  registration_closes_at?: string
  is_published: boolean
  featured_order?: number
  difficulty_level: string
  event_tags: string[]
  gpx_file_path?: string
  gpx_file_name?: string
  gpx_file_size?: number
  gpx_file_uploaded_at?: string
  created_at: string
  event_highlights?: EventHighlight[]
  registration_count?: number
}

export interface EventHighlight {
  id: string
  event_id: string
  title: string
  description?: string
  highlight_order: number
  created_at: string
}

export interface UserEvent {
  id: string
  user_id: string
  event_id: string
  registration_status: string
  registered_at: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  equipment_checklist: Record<string, any>
  start_time?: string
  finish_time?: string
  final_time_hours?: number
  final_distance_km?: number
  post_ride_notes?: string
  mood_rating?: number
  would_recommend?: boolean
  finish_photo_url?: string
  created_at: string
  updated_at: string
}

export interface UserStepProgress {
  id: string
  user_id: string
  event_id?: string
  step_id: number
  phase: 'before' | 'start' | 'end'
  is_completed: boolean
  completed_at?: string
  step_data: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Achievement {
  id: string
  name: string
  description?: string
  category: string
  badge_icon?: string
  points_value: number
  criteria: Record<string, any>
  is_secret: boolean
  is_active: boolean
  created_at: string
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  user_event_id?: string
  points_earned: number
  achievement_data: Record<string, any>
  created_at: string
  achievements: Achievement
}

export interface LeaderboardEntry {
  id: string
  email: string
  display_name?: string
  first_name?: string
  last_name?: string
  city?: string
  total_points: number
  events_completed: number
  achievements_earned: number
  avg_event_time?: number
  best_time?: number
  rank_position: number
}

export interface CommunityInvitation {
  id: string
  inviter_id: string
  invited_email: string
  invited_user_id?: string
  invitation_token: string
  personal_message?: string
  status: 'pending' | 'accepted' | 'expired'
  referral_points_awarded: number
  referral_points_awarded_at?: string
  created_at: string
  accepted_at?: string
  expires_at: string
}

export interface EventParticipant {
  name: string
  email: string
  joinedAt: string
  status: 'ready' | 'preparing'
  location: string
}

// API client for server endpoints
export class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-91bdaa9f`
  }

  private isAuthRequiredEndpoint(endpoint: string, method: string): boolean {
    // List of endpoints that always require authentication
    const authRequiredEndpoints = [
      '/user/profile',
      '/user/update-profile',
      '/user/achievements',
      '/user/points-activity',
      '/user/registrations',
      '/invitations/send'
    ]

    // Event registration and progress endpoints also require auth
    const authRequiredPatterns = [
      /^\/events\/[^\/]+\/register$/,
      /^\/events\/[^\/]+\/soft-register$/,
      /^\/events\/[^\/]+\/progress$/,
      /^\/events\/[^\/]+\/gpx-download$/,
      /^\/events\/[^\/]+\/withdraw$/
    ]

    // Check exact matches
    if (authRequiredEndpoints.includes(endpoint)) {
      return true
    }

    // Check pattern matches
    for (const pattern of authRequiredPatterns) {
      if (pattern.test(endpoint)) {
        return true
      }
    }

    // All requests to user endpoints require auth (including GET)
    if (endpoint.startsWith('/user/')) {
      return true
    }

    // Creating events requires authentication
    if (method === 'POST' && endpoint === '/events') {
      return true
    }

    // Other specific endpoints that require auth regardless of method
    return endpoint.includes('/register') || (endpoint.includes('/progress') && method !== 'GET')
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    providedToken?: string
  ): Promise<T> {
    let token = publicAnonKey
    let method = options.method || 'GET'
    let isAuthRequired = this.isAuthRequiredEndpoint(endpoint, method)

    console.log('API CLIENT - Request details:', {
      endpoint,
      method,
      isAuthRequired,
      hasProvidedToken: !!providedToken,
      providedTokenLength: providedToken?.length,
      anonKeyLength: publicAnonKey?.length
    })

    // Use provided token if available (from current auth state)
    if (providedToken) {
      token = providedToken
      console.log('API CLIENT - Using provided token, length:', token.length)
    } else if (isAuthRequired) {
      console.log('API CLIENT - Auth required, no token provided, getting session...')
      // Only try to get session if no token provided and auth is required
      try {
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Session timeout')), 1500)
        )

        const { data, error } = await Promise.race([sessionPromise, timeoutPromise])

        if (error) {
          console.log('API CLIENT - Session error:', error)
          throw new Error('Authentication required. Please sign in to access this resource.')
        } else if (data.session?.access_token) {
          token = data.session.access_token
          console.log('API CLIENT - Got session token, length:', token.length)
        } else {
          console.log('API CLIENT - No session found')
          throw new Error('Authentication required. Please sign in to access this resource.')
        }
      } catch (error) {
        console.log('API CLIENT - Auth session required but unavailable:', error)
        throw new Error('Authentication required. Please sign in to access this resource.')
      }
    } else {
      console.log('API CLIENT - Using anon key for non-auth endpoint')
    }

    console.log('API CLIENT - Final token details:', {
      finalTokenLength: token?.length,
      isAnonKey: token === publicAnonKey,
      tokenStart: token?.substring(0, 20) + '...'
    })

    let response: Response

    try {
      console.log(`API CLIENT - Making request to: ${this.baseUrl}${endpoint}`)

      // Add timeout to all API requests
      const controller = new AbortController()
      // Use reasonable timeout for different endpoints
      let timeout = 12000 // Default 12 seconds
      if (endpoint.includes('/count')) {
        timeout = 8000 // Count endpoints: 8 seconds
      } else if (endpoint.includes('/leaderboard')) {
        timeout = 20000 // Leaderboard endpoint: 20 seconds (needs more time for aggregation)
      }
      const timeoutId = setTimeout(() => {
        controller.abort()
      }, timeout)

      response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
        signal: controller.signal,
        ...options,
      })

      clearTimeout(timeoutId)
      console.log(`API CLIENT - Response status: ${response.status} ${response.statusText}`)
    } catch (fetchError) {
      console.log('API CLIENT - Network error:', {
        error: fetchError instanceof Error ? fetchError.message : 'Unknown network error',
        endpoint: `${this.baseUrl}${endpoint}`,
        fetchErrorType: typeof fetchError
      })

      // Handle abort errors (timeouts)
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error(`Request timeout. The server is taking too long to respond.`)
      }

      // Handle network errors specifically
      if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
        throw new Error(`Network connection failed. Please check your internet connection and try again. (${fetchError.message})`)
      }

      throw new Error(`Network request failed: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`)
    }

    if (!response.ok) {
      let errorData: any = {}
      try {
        errorData = await response.json()
      } catch (parseError) {
        console.log('API CLIENT - Failed to parse error response:', parseError)
      }

      console.log('API CLIENT - HTTP error response:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      })

      // Handle specific auth errors
      if (response.status === 401) {
        throw new Error(errorData.error || 'Authentication required. Please sign in to access this resource.')
      }

      // Handle server errors with more context
      if (response.status >= 500) {
        const errorMessage = errorData.details
          ? `${errorData.error}: ${errorData.details}`
          : (errorData.error || `Server error (${response.status}): ${response.statusText}`);
        throw new Error(errorMessage)
      }

      // Handle 404 errors with details
      if (response.status === 404) {
        const errorMessage = errorData.details
          ? `${errorData.error}: ${errorData.details}`
          : (errorData.error || `Not found (${response.status})`);
        throw new Error(errorMessage)
      }

      // Generic error with details if available
      const errorMessage = errorData.details
        ? `${errorData.error}: ${errorData.details}`
        : (errorData.error || `HTTP error! status: ${response.status} ${response.statusText}`);
      throw new Error(errorMessage)
    }

    try {
      const responseData = await response.json()
      console.log(`API CLIENT - Response data received:`, {
        endpoint,
        dataKeys: Object.keys(responseData),
        hasData: !!responseData
      })
      return responseData
    } catch (jsonError) {
      console.log('API CLIENT - Failed to parse JSON response:', jsonError)
      throw new Error('Invalid response format from server')
    }
  }

  // User methods
  async getUserProfile(token?: string): Promise<{ user: User }> {
    console.log('API CLIENT - getUserProfile called with token:', {
      hasToken: !!token,
      tokenLength: token?.length,
      tokenStart: token?.substring(0, 20) + '...'
    })
    return this.request('/user/profile', {}, token)
  }

  async updateUserProfile(updates: Partial<User>, token?: string): Promise<{ user: User }> {
    return this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    }, token)
  }

  async updateAboutYou(data: { firstName: string; lastName: string; city: string; eventName?: string }, token?: string): Promise<{ user: User }> {
    return this.request('/user/about-you', {
      method: 'PUT',
      body: JSON.stringify(data),
    }, token)
  }

  async updateProfile(updates: { first_name?: string; last_name?: string; city?: string; display_name?: string }, token?: string): Promise<{ user: User }> {
    return this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    }, token)
  }

  async getUserPoints(): Promise<{ points: number; userId: string }> {
    return this.request('/user/points')
  }

  async getUserSubscription(): Promise<{
    subscription: {
      isPremium: boolean;
      status: string;
      tier?: string;
      startedAt?: string;
      expiresAt?: string;
      stripeSubscriptionId?: string;
    }
  }> {
    return this.request('/user/subscription')
  }

  async signUp(data: {
    email: string
    password: string
    displayName: string
    invitationToken?: string
  }): Promise<{ user: any }> {
    return this.request('/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Event methods
  async getEvents(): Promise<{ events: Event[] }> {
    return this.request('/events')
  }

  async getEvent(slug: string): Promise<{ event: Event }> {
    return this.request(`/events/${slug}`)
  }

  async createEvent(eventData: {
    name: string
    slug: string
    description?: string
    location: string
    timezone?: string
    eventDate: string
    startTime?: string
    distanceKm?: number
    registrationOpensAt?: string
    registrationClosesAt?: string
    difficultyLevel?: string
    eventTags?: string[]
    gpxFilePath?: string
    gpxFileName?: string
    gpxFileSize?: number
    routeDescription?: string
    highlights?: Array<{
      title: string
      description?: string
      order: number
    }>
  }): Promise<{ event: Event; message: string; pointsAwarded: number }> {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    })
  }

  async uploadGpxFile(file: File, eventSlug: string): Promise<{
    success: boolean;
    filePath: string;
    fileName: string;
    fileSize: number;
    message: string
  }> {
    const formData = new FormData()
    formData.append('gpxFile', file)
    formData.append('eventSlug', eventSlug)

    const response = await fetch(`${this.baseUrl}/events/upload-gpx`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await this.getAuthToken()}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  async getGpxDownloadUrl(eventId: string): Promise<{ downloadUrl: string; fileName: string }> {
    try {
      const response = await this.request(`/events/${eventId}/gpx-download`) as any;

      // Log successful GPX download URL generation
      (window as any).sessionRewind?.logEvent('GPX Downloaded', {
        eventId: eventId,
        fileName: response.fileName
      })

      return response as { downloadUrl: string; fileName: string };
    } catch (error) {
      (window as any).sessionRewind?.logError(error instanceof Error ? error : new Error('GPX Download Failed'), {
        action: 'getGpxDownloadUrl',
        eventId: eventId
      })
      throw error;
    }
  }

  async getAuthToken(): Promise<string> {
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error || !data.session?.access_token) {
        // Return anon key for public endpoints
        return publicAnonKey
      }
      return data.session.access_token
    } catch (error) {
      // Return anon key for public endpoints
      return publicAnonKey
    }
  }

  async registerForEvent(
    eventId: string,
    registrationData: {
      emergencyContactName: string
      emergencyContactPhone: string
      equipmentChecklist?: Record<string, any>
    }
  ): Promise<{ registration: UserEvent; pointsAwarded?: number }> {
    const response = await this.request<any>(`/events/${eventId}/register`, {
      method: 'POST',
      body: JSON.stringify(registrationData),
    })

    // Log the full response for debugging
    console.log('Registration API response:', response)

    // Check if the response indicates success
    if (response.success === false) {
      throw new Error(response.error || 'Registration failed')
    }

    return {
      registration: response.registration,
      pointsAwarded: response.pointsAwarded
    }
  }

  async softRegisterForEvent(eventId: string): Promise<{
    success: boolean;
    registration?: UserEvent;
    eventName?: string;
    message?: string;
  }> {
    return this.request(`/events/${eventId}/soft-register`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
  }

  async getEventParticipants(eventId: string): Promise<{ participants: EventParticipant[] }> {
    return this.request(`/events/${eventId}/participants`)
  }

  async getEventParticipantCount(eventId: string): Promise<{ count: number; cached?: boolean }> {
    return this.request(`/events/${eventId}/participants/count`)
  }

  async getUserRegistrations(token?: string): Promise<any[]> {
    console.log('API CLIENT - getUserRegistrations called with token:', {
      hasToken: !!token,
      tokenLength: token?.length,
      tokenStart: token?.substring(0, 20) + '...'
    })
    const response = await this.request<{ registrations: any[] }>('/user/registrations', {}, token)
    return response.registrations || []
  }

  async getEventRegistrationStatus(eventId: string): Promise<{
    isRegistered: boolean;
    status?: 'registered' | 'in_progress' | 'withdrawn';
    registration?: UserEvent;
  }> {
    try {
      const response = await this.request<{ registration: UserEvent | null }>(`/events/${eventId}/registration-status`)
      return {
        isRegistered: response.registration?.registration_status === 'registered' || response.registration?.registration_status === 'in_progress',
        status: response.registration?.registration_status as 'registered' | 'in_progress' | 'withdrawn' | undefined,
        registration: response.registration || undefined
      }
    } catch (error) {
      // If not authenticated or no registration, return not registered
      return { isRegistered: false }
    }
  }

  // DISABLED: Registration email method - simplified registration flow
  // This method was removed to simplify the registration process
  // Users no longer receive automated registration emails during onboarding

  // Step progress methods
  async getStepProgress(eventId: string): Promise<{
    progress: UserStepProgress[];
    currentStep: number;
    currentPhase: string;
  }> {
    try {
      console.log('API CLIENT - getStepProgress called for eventId:', eventId)
      const result = await this.request(`/events/${eventId}/progress`)
      console.log('API CLIENT - getStepProgress success:', {
        eventId,
        progressCount: result.progress?.length || 0,
        currentStep: result.currentStep,
        currentPhase: result.currentPhase
      })
      return {
        progress: result.progress || [],
        currentStep: result.currentStep || 0,
        currentPhase: result.currentPhase || 'before'
      }
    } catch (error) {
      console.log('API CLIENT - getStepProgress error:', {
        eventId,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: typeof error
      })
      throw error
    }
  }

  async updateStepProgress(
    eventId: string,
    data: {
      stepId: number
      phase: 'before' | 'start' | 'end'
      stepData?: Record<string, any>
      isCompleted: boolean
    }
  ): Promise<{ progress: UserStepProgress }> {
    return this.request(`/events/${eventId}/progress`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Achievement methods
  async getUserAchievements(): Promise<{ achievements: UserAchievement[] }> {
    return this.request('/user/achievements')
  }

  // Leaderboard methods
  async getLeaderboard(): Promise<{ leaderboard: LeaderboardEntry[] }> {
    return this.request('/leaderboard')
  }

  async createLeaderboardSnapshot(data?: {
    snapshotType?: string
    eventId?: string
  }): Promise<{ snapshotsCreated: number }> {
    return this.request('/leaderboard/snapshot', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    })
  }

  // Community methods
  async sendInvitation(data: {
    email: string
    personalMessage?: string
  }): Promise<{ invitation: CommunityInvitation; invitationLink: string; emailSent?: boolean }> {
    return this.request('/invitations/send', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async acceptInvitation(data: {
    token: string
    userEmail: string
  }): Promise<{ success: boolean }> {
    return this.request('/invitations/accept', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request('/health')
  }
}

// Export singleton instance
export const apiClient = new ApiClient()