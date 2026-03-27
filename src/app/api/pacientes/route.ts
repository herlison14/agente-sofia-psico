import { auth } from '@/auth'
import pool from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { isDemoMode, DEMO_PACIENTES } from '@/lib/mockData'

export async function GET() {
  if (isDemoMode()) return NextResponse.json(DEMO_PACIENTES)

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { rows } = await pool.query(
    'SELECT * FROM pacientes WHERE psicologo_id = $1 ORDER BY nome',
    [session.user.id]
  )

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  if (isDemoMode()) {
    const body = await req.json()
    return NextResponse.json({ id: 'p-new-' + Date.now(), psicologo_id: 'demo', ativo: true, created_at: new Date().toISOString(), ...body }, { status: 201 })
  }

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { nome, cpf, email, telefone, valor_sessao } = await req.json()
  if (!nome?.trim()) return NextResponse.json({ error: 'Nome é obrigatório.' }, { status: 400 })

  const { rows } = await pool.query(
    `INSERT INTO pacientes (psicologo_id, nome, cpf, email, telefone, valor_sessao)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [session.user.id, nome, cpf || null, email || null, telefone || null, valor_sessao ?? 150]
  )

  return NextResponse.json(rows[0], { status: 201 })
}
