const API_BASE = process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:3001'

export const PASSWORD = 'Password123!'

let _seq = 0
export function uniqueEmail(): string {
  return `e2e_${Date.now()}_${++_seq}@test.local`
}

async function api<T>(path: string, init: Parameters<typeof fetch>[1] = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init.headers },
    ...init
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${init.method ?? 'GET'} ${path} → ${res.status}: ${text}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export async function registerUser(email: string): Promise<string> {
  const data = await api<{ accessToken: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      firstname: 'Test',
      lastname: 'E2E',
      email,
      confirmEmail: email,
      password: PASSWORD,
      confirmPassword: PASSWORD
    })
  })
  return data.accessToken
}

export async function createList(
  token: string,
  name: string
): Promise<{ id: string; name: string }> {
  return api('/lists', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name })
  })
}

export async function createTask(
  token: string,
  listId: string,
  payload: { shortDescription: string; dueDate: string }
): Promise<{ id: string }> {
  return api(`/lists/${listId}/tasks`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  })
}

export async function completeTask(token: string, taskId: string): Promise<void> {
  await api(`/tasks/${taskId}/complete`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  })
}
