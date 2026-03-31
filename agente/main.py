import asyncio
import os
import time
from contextlib import asynccontextmanager

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Request, Response

load_dotenv()

from agent import processar
from waha import enviar_resposta_humanizada, enviar_texto

PSICO_API_URL = os.getenv("PSICO_API_URL", "")
AGENTE_API_KEY = os.getenv("AGENTE_API_KEY", "")
PSICOLOGO_ID = os.getenv("PSICOLOGO_ID", "")
BUFFER_DELAY = float(os.getenv("BUFFER_DELAY", "3"))

PSICO_HEADERS = {
    "Authorization": f"Bearer {AGENTE_API_KEY}",
    "Content-Type": "application/json",
}

# ─── Estado em memória ─────────────────────────────────────────────────────────
_buffers: dict[str, list[dict]] = {}
_buffer_tasks: dict[str, asyncio.Task] = {}
_agent_status: dict[str, tuple[str, float]] = {}


def agente_ativo(phone: str) -> bool:
    if phone not in _agent_status:
        return True
    status, expires_at = _agent_status[phone]
    if expires_at and time.time() > expires_at:
        del _agent_status[phone]
        return True
    return status != "disabled"


def desativar_agente(phone: str, ttl_segundos: int = 86400):
    _agent_status[phone] = ("disabled", time.time() + ttl_segundos)


async def _disable_agent_fn(phone: str):
    desativar_agente(phone)


# ─── Busca / cria paciente ─────────────────────────────────────────────────────

async def obter_paciente(phone: str, nome: str) -> dict | None:
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(
            f"{PSICO_API_URL}/api/agente/paciente",
            headers=PSICO_HEADERS,
            params={"phone": phone, "psicologo_id": PSICOLOGO_ID},
        )
        data = r.json()

    if data.get("encontrado"):
        return data["paciente"]

    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post(
            f"{PSICO_API_URL}/api/agente/paciente",
            headers=PSICO_HEADERS,
            json={"psicologo_id": PSICOLOGO_ID, "nome": nome, "telefone": phone},
        )
        result = r.json()
        return result.get("paciente")


# ─── Análise de imagem via Claude ─────────────────────────────────────────────

async def _analisar_imagem(url: str, caption: str) -> str:
    if not url:
        return f"[imagem recebida{': ' + caption if caption else ''}]"
    try:
        import anthropic as _anthropic
        _client = _anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        resp = await _client.messages.create(
            model="claude-opus-4-6",
            max_tokens=512,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image", "source": {"type": "url", "url": url}},
                    {"type": "text", "text": f"Descreva o que vê na imagem.{' Legenda: ' + caption if caption else ''}"},
                ],
            }],
        )
        return resp.content[0].text
    except Exception as e:
        return f"[imagem recebida — erro na análise: {e}]"


# ─── Buffer de mensagens ───────────────────────────────────────────────────────

async def _processar_buffer(phone: str, nome: str):
    await asyncio.sleep(BUFFER_DELAY)

    mensagens = _buffers.pop(phone, [])
    if not mensagens or not agente_ativo(phone):
        return

    partes = [f"[{m['type'].upper()}]: {m['content']}" for m in mensagens]
    texto_consolidado = "\n".join(partes)

    try:
        paciente = await obter_paciente(phone, nome)
        paciente_id = paciente["id"] if paciente else None
        paciente_nome = paciente["nome"] if paciente else nome

        resposta = await processar(
            phone=phone,
            paciente_id=paciente_id,
            paciente_nome=paciente_nome,
            mensagens_usuario=texto_consolidado,
            disable_agent_fn=_disable_agent_fn,
        )

        await enviar_resposta_humanizada(phone, resposta)

    except Exception as e:
        print(f"[ERRO] Processamento {phone}: {e}")
        await enviar_texto(phone, "Desculpe, ocorreu um erro. Tente novamente em instantes.")


def adicionar_ao_buffer(phone: str, nome: str, mensagem: dict):
    if phone not in _buffers:
        _buffers[phone] = []
    _buffers[phone].append(mensagem)

    tarefa = _buffer_tasks.get(phone)
    if tarefa is None or tarefa.done():
        _buffer_tasks[phone] = asyncio.create_task(_processar_buffer(phone, nome))


# ─── FastAPI ───────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("✅ Agente Sofia iniciado (WAHA)")
    yield


app = FastAPI(title="Agente Sofia — Psico-agenda", lifespan=lifespan)


@app.get("/health")
async def health():
    return {"status": "ok", "agente": "Sofia", "whatsapp": "WAHA"}


@app.post("/webhook")
async def webhook(request: Request):
    try:
        body = await request.json()
    except Exception:
        return Response(status_code=400)

    # Formato WAHA: { event, session, payload: { from, fromMe, body, hasMedia, ... } }
    if body.get("event") != "message":
        return Response(status_code=200)

    payload = body.get("payload", {})

    if payload.get("fromMe"):
        return Response(status_code=200)

    # Extrai telefone no formato limpo (sem @c.us)
    phone = payload.get("from", "").replace("@c.us", "").replace("@s.whatsapp.net", "")
    nome = body.get("me", {}).get("pushName") or payload.get("pushName") or "Paciente"

    if not phone:
        return Response(status_code=200)

    if not agente_ativo(phone):
        return Response(status_code=200)

    has_media = payload.get("hasMedia", False)
    body_text = payload.get("body", "")
    media = payload.get("media", {}) or {}

    if not has_media:
        # Mensagem de texto
        if body_text:
            adicionar_ao_buffer(phone, nome, {"type": "text", "content": body_text})

    else:
        mime = media.get("mimetype", "")

        if mime.startswith("audio/"):
            adicionar_ao_buffer(phone, nome, {"type": "audio", "content": "[áudio recebido — transcrição indisponível]"})

        elif mime.startswith("image/"):
            url = media.get("url", "")
            caption = payload.get("caption", "")
            descricao = await _analisar_imagem(url, caption)
            adicionar_ao_buffer(phone, nome, {"type": "image", "content": descricao})

        else:
            adicionar_ao_buffer(phone, nome, {"type": "other", "content": "[arquivo recebido]"})

    return Response(status_code=200)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
