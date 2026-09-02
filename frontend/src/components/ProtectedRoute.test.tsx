import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import { AuthProvider } from '../context/AuthContext'

function renderProtected() {
  return render(
    <MemoryRouter initialEntries={['/wardrobe']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>Login-Seite</div>} />
          <Route
            path="/wardrobe"
            element={
              <ProtectedRoute>
                <div>Geschützter Inhalt</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  it('redirects to /login when there is no token', () => {
    renderProtected()
    expect(screen.getByText('Login-Seite')).toBeTruthy()
    expect(screen.queryByText('Geschützter Inhalt')).toBeNull()
  })
})
