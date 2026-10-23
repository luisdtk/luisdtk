# -*- coding: utf-8 -*-
"""
PASSO 5 — Músicas (melhoria dos arquivos de 128 kbps) + sons sintetizados.

Músicas: high-pass 28 Hz, corpo +1,5 dB @70 Hz, realce suave de agudos (aexciter
+ high-shelf), normalização em -20 LUFS -> WAV 48 kHz. (Não dá para "recriar" o que
o MP3 de 128 kbps jogou fora; isso só deixa mais aberto e consistente.)

Sons gerados (sem direitos autorais):
  boom   — impacto grave dos cartões de capítulo
  whoosh — transição suave
  drone  — ambiência escura do Ato 4 (grave + vento)
  vento  — vento leve

Uso: python pipeline/p05_tratar_musicas_e_sfx.py
"""
import re
from pathlib import Path

from common import carregar_config, pasta_trabalho, exigir, rodar, medir_loudness, filtro_loudnorm, salvar_json, duracao

EXTS = (".mp3", ".m4a", ".wav", ".flac", ".ogg", ".opus", ".webm", ".aac", ".mp4", ".mkv", ".mov")
CADEIA_MUSICA = ("highpass=f=28:poles=2,equalizer=f=70:t=q:w=1:g=1.5,"
                 "aexciter=amount=1.2:drive=4:freq=6500:ceil=16000:blend=0,highshelf=f=9000:g=1.5")


def curva_loudness(arquivo):
    """Loudness de curto prazo (S, janela 3 s) a cada 0,1 s -> lista [(t, lufs)]."""
    out = rodar(["ffmpeg", "-hide_banner", "-nostats", "-v", "verbose", "-i", arquivo, "-vn", "-af", "ebur128=framelog=verbose",
                 "-f", "null", "-"], capturar=True)
    pts = []
    for m in re.finditer(r"t:\s*([\d.]+).*?S:\s*(-?[\d.]+|-inf)", out):
        v = float(m.group(2)) if m.group(2) != "-inf" else -70.0
        pts.append((float(m.group(1)), max(-70.0, v)))
    return pts


def parte_principal(arquivo, janela):
    """Início da 'parte principal': a janela de 'janela' segundos com mais energia musical,
    recuada até o ponto mais calmo dos 8 s anteriores (para a música entrar de forma natural)."""
    pts = curva_loudness(arquivo)
    if not pts:
        return 0.0
    dur = pts[-1][0]
    if dur <= janela + 5:
        return 0.0
    passo = 1.0
    seg = {}
    for t, v in pts:
        seg.setdefault(int(t), []).append(v)
    media = [sum(seg.get(i, [-70])) / len(seg.get(i, [-70])) for i in range(int(dur) + 1)]
    melhor, ini = -1e9, 0
    w = int(janela)
    for i in range(0, len(media) - w):
        val = sum(media[i:i + w]) / w
        if val > melhor:
            melhor, ini = val, i
    antes = range(max(0, ini - 8), ini + 1)
    ini = min(antes, key=lambda i: media[i])
    return float(ini)


def achar_musica(pasta, chave):
    chave_n = chave.lower()
    for p in sorted(Path(pasta).iterdir()):
        if p.suffix.lower() in EXTS and chave_n in p.stem.lower():
            return p
    return None


def gerar_sfx(destino):
    sons = {
        # sub que cai de 70 para 32 Hz + golpe de ruído filtrado + cauda com eco
        "boom": ("aevalsrc='0.9*sin(2*PI*(32*t+19*(1-exp(-6*t))))*exp(-1.6*t)':s=48000:d=5,"
                 "aecho=0.6:0.5:60|140:0.3|0.2,lowpass=f=180,afade=t=out:st=3.5:d=1.5"),
        # ruído rosa com filtro passa-banda varrendo (sobe e desce)
        "whoosh": ("anoisesrc=c=pink:r=48000:d=2.2:a=0.6,"
                   "bandpass=f=900:w=1.4,volume='sin(PI*t/2.2)^2':eval=frame,afade=t=in:d=0.4,afade=t=out:st=1.6:d=0.6"),
        # drone: três graves desafinados + ruído marrom grave, respiração lenta
        "drone": ("aevalsrc='0.22*sin(2*PI*41.2*t)+0.16*sin(2*PI*55.1*t+sin(0.07*t))+0.10*sin(2*PI*61.9*t)"
                  "+0.05*sin(2*PI*82.4*t)*(0.6+0.4*sin(0.2*t))':s=48000:d=180,"
                  "volume='0.75+0.25*sin(2*PI*t/23)':eval=frame,lowpass=f=420,aecho=0.7:0.6:900|1700:0.35|0.25"),
        "vento": ("anoisesrc=c=brown:r=48000:d=60:a=0.5,lowpass=f=650,highpass=f=80,"
                  "volume='0.55+0.45*sin(2*PI*t/11)*sin(2*PI*t/5.3)':eval=frame"),
    }
    for nome, filtro in sons.items():
        tmp = destino / f"_{nome}.wav"
        saida = destino / f"{nome}.wav"
        rodar(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", filtro, "-ac", "2", tmp])
        medida = medir_loudness(tmp)
        alvo = {"boom": -14, "whoosh": -24, "drone": -24, "vento": -26}[nome]
        rodar(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp, "-af", filtro_loudnorm(medida, alvo, -1.5),
               "-ar", "48000", "-c:a", "pcm_s24le", saida])
        tmp.unlink()
        print(f"  sfx gerado: {saida.name}")


def main():
    cfg = carregar_config()
    exigir("ffmpeg")
    destino = pasta_trabalho(cfg, "musicas_tratadas")
    indice = {}
    for mid, chave in cfg["musicas"].items():
        origem = achar_musica(cfg["pastas"]["musicas"], chave)
        if not origem:
            print(f"AVISO: música '{chave}' não encontrada em {cfg['pastas']['musicas']}")
            continue
        tmp = destino / f"_{mid}.wav"
        saida = destino / f"{mid}.wav"
        print(f"[{mid}] {origem.name}")
        rodar(["ffmpeg", "-y", "-loglevel", "error", "-i", origem, "-af", CADEIA_MUSICA, "-ar", "48000", "-ac", "2", tmp])
        medida = medir_loudness(tmp)
        rodar(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp,
               "-af", filtro_loudnorm(medida, cfg["audio"]["musica_lufs"], -2), "-ar", "48000", "-c:a", "pcm_s24le", saida])
        tmp.unlink()
        janela = {"warmth": 100, "respite": 120, "serenity": 140}.get(mid, 90)
        inicio = parte_principal(saida, janela)
        # fim útil: último momento com música de verdade (corta silêncio/aplausos do vídeo no fim)
        curva = curva_loudness(saida)
        fim_util = max((t for t, v in curva if v > -40), default=duracao(saida))
        indice[mid] = {"arquivo": saida.as_posix(), "dur": round(min(duracao(saida), fim_util + 1.5), 3),
                       "origem": origem.name, "inicio": inicio}
        print(f"   parte principal a partir de {int(inicio // 60)}:{int(inicio % 60):02d}")

    sfx = pasta_trabalho(cfg, "sfx", "gerados")
    gerar_sfx(sfx)
    indice["drone"] = {"arquivo": (sfx / "drone.wav").as_posix(), "dur": round(duracao(sfx / "drone.wav"), 3),
                       "origem": "gerado"}
    salvar_json(destino / "musicas.json", indice)
    print(f"\nOK -> {destino / 'musicas.json'}")


if __name__ == "__main__":
    main()
