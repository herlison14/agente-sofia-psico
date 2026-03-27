import { auth } from '@/auth'
import pool from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { isDemoMode, DEMO_SESSOES } from '@/lib/mockData'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { status, notas_clinicas } = body

  if (isDemoMode()) {
    const sessao = DEMO_SESSOES.find(s => s.id === id)
    if (sessao) {
      if (status !== undefined) sessao.status = status as typeof sessao.status
      if (notas_clinicas !== undefined) sessao.notas_clinicas = notas_clinicas
    }
    return NextResponse.json({ ...(sessao ?? { id }), ...body })
  }

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const updates: string[] = []
  const values: unknown[] = []
  let idx = 1
  if (status !== undefined) { updates.push(`status=$${idx++}`); values.push(status) }
  if (notas_clinicas !== undefined) { updates.push(`notas_clinicas=$${idx++}`); values.push(notas_clinicas) }
  values.push(id, session.user.id)

  const { rows } = await pool.query(
    `UPDATE sessoes SET ${updates.join(', ')} WHERE id=$${idx++} AND psicologo_id=$${idx} RETURNING *`,
    values
  )

  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(rows[0])
}
