import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { verificarAgenteApiKey } from '@/lib/agente-auth'

// GET /api/agente/sessao/:id — busca próxima sessão agendada do paciente
// (usado com id = paciente_id quando query param ?tipo=proxima)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verificarAgenteApiKey(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const tipo = req.nextUrl.searchParams.get('tipo')
  const psicologo_id = req.nextUrl.searchParams.get('psicologo_id')

  if (tipo === 'proxima' && psicologo_id) {
    // Busca próxima sessão agendada do paciente
    const { rows } = await pool.query(
      `SELECT s.*, p.nome as paciente_nome
       FROM sessoes s
       JOIN pacientes p ON p.id = s.paciente_id
       WHERE s.paciente_id = $1
         AND s.psicologo_id = $2
         AND s.status = 'agendado'
         AND s.data_hora > NOW()
       ORDER BY s.data_hora ASC
       LIMIT 1`,
      [id, psicologo_id]
    )
    if (rows.length === 0)
      return NextResponse.json({ encontrado: false, sessao: null })
    return NextResponse.json({ encontrado: true, sessao: rows[0] })
  }

  // Busca sessão por ID
  const { rows } = await pool.query('SELECT * FROM sessoes WHERE id = $1', [id])
  if (rows.length === 0)
    return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })

  return NextResponse.json({ sessao: rows[0] })
}

// PATCH /api/agente/sessao/:id — cancela ou reagenda
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verificarAgenteApiKey(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { status, data_hora, observacoes } = await req.json()

  const statusValidos = ['agendado', 'cancelado', 'realizado', 'faltou']
  if (status && !statusValidos.includes(status))
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })

  const campos: string[] = []
  const valores: unknown[] = []
  let idx = 1

  if (status) { campos.push(`status = $${idx++}`); valores.push(status) }
  if (data_hora) { campos.push(`data_hora = $${idx++}`); valores.push(data_hora) }
  if (observacoes !== undefined) { campos.push(`observacoes = $${idx++}`); valores.push(observacoes) }

  if (campos.length === 0)
    return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })

  valores.push(id)

  const { rows } = await pool.query(
    `UPDATE sessoes SET ${campos.join(', ')} WHERE id = $${idx} RETURNING *`,
    valores
  )

  if (rows.length === 0)
    return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })

  return NextResponse.json({ sessao: rows[0] })
}
