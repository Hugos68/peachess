import type { LayoutServerLoad } from './$types'
import { getServerSession } from '@supabase/auth-helpers-sveltekit'

export const load: LayoutServerLoad = async (event) => {
  console.log(await getServerSession(event));
  return {
    session: await getServerSession(event),
  }
}