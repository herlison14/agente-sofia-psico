import { NextRequest } from 'next/server'

export function verificarAgenteApiKey(req: NextRequest): boolean {
  const apiKey = process.env.AGENTE_API_KEY
  if (!apiKey) return false

  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return false

  return authHeader.slice(7) === apiKey
}
