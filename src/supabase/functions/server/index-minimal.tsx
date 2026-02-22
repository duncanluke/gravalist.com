import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'npm:@supabase/supabase-js@2'

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const app = new Hono()

// Middleware  
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}))
app.use('*', logger(console.log))

// Helper function to get user from auth token
async function getAuthenticatedUser(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.split(' ')[1]
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  
  if (token === anonKey) {
    return null // No authenticated user when using anon key
  }
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      return null
    }
    return user
  } catch (error) {
    return null
  }
}

// Custom authorization helper for protected routes
async function requireAuth(c: any) {
  const user = await getAuthenticatedUser(c.req.header('Authorization'))
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401)
  }
  return user
}

// Health check endpoint
app.get('/make-server-91bdaa9f/health', async (c) => {
  return c.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    server: 'Gravalist Make Server',
    version: '1.0.0'
  })
})

// Get user profile
app.get('/make-server-91bdaa9f/user/profile', async (c) => {
  try {
    const user = await requireAuth(c)
    if (user instanceof Response) return user

    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', user.email)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.log('Database error getting user profile:', error)
      return c.json({ error: 'Database error' }, 500)
    }

    // Create user if doesn't exist
    if (!userData) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: user.email,
          first_name: user.user_metadata?.first_name,
          last_name: user.user_metadata?.last_name,
          city: user.user_metadata?.city,
          display_name: user.user_metadata?.display_name || 
            `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() ||
            user.email.split('@')[0],
          profile_image_url: user.user_metadata?.avatar_url,
        })
        .select()
        .single()

      if (createError) {
        console.log('Error creating user profile:', createError)
        return c.json({ error: 'Failed to create user profile' }, 500)
      }

      return c.json({ user: newUser })
    }

    return c.json({ user: userData })
  } catch (error) {
    console.log('Error in user profile route:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// User signup
app.post('/make-server-91bdaa9f/signup', async (c) => {
  try {
    const { email, password, displayName, firstName, lastName, city } = await c.req.json()

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      user_metadata: { 
        display_name: displayName,
        first_name: firstName,
        last_name: lastName,
        city: city 
      },
      email_confirm: true
    })

    if (error) {
      console.log('Auth signup error:', error)
      return c.json({ error: error.message }, 400)
    }

    // Create user record in database
    const { data: userRecord, error: dbError } = await supabase
      .from('users')
      .insert({
        email: email,
        first_name: firstName,
        last_name: lastName,
        city: city,
        display_name: displayName || `${firstName} ${lastName}`.trim() || email.split('@')[0]
      })
      .select()
      .single()

    if (dbError) {
      console.log('Database user creation error:', dbError)
    }

    return c.json({ user: data.user, userRecord })
  } catch (error) {
    console.log('Error in signup route:', error)
    return c.json({ error: 'Internal server error' }, 500)
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
      .select('id, email')
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

Deno.serve(app.fetch)