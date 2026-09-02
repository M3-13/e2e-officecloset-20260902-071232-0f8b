import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import * as authApi from '../api/auth'
import { getToken } from '../api/client'

export interface User {
  id: number
  email: string
}

export interface AuthContextValue {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const TOKEN_KEY = 'token'
const EMAIL_KEY = 'auth.email'

function parseUserId(token: string): number {
  const payload = token.split('.')[1]
  if (!payload) {
    throw new Error('Ungültiges Token')
  }
  const decoded = JSON.parse(
    atob(payload.replace(/-/g, '+').replace(/_/g, '/')),
  ) as { sub?: string }
  if (!decoded.sub) {
    throw new Error('Token enthält keine Nutzer-ID')
  }
  const id = Number(decoded.sub)
  if (!Number.isInteger(id)) {
    throw new Error('Ungültige Nutzer-ID im Token')
  }
  return id
}

function restoreUser(): User | null {
  const storedToken = getToken()
  if (!storedToken) {
    return null
  }
  const email = localStorage.getItem(EMAIL_KEY)
  if (!email) {
    return null
  }
  try {
    return { id: parseUserId(storedToken), email }
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getToken())
  const [user, setUser] = useState<User | null>(() => restoreUser())
  const [loading, setLoading] = useState(false)

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    try {
      const { access_token } = await authApi.login(email, password)
      localStorage.setItem(TOKEN_KEY, access_token)
      localStorage.setItem(EMAIL_KEY, email)
      setToken(access_token)
      setUser({ id: parseUserId(access_token), email })
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (email: string, password: string) => {
    setLoading(true)
    try {
      await authApi.register(email, password)
      const { access_token } = await authApi.login(email, password)
      localStorage.setItem(TOKEN_KEY, access_token)
      localStorage.setItem(EMAIL_KEY, email)
      setToken(access_token)
      setUser({ id: parseUserId(access_token), email })
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(EMAIL_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
