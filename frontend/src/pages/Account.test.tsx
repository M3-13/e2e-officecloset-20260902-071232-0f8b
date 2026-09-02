import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Account from './Account'
import { deleteAccount } from '../api/account'
import { useAuth } from '../context/AuthContext'

vi.mock('../api/account', () => ({
  deleteAccount: vi.fn(),
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const mockedDeleteAccount = vi.mocked(deleteAccount)
const mockedUseAuth = vi.mocked(useAuth)

function renderAccount() {
  return render(
    <MemoryRouter initialEntries={['/account']}>
      <Routes>
        <Route path="/account" element={<Account />} />
        <Route path="/" element={<div>Startseite</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

function mockAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
  mockedUseAuth.mockReturnValue({
    user: { id: 1, email: 'user@example.com' },
    token: 'abc',
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  })
}

describe('Account', () => {
  beforeEach(() => {
    localStorage.clear()
    mockedDeleteAccount.mockReset()
    mockedUseAuth.mockReset()
    mockAuth()
  })

  afterEach(() => {
    cleanup()
  })

  it('requires confirmation before deleting', () => {
    renderAccount()

    fireEvent.click(screen.getByRole('button', { name: 'Account löschen' }))

    expect(screen.getByRole('button', { name: 'Ja, endgültig löschen' })).toBeTruthy()
    expect(mockedDeleteAccount).not.toHaveBeenCalled()
  })

  it('deletes the account, logs out and redirects home on confirm', async () => {
    const logout = vi.fn()
    mockAuth({ logout })
    mockedDeleteAccount.mockResolvedValue(undefined)
    localStorage.setItem('token', 'abc')

    renderAccount()

    fireEvent.click(screen.getByRole('button', { name: 'Account löschen' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ja, endgültig löschen' }))

    expect(await screen.findByText('Startseite')).toBeTruthy()
    expect(mockedDeleteAccount).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem('token')).toBeNull()
    expect(logout).toHaveBeenCalledTimes(1)
  })

  it('shows an error and keeps the confirmation when deletion fails', async () => {
    mockedDeleteAccount.mockRejectedValue(new Error('Löschen fehlgeschlagen'))

    renderAccount()

    fireEvent.click(screen.getByRole('button', { name: 'Account löschen' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ja, endgültig löschen' }))

    expect(await screen.findByText('Löschen fehlgeschlagen')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Ja, endgültig löschen' })).toBeTruthy()
  })
})
