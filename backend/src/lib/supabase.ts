import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Environment } from '../config/env.js';

export function createSupabaseAdminClient(environment: Environment): SupabaseClient {
  return createClient(environment.SUPABASE_URL, environment.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
