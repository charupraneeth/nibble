
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Authenticate User
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            throw new Error('Unauthorized')
        }

        // 2. Check Quota
        // Note: We use a separate admin client to bypass RLS for quota updates if needed,
        // OR we can trust the user to read their own quota but we need admin power to increment strictly.
        // Actually, RLS usually prevents update. Let's use service_role key to manage quota reliably.

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const today = new Date().toISOString().split('T')[0]

        // Get current quota
        let { data: quota, error: quotaError } = await supabaseAdmin
            .from('user_quotas')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (quotaError && quotaError.code === 'PGRST116') {
            // No quota row exists yet, create one
            const { data: newQuota, error: createError } = await supabaseAdmin
                .from('user_quotas')
                .insert({ user_id: user.id, date: today, count: 0 })
                .select()
                .single()

            if (createError) throw createError
            quota = newQuota
        } else if (quotaError) {
            throw quotaError
        }

        // Reset quota if it's a new day
        if (quota.date !== today) {
            const { data: resetQuota, error: resetError } = await supabaseAdmin
                .from('user_quotas')
                .update({ date: today, count: 0 })
                .eq('user_id', user.id)
                .select()
                .single()

            if (resetError) throw resetError
            quota = resetQuota
        }

        // Check limit (10 per day)
        if (quota.count >= 10) {
            return new Response(
                JSON.stringify({ error: 'Daily limit reached. Please try again tomorrow or add your own API key in Settings.' }),
                { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 3. Call OpenAI
        const { image, text } = await req.json()
        const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

        if (!OPENAI_API_KEY) {
            throw new Error('Server misconfiguration: OPENAI_API_KEY missing')
        }

        // Construct prompt
        const messages = [
            {
                role: "system",
                content: "You are a nutritionist. Analyze the image or text and return a JSON object with: name (string, descriptive food name), calories (number), protein (number), fat (number), carbs (number), weight (number, estimated total weight in grams), confidence (number, 0-1). Return ONLY valid JSON, no markdown."
            },
            {
                role: "user",
                content: [
                    { type: "text", text: text || "Analyze this food for nutrition data." },
                    ...(image ? [{ type: "image_url", image_url: { url: image } }] : [])
                ]
            }
        ]

        const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: messages,
                max_tokens: 500,
                response_format: { type: "json_object" }
            }),
        })

        const aiData = await openAIResponse.json()

        if (!aiData.choices?.[0]?.message?.content) {
            throw new Error('Failed to get analysis from AI')
        }

        // 4. Increment Quota
        await supabaseAdmin
            .from('user_quotas')
            .update({ count: quota.count + 1, last_updated: new Date().toISOString() })
            .eq('user_id', user.id)

        // 5. Return Result
        return new Response(aiData.choices[0].message.content, {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
