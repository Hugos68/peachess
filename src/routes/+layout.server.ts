import type { LayoutServerLoad } from './$types'
import { getServerSession, getSupabase } from '@supabase/auth-helpers-sveltekit'

export const load: LayoutServerLoad = async (event) => {
  event.setHeaders( {
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin'
  });
  return {
    session: await getServerSession(event),
  }
}