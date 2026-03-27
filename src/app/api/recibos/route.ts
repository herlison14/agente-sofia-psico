import { auth } from '@/auth'
import pool from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { isDemoMode, DEMO_RECIBOS } from '@/lib/mockData'

export async function GET() {
  if (isDemoMode()) return NextResponse.json(DEMO_RECIBOS)

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { rows } = await pool.query(
    `SELECT r.*, row_to_json(p.*) as paciente
     FROM recibos r
     LEFT JOIN pacientes p ON p.id = r.paciente_id
     WHERE r.psicologo_id = $1
     ORDER BY r.numero DESC`,
    [session.user.id]
  )

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  if (isDemoMode()) {
    const body = await req.json()
    const numero = DEMO_RECIBOS.length + 1
    return NextResponse.json({ id: 'r-new-' + Date.now(), psicologo_id: 'demo', numero, created_at: new Date().toISOString(), ...body }, { status: 201 })
  }

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { paciente_id, sessao_id, valor, data_emissao, descricao } = await req.json()

  const { rows: last } = await pool.query(
    'SELECT COALESCE(MAX(numero), 0) + 1 as proximo FROM recibos WHERE psicologo_id = $1',
    [session.user.id]
  )
  const numero = last[0].proximo

  const { rows } = await pool.query(
    `INSERT INTO recibos (psicologo_id, paciente_id, sessao_id, numero, valor, data_emissao, descricao)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [session.user.id, paciente_id, sessao_id || null, numero, valor, data_emissao, descricao ?? 'Consulta Psicológica']
  )

  return NextResponse.json({ ...rows[0], numero }, { status: 201 })
}
