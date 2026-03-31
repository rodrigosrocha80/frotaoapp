import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { apiJson } from '../lib/api'
import { perfilLabels } from '../labels'
import type { UserMe } from '../types'

const nav = [
  { to: '/dashboard', label: 'Painel' },
  { to: '/ordens', label: 'Ordens de serviço' },
  { to: '/ordens/nova', label: 'Abrir OS' },
  { to: '/equipamentos', label: 'Equipamentos' },
]

export function Layout() {
  const { session, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [me, setMe] = useState<UserMe | null>(null)

  useEffect(() => {
    if (!session?.access_token) return
    void apiJson<UserMe>('/me', session.access_token)
      .then(setMe)
      .catch(() => setMe(null))
  }, [session?.access_token])

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive
        ? 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/40'
        : 'text-slate-300 hover:bg-slate-800/80'
    }`

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <header className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/90 px-4 py-3 md:hidden">
        <Link to="/dashboard" className="text-lg font-semibold tracking-tight text-white">
          Frotao
        </Link>
        <button
          type="button"
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          Menu
        </button>
      </header>

      <aside
        className={`${
          open ? 'flex' : 'hidden'
        } md:flex w-full flex-col border-slate-800 bg-slate-900/95 md:w-56 md:border-r md:pt-0`}
      >
        <div className="hidden border-b border-slate-800 px-4 py-5 md:block">
          <Link to="/dashboard" className="text-xl font-semibold tracking-tight text-white">
            Frotao
          </Link>
          <p className="mt-1 text-xs text-slate-500">Manutenção de frota</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass} onClick={() => setOpen(false)} end={item.to === '/ordens'}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-3 text-xs text-slate-400">
          {me && (
            <p className="mb-2 text-slate-200">
              <span className="font-medium">{me.nome}</span>
              <br />
              <span className="text-slate-500">{perfilLabels[me.perfil] ?? me.perfil}</span>
            </p>
          )}
          <button
            type="button"
            className="w-full rounded-lg border border-slate-700 py-2 text-slate-200 hover:bg-slate-800"
            onClick={() => void signOut()}
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 bg-gradient-to-b from-slate-950 to-slate-900 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
