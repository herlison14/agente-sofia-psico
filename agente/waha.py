import httpx
import os
import asyncio

WAHA_URL = os.getenv("WAHA_URL", "http://localhost:3000")
WAHA_API_KEY = os.getenv("WAHA_API_KEY", "")
WAHA_SESSION = os.getenv("WAHA_SESSION", "default")

HEADERS = {"X-Api-Key": WAHA_API_KEY} if WAHA_API_KEY else {}


def _format_chat_id(phone: str) -> str:
    """Garante formato correto: 5521999999999@c.us"""
    phone = phone.replace("@c.us", "").replace("@s.whatsapp.net", "")
    return f"{phone}@c.us"


async def enviar_texto(phone: str, texto: str):
    url = f"{WAHA_URL}/api/sendText"
    payload = {
        "session": WAHA_SESSION,
        "chatId": _format_chat_id(phone),
        "text": texto,
    }
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(url, json=payload, headers=HEADERS)
        r.raise_for_status()
    return r.json()


async def enviar_digitando(phone: str, duracao_ms: int = 2000):
    """Simula digitação antes de enviar."""
    url = f"{WAHA_URL}/api/startTyping"
    payload = {"session": WAHA_SESSION, "chatId": _format_chat_id(phone)}
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            await client.post(url, json=payload, headers=HEADERS)
        await asyncio.sleep(duracao_ms / 1000)
        url_stop = f"{WAHA_URL}/api/stopTyping"
        async with httpx.AsyncClient(timeout=5) as client:
            await client.post(url_stop, json=payload, headers=HEADERS)
    except Exception:
        pass


async def enviar_resposta_humanizada(phone: str, texto: str):
    """Divide a resposta em partes, simula digitação e envia."""
    import re
    partes = re.split(r'(?<=[.!?])\s+', texto.strip())

    grupos: list[str] = []
    for frase in partes:
        if grupos and len(grupos[-1]) + len(frase) < 200:
            grupos[-1] += " " + frase
        else:
            grupos.append(frase)

    for parte in grupos:
        parte = parte.strip()
        if not parte:
            continue
        delay_s = min(1.0 + len(parte) * 0.03, 5.0)
        await enviar_digitando(phone, int(delay_s * 1000))
        await enviar_texto(phone, parte)
        await asyncio.sleep(0.5)
