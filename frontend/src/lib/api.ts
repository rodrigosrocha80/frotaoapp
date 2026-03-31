function detailFromBody(data: unknown): string {
  if (!data || typeof data !== 'object') return 'Erro na requisição'
  const d = data as Record<string, unknown>
  const detail = d.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail
      .map((x) => (typeof x === 'object' && x && 'msg' in x ? String((x as { msg: string }).msg) : String(x)))
      .join(', ')
  }
  return 'Erro na requisição'
}

export async function apiJson<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const base = import.meta.env.VITE_API_BASE_URL ?? ''
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  })
  if (!res.ok) {
    let body: unknown
    try {
      body = await res.json()
    } catch {
      body = null
    }
    throw new Error(detailFromBody(body) || res.statusText)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
