import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from './AuthContext'
import { login, register } from '../api/auth'

vi.mock('../api/auth', () => ({
  login: vi.fn(),
  register: vi.fn(),
}))

const loginMock = vi.mocked(login)
const registerMock = vi.mocked(register)

function makeToken(sub: string): string {
  const payload = btoa(JSON.stringify({ sub, exp: 1893456000 }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return `eyJhbGciOiJIUzI1NiJ9.${payload}.signature`
}

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('login stores the token and loads the user', async () => {
    const token = makeToken('42')
    loginMock.mockResolvedValue({ access_token: token, token_type: 'bearer' })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login('anna@example.com', 'secret')
    })

    expect(localStorage.getItem('token')).toBe(token)
    expect(result.current.token).toBe(token)
    expect(result.current.user).toEqual({ id: 42, email: 'anna@example.com' })
  })

  it('register signs the user in afterwards', async () => {
    const token = makeToken('7')
    registerMock.mockResolvedValue({ id: 7, email: 'anna@example.com' })
    loginMock.mockResolvedValue({ access_token: token, token_type: 'bearer' })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.register('anna@example.com', 'secret')
    })

    expect(registerMock).toHaveBeenCalledWith('anna@example.com', 'secret')
    expect(localStorage.getItem('token')).toBe(token)
    expect(result.current.user).toEqual({ id: 7, email: 'anna@example.com' })
  })

  it('logout clears the token and the user', async () => {
    const token = makeToken('42')
    loginMock.mockResolvedValue({ access_token: token, token_type: 'bearer' })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login('anna@example.com', 'secret')
    })

    act(() => {
      result.current.logout()
    })

    expect(localStorage.getItem('token')).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.user).toBeNull()
  })

  it('restores the user from a stored token on mount', () => {
    const token = makeToken('9')
    localStorage.setItem('token', token)
    localStorage.setItem('auth.email', 'anna@example.com')

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.token).toBe(token)
    expect(result.current.user).toEqual({ id: 9, email: 'anna@example.com' })
  })
})
