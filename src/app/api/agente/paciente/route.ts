import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { verificarAgenteApiKey } from '@/lib/agente-auth'

// GET /api/agente/paciente?phone=5521999999999&psicologo_id=uuid
export async function GET(req: NextRequest) {
  if (!verificarAgenteApiKey(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const phone = searchParams.get('phone')
  const psicologo_id = searchParams.get('psicologo_id')

  if (!phone || !psicologo_id)
    return NextResponse.json({ error: 'phone e psicologo_id são obrigatórios' }, { status: 400 })

  // Normaliza o telefone removendo caracteres não numéricos
  const phoneNorm = phone.replace(/\D/g, '')

  const { rows } = await pool.query(
    `SELECT * FROM pacientes
     WHERE psicologo_id = $1
       AND ativo = true
       AND REGEXP_REPLACE(telefone, '[^0-9]', '', 'g') = $2
     LIMIT 1`,
    [psicologo_id, phoneNorm]
  )

  if (rows.length === 0)
    return NextResponse.json({ encontrado: false, paciente: null })

  return NextResponse.json({ encontrado: true, paciente: rows[0] })
}

// POST /api/agente/paciente
export async function POST(req: NextRequest) {
  if (!verificarAgenteApiKey(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { psicologo_id, nome, telefone, email, cpf, valor_sessao } = await req.json()

  if (!psicologo_id || !nome?.trim() || !telefone)
    return NextResponse.json({ error: 'psicologo_id, nome e telefone são obrigatórios' }, { status: 400 })

  const { rows } = await pool.query(
    `INSERT INTO pacientes (psicologo_id, nome, telefone, email, cpf, valor_sessao)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [psicologo_id, nome.trim(), telefone, email || null, cpf || null, valor_sessao ?? 150]
  )

  return NextResponse.json({ paciente: rows[0] }, { status: 201 })
}
