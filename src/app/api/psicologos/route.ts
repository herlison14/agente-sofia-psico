import { auth } from '@/auth'
import pool from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { isDemoMode, DEMO_PSICOLOGO } from '@/lib/mockData'

export async function GET() {
  if (isDemoMode()) return NextResponse.json(DEMO_PSICOLOGO)

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { rows } = await pool.query(
    'SELECT id, nome, crp, cpf, email, telefone, endereco, cidade, estado, created_at FROM psicologos WHERE id = $1',
    [session.user.id]
  )

  return NextResponse.json(rows[0] ?? null)
}

export async function PUT(req: NextRequest) {
  if (isDemoMode()) {
    const body = await req.json()
    return NextResponse.json({ ...DEMO_PSICOLOGO, ...body })
  }

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { nome, crp, cpf, email, telefone, endereco, cidade, estado } = body

  const { rows } = await pool.query(
    `UPDATE psicologos
     SET nome=$1, crp=$2, cpf=$3, email=$4, telefone=$5, endereco=$6, cidade=$7, estado=$8
     WHERE id=$9
     RETURNING id, nome, crp, cpf, email, telefone, endereco, cidade, estado`,
    [nome, crp, cpf, email, telefone, endereco, cidade, estado, session.user.id]
  )

  return NextResponse.json(rows[0])
}
