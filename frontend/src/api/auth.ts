import apiFetch from './client'

export interface AuthUser {
  id: number
  email: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export async function register(email: string, password: string): Promise<AuthUser> {
  return apiFetch<AuthUser>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}
