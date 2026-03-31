import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { apiJson } from '../lib/api'
import type { OrdemServico, Veiculo } from '../types'

export function NovaOS() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [veiculoId, setVeiculoId] = useState('')
  const [tipo, setTipo] = useState('preventiva')
  const [descricao, setDescricao] = useState('')
  const [km, setKm] = useState('0')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!session?.access_token) return
    void apiJson<Veiculo[]>('/veiculos', session.access_token)
      .then(setVeiculos)
      .catch(() => setVeiculos([]))
  }, [session?.access_token])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!session?.access_token) return
    setErr(null)
    setBusy(true)
    try {
      const vid = Number(veiculoId)
      if (!vid) {
        setErr('Selecione um veículo.')
        setBusy(false)
        return
      }
      const os = await apiJson<OrdemServico>(
        '/os/abrir',
        session.access_token,
        {
          method: 'POST',
          body: JSON.stringify({
            veiculo_id: vid,
            tipo_manutencao: tipo,
            descricao,
            km_abertura: Number(km) || 0,
            responsavel_id: null,
          }),
        },
      )
      navigate(`/ordens/${os.id}`, { replace: true })
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Erro ao abrir OS')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <Link to="/ordens" className="text-sm text-cyan-400 hover:text-cyan-300">
        ← Voltar às ordens
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Abrir ordem de serviço</h1>
      <p className="mt-1 text-slate-400">Registre uma nova OS para o veículo selecionado.</p>

      <form
        onSubmit={onSubmit}
        className="mt-8 max-w-xl space-y-5 rounded-2xl border border-slate-800 bg-slate-900/50 p-6"
      >
        <div>
          <label htmlFor="veiculo" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
            Veículo
          </label>
          <select
            id="veiculo"
            required
            value={veiculoId}
            onChange={(e) => setVeiculoId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
          >
            <option value="">Selecione…</option>
            {veiculos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.placa} — {v.modelo}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="tipo" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
            Tipo de manutenção
          </label>
          <select
            id="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
          >
            <option value="preventiva">Preventiva</option>
            <option value="corretiva">Corretiva</option>
          </select>
        </div>

        <div>
          <label htmlFor="km" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
            KM na abertura
          </label>
          <input
            id="km"
            type="number"
            min={0}
            value={km}
            onChange={(e) => setKm(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
          />
        </div>

        <div>
          <label htmlFor="desc" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
            Descrição
          </label>
          <textarea
            id="desc"
            required
            rows={4}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
            placeholder="Sintomas, serviço solicitado, observações…"
          />
        </div>

        {err && <p className="text-sm text-rose-400">{err}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-cyan-600 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-500 disabled:opacity-60 sm:w-auto sm:px-8"
        >
          {busy ? 'Salvando…' : 'Abrir OS'}
        </button>
      </form>
    </div>
  )
}
