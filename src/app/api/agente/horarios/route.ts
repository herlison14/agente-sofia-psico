import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { verificarAgenteApiKey } from '@/lib/agente-auth'

// Horários padrão de atendimento (hora cheia)
const HORARIOS_PADRAO = [8, 9, 10, 11, 14, 15, 16, 17]

// GET /api/agente/horarios?psicologo_id=uuid&dias=7
export async function GET(req: NextRequest) {
  if (!verificarAgenteApiKey(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const psicologo_id = searchParams.get('psicologo_id')
  const dias = Math.min(parseInt(searchParams.get('dias') ?? '7'), 30)

  if (!psicologo_id)
    return NextResponse.json({ error: 'psicologo_id é obrigatório' }, { status: 400 })

  // Busca sessões agendadas nos próximos N dias
  const agora = new Date()
  const limite = new Date(agora)
  limite.setDate(limite.getDate() + dias)

  const { rows: sessoesOcupadas } = await pool.query(
    `SELECT data_hora FROM sessoes
     WHERE psicologo_id = $1
       AND status = 'agendado'
       AND data_hora >= $2
       AND data_hora < $3`,
    [psicologo_id, agora.toISOString(), limite.toISOString()]
  )

  const ocupados = new Set(
    sessoesOcupadas.map(s => new Date(s.data_hora).toISOString())
  )

  // Gera slots disponíveis (seg-sex, horários padrão)
  const slots: { data: string; hora: string; data_hora: string }[] = []

  for (let d = 1; d <= dias; d++) {
    const dia = new Date(agora)
    dia.setDate(dia.getDate() + d)
    dia.setHours(0, 0, 0, 0)

    const diaSemana = dia.getDay()
    if (diaSemana === 0 || diaSemana === 6) continue // pula fim de semana

    for (const hora of HORARIOS_PADRAO) {
      const slot = new Date(dia)
      slot.setHours(hora, 0, 0, 0)

      if (!ocupados.has(slot.toISOString())) {
        slots.push({
          data: dia.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' }),
          hora: `${hora.toString().padStart(2, '0')}:00`,
          data_hora: slot.toISOString(),
        })
      }
    }
  }

  return NextResponse.json({ slots })
}
