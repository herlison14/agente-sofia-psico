import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import pool from '@/lib/db'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email || !password || password.length < 6) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  const existing = await pool.query('SELECT id FROM psicologos WHERE email = $1', [email])
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: 'E-mail já cadastrado.' }, { status: 409 })
  }

  const password_hash = await hash(password, 10)
  await pool.query(
    'INSERT INTO psicologos (email, password_hash) VALUES ($1, $2)',
    [email, password_hash]
  )

  return NextResponse.json({ ok: true }, { status: 201 })
}
