import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { apiJson } from '../lib/api'
import { osStatusLabels, tipoManutLabels, veiculoStatusLabels } from '../labels'
import type { OrdemServico, UserMe } from '../types'

const statusValues = ['aberto', 'em_checklist', 'em_execucao', 'finalizado'] as const

function fmtMoney(v: string | number) {
  const n = typeof v === 'string' ? parseFloat(v) : v
  if (Number.isNaN(n)) return '—'
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function DetalheOS() {
  const { id } = useParams()
  const osId = Number(id)
  const { session } = useAuth()
  const [os, setOs] = useState<OrdemServico | null>(null)
  const [me, setMe] = useState<UserMe | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusBusy, setStatusBusy] = useState(false)
  const [finBusy, setFinBusy] = useState(false)

  const [nextStatus, setNextStatus] = useState('')
  const [kmFim, setKmFim] = useState('')
  const [custo, setCusto] = useState('')
  const [stVeiculo, setStVeiculo] = useState('disponivel')

  const canFinalize = me?.perfil === 'admin' || me?.perfil === 'mecanico'

  useEffect(() => {
    if (!session?.access_token || !Number.isFinite(osId)) return
    setLoading(true)
    setErr(null)
    void Promise.all([
      apiJson<OrdemServico>(`/os/${osId}`, session.access_token),
      apiJson<UserMe>('/me', session.access_token),
    ])
      .then(([o, u]) => {
        setOs(o)
        setMe(u)
        setNextStatus(o.status)
        setKmFim(String(o.km_fechamento ?? o.km_abertura))
        setCusto(typeof o.custo_total === 'string' ? o.custo_total : String(o.custo_total))
        setStVeiculo('disponivel')
      })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false))
  }, [session?.access_token, osId])

  async function patchStatus() {
    if (!session?.access_token || !os || nextStatus === os.status) return
    setStatusBusy(true)
    setErr(null)
    try {
      const updated = await apiJson<OrdemServico>(`/os/${os.id}/status`, session.access_token, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      })
      setOs(updated)
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Erro ao atualizar status')
    } finally {
      setStatusBusy(false)
    }
  }

  async function finalizar() {
    if (!session?.access_token || !os) return
    setFinBusy(true)
    setErr(null)
    try {
      const km = Number(kmFim)
      const custoNum = parseFloat(custo.replace(',', '.'))
      const updated = await apiJson<OrdemServico>(`/os/${os.id}/finalizar`, session.access_token, {
        method: 'POST',
        body: JSON.stringify({
          km_fechamento: km,
          custo_total: Number.isFinite(custoNum) ? String(custoNum) : '0',
          status_veiculo_final: stVeiculo,
          data_fim: null,
          sulcos: [],
        }),
      })
      setOs(updated)
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Erro ao finalizar')
    } finally {
      setFinBusy(false)
    }
  }

  if (!Number.isFinite(osId)) {
    return <p className="text-rose-400">ID inválido.</p>
  }

  return (
    <div>
      <Link to="/ordens" className="text-sm text-cyan-400 hover:text-cyan-300">
        ← Voltar às ordens
      </Link>

      {loading && <p className="mt-6 text-slate-500">Carregando OS…</p>}
      {err && (
        <p className="mt-6 rounded-lg border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
          {err}
        </p>
      )}

      {os && (
        <div className="mt-6 space-y-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">OS #{os.id}</h1>
            <p className="mt-1 text-slate-400">
              Veículo #{os.veiculo_id} · {tipoManutLabels[os.tipo_manutencao] ?? os.tipo_manutencao}
            </p>
          </div>

          <div className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
              <p className="mt-1 text-lg text-white">{osStatusLabels[os.status] ?? os.status}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Custo atual</p>
              <p className="mt-1 text-lg text-white">{fmtMoney(os.custo_total)}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Descrição</p>
              <p className="mt-2 whitespace-pre-wrap text-slate-300">{os.descricao}</p>
            </div>
          </div>

          {os.status !== 'finalizado' && (
            <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <h2 className="text-lg font-medium text-white">Alterar status</h2>
              <p className="mt-1 text-sm text-slate-500">Atualize o estágio da ordem (checklist, execução, etc.).</p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label htmlFor="st" className="text-xs uppercase tracking-wide text-slate-500">
                    Novo status
                  </label>
                  <select
                    id="st"
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                  >
                    {statusValues.map((s) => (
                      <option key={s} value={s}>
                        {osStatusLabels[s] ?? s}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  disabled={statusBusy || nextStatus === os.status}
                  onClick={() => void patchStatus()}
                  className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 disabled:opacity-50"
                >
                  {statusBusy ? 'Salvando…' : 'Aplicar'}
                </button>
              </div>
            </section>
          )}

          {os.status !== 'finalizado' && canFinalize && (
            <section className="rounded-2xl border border-cyan-900/40 bg-cyan-950/20 p-5">
              <h2 className="text-lg font-medium text-cyan-100">Finalizar ordem</h2>
              <p className="mt-1 text-sm text-slate-400">
                Registre KM e custo. O veículo terá o status atualizado conforme escolha abaixo.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="kmf" className="text-xs uppercase tracking-wide text-slate-500">
                    KM fechamento
                  </label>
                  <input
                    id="kmf"
                    type="number"
                    min={0}
                    value={kmFim}
                    onChange={(e) => setKmFim(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label htmlFor="custo" className="text-xs uppercase tracking-wide text-slate-500">
                    Custo total (R$)
                  </label>
                  <input
                    id="custo"
                    type="text"
                    inputMode="decimal"
                    value={custo}
                    onChange={(e) => setCusto(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="sv" className="text-xs uppercase tracking-wide text-slate-500">
                    Status do veículo após serviço
                  </label>
                  <select
                    id="sv"
                    value={stVeiculo}
                    onChange={(e) => setStVeiculo(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                  >
                    {Object.entries(veiculoStatusLabels).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="button"
                disabled={finBusy}
                onClick={() => void finalizar()}
                className="mt-6 w-full rounded-lg bg-cyan-600 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-500 disabled:opacity-60 sm:w-auto sm:px-8"
              >
                {finBusy ? 'Finalizando…' : 'Finalizar OS'}
              </button>
            </section>
          )}

          {os.status !== 'finalizado' && !canFinalize && me && (
            <p className="text-sm text-slate-500">
              Apenas administradores e mecânicos podem finalizar ordens. Seu perfil: {me.perfil}.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
