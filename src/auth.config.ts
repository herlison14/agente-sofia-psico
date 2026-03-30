import type { NextAuthConfig } from 'next-auth'

export const authConfig: NextAuthConfig = {
  pages: { signIn: '/login' },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isAuthPage = nextUrl.pathname.startsWith('/login')
      const isApiAuth = nextUrl.pathname.startsWith('/api/auth')
      const isAgenteApi = nextUrl.pathname.startsWith('/api/agente')
      if (isAuthPage || isApiAuth || isAgenteApi) return true
      if (!isLoggedIn) return false
      return true
    },
  },
  providers: [],
}
