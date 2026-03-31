import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { apiJson } from '../lib/api'
import type { Equipamento, NovoEquipamentoInput, NovoVeiculoInput, OrdemServico, Veiculo } from '../types'

type AssetType = 'veiculo' | 'equipamento'
type AssetMode = 'existente' | 'novo'

const emptyNovoVeiculo: NovoVeiculoInput = {
  placa: '',
  modelo: '',
  km_atual: 0,
  status: 'disponivel',
}

const emptyNovoEquipamento: NovoEquipamentoInput = {
  nome: '',
  descricao: '',
  categoria: 'equipamento',
  cor: '',
  ano: null,
  modelo: '',
  renavam: '',
  numero_serie: '',
  chassi: '',
  placa: '',
  etiqueta_tag: '',
  capacidade_tanque: null,
  tipo_combustivel: '',
}

function parseOptionalNumber(value: string): number | null {
  if (!value.trim()) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function NovaOS() {
  const { session } = useAuth()
  const navigate = useNavigate()

  const [assetType, setAssetType] = useState<AssetType>('veiculo')
  const [assetMode, setAssetMode] = useState<AssetMode>('existente')
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [veiculoId, setVeiculoId] = useState('')
  const [equipamentoId, setEquipamentoId] = useState('')
  const [novoVeiculo, setNovoVeiculo] = useState<NovoVeiculoInput>(emptyNovoVeiculo)
  const [novoEquipamento, setNovoEquipamento] = useState<NovoEquipamentoInput>(emptyNovoEquipamento)
  const [tipo, setTipo] = useState('preventiva')
  const [descricao, setDescricao] = useState('')
  const [km, setKm] = useState('0')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!session?.access_token) return
    void Promise.all([
      apiJson<Veiculo[]>('/veiculos', session.access_token).catch(() => []),
      apiJson<Equipamento[]>('/equipamentos?ativo=true', session.access_token).catch(() => []),
    ]).then(([veiculosData, equipamentosData]) => {
      setVeiculos(veiculosData)
      setEquipamentos(equipamentosData)
    })
  }, [session?.access_token])

  useEffect(() => {
    setErr(null)
  }, [assetType, assetMode])

  const helpText = useMemo(() => {
    if (assetType === 'veiculo') {
      return assetMode === 'existente'
        ? 'Selecione um veículo já cadastrado para vincular à OS.'
        : 'Cadastre um novo veículo sem sair da abertura da ordem de serviço.'
    }
    return assetMode === 'existente'
      ? 'Selecione um equipamento já cadastrado para vincular à OS.'
      : 'Cadastre um equipamento avulso no momento da abertura da ordem de serviço.'
  }, [assetMode, assetType])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!session?.access_token) return

    setErr(null)
    setBusy(true)

    try {
      const kmAbertura = Number(km) || 0
      const payload: Record<string, unknown> = {
        asset_type: assetType,
        tipo_manutencao: tipo,
        descricao,
        km_abertura: kmAbertura,
        responsavel_id: null,
      }

      if (assetType === 'veiculo') {
        if (assetMode === 'existente') {
          const vid = Number(veiculoId)
          if (!vid) throw new Error('Selecione um veículo.')
          payload.veiculo_id = vid
        } else {
          if (!novoVeiculo.placa.trim() || !novoVeiculo.modelo.trim()) {
            throw new Error('Informe placa e modelo do novo veículo.')
          }

          payload.novo_veiculo = {
            placa: novoVeiculo.placa.trim().toUpperCase(),
            modelo: novoVeiculo.modelo.trim(),
            km_atual: Math.max(Number(novoVeiculo.km_atual) || 0, kmAbertura),
            status: novoVeiculo.status || 'disponivel',
          }
        }
      } else if (assetMode === 'existente') {
        const eid = Number(equipamentoId)
        if (!eid) throw new Error('Selecione um equipamento.')
        payload.equipamento_id = eid
      } else {
        if (!novoEquipamento.nome?.trim()) {
          throw new Error('Informe o nome do equipamento.')
        }

        payload.novo_equipamento = {
          nome: novoEquipamento.nome.trim(),
          descricao: novoEquipamento.descricao?.trim() || null,
          categoria: novoEquipamento.categoria || 'equipamento',
          cor: novoEquipamento.cor?.trim() || null,
          ano: novoEquipamento.ano ?? null,
          modelo: novoEquipamento.modelo?.trim() || null,
          renavam: novoEquipamento.renavam?.trim() || null,
          numero_serie: novoEquipamento.numero_serie?.trim() || null,
          chassi: novoEquipamento.chassi?.trim() || null,
          placa: novoEquipamento.placa?.trim().toUpperCase() || null,
          etiqueta_tag: novoEquipamento.etiqueta_tag?.trim() || null,
          capacidade_tanque: novoEquipamento.capacidade_tanque ?? null,
          tipo_combustivel: novoEquipamento.tipo_combustivel?.trim() || null,
        }
      }

      const os = await apiJson<OrdemServico>('/os/abrir', session.access_token, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
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
      <p className="mt-1 text-slate-400">
        Abra OS para veículo ou equipamento, escolhendo um item existente ou cadastrando um novo na hora.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-8 max-w-3xl space-y-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">Tipo do item</label>
            <select
              value={assetType}
              onChange={(e) => {
                const nextType = e.target.value as AssetType
                setAssetType(nextType)
                setVeiculoId('')
                setEquipamentoId('')
              }}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
            >
              <option value="veiculo">Veículo</option>
              <option value="equipamento">Equipamento</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">Origem do item</label>
            <select
              value={assetMode}
              onChange={(e) => setAssetMode(e.target.value as AssetMode)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
            >
              <option value="existente">Usar cadastro existente</option>
              <option value="novo">Cadastrar na abertura da OS</option>
            </select>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-sm text-slate-300">{helpText}</p>

          {assetType === 'veiculo' && assetMode === 'existente' ? (
            <div className="mt-4">
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
          ) : null}

          {assetType === 'veiculo' && assetMode === 'novo' ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">Placa</label>
                <input
                  required
                  value={novoVeiculo.placa}
                  onChange={(e) => setNovoVeiculo((prev) => ({ ...prev, placa: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">Modelo</label>
                <input
                  required
                  value={novoVeiculo.modelo}
                  onChange={(e) => setNovoVeiculo((prev) => ({ ...prev, modelo: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                  KM atual do veículo
                </label>
                <input
                  type="number"
                  min={0}
                  value={novoVeiculo.km_atual}
                  onChange={(e) =>
                    setNovoVeiculo((prev) => ({ ...prev, km_atual: Number(e.target.value) || 0 }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">Status</label>
                <select
                  value={novoVeiculo.status}
                  onChange={(e) => setNovoVeiculo((prev) => ({ ...prev, status: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
                >
                  <option value="disponivel">Disponível</option>
                  <option value="em_manutencao">Em manutenção</option>
                  <option value="indisponivel">Indisponível</option>
                </select>
              </div>
            </div>
          ) : null}

          {assetType === 'equipamento' && assetMode === 'existente' ? (
            <div className="mt-4">
              <label
                htmlFor="equipamento"
                className="block text-xs font-medium uppercase tracking-wide text-slate-500"
              >
                Equipamento
              </label>
              <select
                id="equipamento"
                required
                value={equipamentoId}
                onChange={(e) => setEquipamentoId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
              >
                <option value="">Selecione…</option>
                {equipamentos.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome} {item.modelo ? `— ${item.modelo}` : ''} {item.placa ? `(${item.placa})` : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {assetType === 'equipamento' && assetMode === 'novo' ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">Nome</label>
                <input
                  required
                  value={novoEquipamento.nome}
                  onChange={(e) => setNovoEquipamento((prev) => ({ ...prev, nome: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">Categoria</label>
                <select
                  value={novoEquipamento.categoria}
                  onChange={(e) => setNovoEquipamento((prev) => ({ ...prev, categoria: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
                >
                  <option value="equipamento">Equipamento</option>
                  <option value="maquina">Máquina</option>
                  <option value="outro">Outro</option>
                  <option value="veiculo">Veículo</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">Descrição</label>
                <textarea
                  rows={3}
                  value={novoEquipamento.descricao ?? ''}
                  onChange={(e) => setNovoEquipamento((prev) => ({ ...prev, descricao: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">Modelo</label>
                <input
                  value={novoEquipamento.modelo ?? ''}
                  onChange={(e) => setNovoEquipamento((prev) => ({ ...prev, modelo: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">Ano</label>
                <input
                  type="number"
                  min={0}
                  value={novoEquipamento.ano ?? ''}
                  onChange={(e) =>
                    setNovoEquipamento((prev) => ({ ...prev, ano: parseOptionalNumber(e.target.value) }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">Placa</label>
                <input
                  value={novoEquipamento.placa ?? ''}
                  onChange={(e) => setNovoEquipamento((prev) => ({ ...prev, placa: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Número de série
                </label>
                <input
                  value={novoEquipamento.numero_serie ?? ''}
                  onChange={(e) => setNovoEquipamento((prev) => ({ ...prev, numero_serie: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">Chassi</label>
                <input
                  value={novoEquipamento.chassi ?? ''}
                  onChange={(e) => setNovoEquipamento((prev) => ({ ...prev, chassi: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">RENAVAM</label>
                <input
                  value={novoEquipamento.renavam ?? ''}
                  onChange={(e) => setNovoEquipamento((prev) => ({ ...prev, renavam: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Etiqueta / TAG
                </label>
                <input
                  value={novoEquipamento.etiqueta_tag ?? ''}
                  onChange={(e) => setNovoEquipamento((prev) => ({ ...prev, etiqueta_tag: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">Cor</label>
                <input
                  value={novoEquipamento.cor ?? ''}
                  onChange={(e) => setNovoEquipamento((prev) => ({ ...prev, cor: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Tipo de combustível
                </label>
                <select
                  value={novoEquipamento.tipo_combustivel ?? ''}
                  onChange={(e) => setNovoEquipamento((prev) => ({ ...prev, tipo_combustivel: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
                >
                  <option value="">Não informado</option>
                  <option value="gasolina">Gasolina</option>
                  <option value="diesel">Diesel</option>
                  <option value="alcool">Álcool</option>
                  <option value="gnv">GNV</option>
                  <option value="hibrido">Híbrido</option>
                  <option value="eletrico">Elétrico</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Capacidade do tanque
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={novoEquipamento.capacidade_tanque ?? ''}
                  onChange={(e) =>
                    setNovoEquipamento((prev) => ({
                      ...prev,
                      capacidade_tanque: parseOptionalNumber(e.target.value),
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
