import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export type AuthCtx = {
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthCtx | null>(null)
