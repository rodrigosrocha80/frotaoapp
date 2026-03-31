import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { apiJson } from '../lib/api'
import { perfilLabels } from '../labels'
import type { UserMe } from '../types'

type Usuario = {
  id: number
  nome: string
  email: string
  perfil: string
  ativo: boolean
  criado_em: string
}

export function Usuarios() {
  const { session } = useAuth()
  const [lista, setLista] = useState<Usuario[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<UserMe | null>(null)

  useEffect(() => {
    if (!session?.access_token) return

    void (async () => {
      setLoading(true)
      setErr(null)
      try {
        const [users, me] = await Promise.all([
          apiJson<Usuario[]>('/usuarios', session.access_token),
          apiJson<UserMe>('/me', session.access_token)
        ])
        setLista(users)
        setCurrentUser(me)
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Erro ao carregar usuários')
      } finally {
        setLoading(false)
      }
    })()
  }, [session?.access_token])

  const toggleAtivo = async (usuario: Usuario) => {
    if (!session?.access_token) return

    try {
      await apiJson(`/usuarios/${usuario.id}`, session.access_token, {
        method: 'PUT',
        body: JSON.stringify({ ativo: !usuario.ativo })
      })

      setLista(prev => prev.map(u =>
        u.id === usuario.id ? { ...u, ativo: !u.ativo } : u
      ))
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao alterar status do usuário')
    }
  }

  const deleteUsuario = async (usuario: Usuario) => {
    if (!session?.access_token) return
    if (!confirm(`Tem certeza que deseja deletar o usuário "${usuario.nome}"?`)) return

    try {
      await apiJson(`/usuarios/${usuario.id}`, session.access_token, {
        method: 'DELETE'
      })

      setLista(prev => prev.filter(u => u.id !== usuario.id))
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao deletar usuário')
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Usuários</h1>
          <p className="mt-1 text-slate-400">Gerenciamento de usuários do sistema.</p>
        </div>
        <Link
          to="/usuarios/novo"
          className="inline-flex items-center justify-center rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-500"
        >
          Novo usuário
        </Link>
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
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Perfil</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Criado em</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {lista.map((usuario) => (
              <tr key={usuario.id} className="hover:bg-slate-800/40">
                <td className="px-4 py-3 font-medium text-slate-100">{usuario.nome}</td>
                <td className="px-4 py-3 text-slate-300">{usuario.email}</td>
                <td className="px-4 py-3 text-slate-300">
                  {perfilLabels[usuario.perfil] ?? usuario.perfil}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-md px-2 py-0.5 text-xs ${
                    usuario.ativo
                      ? 'bg-green-500/20 text-green-200'
                      : 'bg-red-500/20 text-red-200'
                  }`}>
                    {usuario.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {new Date(usuario.criado_em).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      to={`/usuarios/${usuario.id}`}
                      className="font-medium text-cyan-400 hover:text-cyan-300"
                    >
                      Editar
                    </Link>
                    {currentUser && currentUser.id !== usuario.id && (
                      <>
                        <button
                          onClick={() => void toggleAtivo(usuario)}
                          className={`font-medium ${
                            usuario.ativo
                              ? 'text-orange-400 hover:text-orange-300'
                              : 'text-green-400 hover:text-green-300'
                          }`}
                        >
                          {usuario.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                        <button
                          onClick={() => void deleteUsuario(usuario)}
                          className="font-medium text-red-400 hover:text-red-300"
                        >
                          Deletar
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && lista.length === 0 && (
          <p className="px-4 py-8 text-center text-slate-500">Nenhum usuário encontrado.</p>
        )}
      </div>
    </div>
  )
}
