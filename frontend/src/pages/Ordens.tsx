import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { apiJson } from '../lib/api'
import { osStatusLabels, tipoManutLabels } from '../labels'
import type { OrdemServico } from '../types'

const filtros: { value: string; label: string }[] = [
  { value: '', label: 'Todas' },
  { value: 'aberto', label: 'Abertas' },
  { value: 'em_execucao', label: 'Em execução' },
  { value: 'finalizado', label: 'Finalizadas' },
]

export function Ordens() {
  const { session } = useAuth()
  const [lista, setLista] = useState<OrdemServico[]>([])
  const [filtro, setFiltro] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.access_token) return
    void (async () => {
      setLoading(true)
      setErr(null)
      const q = filtro ? `?status=${encodeURIComponent(filtro)}` : ''
      try {
        const list = await apiJson<OrdemServico[]>(`/os${q}`, session.access_token)
        setLista(list)
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Erro ao carregar ordens')
      } finally {
        setLoading(false)
      }
    })()
  }, [session?.access_token, filtro])

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Ordens de serviço</h1>
          <p className="mt-1 text-slate-400">Lista das OS registradas no sistema.</p>
        </div>
        <Link
          to="/ordens/nova"
          className="inline-flex items-center justify-center rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-500"
        >
          Abrir nova OS
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {filtros.map((f) => (
          <button
            key={f.value || 'all'}
            type="button"
            onClick={() => setFiltro(f.value)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition ${
              filtro === f.value
                ? 'bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-500/50'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <p className="mt-6 text-slate-500">Carregando…</p>}
      {err && (
        <p className="mt-6 rounded-lg border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
          {err}
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Veículo</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Abertura</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {lista.map((os) => (
              <tr key={os.id} className="hover:bg-slate-800/40">
                <td className="px-4 py-3 font-mono text-slate-300">#{os.id}</td>
                <td className="px-4 py-3 text-slate-200">#{os.veiculo_id}</td>
                <td className="px-4 py-3 text-slate-300">{tipoManutLabels[os.tipo_manutencao] ?? os.tipo_manutencao}</td>
                <td className="px-4 py-3">
                  <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-cyan-200">
                    {osStatusLabels[os.status] ?? os.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {new Date(os.data_abertura).toLocaleString('pt-BR')}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/ordens/${os.id}`} className="font-medium text-cyan-400 hover:text-cyan-300">
                    Detalhes
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && lista.length === 0 && (
          <p className="px-4 py-8 text-center text-slate-500">Nenhuma ordem encontrada.</p>
        )}
      </div>
    </div>
  )
}
