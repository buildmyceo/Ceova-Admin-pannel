import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Read the user's specific external app secrets securely from Vault
    const appUrl = Deno.env.get("SUPABSE_APP_URL");
    const appKey = Deno.env.get("SUPABSE_SERVICE_ROLE_APP_KEY") || Deno.env.get("SUPABSE_ANON_APP_KEY");

    if (!appUrl || !appKey) {
      throw new Error("Missing external app credentials (SUPABSE_APP_URL or SUPABSE_SERVICE_ROLE_APP_KEY)");
    }

    // Initialize Supabase Client pointing to the EXTERNAL connected app
    const externalSupabase = createClient(appUrl, appKey);

    // 1. Fetch total users (from auth if we have service role key, fallback to public.users table)
    let totalUsers = 0;
    try {
      // First try to use the admin auth API to get all users directly
      const { data: { users }, error: authError } = await externalSupabase.auth.admin.listUsers({ perPage: 1000 });
      if (!authError && users) {
        totalUsers = users.length;
      } else {
        // Fallback to public users table
        const { count } = await externalSupabase.from('users').select('*', { count: 'exact', head: true });
        totalUsers = count || 0;
      }
    } catch (e) {
      const { count } = await externalSupabase.from('users').select('*', { count: 'exact', head: true });
      totalUsers = count || 0;
    }

    // 2. Fetch current money (profit) from user_subscriptions
    // We will fetch the actual records to dynamically sum up whatever price/amount field exists
    const { data: subs, error: subsError } = await externalSupabase.from('user_subscriptions').select('*');
    let totalProfit = 0;
    
    if (subs && !subsError) {
      subs.forEach((sub: any) => {
        // Look for common money/price column names in the user_subscriptions table
        const value = sub.price || sub.amount || sub.total || sub.profit || sub.cost || sub.price_amount || 0;
        
        // Ensure it's a number and add it
        const parsed = parseFloat(value);
        if (!isNaN(parsed)) {
          totalProfit += parsed;
        }
      });
    }

    // Construct the result payload
    const stats = {
      totalUsers,
      totalProfit
    };

    return new Response(JSON.stringify(stats), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
