import { useState } from 'react'
import type { Location } from 'react-router-dom'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase, supabaseConfigured } from '../lib/supabase'

export function Login() {
  const { session, loading } = useAuth()
  const loc = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const from = (loc.state as { from?: Location } | null)?.from?.pathname ?? '/dashboard'

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-950 text-slate-400">
        Carregando…
      </div>
    )
  }

  if (session) {
    return <Navigate to={from} replace />
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    if (!supabaseConfigured()) {
      setErr('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no build.')
      return
    }
    setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) {
      setErr(error.message)
      return
    }
    navigate(from, { replace: true })
  }

  return (
    <div className="flex min-h-dvh flex-col justify-center bg-slate-950 px-4 py-10">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-black/40 backdrop-blur">
        <div className="flex items-center gap-3">
          <img src="/caminhao-bau.png" alt="Caminhão baú Frotao" className="h-12 w-12 object-contain" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">FrotãoApp</h1>
            <p className="mt-1 text-sm text-slate-400">
              Entre com sua conta ou (Solicite acesso via email: <a href="mailto:rodrigorocha@ccglocacao.com.br" className="text-cyan-400 hover:text-cyan-300">
                rodrigorocha@frotaoapp.com
              </a>).
            </p>
          </div>
        </div>

        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <div>
            <label htmlFor="email" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
              Senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
            />
          </div>
          {err && <p className="text-sm text-rose-400">{err}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-cyan-600 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-500 disabled:opacity-60"
          >
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
