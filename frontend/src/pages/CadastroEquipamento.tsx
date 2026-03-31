import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { apiJson } from '../lib/api'
import { categoriaEquipamentoLabels, tipoCombustivelLabels } from '../labels'
import type { Equipamento } from '../types'

const categorias = ['veiculo', 'equipamento', 'maquina', 'outro']
const combustiveis = ['gasolina', 'diesel', 'alcool', 'gnv', 'hibrido', 'eletrico', 'outro']

export function CadastroEquipamento() {
  const { id } = useParams()
  const { session } = useAuth()
  const navigate = useNavigate()
  const isEdit = !!id

  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [categoria, setCategoria] = useState('veiculo')
  const [cor, setCor] = useState('')
  const [ano, setAno] = useState('')
  const [modelo, setModelo] = useState('')
  const [renavam, setRenavam] = useState('')
  const [numeroSerie, setNumeroSerie] = useState('')
  const [chassi, setChássi] = useState('')
  const [placa, setPlaca] = useState('')
  const [etiqueta, setEtiqueta] = useState('')
  const [capacidadeTanque, setCapacidadeTanque] = useState('')
  const [tipoCombustivel, setTipoCombustivel] = useState('')
  const [ativo, setAtivo] = useState(true)

  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    if (!isEdit || !session?.access_token) return
    void (async () => {
      try {
        const eq = await apiJson<Equipamento>(`/equipamentos/${id}`, session.access_token)
        setNome(eq.nome)
        setDescricao(eq.descricao || '')
        setCategoria(eq.categoria)
        setCor(eq.cor || '')
        setAno(eq.ano?.toString() || '')
        setModelo(eq.modelo || '')
        setRenavam(eq.renavam || '')
        setNumeroSerie(eq.numero_serie || '')
        setChássi(eq.chassi || '')
        setPlaca(eq.placa || '')
        setEtiqueta(eq.etiqueta_tag || '')
        setCapacidadeTanque(eq.capacidade_tanque?.toString() || '')
        setTipoCombustivel(eq.tipo_combustivel || '')
        setAtivo(eq.ativo)
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Erro ao carregar equipamento')
      } finally {
        setLoading(false)
      }
    })()
  }, [isEdit, id, session?.access_token])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!session?.access_token) return
    setErr(null)
    setBusy(true)

    try {
      const payload = {
        nome,
        descricao: descricao || null,
        categoria,
        cor: cor || null,
        ano: ano ? Number(ano) : null,
        modelo: modelo || null,
        renavam: renavam || null,
        numero_serie: numeroSerie || null,
        chassi: chassi || null,
        placa: placa || null,
        etiqueta_tag: etiqueta || null,
        capacidade_tanque: capacidadeTanque ? Number(capacidadeTanque) : null,
        tipo_combustivel: tipoCombustivel || null,
        ...(isEdit && { ativo }),
      }

      if (isEdit) {
        await apiJson(`/equipamentos/${id}`, session.access_token, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      } else {
        const eq = await apiJson<Equipamento>('/equipamentos', session.access_token, {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        navigate(`/equipamentos/${eq.id}`, { replace: true })
        return
      }

      navigate('/equipamentos', { replace: true })
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Erro ao salvar equipamento')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div>
        <p className="text-slate-500">Carregando…</p>
      </div>
    )
  }

  return (
    <div>
      <Link to="/equipamentos" className="text-sm text-cyan-400 hover:text-cyan-300">
        ← Voltar aos equipamentos
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        {isEdit ? 'Editar equipamento' : 'Novo equipamento'}
      </h1>
      <p className="mt-1 text-slate-400">
        {isEdit ? 'Atualize as informações do equipamento.' : 'Registre um novo equipamento no sistema.'}
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-8 max-w-4xl space-y-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-6"
      >
        {/* Seção Principal */}
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Informações básicas</h3>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="nome" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                Nome *
              </label>
              <input
                id="nome"
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Caminhão Volvo FH"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
              />
            </div>

            <div>
              <label htmlFor="categoria" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                Categoria *
              </label>
              <select
                id="categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
              >
                {categorias.map((c) => (
                  <option key={c} value={c}>
                    {categoriaEquipamentoLabels[c]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="descricao" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
              Descrição
            </label>
            <textarea
              id="descricao"
              rows={3}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Adicione detalhes sobre o equipamento…"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
            />
          </div>
        </div>

        {/* Seção Identificação */}
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Identificação</h3>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="placa" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                Placa
              </label>
              <input
                id="placa"
                type="text"
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                placeholder="ABC1234"
                maxLength={10}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
              />
            </div>

            <div>
              <label htmlFor="etiqueta" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                Etiqueta / TAG
              </label>
              <input
                id="etiqueta"
                type="text"
                value={etiqueta}
                onChange={(e) => setEtiqueta(e.target.value)}
                placeholder="EQ-001"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
              />
            </div>

            <div>
              <label htmlFor="renavam" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                RENAVAM
              </label>
              <input
                id="renavam"
                type="text"
                value={renavam}
                onChange={(e) => setRenavam(e.target.value)}
                placeholder="12345678901"
                maxLength={11}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
              />
            </div>

            <div>
              <label htmlFor="chassis" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                Chassi
              </label>
              <input
                id="chassis"
                type="text"
                value={chassi}
                onChange={(e) => setChássi(e.target.value.toUpperCase())}
                placeholder="9BWHE21F452227200"
                maxLength={17}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-slate-100 uppercase outline-none ring-cyan-500/40 focus:ring-2"
              />
            </div>

            <div>
              <label htmlFor="serie" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                Número de série
              </label>
              <input
                id="serie"
                type="text"
                value={numeroSerie}
                onChange={(e) => setNumeroSerie(e.target.value)}
                placeholder="SN12345678"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
              />
            </div>
          </div>
        </div>

        {/* Seção Características */}
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Características</h3>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="cor" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                Cor
              </label>
              <input
                id="cor"
                type="text"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                placeholder="Branco"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
              />
            </div>

            <div>
              <label htmlFor="ano" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                Ano
              </label>
              <input
                id="ano"
                type="number"
                value={ano}
                onChange={(e) => setAno(e.target.value)}
                placeholder="2022"
                min={1950}
                max={new Date().getFullYear() + 1}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
              />
            </div>

            <div>
              <label htmlFor="modelo" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                Modelo
              </label>
              <input
                id="modelo"
                type="text"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                placeholder="FH 540"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
              />
            </div>

            <div>
              <label htmlFor="combustivel" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                Tipo de combustível
              </label>
              <select
                id="combustivel"
                value={tipoCombustivel}
                onChange={(e) => setTipoCombustivel(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
              >
                <option value="">Selecione…</option>
                {combustiveis.map((c) => (
                  <option key={c} value={c}>
                    {tipoCombustivelLabels[c]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="tanque" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                Capacidade do tanque (litros)
              </label>
              <input
                id="tanque"
                type="number"
                value={capacidadeTanque}
                onChange={(e) => setCapacidadeTanque(e.target.value)}
                placeholder="200"
                step={0.01}
                min={0}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
              />
            </div>
          </div>
        </div>

        {/* Seção Status */}
        {isEdit && (
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Status</h3>
            <div className="mt-4 flex items-center gap-3">
              <input
                id="ativo"
                type="checkbox"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-950 accent-cyan-600"
              />
              <label htmlFor="ativo" className="text-sm text-slate-300">
                Ativo no sistema
              </label>
            </div>
          </div>
        )}

        {err && (
          <p className="rounded-lg border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
            {err}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-cyan-600 py-2.5 px-6 text-sm font-semibold text-slate-950 hover:bg-cyan-500 disabled:opacity-60"
          >
            {busy ? 'Salvando…' : isEdit ? 'Atualizar' : 'Criar equipamento'}
          </button>
          <Link
            to="/equipamentos"
            className="rounded-lg border border-slate-700 bg-slate-950 py-2.5 px-6 text-center text-sm font-semibold text-slate-300 hover:bg-slate-900"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
