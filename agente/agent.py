import anthropic
import json
import os
from datetime import datetime
from zoneinfo import ZoneInfo
from tools import TOOLS, executar_tool

client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

SYSTEM_PROMPT = """Você é a July, assistente virtual da clínica de psicologia.

Suas funções:
1. Responder dúvidas sobre a clínica e o processo terapêutico
2. Verificar horários disponíveis para consultas
3. Agendar, cancelar ou reagendar sessões
4. Confirmar agendamentos existentes
5. Escalar para a psicóloga quando necessário

Regras:
- Responda sempre em português brasileiro, de forma acolhedora e empática
- Nunca forneça orientações clínicas, diagnósticos ou conselhos terapêuticos
- Para questões emocionais urgentes ou crises, acione imediatamente notificar_psicologa
- O valor padrão da sessão é R$ 150,00
- Sessões têm duração de 50 minutos
- Ao agendar, sempre confirme: nome, data, horário e valor antes de executar
- Nunca invente horários — use sempre a tool verificar_horarios
- Apresente no máximo 5 opções de horário por vez

Fluxo de agendamento:
1. Pergunte se é primeira consulta ou retorno
2. Use verificar_horarios para buscar datas disponíveis
3. Apresente opções claras (ex: "Segunda 07/04 às 09:00")
4. Confirme os dados com o paciente
5. Use agendar_sessao para registrar
6. Confirme com data/hora formatada em português"""

# Histórico em memória: phone -> list[dict]
_historico: dict[str, list[dict]] = {}
MAX_HISTORICO = 20


def _get_historico(phone: str) -> list[dict]:
    return _historico.get(phone, [])


def _salvar_historico(phone: str, mensagens: list[dict]):
    _historico[phone] = mensagens[-MAX_HISTORICO:]


async def processar(
    phone: str,
    paciente_id: str | None,
    paciente_nome: str,
    mensagens_usuario: str,
    disable_agent_fn,
) -> str:
    agora = datetime.now(ZoneInfo("America/Sao_Paulo")).strftime("%A, %d/%m/%Y %H:%M")

    system = f"{SYSTEM_PROMPT}\n\nData/hora atual: {agora}"
    if paciente_id:
        system += f"\nID do paciente: {paciente_id}"
    system += f"\nNome do paciente: {paciente_nome}\nTelefone: {phone}"

    historico = _get_historico(phone)
    historico.append({"role": "user", "content": mensagens_usuario})

    mensagens = list(historico)

    # Loop de tool use
    while True:
        response = await client.messages.create(
            model="claude-opus-4-6",
            max_tokens=1024,
            system=system,
            tools=TOOLS,
            messages=mensagens,
        )

        # Adiciona resposta ao contexto
        mensagens.append({"role": "assistant", "content": response.content})

        if response.stop_reason == "end_turn":
            # Extrai texto final
            texto = next(
                (b.text for b in response.content if hasattr(b, "text")),
                "Desculpe, não consegui processar sua mensagem."
            )
            historico.append({"role": "assistant", "content": texto})
            _salvar_historico(phone, historico)
            return texto

        if response.stop_reason == "tool_use":
            resultados_tools = []

            for bloco in response.content:
                if bloco.type != "tool_use":
                    continue

                resultado = await executar_tool(
                    bloco.name,
                    bloco.input,
                    evolution_send_fn=None,
                    disable_agent_fn=disable_agent_fn,
                )

                resultados_tools.append({
                    "type": "tool_result",
                    "tool_use_id": bloco.id,
                    "content": json.dumps(resultado, ensure_ascii=False),
                })

            mensagens.append({"role": "user", "content": resultados_tools})
            continue

        # Stop reason inesperado
        break

    return "Desculpe, ocorreu um erro ao processar sua mensagem."
