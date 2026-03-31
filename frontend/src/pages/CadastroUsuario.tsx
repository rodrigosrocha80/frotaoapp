import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { apiJson } from '../lib/api'
import { perfilLabels } from '../labels'
import { supabase } from '../lib/supabase'

type Usuario = {
  id: number
  nome: string
  email: string
  perfil: string
  ativo: boolean
  criado_em: string
}

const perfis = ['admin', 'mecanico', 'supervisor']

export function CadastroUsuario() {
  const { id } = useParams()
  const { session } = useAuth()
  const navigate = useNavigate()
  const isEdit = !!id

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [perfil, setPerfil] = useState('mecanico')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [ativo, setAtivo] = useState(true)

  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    if (!isEdit || !session?.access_token) return
    void (async () => {
      try {
        const usuario = await apiJson<Usuario>(`/usuarios/${id}`, session.access_token)
        setNome(usuario.nome)
        setEmail(usuario.email)
        setPerfil(usuario.perfil)
        setAtivo(usuario.ativo)
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Erro ao carregar usuário')
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
      // Validações
      if (!isEdit && senha !== confirmarSenha) {
        setErr('As senhas não coincidem')
        setBusy(false)
        return
      }

      if (!isEdit && senha.length < 6) {
        setErr('A senha deve ter pelo menos 6 caracteres')
        setBusy(false)
        return
      }

      const payload: any = {
        nome,
        email,
        perfil,
      }

      if (!isEdit) {
        payload.senha = senha
      } else {
        payload.ativo = ativo
        if (senha) {
          if (senha !== confirmarSenha) {
            setErr('As senhas não coincidem')
            setBusy(false)
            return
          }
          if (senha.length < 6) {
            setErr('A senha deve ter pelo menos 6 caracteres')
            setBusy(false)
            return
          }
          payload.senha = senha
        }
      }

      if (isEdit) {
        await apiJson(`/usuarios/${id}`, session.access_token, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      } else {
        // Criar conta no Supabase Auth para permitir login após cadastro
        const { error: supabaseError } = await supabase.auth.signUp({
          email,
          password: senha,
        })
        if (supabaseError) {
          throw new Error(`Falha ao criar a conta de autenticação: ${supabaseError.message}`)
        }

        const usuario = await apiJson<Usuario>('/usuarios', session.access_token, {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        navigate(`/usuarios/${usuario.id}`, { replace: true })
        return
      }

      navigate('/usuarios', { replace: true })
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Erro ao salvar usuário')
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
      <Link to="/usuarios" className="text-sm text-cyan-400 hover:text-cyan-300">
        ← Voltar aos usuários
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        {isEdit ? 'Editar usuário' : 'Novo usuário'}
      </h1>
      <p className="mt-1 text-slate-400">
        {isEdit ? 'Atualize as informações do usuário.' : 'Registre um novo usuário no sistema.'}
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-8 max-w-xl space-y-5 rounded-2xl border border-slate-800 bg-slate-900/50 p-6"
      >
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
            placeholder="João Silva"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
            Email *
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="joao@empresa.com"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
          />
        </div>

        <div>
          <label htmlFor="perfil" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
            Perfil *
          </label>
          <select
            id="perfil"
            value={perfil}
            onChange={(e) => setPerfil(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
          >
            {perfis.map((p) => (
              <option key={p} value={p}>
                {perfilLabels[p]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="senha" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
            Senha {isEdit ? '(deixe em branco para manter)' : '*'}
          </label>
          <input
            id="senha"
            type="password"
            required={!isEdit}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder={isEdit ? 'Nova senha' : 'Digite a senha'}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
          />
        </div>

        <div>
          <label htmlFor="confirmarSenha" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
            Confirmar senha {isEdit && !senha ? '(opcional)' : '*'}
          </label>
          <input
            id="confirmarSenha"
            type="password"
            required={!isEdit || !!senha}
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            placeholder={isEdit ? 'Confirme a nova senha' : 'Confirme a senha'}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
          />
        </div>

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
                Usuário ativo no sistema
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
            {busy ? 'Salvando…' : isEdit ? 'Atualizar' : 'Criar usuário'}
          </button>
          <Link
            to="/usuarios"
            className="rounded-lg border border-slate-700 bg-slate-950 py-2.5 px-6 text-center text-sm font-semibold text-slate-300 hover:bg-slate-900"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
