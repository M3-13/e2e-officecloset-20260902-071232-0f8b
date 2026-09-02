import { createContext, useContext, useMemo, type ReactNode } from 'react'

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

function notImplemented(name: string): never {
  throw new Error(`not implemented: ${name}`)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const value = useMemo<AuthContextValue>(
    () => ({
      user: null,
      token: null,
      loading: false,
      login: () => {
        notImplemented('login')
      },
      register: () => {
        notImplemented('register')
      },
      logout: () => {
        notImplemented('logout')
      },
    }),
    [],
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
