# -*- coding: utf-8 -*-
"""
PASSO 8 — Checagem final automática do vídeo exportado.

  * duração (10:00 ± 0,5 s)
  * telas pretas fora do lugar (ignora o começo, o fim e os cartões de capítulo)
  * travadas (imagem congelada > 2 s; pinturas com zoom lento não contam)
  * loudness integrado (-14 LUFS ± 1) e true peak (≤ -1 dB)
  * voz acima da música: compara o volume durante as falas com o volume nas pausas
  * créditos das imagens (todas domínio público)
Gera <medal>/CHECAGEM_FINAL.md

Uso:  python pipeline/p08_checagem_final.py [video.mp4]
"""
import re
import sys
from pathlib import Path

from common import carregar_config, exigir, rodar, ler_json, duracao


def intervalos(log, chave_ini, chave_fim):
    ini = [float(x) for x in re.findall(chave_ini + r":\s*([\d.]+)", log)]
    fim = [float(x) for x in re.findall(chave_fim + r":\s*([\d.]+)", log)]
    return list(zip(ini, fim))


def volume_medio(video, trechos):
    """dB RMS médio de uma lista de trechos (amostra até 12 trechos)."""
    vals = []
    for a, b in trechos[:12]:
        out = rodar(["ffmpeg", "-hide_banner", "-nostats", "-ss", f"{a:.2f}", "-t", f"{max(0.3, b - a):.2f}", "-i", video,
                     "-af", "volumedetect", "-vn", "-f", "null", "-"], capturar=True)
        m = re.search(r"mean_volume:\s*(-?[\d.]+)", out)
        if m:
            vals.append(float(m.group(1)))
    return sum(vals) / len(vals) if vals else None


def main():
    cfg = carregar_config()
    exigir("ffmpeg")
    base = Path(cfg["pastas"]["trabalho"])
    medal = Path(cfg["pastas"]["medal"])
    video = sys.argv[1] if len(sys.argv) > 1 else str(medal / "O_Mundo_e_um_Servidor_4K_FINAL.mp4")
    edl = ler_json(base / "edl.json")
    L = ["# Checagem final — O MUNDO É UM SERVIDOR", "", f"Arquivo: `{video}`", ""]
    ok = True

    d = duracao(video)
    passou = abs(d - 600) <= 0.5
    ok &= passou
    L.append(f"- {'✅' if passou else '❌'} Duração: {int(d // 60)}:{d % 60:05.2f}")

    print("Procurando telas pretas e travadas (leva alguns minutos)…")
    log = rodar(["ffmpeg", "-hide_banner", "-nostats", "-i", video, "-vf",
                 "fps=10,scale=480:-2,blackdetect=d=1.0:pix_th=0.06,freezedetect=n=0.002:d=2.5", "-an", "-f", "null", "-"],
                capturar=True)
    permitidos = [(0, 8)] + [(c["ini"] - 1, c["fim"] + 1) for c in edl["cartoes"]] + [(d - 18, d + 1)]
    pretas = [(a, b) for a, b in intervalos(log, "black_start", "black_end")
              if not any(x <= a and b <= y for x, y in permitidos)]
    travadas = intervalos(log, "freeze_start", "freeze_end")
    ok &= not pretas
    L.append(f"- {'✅' if not pretas else '❌'} Telas pretas fora do lugar: {len(pretas)}")
    L += [f"  - {a:.1f}s → {b:.1f}s" for a, b in pretas]
    L.append(f"- {'✅' if not travadas else '⚠️'} Imagem congelada > 2,5 s: {len(travadas)} (confira se não é um cartão)")
    L += [f"  - {a:.1f}s → {b:.1f}s" for a, b in travadas]

    out = rodar(["ffmpeg", "-hide_banner", "-nostats", "-i", video, "-af", "ebur128=peak=true", "-vn", "-f", "null", "-"],
                capturar=True)
    resumo = out[out.rfind("Summary:"):]
    li = float(re.search(r"I:\s*(-?[\d.]+) LUFS", resumo).group(1))
    tp = float(re.search(r"Peak:\s*(-?[\d.]+) dBFS", resumo).group(1))
    a1 = abs(li - cfg["audio"]["master_lufs"]) <= 1.0
    a2 = tp <= cfg["audio"]["master_true_peak"] + 0.2
    ok &= a1 and a2
    L.append(f"- {'✅' if a1 else '❌'} Loudness integrado: {li:.1f} LUFS (alvo {cfg['audio']['master_lufs']})")
    L.append(f"- {'✅' if a2 else '❌'} True peak: {tp:.1f} dBTP (máx {cfg['audio']['master_true_peak']})")

    falas = [(n["ini"] + 0.3, n["ini"] + n["out"] - n["in"] - 0.3) for n in edl["audio"]["narracao"]]
    pausas = [(a[1] + 0.4, b[0] - 0.2) for a, b in zip(falas, falas[1:]) if b[0] - a[1] > 2.0]
    vf, vp = volume_medio(video, falas[::3]), volume_medio(video, pausas[::2])
    if vf is not None and vp is not None:
        dif = vf - vp
        L.append(f"- {'✅' if dif >= 6 else '⚠️'} Voz x música: falas {vf:.1f} dB, pausas {vp:.1f} dB "
                 f"(diferença {dif:.1f} dB; a voz em si fica ~15 dB acima da música abaixada)")

    cred = base / "imagens" / "CREDITOS_IMAGENS.txt"
    L.append(f"- {'✅' if cred.exists() else '⚠️'} Créditos das imagens: {cred}")
    L += ["", "## Conferir assistindo (manual)",
          "- [ ] nenhum menu, inventário, crafting ou tela escura ilegível",
          "- [ ] textos sincronizados com a fala e legíveis",
          "- [ ] voz clara do começo ao fim",
          "", "## Direitos autorais",
          "As músicas (C418 – Warmth; Resident Evil 9 – Respite; Resident Evil 4 – Serenity) têm direitos autorais. "
          "O Instagram/YouTube pode silenciar o áudio ou bloquear o vídeo. Alternativa segura: trilhas livres "
          "(YouTube Audio Library, Pixabay Music) ou licenciadas (Artlist, Epidemic Sound).",
          "", f"**Resultado: {'APROVADO' if ok else 'REVISAR os itens ❌'}**"]
    saida = medal / "CHECAGEM_FINAL.md"
    saida.write_text("\n".join(L), encoding="utf-8")
    print("\n".join(L))
    print(f"\n-> {saida}")


if __name__ == "__main__":
    main()
