# -*- coding: utf-8 -*-
"""
PASSO 2 — Narração com som de estúdio.

Cadeia (por arquivo, na ordem do config):
  redução de ruído (afftdn)  -> high-pass 80 Hz  -> calor +2,5 dB @120 Hz
  -> corte de lama -3 dB @250 Hz -> presença +3 dB @3 kHz -> ar +2,5 dB @11 kHz
  -> de-esser -> compressor 3,5:1 -> limiter -> loudnorm 2 passadas em -16 LUFS
Saída: WAV 48 kHz / 24 bits em <trabalho>/narracao_tratada/NN.wav

Melhor resultado: passe ANTES os .m4a no Adobe Podcast Enhance (força ~70%) ou no
iZotope RX (Voice De-noise + De-reverb) e salve em <medal>/narracao_enhanced/ com o
MESMO nome. Se essa pasta existir, este passo usa esses arquivos e pula o afftdn.

Uso:  python pipeline/p02_tratar_narracao.py
"""
from pathlib import Path

from common import carregar_config, pasta_trabalho, exigir, rodar, medir_loudness, filtro_loudnorm, salvar_json, duracao


def cadeia_voz(com_denoise=True):
    f = []
    if com_denoise:
        f.append("afftdn=nr=12:nf=-42:tn=1")
    f += [
        "highpass=f=80:poles=2",
        "equalizer=f=120:t=q:w=1.0:g=2.5",
        "equalizer=f=250:t=q:w=1.2:g=-3",
        "equalizer=f=3000:t=q:w=1.0:g=3",
        "highshelf=f=11000:g=2.5",
        "deesser=i=0.35:m=0.5:f=0.5:s=o",
        "acompressor=threshold=-21dB:ratio=3.5:attack=6:release=90:knee=4:makeup=4",
        "alimiter=limit=0.89:attack=3:release=40:level=disabled",
    ]
    return ",".join(f)


def localizar(cfg, nome):
    """Arquivo enhanced (se existir, qualquer extensão) ou o original."""
    enh = Path(cfg["pastas"]["medal"]) / "narracao_enhanced"
    if enh.is_dir():
        base = Path(nome).stem
        for ext in (".wav", ".m4a", ".mp3", ".flac"):
            p = enh / (base + ext)
            if p.exists():
                return p, True
    return Path(cfg["pastas"]["narracao"]) / nome, False


def main():
    cfg = carregar_config()
    exigir("ffmpeg")
    destino = pasta_trabalho(cfg, "narracao_tratada")
    alvo = cfg["audio"]["voz_lufs"]
    lista = []
    for i, nome in enumerate(cfg["narracao_ordem"], start=1):
        origem, enhanced = localizar(cfg, nome)
        if not origem.exists():
            print(f"AVISO: faltando {origem}")
            continue
        intermediario = destino / f"_{i:02d}_cadeia.wav"
        saida = destino / f"{i:02d}.wav"
        print(f"[{i:02d}] {origem.name}{' (enhanced)' if enhanced else ''}")
        rodar(["ffmpeg", "-y", "-loglevel", "error", "-i", origem, "-af", cadeia_voz(not enhanced),
               "-ar", "48000", "-ac", "1", "-c:a", "pcm_s24le", intermediario])
        medida = medir_loudness(intermediario)
        rodar(["ffmpeg", "-y", "-loglevel", "error", "-i", intermediario, "-af", filtro_loudnorm(medida, alvo, -1.5),
               "-ar", "48000", "-ac", "2", "-c:a", "pcm_s24le", saida])
        intermediario.unlink()
        lista.append({"n": i, "original": nome, "arquivo": saida.as_posix(), "dur": round(duracao(saida), 3),
                      "lufs_antes": float(medida["input_i"])})
    salvar_json(destino / "narracao_tratada.json", lista)
    print(f"\nOK -> {len(lista)} arquivos em {destino}")


if __name__ == "__main__":
    main()
