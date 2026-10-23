# -*- coding: utf-8 -*-
"""
PASSO 1 — Analisa a gameplay e separa SÓ as partes boas.

Para cada quadro (amostrado a 10 fps, em baixa resolução) mede:
  * travada ............ freezedetect (imagem idêntica por mais de 0,5 s)
  * escuro ............. brilho médio (YAVG) abaixo do limite (caverna/noite ilegível)
  * menu/inventário .... centro da tela cinza, sem cor e parado (painel da GUI do Minecraft)
  * solavanco .......... diferença entre quadros muito acima do normal (câmera brusca)
Depois cruza com as janelas do roteiro (GAMEPLAY_JANELAS) e os cortes manuais
(GAMEPLAY_CORTES) e grava <trabalho>/analise/gameplay_bons.json + relatório + folhas de contato.

Uso:  python pipeline/p01_analisar_gameplay.py
"""
import re
import tempfile
from pathlib import Path

from common import carregar_config, pasta_trabalho, exigir, rodar, salvar_json, roteiro

FPS_ANALISE = 10
LIMITE_ESCURO = 30        # YAVG (0–255) para cenas de dia
LIMITE_ESCURO_NOITE = 14  # para etiquetas marcadas escuro_ok (noite com tochas, lava)
FREEZE_RUIDO = 0.0015
FREEZE_MIN_S = 0.5
MENU_SAT_MAX = 9
MENU_YDIF_MAX = 0.6
MENU_Y = (105, 220)
MENU_MIN_S = 0.6
SOLAVANCO_ABS = 22
FOLGA_S = 0.4             # margem cortada ao redor de cada trecho ruim
MIN_TRECHO_S = 2.5


def _ler_metadata(txt):
    """Lê a saída de metadata=mode=print -> lista de dicts por quadro (com 'pts_time')."""
    quadros, atual = [], None
    for linha in Path(txt).read_text(encoding="utf-8", errors="replace").splitlines():
        m = re.match(r"frame:\d+\s+pts:\d+\s+pts_time:([\d.]+)", linha)
        if m:
            atual = {"t": float(m.group(1))}
            quadros.append(atual)
        elif atual is not None and "=" in linha:
            k, v = linha.split("=", 1)
            try:
                atual[k.strip().split(".")[-1]] = float(v)
            except ValueError:
                atual[k.strip().split(".")[-1]] = v
    return quadros


def analisar_arquivo(video):
    """Devolve lista de quadros: t, y, sat, ydif, cy, csat, cydif, freeze."""
    with tempfile.TemporaryDirectory() as tmp:
        filtro = (f"[0:v]fps={FPS_ANALISE},scale=480:270,split=2[a][b];"
                  f"[a]freezedetect=n={FREEZE_RUIDO}:d={FREEZE_MIN_S},signalstats,"
                  f"metadata=mode=print:file=inteiro.txt[ao];"
                  f"[b]crop=iw*0.36:ih*0.5,signalstats,metadata=mode=print:file=centro.txt[bo]")
        import subprocess
        cmd = ["ffmpeg", "-hide_banner", "-nostats", "-i", str(video), "-filter_complex", filtro,
               "-map", "[ao]", "-f", "null", "-", "-map", "[bo]", "-f", "null", "-"]
        print("  analisando", Path(video).name, "(pode levar alguns minutos)…")
        r = subprocess.run(cmd, cwd=tmp, capture_output=True, text=True, encoding="utf-8", errors="replace")
        if r.returncode != 0:
            raise RuntimeError(r.stderr[-3000:])
        inteiro = _ler_metadata(Path(tmp) / "inteiro.txt")
        centro = _ler_metadata(Path(tmp) / "centro.txt")
        # freezedetect também escreve no log; é a fonte mais confiável dos intervalos
        travadas, ini = [], None
        for linha in r.stderr.splitlines():
            m = re.search(r"freeze_start: ([\d.]+)", linha)
            if m:
                ini = float(m.group(1))
            m = re.search(r"freeze_end: ([\d.]+)", linha)
            if m and ini is not None:
                travadas.append((ini, float(m.group(1))))
                ini = None
        if ini is not None:
            travadas.append((ini, 1e9))

    quadros = []
    for q, c in zip(inteiro, centro):
        quadros.append({"t": q["t"], "y": q.get("YAVG", 0), "sat": q.get("SATAVG", 0), "ydif": q.get("YDIF", 0),
                        "cy": c.get("YAVG", 0), "csat": c.get("SATAVG", 0), "cydif": c.get("YDIF", 0)})
    for q in quadros:
        q["freeze"] = any(a <= q["t"] <= b for a, b in travadas)
    return quadros


def _runs(flags, quadros, min_s):
    """Intervalos (t0, t1) onde flags[i] é verdadeiro por pelo menos min_s."""
    dt = 1.0 / FPS_ANALISE
    out, ini = [], None
    for i, f in enumerate(flags + [False]):
        if f and ini is None:
            ini = i
        elif not f and ini is not None:
            t0, t1 = quadros[ini]["t"], quadros[i - 1]["t"] + dt
            if t1 - t0 >= min_s:
                out.append((t0, t1))
            ini = None
    return out


