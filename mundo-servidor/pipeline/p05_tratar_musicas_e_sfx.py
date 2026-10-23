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
from pathlib import Path

from common import carregar_config, pasta_trabalho, exigir, rodar, medir_loudness, filtro_loudnorm, salvar_json, duracao

EXTS = (".mp3", ".m4a", ".wav", ".flac", ".ogg", ".opus", ".webm", ".aac")
CADEIA_MUSICA = ("highpass=f=28:poles=2,equalizer=f=70:t=q:w=1:g=1.5,"
                 "aexciter=amount=1.2:drive=4:freq=6500:ceil=16000:blend=0,highshelf=f=9000:g=1.5")


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
        indice[mid] = {"arquivo": saida.as_posix(), "dur": round(duracao(saida), 3), "origem": origem.name}

    sfx = pasta_trabalho(cfg, "sfx", "gerados")
    gerar_sfx(sfx)
    indice["drone"] = {"arquivo": (sfx / "drone.wav").as_posix(), "dur": round(duracao(sfx / "drone.wav"), 3),
                       "origem": "gerado"}
    salvar_json(destino / "musicas.json", indice)
    print(f"\nOK -> {destino / 'musicas.json'}")


if __name__ == "__main__":
    main()
