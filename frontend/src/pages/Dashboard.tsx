import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { apiJson } from '../lib/api'
import type { KPIResponse } from '../types'

function fmt(n: number, digits = 1) {
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('pt-BR', { maximumFractionDigits: digits, minimumFractionDigits: digits })
}

export function Dashboard() {
  const { session } = useAuth()
  const [data, setData] = useState<KPIResponse | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.access_token) return
    void (async () => {
      setLoading(true)
      setErr(null)
      try {
        const d = await apiJson<KPIResponse>('/dashboard/kpis', session.access_token)
        setData(d)
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Erro ao carregar KPIs')
      } finally {
        setLoading(false)
      }
    })()
  }, [session?.access_token])

  const cards = [
    { label: 'MTBF (horas)', value: data ? fmt(data.mtbf_horas) : '—', hint: 'Tempo médio entre falhas' },
    { label: 'MTTR (horas)', value: data ? fmt(data.mttr_horas) : '—', hint: 'Tempo médio de reparo' },
    {
      label: 'Disponibilidade',
      value: data ? `${fmt(data.disponibilidade_percentual, 2)} %` : '—',
      hint: 'Estimativa com base nas OS finalizadas',
    },
    {
      label: 'Custo total manutenção',
      value: data
        ? data.custo_total_manutencao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        : '—',
      hint: 'Soma dos custos das OS finalizadas',
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Painel</h1>
      <p className="mt-1 text-slate-400">Indicadores calculados a partir das ordens de serviço finalizadas.</p>

      {loading && <p className="mt-8 text-slate-500">Carregando indicadores…</p>}
      {err && (
        <p className="mt-8 rounded-lg border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
          {err}
        </p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg shadow-black/20"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{c.label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{c.value}</p>
            <p className="mt-2 text-xs text-slate-500">{c.hint}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
