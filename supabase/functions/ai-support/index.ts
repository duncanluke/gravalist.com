import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You are the official Support Bot for Gravalist.
Gravalist is a non-corporate, independent gravel routing platform. "Gravel roads are yours and free, we help you get there by offering a no-fuss, non-corporate sponsored opportunity for you to enjoy your life and gravel riding."

Here are the rules to answer questions:
1. SUBSCRIPTIONS: Premium subscribers get exclusive access to event GPX files and leaderboards. They can upgrade at /upgrade.
2. FREE USERS: Anyone can browse the routes and sign up for an event, but GPX downloads require a subscription.
3. TONE: Friendly, short, to the point, and non-corporate. Do not use overly robotic language.
4. If a user asks a complex question about a specific route that isn't general knowledge, ask them to email hello@gravalist.com.
5. If they ask about the Hubspot images or CRM, say it's an internal system.

When the user asks a question, provide a helpful and encouraging answer in 1-3 sentences max.`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, conversationHistory = [] } = await req.json()

    if (!message) {
      throw new Error('Message is required')
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) {
      throw new Error('Gemini API key not configured. Please contact the administrator.')
    }

    // Format conversation for Gemini
    const contents = conversationHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }))
    
    // Append the latest message
    contents.push({ role: 'user', parts: [{ text: message }] })

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: contents,
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 150,
        }
      }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error('Gemini Error:', data)
      throw new Error('Failed to generate AI response')
    }

    const reply = data.candidates[0].content.parts[0].text

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Support Bot Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
