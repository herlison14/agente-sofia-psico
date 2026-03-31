import httpx
import os
import asyncio

EVOLUTION_API_URL = os.getenv("EVOLUTION_API_URL", "https://api.evolution-api.com")
EVOLUTION_API_KEY = os.getenv("EVOLUTION_API_KEY", "")
EVOLUTION_INSTANCE_ID = os.getenv("EVOLUTION_INSTANCE_ID", "")

HEADERS = {
    "apikey": EVOLUTION_API_KEY,
    "Content-Type": "application/json",
}


async def enviar_texto(phone: str, texto: str, delay_ms: int = 1500):
    url = f"{EVOLUTION_API_URL}/message/sendText/{EVOLUTION_INSTANCE_ID}"
    payload = {"number": phone, "text": texto, "delay": delay_ms}
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(url, json=payload, headers=HEADERS)
        r.raise_for_status()
    return r.json()


async def enviar_resposta_humanizada(phone: str, texto: str):
    """Divide a resposta em partes e envia com delay proporcional."""
    import re
    partes = re.split(r'(?<=[.!?])\s+', texto.strip())

    # Agrupa frases curtas
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
        delay_ms = min(1000 + len(parte) * 30, 5000)
        await enviar_texto(phone, parte, delay_ms)
        await asyncio.sleep(delay_ms / 1000)


async def baixar_audio_base64(instance_id: str, remote_jid: str, audio_id: str) -> str:
    """Retorna o áudio em base64 via Evolution API."""
    url = f"{EVOLUTION_API_URL}/message/getBase64FromMediaMessage/{instance_id}"
    payload = {"message": {"key": {"remoteJid": remote_jid, "id": audio_id}}}
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(url, json=payload, headers=HEADERS)
        r.raise_for_status()
    return r.json().get("base64", "")
