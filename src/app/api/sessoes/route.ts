import { auth } from '@/auth'
import pool from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { isDemoMode, DEMO_SESSOES } from '@/lib/mockData'

export async function GET(req: NextRequest) {
  if (isDemoMode()) {
    const { searchParams } = req.nextUrl
    const inicio = searchParams.get('inicio')
    const fim = searchParams.get('fim')
    const mes = searchParams.get('mes')
    const status = searchParams.get('status')

    let result = [...DEMO_SESSOES]

    if (inicio) result = result.filter(s => s.data_hora >= inicio)
    if (fim) result = result.filter(s => s.data_hora < fim)
    if (mes) {
      const [y, m] = mes.split('-').map(Number)
      const start = new Date(y, m - 1, 1)
      const end = new Date(y, m, 0, 23, 59, 59)
      result = result.filter(s => {
        const d = new Date(s.data_hora)
        return d >= start && d <= end
      })
    }
    if (status) result = result.filter(s => s.status === status)

    return NextResponse.json(result)
  }

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const inicio = searchParams.get('inicio')
  const fim = searchParams.get('fim')
  const mes = searchParams.get('mes')
  const status = searchParams.get('status')

  let query = `
    SELECT s.*, row_to_json(p.*) as paciente
    FROM sessoes s
    LEFT JOIN pacientes p ON p.id = s.paciente_id
    WHERE s.psicologo_id = $1
  `
  const values: (string | null)[] = [session.user.id]
  let idx = 2

  if (inicio) { query += ` AND s.data_hora >= $${idx++}`; values.push(inicio) }
  if (fim) { query += ` AND s.data_hora < $${idx++}`; values.push(fim) }
  if (mes) {
    const [y, m] = mes.split('-').map(Number)
    const start = new Date(y, m - 1, 1).toISOString()
    const end = new Date(y, m, 0, 23, 59, 59).toISOString()
    query += ` AND s.data_hora >= $${idx++} AND s.data_hora <= $${idx++}`
    values.push(start, end)
  }
  if (status) { query += ` AND s.status = $${idx++}`; values.push(status) }

  query += ' ORDER BY s.data_hora'

  const { rows } = await pool.query(query, values)
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  if (isDemoMode()) {
    const body = await req.json()
    return NextResponse.json({ id: 's-new-' + Date.now(), psicologo_id: 'demo', created_at: new Date().toISOString(), ...body }, { status: 201 })
  }

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { paciente_id, data_hora, duracao_min, valor, observacoes, status } = await req.json()

  const { rows } = await pool.query(
    `INSERT INTO sessoes (psicologo_id, paciente_id, data_hora, duracao_min, valor, observacoes, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [session.user.id, paciente_id, data_hora, duracao_min ?? 50, valor, observacoes || null, status ?? 'agendado']
  )

  return NextResponse.json(rows[0], { status: 201 })
}
