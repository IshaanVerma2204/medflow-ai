import Cookies from 'js-cookie'

const TOKEN_KEY = 'medflow_auth_token'

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
  Cookies.set(TOKEN_KEY, token, { secure: true, sameSite: 'strict' })
}

export function getToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  return Cookies.get(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || null
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  Cookies.remove(TOKEN_KEY)
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

export function parseJwtRole(token: string): string | null {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    const payload = JSON.parse(jsonPayload)
    return payload.role || null
  } catch (e) {
    return null
  }
}
