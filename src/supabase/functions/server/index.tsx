import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendWelcomeEmail, sendRideRegistrationEmail } from './mailersend.tsx'

// Initialize Supabase client with service role for admin operations
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Initialize Supabase client with anon key for auth verification
const supabaseAuth = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!
)

const app = new Hono()

// Middleware  
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}))
app.use('*', logger(console.log))

// Helper function for authentication
async function requireAuth(c: any) {
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  
  console.log('🔐 requireAuth - Validating token:', {
    hasToken: !!token,
    tokenLength: token?.length,
    tokenPrefix: token?.substring(0, 30) + '...'
  })
  
  if (!token) {
    console.log('❌ requireAuth - No token provided')
    return c.json({ error: 'Authentication required' }, 401)
  }

  try {
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token)
    
    if (error) {
      console.log('❌ requireAuth - Token validation error:', {
        message: error.message,
        status: error.status,
        name: error.name
      })
    }
    
    if (error || !user) {
      return c.json({ error: 'Invalid or expired token', details: error?.message }, 401)
    }
    
    console.log('✅ requireAuth - Token valid for user:', user.email)
    return user
  } catch (error) {
    console.log('❌ requireAuth - Unexpected error:', error)
    return c.json({ error: 'Authentication failed' }, 401)
  }
}

// Create user account (signup)
app.post('/make-server-91bdaa9f/auth/signup', async (c) => {
  try {
    const { email, password, displayName, invitationToken } = await c.req.json()

    console.log('SIGNUP - Creating user:', email)

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400)
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split('@')[0]
        }
      }
    })

    if (authError) {
      console.log('SIGNUP - Auth error:', authError)
      return c.json({ error: authError.message }, 400)
    }

    if (!authData.user) {
      return c.json({ error: 'Failed to create user' }, 500)
    }

    console.log('SIGNUP - Auth user created, creating profile in database')

    // Create user profile in database
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .insert({
        email: email,
        display_name: displayName || email.split('@')[0],
        first_name: '',
        last_name: '',
        city: '',
        total_points: 0,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) {
      console.log('SIGNUP - Profile creation error:', profileError)
      // User auth account was created but profile failed
      // This is OK - profile can be created later
      console.log('SIGNUP - Continuing without profile, will be created on first login')
    }

    console.log('SIGNUP - User created successfully:', {
      email: authData.user.email,
      hasProfile: !!userProfile
    })

    // Send welcome email
    if (authData.user.email) {
      console.log('SIGNUP - Sending welcome email to:', authData.user.email)
      // Run in background (don't await) to not block response
      sendWelcomeEmail(authData.user.email, displayName).then(result => {
        if (result.success) {
          console.log('✅ SIGNUP - Welcome email sent successfully')
        } else {
          console.log('❌ SIGNUP - Welcome email FAILED:', result.error)
        }
      }).catch(err => {
        console.log('❌ SIGNUP - Exception sending welcome email:', err)
      })
    }

    return c.json({
      success: true,
      user: authData.user,
      session: authData.session,
      profile: userProfile
    })

  } catch (error) {
    console.log('SIGNUP - Error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Health check
app.get('/make-server-91bdaa9f/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    server: 'Gravalist Make Server'
  })
})

