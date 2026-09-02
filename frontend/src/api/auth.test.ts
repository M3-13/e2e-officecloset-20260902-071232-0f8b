import { describe, it, expect, vi, beforeEach } from 'vitest'
import { register, login } from './auth'
import apiFetch from './client'

vi.mock('./client', () => ({
  default: vi.fn(),
}))

const mockedApiFetch = vi.mocked(apiFetch)

describe('auth api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('register posts email and password to /api/auth/register', async () => {
    mockedApiFetch.mockResolvedValue({ id: 1, email: 'anna@example.com' })

    await register('anna@example.com', 'secret')

    expect(mockedApiFetch).toHaveBeenCalledWith('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'anna@example.com', password: 'secret' }),
    })
  })

  it('login posts to /api/auth/login and returns the response', async () => {
    const response = { access_token: 'token-value', token_type: 'bearer' }
    mockedApiFetch.mockResolvedValue(response)

    const result = await login('anna@example.com', 'secret')

    expect(mockedApiFetch).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'anna@example.com', password: 'secret' }),
    })
    expect(result).toBe(response)
  })
})
