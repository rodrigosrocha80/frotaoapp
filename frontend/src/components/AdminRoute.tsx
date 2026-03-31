import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { apiJson } from '../lib/api'
import { useEffect, useState } from 'react'
import type { UserMe } from '../types'

export function AdminRoute() {
  const { session, loading } = useAuth()
  const location = useLocation()
  const [user, setUser] = useState<UserMe | null>(null)
  const [userLoading, setUserLoading] = useState(true)

  useEffect(() => {
    if (!session?.access_token) {
      setUserLoading(false)
      return
    }

    void (async () => {
      try {
        const userData = await apiJson<UserMe>('/me', session.access_token)
        setUser(userData)
      } catch (e) {
        setUser(null)
      } finally {
        setUserLoading(false)
      }
    })()
  }, [session?.access_token])

  if (loading || userLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-950 text-slate-400">
        Carregando…
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!user || user.perfil !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
