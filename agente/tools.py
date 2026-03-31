import httpx
import os
from typing import Any

PSICO_API_URL = os.getenv("PSICO_API_URL", "")
AGENTE_API_KEY = os.getenv("AGENTE_API_KEY", "")
PSICOLOGO_ID = os.getenv("PSICOLOGO_ID", "")
PSICOLOGA_PHONE = os.getenv("PSICOLOGA_PHONE", "")

HEADERS = {
    "Authorization": f"Bearer {AGENTE_API_KEY}",
    "Content-Type": "application/json",
}

# ─── Definições das tools para o Claude ───────────────────────────────────────

TOOLS = [
    {
        "name": "verificar_horarios",
        "description": "Verifica os horários disponíveis para agendamento nos próximos dias (seg-sex). Use quando o paciente quiser saber quando pode marcar uma consulta.",
        "input_schema": {
            "type": "object",
            "properties": {
                "dias": {
                    "type": "integer",
                    "description": "Quantos dias à frente buscar (padrão 7, máximo 30)",
                    "default": 7,
                }
            },
            "required": [],
        },
    },
    {
        "name": "agendar_sessao",
        "description": "Agenda uma sessão para o paciente. Use após o paciente confirmar o horário desejado.",
        "input_schema": {
            "type": "object",
            "properties": {
                "paciente_id": {"type": "string", "description": "UUID do paciente"},
                "data_hora": {"type": "string", "description": "Data e hora em ISO 8601 (ex: 2026-04-01T09:00:00.000Z)"},
                "valor": {"type": "number", "description": "Valor da sessão em reais"},
                "observacoes": {"type": "string", "description": "Observações opcionais"},
            },
            "required": ["paciente_id", "data_hora", "valor"],
        },
    },
    {
        "name": "buscar_proxima_sessao",
        "description": "Busca a próxima sessão agendada do paciente. Use quando o paciente perguntar sobre o próximo agendamento ou quiser cancelar/reagendar.",
        "input_schema": {
            "type": "object",
            "properties": {
                "paciente_id": {"type": "string", "description": "UUID do paciente"},
            },
            "required": ["paciente_id"],
        },
    },
    {
        "name": "cancelar_ou_reagendar_sessao",
        "description": "Cancela ou reagenda uma sessão existente. Para cancelar: status='cancelado'. Para reagendar: informe data_hora com o novo horário.",
        "input_schema": {
            "type": "object",
            "properties": {
                "sessao_id": {"type": "string", "description": "UUID da sessão"},
                "status": {"type": "string", "enum": ["cancelado", "agendado"], "description": "Novo status"},
                "data_hora": {"type": "string", "description": "Novo horário em ISO 8601 (para reagendamento)"},
                "observacoes": {"type": "string", "description": "Motivo ou observação"},
            },
            "required": ["sessao_id"],
        },
    },
    {
        "name": "notificar_psicologa",
        "description": "Notifica a psicóloga e pausa o agente para este contato. Use em casos de crise emocional, pedido urgente, reclamação grave ou quando não conseguir resolver.",
        "input_schema": {
            "type": "object",
            "properties": {
                "motivo": {"type": "string", "description": "Motivo detalhado da notificação"},
                "paciente_nome": {"type": "string", "description": "Nome do paciente"},
                "paciente_phone": {"type": "string", "description": "Telefone do paciente"},
            },
            "required": ["motivo", "paciente_nome", "paciente_phone"],
        },
    },
]

# ─── Implementações ────────────────────────────────────────────────────────────

async def verificar_horarios(dias: int = 7) -> dict:
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(
            f"{PSICO_API_URL}/api/agente/horarios",
            headers=HEADERS,
            params={"psicologo_id": PSICOLOGO_ID, "dias": dias},
        )
        return r.json()


async def agendar_sessao(paciente_id: str, data_hora: str, valor: float, observacoes: str = "") -> dict:
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post(
            f"{PSICO_API_URL}/api/agente/sessao",
            headers=HEADERS,
            json={
                "psicologo_id": PSICOLOGO_ID,
                "paciente_id": paciente_id,
                "data_hora": data_hora,
                "valor": valor,
                "observacoes": observacoes or None,
            },
        )
        return r.json()


async def buscar_proxima_sessao(paciente_id: str) -> dict:
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(
            f"{PSICO_API_URL}/api/agente/sessao/{paciente_id}",
            headers=HEADERS,
            params={"tipo": "proxima", "psicologo_id": PSICOLOGO_ID},
        )
        return r.json()


async def cancelar_ou_reagendar_sessao(
    sessao_id: str,
    status: str | None = None,
    data_hora: str | None = None,
    observacoes: str | None = None,
) -> dict:
    payload: dict[str, Any] = {}
    if status:
        payload["status"] = status
    if data_hora:
        payload["data_hora"] = data_hora
    if observacoes:
        payload["observacoes"] = observacoes

    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.patch(
            f"{PSICO_API_URL}/api/agente/sessao/{sessao_id}",
            headers=HEADERS,
            json=payload,
        )
        return r.json()


async def notificar_psicologa(
    motivo: str,
    paciente_nome: str,
    paciente_phone: str,
    evolution_send_fn,
    disable_agent_fn,
) -> dict:
    from evolution import enviar_texto

    await disable_agent_fn(paciente_phone)

    mensagem_psicologa = (
        f"🔔 *Atenção — Agente July*\n\n"
        f"*Paciente:* {paciente_nome}\n"
        f"*Telefone:* {paciente_phone}\n\n"
        f"*Motivo:* {motivo}\n\n"
        f"_O agente foi pausado para este contato por 24h._"
    )
    await enviar_texto(PSICOLOGA_PHONE, mensagem_psicologa)

    return {"resultado": "notificacao_enviada", "agente_pausado": True}


async def executar_tool(nome: str, inputs: dict, **kwargs) -> Any:
    if nome == "verificar_horarios":
        return await verificar_horarios(**inputs)
    elif nome == "agendar_sessao":
        return await agendar_sessao(**inputs)
    elif nome == "buscar_proxima_sessao":
        return await buscar_proxima_sessao(**inputs)
    elif nome == "cancelar_ou_reagendar_sessao":
        return await cancelar_ou_reagendar_sessao(**inputs)
    elif nome == "notificar_psicologa":
        return await notificar_psicologa(**inputs, **kwargs)
    else:
        return {"erro": f"Tool '{nome}' não reconhecida"}