def ruins(quadros, escuro_ok):
    """Todos os intervalos ruins, etiquetados."""
    if not quadros:
        return []
    lim = LIMITE_ESCURO_NOITE if escuro_ok else LIMITE_ESCURO
    ydifs = sorted(q["ydif"] for q in quadros)
    p97 = ydifs[int(len(ydifs) * 0.97)]
    lim_sol = max(SOLAVANCO_ABS, p97)
    res = []
    res += [(a, b, "travada") for a, b in _runs([q["freeze"] for q in quadros], quadros, FREEZE_MIN_S)]
    res += [(a, b, "escuro") for a, b in _runs([q["y"] < lim for q in quadros], quadros, 0.3)]
    menu = [q["csat"] < MENU_SAT_MAX and q["cydif"] < MENU_YDIF_MAX and MENU_Y[0] <= q["cy"] <= MENU_Y[1]
            for q in quadros]
    res += [(a, b, "menu/inventario") for a, b in _runs(menu, quadros, MENU_MIN_S)]
    res += [(a, b, "solavanco") for a, b in _runs([q["ydif"] > lim_sol for q in quadros], quadros, 0.2)]
    return res


def subtrair(janelas, cortes):
    """janelas - cortes (listas de intervalos)."""
    res = []
    for a, b in janelas:
        partes = [(a, b)]
        for c, d in cortes:
            novas = []
            for x, y in partes:
                if d <= x or c >= y:
                    novas.append((x, y))
                else:
                    if c > x:
                        novas.append((x, c))
                    if d < y:
                        novas.append((d, y))
            partes = novas
        res += partes
    return [(round(a, 2), round(b, 2)) for a, b in res if b - a >= MIN_TRECHO_S]


def brilho_medio(quadros, a, b):
    sel = [q["y"] for q in quadros if a <= q["t"] <= b]
    return round(sum(sel) / len(sel), 1) if sel else 0


def folha_de_contato(video, trechos, saida):
    """Uma miniatura do meio de cada trecho bom, em mosaico — para conferir rápido."""
    if not trechos:
        return
    with tempfile.TemporaryDirectory() as tmp:
        for i, (a, b) in enumerate(trechos):
            rodar(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{(a + b) / 2:.2f}", "-i", video, "-frames:v", "1",
                   "-vf", "scale=480:-2", str(Path(tmp) / f"m{i:03d}.png")])
        colunas = 4
        linhas = (len(trechos) + colunas - 1) // colunas
        rodar(["ffmpeg", "-y", "-loglevel", "error", "-framerate", "1", "-i", str(Path(tmp) / "m%03d.png"),
               "-vf", f"tile={colunas}x{linhas}:padding=6:color=black", "-frames:v", "1", saida])


def main():
    cfg = carregar_config()
    exigir("ffmpeg")
    destino = pasta_trabalho(cfg, "analise")
    videos = {"principal": cfg["gameplay"]["principal"], "curto": cfg["gameplay"]["curto"]}

    analises = {}
    for nome, video in videos.items():
        if not Path(video).exists():
            print(f"AVISO: não achei {video}")
            continue
        analises[nome] = analisar_arquivo(video)

    resultado = {"fps_analise": FPS_ANALISE, "arquivos": {k: str(v) for k, v in videos.items()}, "tags": {}}
    relatorio = ["# Análise da gameplay\n"]
    for tag, spec in roteiro.GAMEPLAY_JANELAS.items():
        arq = spec["arquivo"]
        if arq not in analises:
            continue
        quadros = analises[arq]
        maus = ruins(quadros, spec["escuro_ok"])
        cortes = [(a - FOLGA_S, b + FOLGA_S) for a, b, _ in maus] + list(roteiro.GAMEPLAY_CORTES.get(arq, []))
        bons = subtrair(spec["janelas"], cortes)
        resultado["tags"][tag] = {"arquivo": arq, "video": videos[arq],
                                  "trechos": [{"ini": a, "fim": b, "brilho": brilho_medio(quadros, a, b)} for a, b in bons]}
        total = sum(b - a for a, b in bons)
        relatorio.append(f"## {tag}  ({arq})  — {total:.1f} s bons de gameplay\n")
        for a, b in bons:
            relatorio.append(f"- ✅ {a:7.2f} → {b:7.2f}  ({b - a:4.1f} s, brilho {brilho_medio(quadros, a, b)})")
        for a, b, motivo in maus:
            for ja, jb in spec["janelas"]:
                if b > ja and a < jb:
                    relatorio.append(f"- ✂️ {max(a, ja):7.2f} → {min(b, jb):7.2f}  {motivo}")
                    break
        relatorio.append("")
        folha_de_contato(videos[arq], bons, destino / f"contato_{tag}.png")

    salvar_json(destino / "gameplay_bons.json", resultado)
    (destino / "gameplay_relatorio.md").write_text("\n".join(relatorio), encoding="utf-8")
    print(f"\nOK -> {destino / 'gameplay_bons.json'}")
    print(f"Confira as miniaturas em {destino} (contato_*.png) e o relatório gameplay_relatorio.md.")
    print("Se algum trecho ruim passou, adicione em GAMEPLAY_CORTES no roteiro.py e rode de novo.")


if __name__ == "__main__":
    main()
