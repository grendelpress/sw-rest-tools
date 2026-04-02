import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export default async (req) => {
  try {
    const { next_run } = await req.json();

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { count, error } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw error;
    }

    const timestamp = new Date().toISOString();

    console.log(`[Keep-Alive] Executed at ${timestamp}`);
    console.log(`[Keep-Alive] Database query successful - ${count} categories found`);
    console.log(`[Keep-Alive] Next run scheduled for: ${next_run}`);

    return new Response(
      JSON.stringify({
        success: true,
        timestamp,
        message: 'Keep-alive query executed successfully',
        data: {
          categoriesCount: count,
          nextRun: next_run
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('[Keep-Alive] Error:', error.message);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
};

export const config = {
  schedule: '0 0 */3 * *'
};