// Get leaderboard
app.get('/make-server-91bdaa9f/leaderboard', async (c) => {
  try {
    console.log('LEADERBOARD - Fetching from database')
    
    // Get leaderboard data from users table
    const { data: leaderboard, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        city,
        display_name,
        total_points
      `)
      .order('total_points', { ascending: false })
      .limit(100)

    if (error) {
      console.log('LEADERBOARD - Database error:', error)
      return c.json({ error: 'Failed to fetch leaderboard' }, 500)
    }

    // Get event counts for users
    const userIds = leaderboard?.map(user => user.id) || []
    
    let eventCounts: Record<string, number> = {}
    if (userIds.length > 0) {
      const { data: events } = await supabase
        .from('user_events')
        .select('user_id')
        .in('user_id', userIds)
        .eq('registration_status', 'finished')
      
      if (events) {
        eventCounts = events.reduce((acc, event) => {
          acc[event.user_id] = (acc[event.user_id] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }
    }

    // Format leaderboard data
    const formattedLeaderboard = leaderboard?.map((entry, index) => ({
      id: entry.id,
      email: entry.email,
      display_name: entry.display_name || `${entry.first_name} ${entry.last_name}`.trim() || entry.email.split('@')[0],
      first_name: entry.first_name,
      last_name: entry.last_name,
      city: entry.city || 'City not provided',
      total_points: entry.total_points || 0,
      events_completed: eventCounts[entry.id] || 0,
      achievements_earned: 0,
      rank_position: index + 1
    })) || []

    console.log('LEADERBOARD - Returning', formattedLeaderboard.length, 'entries')
    return c.json({ leaderboard: formattedLeaderboard })

  } catch (error) {
    console.log('LEADERBOARD - Error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Get all events (with highlights and registration counts)
app.get('/make-server-91bdaa9f/events', async (c) => {
  try {
    console.log('EVENTS - Fetching all events from database')
    
    // Fetch events with highlights
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select(`
        *,
        event_highlights (
          id,
          event_id,
          title,
          description,
          highlight_order
        )
      `)
      .order('event_date', { ascending: true })

    if (eventsError) {
      console.log('EVENTS - Database error:', eventsError)
      return c.json({ error: 'Failed to fetch events', details: eventsError.message }, 500)
    }

    // Get registration counts for each event
    const eventIds = events?.map(event => event.id) || []
    let registrationCounts: Record<string, number> = {}
    
    if (eventIds.length > 0) {
      const { data: registrations } = await supabase
        .from('user_events')
        .select('event_id')
        .in('event_id', eventIds)
      
      if (registrations) {
        registrationCounts = registrations.reduce((acc, reg) => {
          acc[reg.event_id] = (acc[reg.event_id] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }
    }

    // Add registration counts to events
    const eventsWithCounts = events?.map(event => ({
      ...event,
      registration_count: registrationCounts[event.id] || 0
    })) || []

    console.log('EVENTS - Returning', eventsWithCounts.length, 'events')
    return c.json({ events: eventsWithCounts })

  } catch (error) {
    console.log('EVENTS - Error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Get user profile
app.get('/make-server-91bdaa9f/user/profile', async (c) => {
  try {
    // Get token from Authorization header
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return c.json({ error: 'Authorization token is required' }, 401)
    }

    console.log('USER PROFILE - Getting user from token')

    // Get user from token
    const { data: { user: authUser }, error: authError } = await supabaseAuth.auth.getUser(token)
    
    if (authError || !authUser?.email) {
      console.log('USER PROFILE - Auth error:', authError)
      return c.json({ error: 'Invalid or expired token' }, 401)
    }

    console.log('USER PROFILE - Fetching for email:', authUser.email)

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', authUser.email)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('USER PROFILE - User not found')
        return c.json({ error: 'User not found' }, 404)
      }
      console.log('USER PROFILE - Database error:', error)
      return c.json({ error: 'Failed to fetch profile' }, 500)
    }

    console.log('USER PROFILE - Found user:', {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      displayName: user.display_name,
      city: user.city,
      isPremiumSubscriber: user.is_premium_subscriber,
      subscriptionStatus: user.subscription_status,
      subscriptionTier: user.subscription_tier
    })
    return c.json({ user })

  } catch (error) {
    console.log('USER PROFILE - Error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Get user registrations
app.get('/make-server-91bdaa9f/user/registrations', async (c) => {
  try {
    // Get token from Authorization header
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      console.log('USER REGISTRATIONS - No token provided')
      return c.json({ error: 'Authorization token is required' }, 401)
    }

    console.log('USER REGISTRATIONS - Token received, length:', token.length)
    console.log('USER REGISTRATIONS - Getting user from token')

    // Get user from token
    const { data: { user: authUser }, error: authError } = await supabaseAuth.auth.getUser(token)
    
    if (authError) {
      console.log('USER REGISTRATIONS - Auth error details:', {
        message: authError.message,
        status: authError.status,
        name: authError.name
      })
      return c.json({ error: 'Invalid or expired token', details: authError.message }, 401)
    }
    
    if (!authUser?.email) {
      console.log('USER REGISTRATIONS - No email in auth user:', authUser)
      return c.json({ error: 'Invalid or expired token' }, 401)
    }

    console.log('USER REGISTRATIONS - Authenticated user email:', authUser.email)
    console.log('USER REGISTRATIONS - Fetching user from database')

    // First get user ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', authUser.email)
      .single()

    if (userError) {
      console.log('USER REGISTRATIONS - User lookup error details:', {
        code: userError.code,
        message: userError.message,
        details: userError.details,
        hint: userError.hint
      })
      
      if (userError.code === 'PGRST116') {
        console.log('USER REGISTRATIONS - User not found in database, returning empty registrations')
        // Return empty registrations instead of error - user might be newly signed up
        return c.json({ registrations: [] })
      }
      return c.json({ error: 'Failed to fetch user', details: userError.message }, 500)
    }

    console.log('USER REGISTRATIONS - Found user ID:', user.id)
    console.log('USER REGISTRATIONS - Fetching registrations')

    // First, let's check if user_events records exist at all (debug query)
    const { data: userEventsDebug, error: debugError } = await supabase
      .from('user_events')
      .select('*')
      .eq('user_id', user.id)

    console.log('USER REGISTRATIONS - DEBUG: Raw user_events records:', JSON.stringify(userEventsDebug, null, 2))
    console.log('USER REGISTRATIONS - DEBUG: Found', userEventsDebug?.length || 0, 'user_events records for this user')
    
    // If no records found for this user, let's check if ANY records exist with a similar user_id pattern
    if (!userEventsDebug || userEventsDebug.length === 0) {
      const { data: sampleEvents } = await supabase
        .from('user_events')
        .select('user_id, event_id')
        .limit(5)
      
      console.log('USER REGISTRATIONS - DEBUG: Sample user_events (any user):', JSON.stringify(sampleEvents, null, 2))
      console.log('USER REGISTRATIONS - DEBUG: Looking for user_id:', user.id)
    }

    // Then get user's event registrations with proper join
    const { data: registrations, error: regError } = await supabase
      .from('user_events')
      .select(`
        id,
        user_id,
        event_id,
        registration_status,
        registered_at,
        events (
          id,
          name,
          slug,
          location,
          event_date,
          distance_km
        )
      `)
      .eq('user_id', user.id)
      .order('registered_at', { ascending: false })

    if (regError) {
      console.log('USER REGISTRATIONS - Database error details:', {
        code: regError.code,
        message: regError.message,
        details: regError.details,
        hint: regError.hint
      })
      return c.json({ error: 'Failed to fetch registrations', details: regError.message }, 500)
    }

    console.log('USER REGISTRATIONS - Found', registrations?.length || 0, 'registrations')
    console.log('USER REGISTRATIONS - Raw data:', JSON.stringify(registrations, null, 2))
    return c.json({ registrations: registrations || [] })

  } catch (error) {
    console.log('USER REGISTRATIONS - Unexpected error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return c.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})

// Get user subscription status
app.get('/make-server-91bdaa9f/user/subscription', async (c) => {
  try {
    const user = await requireAuth(c)
    if (user instanceof Response) return user

    const { data: userData, error } = await supabase
      .from('users')
      .select('is_premium_subscriber, subscription_status, subscription_tier, subscription_started_at, subscription_expires_at, stripe_subscription_id')
      .eq('email', user.email)
      .single()

    if (error || !userData) {
      console.log('Error fetching user subscription:', error)
      return c.json({ error: 'User not found' }, 404)
    }

    return c.json({
      subscription: {
        isPremium: userData.is_premium_subscriber || false,
        status: userData.subscription_status || 'inactive',
        tier: userData.subscription_tier,
        startedAt: userData.subscription_started_at,
        expiresAt: userData.subscription_expires_at,
        stripeSubscriptionId: userData.stripe_subscription_id
      }
    })

  } catch (error) {
    console.log('Error in subscription status route:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Create Stripe checkout session
app.post('/make-server-91bdaa9f/stripe/create-checkout-session', async (c) => {
  try {
    const user = await requireAuth(c)
    if (user instanceof Response) return user

    // Get user from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, display_name')
      .eq('email', user.email)
      .single()

    if (userError || !userData) {
      console.log('Error finding user for stripe checkout:', userError)
      return c.json({ error: 'User not found' }, 404)
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      console.log('STRIPE - Secret key not configured')
      return c.json({ error: 'Payment system not configured' }, 500)
    }

    // Get price ID from environment or use default
    const priceId = Deno.env.get('STRIPE_PRICE_ID') || 'price_1QTVJlANT1yLdvVBaApU0yc4'
    
    console.log('STRIPE - Creating checkout session for user:', userData.email)
    console.log('STRIPE - Display name:', userData.display_name)
    console.log('STRIPE - Using price ID:', priceId)

    const origin = c.req.header('origin') || 'https://gravalist.com'
    
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'payment_method_types[0]': 'card',
        'mode': 'subscription',
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        'allow_promotion_codes': 'true',
        'metadata[user_id]': userData.id,
        'metadata[user_email]': userData.email,
        'success_url': `${origin}/upgrade?success=true`,
        'cancel_url': `${origin}/upgrade?canceled=true`,
        'customer_email': userData.email,
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.log('STRIPE - Checkout session creation failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        priceId: priceId,
        userEmail: userData.email
      })
      
      let userFriendlyError = 'Failed to create checkout session'
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.error?.message) {
          userFriendlyError = errorData.error.message
        }
      } catch (parseError) {
        // Keep default error message
      }
      
      return c.json({ 
        error: userFriendlyError,
        details: `Stripe API error: ${response.status} ${response.statusText}`
      }, 500)
    }

    const session = await response.json()
    console.log('STRIPE - Checkout session created:', session.id)

    return c.json({ 
      checkoutUrl: session.url,
      sessionId: session.id 
    })

  } catch (error) {
    console.log('Error in stripe checkout route:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Stripe webhook handler
app.post('/make-server-91bdaa9f/stripe/webhook', async (c) => {
  try {
    const rawBody = await c.req.text()
    console.log('STRIPE WEBHOOK - Received event')

    const event = JSON.parse(rawBody)
    console.log('STRIPE WEBHOOK - Event type:', event.type)

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object)
        break
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object)
        break
      default:
        console.log('STRIPE WEBHOOK - Unhandled event type:', event.type)
    }

    return c.json({ received: true })

  } catch (error) {
    console.log('Error in stripe webhook route:', error)
    return c.json({ error: 'Webhook processing failed' }, 400)
  }
})

// Helper functions for Stripe webhook events
async function handleCheckoutSessionCompleted(session: any) {
  try {
    console.log('STRIPE - Processing checkout session completed:', session.id)
    
    const userId = session.metadata?.user_id
    if (!userId) {
      console.log('STRIPE - No user_id in session metadata')
      return
    }

    const { error } = await supabase
      .from('users')
      .update({
        is_premium_subscriber: true,
        subscription_status: 'active',
        subscription_tier: 'annual',
        subscription_started_at: new Date().toISOString(),
        subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        stripe_subscription_id: session.subscription
      })
      .eq('id', userId)

    if (error) {
      console.log('STRIPE - Error updating user subscription on checkout completion:', error)
    } else {
      console.log('STRIPE - Successfully updated user subscription on checkout completion')
    }

  } catch (error) {
    console.log('STRIPE - Error handling checkout session completed:', error)
  }
}

async function handleSubscriptionCreated(subscription: any) {
  try {
    console.log('STRIPE - Processing subscription created:', subscription.id)
    
    const { data: userData, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('stripe_subscription_id', subscription.id)
      .single()

    if (error || !userData) {
      console.log('STRIPE - User not found for subscription created event')
      return
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_premium_subscriber: true,
        subscription_status: 'active',
        subscription_tier: 'annual',
        subscription_started_at: new Date(subscription.created * 1000).toISOString(),
        subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
        stripe_subscription_id: subscription.id
      })
      .eq('id', userData.id)

    if (updateError) {
      console.log('STRIPE - Error updating user on subscription created:', updateError)
    } else {
      console.log('STRIPE - Successfully updated user on subscription created')
    }

  } catch (error) {
    console.log('STRIPE - Error handling subscription created:', error)
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  try {
    console.log('STRIPE - Processing subscription updated:', subscription.id)
    
    const { data: userData, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('stripe_subscription_id', subscription.id)
      .single()

    if (error || !userData) {
      console.log('STRIPE - User not found for subscription updated event')
      return
    }

    const isActive = subscription.status === 'active'
    
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_premium_subscriber: isActive,
        subscription_status: subscription.status,
        subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString()
      })
      .eq('id', userData.id)

    if (updateError) {
      console.log('STRIPE - Error updating user on subscription updated:', updateError)
    } else {
      console.log('STRIPE - Successfully updated user on subscription updated')
    }

  } catch (error) {
    console.log('STRIPE - Error handling subscription updated:', error)
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  try {
    console.log('STRIPE - Processing subscription deleted:', subscription.id)
    
    const { data: userData, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('stripe_subscription_id', subscription.id)
      .single()

    if (error || !userData) {
      console.log('STRIPE - User not found for subscription deleted event')
      return
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_premium_subscriber: false,
        subscription_status: 'canceled'
      })
      .eq('id', userData.id)

    if (updateError) {
      console.log('STRIPE - Error updating user on subscription deleted:', updateError)
    } else {
      console.log('STRIPE - Successfully updated user on subscription deleted')
    }

  } catch (error) {
    console.log('STRIPE - Error handling subscription deleted:', error)
  }
}

// Update user profile (About You step)
app.put('/make-server-91bdaa9f/user/about-you', async (c) => {
  try {
    const user = await requireAuth(c)
    if (user instanceof Response) return user

    const { firstName, lastName, city, eventName } = await c.req.json()

    console.log('ABOUT YOU - Updating profile for:', user.email)
    console.log('ABOUT YOU - Data:', { firstName, lastName, city, eventName })

    if (!firstName?.trim() || !lastName?.trim()) {
      return c.json({ error: 'First name and last name are required' }, 400)
    }

    // Update user profile
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        city: city?.trim() || '',
        display_name: `${firstName.trim()} ${lastName.trim()}`
      })
      .eq('email', user.email)
      .select()
      .single()

    if (error) {
      console.log('ABOUT YOU - Update error:', error)
      return c.json({ error: 'Failed to update profile' }, 500)
    }

    console.log('ABOUT YOU - Profile updated successfully')
    return c.json({ user: updatedUser })

  } catch (error) {
    console.log('ABOUT YOU - Error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Update user profile (generic)
app.put('/make-server-91bdaa9f/user/profile', async (c) => {
  try {
    const user = await requireAuth(c)
    if (user instanceof Response) return user

    const updates = await c.req.json()

    console.log('PROFILE UPDATE - Updating for:', user.email)
    console.log('PROFILE UPDATE - Updates:', updates)

    // Update user profile
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updates)
      .eq('email', user.email)
      .select()
      .single()

    if (error) {
      console.log('PROFILE UPDATE - Error:', error)
      return c.json({ error: 'Failed to update profile' }, 500)
    }

    console.log('PROFILE UPDATE - Success')
    return c.json({ user: updatedUser })

  } catch (error) {
    console.log('PROFILE UPDATE - Error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Soft register for event (create user_events record with in_progress status)
app.post('/make-server-91bdaa9f/events/:eventId/soft-register', async (c) => {
  try {
    const user = await requireAuth(c)
    if (user instanceof Response) return user

    const eventId = c.req.param('eventId')
    
    console.log('SOFT REGISTER - User:', user.email, 'Event ID:', eventId)

    // Get user ID from database
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id, display_name, is_premium_subscriber')
      .eq('email', user.email)
      .single()

    if (userError || !dbUser) {
      console.log('SOFT REGISTER - User not found:', userError)
      return c.json({ error: 'User not found' }, 404)
    }

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, name, event_date')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      console.log('SOFT REGISTER - Event not found:', eventError)
      return c.json({ error: 'Event not found' }, 404)
    }

    // Check if user is already registered
    const { data: existingReg } = await supabase
      .from('user_events')
      .select('*')
      .eq('user_id', dbUser.id)
      .eq('event_id', eventId)
      .single()

    if (existingReg) {
      console.log('SOFT REGISTER - Already registered')
      return c.json({ 
        success: true, 
        registration: existingReg,
        eventName: event.name,
        message: 'Already registered'
      })
    }

    // Create user_events record with in_progress status
    const { data: registration, error: regError } = await supabase
      .from('user_events')
      .insert({
        user_id: dbUser.id,
        event_id: eventId,
        registration_status: 'in_progress',
        registered_at: new Date().toISOString()
      })
      .select()
      .single()

    if (regError) {
      console.log('SOFT REGISTER - Failed to create registration:', regError)
      return c.json({ error: 'Failed to register', details: regError.message }, 500)
    }

    console.log('SOFT REGISTER - Success:', registration)

    // Send registration email
    if (user.email) {
      console.log('SOFT REGISTER - Sending registration email to:', user.email)
      
      const formattedDate = new Date(event.event_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })

      // Run in background
      sendRideRegistrationEmail(
        user.email, 
        dbUser.display_name, 
        event.name, 
        formattedDate, 
        eventId,
        dbUser.is_premium_subscriber || false
      ).then(result => {
        if (result.success) {
          console.log('✅ SOFT REGISTER - Registration email sent successfully')
        } else {
          console.log('❌ SOFT REGISTER - Registration email FAILED:', result.error)
        }
      }).catch(err => {
        console.log('❌ SOFT REGISTER - Exception sending registration email:', err)
      })
    }

    return c.json({ 
      success: true, 
      registration,
      eventName: event.name
    })

  } catch (error) {
    console.log('SOFT REGISTER - Error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Get user's step progress for an event
app.get('/make-server-91bdaa9f/events/:eventId/progress', async (c) => {
  try {
    const user = await requireAuth(c)
    if (user instanceof Response) return user

    const eventId = c.req.param('eventId')
    
    console.log('GET PROGRESS - User:', user.email, 'Event ID:', eventId)

    // Get user ID from database
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email)
      .single()

    if (userError || !dbUser) {
      console.log('GET PROGRESS - User not found:', userError)
      return c.json({ error: 'User not found' }, 404)
    }

    // Check if user is registered for this event
    const { data: registration } = await supabase
      .from('user_events')
      .select('*')
      .eq('user_id', dbUser.id)
      .eq('event_id', eventId)
      .single()

    if (!registration) {
      console.log('GET PROGRESS - User not registered for this event')
      return c.json({ 
        progress: [],
        currentStep: 0,
        currentPhase: 'before'
      })
    }

    // Get step progress
    const { data: progress, error: progressError } = await supabase
      .from('user_step_progress')
      .select('*')
      .eq('user_id', dbUser.id)
      .eq('event_id', eventId)
      .order('step_id', { ascending: true })

    if (progressError) {
      console.log('GET PROGRESS - Error fetching progress:', progressError)
      return c.json({ error: 'Failed to fetch progress' }, 500)
    }

    // Calculate current step (highest completed step + 1)
    const completedSteps = progress?.filter(p => p.is_completed) || []
    const currentStep = completedSteps.length > 0 
      ? Math.max(...completedSteps.map(p => p.step_id)) + 1 
      : 0

    // Determine current phase based on current step
    let currentPhase = 'before'
    if (currentStep > 9 && currentStep <= 14) currentPhase = 'start'
    else if (currentStep > 14) currentPhase = 'end'

    console.log('GET PROGRESS - Success:', {
      progressCount: progress?.length || 0,
      currentStep,
      currentPhase
    })

    return c.json({ 
      progress: progress || [],
      currentStep,
      currentPhase
    })

  } catch (error) {
    console.log('GET PROGRESS - Error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Update user's step progress for an event
app.post('/make-server-91bdaa9f/events/:eventId/progress', async (c) => {
  try {
    const user = await requireAuth(c)
    if (user instanceof Response) return user

    const eventId = c.req.param('eventId')
    const { stepId, phase, stepData, isCompleted } = await c.req.json()
    
    console.log('UPDATE PROGRESS - User:', user.email, 'Event ID:', eventId, 'Step:', stepId)

    // Get user ID from database
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email)
      .single()

    if (userError || !dbUser) {
      console.log('UPDATE PROGRESS - User not found:', userError)
      return c.json({ error: 'User not found' }, 404)
    }

    // Check if user is registered for this event (or create soft registration if not)
    let { data: registration } = await supabase
      .from('user_events')
      .select('*')
      .eq('user_id', dbUser.id)
      .eq('event_id', eventId)
      .single()

    if (!registration) {
      // Auto-create soft registration if it doesn't exist
      console.log('UPDATE PROGRESS - Creating soft registration')
      const { data: newReg, error: regError } = await supabase
        .from('user_events')
        .insert({
          user_id: dbUser.id,
          event_id: eventId,
          registration_status: 'in_progress',
          registered_at: new Date().toISOString()
        })
        .select()
        .single()

      if (regError) {
        console.log('UPDATE PROGRESS - Failed to create registration:', regError)
        return c.json({ error: 'Failed to create registration' }, 500)
      }
      registration = newReg
    }

    // Upsert step progress
    const { data: progress, error: progressError } = await supabase
      .from('user_step_progress')
      .upsert({
        user_id: dbUser.id,
        event_id: eventId,
        step_id: stepId,
        phase,
        step_data: stepData || {},
        is_completed: isCompleted,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,event_id,step_id,phase'
      })
      .select()
      .single()

    if (progressError) {
      console.log('UPDATE PROGRESS - Error:', progressError)
      return c.json({ error: 'Failed to update progress' }, 500)
    }

    console.log('UPDATE PROGRESS - Success')
    return c.json({ progress })

  } catch (error) {
    console.log('UPDATE PROGRESS - Error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Withdraw from event
app.post('/make-server-91bdaa9f/events/:eventId/withdraw', async (c) => {
  try {
    const user = await requireAuth(c)
    if (user instanceof Response) return user

    const eventId = c.req.param('eventId')
    const { withdrawal_reason } = await c.req.json()

    console.log('WITHDRAW - User withdrawing from event:', {
      userEmail: user.email,
      eventId,
      reason: withdrawal_reason
    })

    // Get user ID from database
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email)
      .single()

    if (userError || !dbUser) {
      console.log('WITHDRAW - User not found in database:', userError)
      return c.json({ error: 'User not found' }, 404)
    }

    console.log('WITHDRAW - Found database user ID:', dbUser.id)

    // Find the registration
    const { data: registration, error: findError } = await supabase
      .from('user_events')
      .select('*')
      .eq('user_id', dbUser.id)
      .eq('event_id', eventId)
      .single()

    if (findError || !registration) {
      console.log('WITHDRAW - Registration not found:', findError)
      return c.json({ error: 'Registration not found' }, 404)
    }

    // Check if already withdrawn
    if (registration.registration_status === 'withdrawn') {
      console.log('WITHDRAW - Already withdrawn')
      return c.json({ error: 'Already withdrawn from this event' }, 400)
    }

    // Update registration status to withdrawn (only updating the status column that exists)
    const { error: updateError } = await supabase
      .from('user_events')
      .update({
        registration_status: 'withdrawn'
      })
      .eq('user_id', dbUser.id)
      .eq('event_id', eventId)

    if (updateError) {
      console.log('WITHDRAW - Update error:', updateError)
      console.log('WITHDRAW - Update error details:', {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint
      })
      return c.json({ 
        error: 'Failed to withdraw from event',
        details: updateError.message,
        code: updateError.code
      }, 500)
    }

    // Store withdrawal metadata in KV store for future reference
    const withdrawalKey = `withdrawal:${dbUser.id}:${eventId}`
    const withdrawalData = {
      userId: dbUser.id,
      eventId: eventId,
      reason: withdrawal_reason || 'No reason provided',
      withdrawnAt: new Date().toISOString(),
      userEmail: user.email
    }

    const kvStore = await import('./kv_store.tsx')
    await kvStore.set(withdrawalKey, JSON.stringify(withdrawalData))

    console.log('WITHDRAW - Successfully withdrawn and stored metadata')
    return c.json({ 
      success: true,
      message: 'Successfully withdrawn from event'
    })

  } catch (error) {
    console.log('WITHDRAW - Error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

Deno.serve(app.fetch)