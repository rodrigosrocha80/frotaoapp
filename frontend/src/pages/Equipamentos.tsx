import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { apiJson } from '../lib/api'
import { categoriaEquipamentoLabels } from '../labels'
import type { Equipamento } from '../types'

const filtros: { value: string; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'veiculo', label: 'Veículos' },
  { value: 'equipamento', label: 'Equipamentos' },
  { value: 'maquina', label: 'Máquinas' },
  { value: 'outro', label: 'Outros' },
]

export function Equipamentos() {
  const { session } = useAuth()
  const [lista, setLista] = useState<Equipamento[]>([])
  const [filtro, setFiltro] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchNome, setSearchNome] = useState('')

  useEffect(() => {
    if (!session?.access_token) return
    void (async () => {
      setLoading(true)
      setErr(null)
      try {
        const params = new URLSearchParams()
        if (filtro) params.append('categoria', filtro)
        if (searchNome) params.append('nome', searchNome)
        const query = params.toString() ? `?${params.toString()}` : ''
        const list = await apiJson<Equipamento[]>(`/equipamentos${query}`, session.access_token)
        setLista(list)
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Erro ao carregar equipamentos')
      } finally {
        setLoading(false)
      }
    })()
  }, [session?.access_token, filtro, searchNome])

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Equipamentos</h1>
          <p className="mt-1 text-slate-400">Cadastro de veículos, máquinas e equipamentos da frota.</p>
        </div>
        <Link
          to="/equipamentos/novo"
          className="inline-flex items-center justify-center rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-500"
        >
          Novo equipamento
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-start">
        <div className="flex-1">
          <label htmlFor="search" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
            Buscar por nome
          </label>
          <input
            id="search"
            type="text"
            placeholder="Digite o nome do equipamento…"
            value={searchNome}
            onChange={(e) => setSearchNome(e.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
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
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Placa/TAG</th>
              <th className="px-4 py-3">Cor</th>
              <th className="px-4 py-3">Ano/Modelo</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {lista.map((eq) => (
              <tr key={eq.id} className="hover:bg-slate-800/40">
                <td className="px-4 py-3 font-medium text-slate-100">{eq.nome}</td>
                <td className="px-4 py-3 text-slate-300">
                  {categoriaEquipamentoLabels[eq.categoria] ?? eq.categoria}
                </td>
                <td className="px-4 py-3 font-mono text-slate-400">
                  {eq.placa || eq.etiqueta_tag || '—'}
                </td>
                <td className="px-4 py-3 text-slate-400">{eq.cor || '—'}</td>
                <td className="px-4 py-3 text-slate-400">
                  {eq.ano && eq.modelo ? `${eq.ano} / ${eq.modelo}` : eq.ano || eq.modelo || '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/equipamentos/${eq.id}`} className="font-medium text-cyan-400 hover:text-cyan-300">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && lista.length === 0 && (
          <p className="px-4 py-8 text-center text-slate-500">Nenhum equipamento encontrado.</p>
        )}
      </div>
    </div>
  )
}
