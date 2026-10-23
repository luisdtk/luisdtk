# -*- coding: utf-8 -*-
"""
PASSO 7 — Exporta o vídeo final a partir do render do After Effects.

  * Master 4K: 3840x2160, 30 fps, H.264 (ou H.265 com --hevc), ~50 Mbps,
    áudio AAC 320 kbps, loudness -14 LUFS integrado / true peak -1 dB (2 passadas).
  * Reels/teaser 9:16 (1080x1920, 60–90 s): junta os momentos "destaque" da EDL,
    recorta o centro da imagem e mantém as frases na tela.

Uso:  python pipeline/p07_exportar.py [render_do_AE.mov] [--hevc]
Saída: C:/Users/luiss/Videos/Medal/O_Mundo_e_um_Servidor_4K_FINAL.mp4  e  ..._REELS_9x16.mp4
"""
import sys
from pathlib import Path

from common import carregar_config, exigir, rodar, medir_loudness, filtro_loudnorm, ler_json, duracao


def main():
    cfg = carregar_config()
    exigir("ffmpeg")
    base = Path(cfg["pastas"]["trabalho"])
    edl = ler_json(base / "edl.json")
    entrada = next((a for a in sys.argv[1:] if not a.startswith("--")), edl["render_saida"])
    hevc = "--hevc" in sys.argv
    if not Path(entrada).exists():
        sys.exit(f"Não achei o render do After Effects: {entrada}")
    medal = Path(cfg["pastas"]["medal"])
    final = medal / "O_Mundo_e_um_Servidor_4K_FINAL.mp4"
    reels = medal / "O_Mundo_e_um_Servidor_REELS_9x16.mp4"
    au = cfg["audio"]

    print("Medindo loudness do mix…")
    m = medir_loudness(entrada)
    print(f"  entrada: {m['input_i']} LUFS, true peak {m['input_tp']} dB")
    af = filtro_loudnorm(m, au["master_lufs"], au["master_true_peak"]) + ",aresample=48000"
    vcod = (["-c:v", "libx265", "-preset", "slow", "-b:v", "45M", "-maxrate", "60M", "-bufsize", "90M",
             "-tag:v", "hvc1", "-pix_fmt", "yuv420p10le", "-x265-params", "aq-mode=3"] if hevc else
            ["-c:v", "libx264", "-preset", "slow", "-b:v", "50M", "-maxrate", "60M", "-bufsize", "100M",
             "-profile:v", "high", "-pix_fmt", "yuv420p", "-tune", "grain"])
    print("Codificando o master 4K…")
    rodar(["ffmpeg", "-y", "-loglevel", "error", "-stats", "-i", entrada, "-vf", "scale=3840:2160:flags=lanczos,fps=30",
           *vcod, "-af", af, "-c:a", "aac", "-b:a", "320k", "-movflags", "+faststart", final])
    print(f"  -> {final}  ({duracao(final):.2f} s)")

    if not edl.get("reels"):
        print("EDL sem momentos de destaque para o Reels.")
        return
    print("Montando o Reels 9:16…")
    # área útil do 2.39:1 dentro do 4K: recorta 9:16 do centro dela
    util_h = round(3840 / 2.39)
    crop_w = round(util_h * 9 / 16) // 2 * 2
    partes, filtros = [], []
    trechos = edl["reels"]
    for k, r in enumerate(trechos):
        d = r["fim"] - r["ini"]
        filtros.append(f"[0:v]trim=start={r['ini']:.3f}:end={r['fim']:.3f},setpts=PTS-STARTPTS,"
                       f"crop={crop_w}:{util_h}:(iw-{crop_w})/2:(ih-{util_h})/2,scale=1080:1920:flags=lanczos,"
                       f"fade=t=in:d=0.4,fade=t=out:st={d - 0.4:.3f}:d=0.4,setsar=1[v{k}]")
        filtros.append(f"[0:a]atrim=start={r['ini']:.3f}:end={r['fim']:.3f},asetpts=PTS-STARTPTS,"
                       f"afade=t=in:d=0.3,afade=t=out:st={d - 0.4:.3f}:d=0.4[a{k}]")
        partes.append(f"[v{k}][a{k}]")
    filtros.append("".join(partes) + f"concat=n={len(trechos)}:v=1:a=1[v][a]")
    rodar(["ffmpeg", "-y", "-loglevel", "error", "-stats", "-i", final, "-filter_complex", ";".join(filtros),
           "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "slow", "-b:v", "16M", "-pix_fmt", "yuv420p",
           "-r", "30", "-c:a", "aac", "-b:a", "320k", "-movflags", "+faststart", reels])
    print(f"  -> {reels}  ({duracao(reels):.1f} s)")


if __name__ == "__main__":
    main()
