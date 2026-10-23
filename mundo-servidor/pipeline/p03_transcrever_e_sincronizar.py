# -*- coding: utf-8 -*-
"""
PASSO 3 — Whisper: transcreve os 33 áudios e descobre EXATAMENTE qual frase do
roteiro cada arquivo contém, com o tempo de cada palavra.

* Transcreve cada arquivo tratado (faster-whisper, palavra a palavra; cache em transcricao.json).
* Alinha TODAS as palavras faladas contra o texto do roteiro (SequenceMatcher).
  Retakes / frases fora do roteiro ficam sem correspondência e o arquivo é marcado.
* Para cada bloco do roteiro: em que arquivo/segundo começa e termina a fala.
* Para cada frase na tela: o segundo exato em que a âncora é falada.
* Gera relatorio_narracao.md (arquivo -> frase do roteiro) para você conferir.

Uso:  python pipeline/p03_transcrever_e_sincronizar.py [--refazer]
"""
import sys
from difflib import SequenceMatcher
from pathlib import Path

from common import carregar_config, pasta_trabalho, salvar_json, ler_json, normalizar, roteiro

VOCABULARIO = ("Minecraft, griefing, griefer, spawna, mob, TNT, servidor, chat, bunker, "
               "azul, vermelho, norte, sul, cratera, lava.")


# ---------------------------------------------------------------- transcrição
def transcrever(arquivos, cfg):
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        sys.exit("Instale o faster-whisper:  pip install faster-whisper")
    disp = cfg["whisper"]["dispositivo"]
    if disp == "auto":
        try:
            import ctranslate2
            disp = "cuda" if ctranslate2.get_cuda_device_count() > 0 else "cpu"
        except Exception:
            disp = "cpu"
    modelo = WhisperModel(cfg["whisper"]["modelo"], device=disp,
                          compute_type="float16" if disp == "cuda" else "int8")
    res = []
    for a in arquivos:
        print(f"  whisper: {Path(a['arquivo']).name}")
        segs, _ = modelo.transcribe(a["arquivo"], language=cfg["whisper"]["idioma"], word_timestamps=True,
                                    vad_filter=True, beam_size=5, initial_prompt=VOCABULARIO,
                                    condition_on_previous_text=False)
        palavras = []
        for s in segs:
            for w in s.words or []:
                palavras.append({"w": w.word.strip(), "ini": round(w.start, 3), "fim": round(w.end, 3)})
        res.append({"n": a["n"], "arquivo": a["arquivo"], "dur": a["dur"], "palavras": palavras})
    return res


# ---------------------------------------------------------------- alinhamento
def palavras_do_roteiro():
    """Lista [(palavra_normalizada, id_bloco)] na ordem do roteiro."""
    out = []
    for b in roteiro.BLOCOS:
        if b["narracao"]:
            for w in normalizar(b["narracao"]):
                out.append((w, b["id"]))
    return out


def alinhar(transcricao):
    """Localiza cada arquivo no roteiro de forma independente (a ordem dos arquivos não importa).
    Se a mesma frase foi gravada mais de uma vez, fica a take com o trecho contínuo mais longo
    (empate: a gravação mais recente)."""
    script = palavras_do_roteiro()
    sw = [s[0] for s in script]
    falado = []  # (palavra_normalizada, idx_arquivo, ini, fim)
    inicio_arq = []
    for fi, arq in enumerate(transcricao):
        inicio_arq.append(len(falado))
        for p in arq["palavras"]:
            for w in normalizar(p["w"]):
                falado.append((w, fi, p["ini"], p["fim"]))
    inicio_arq.append(len(falado))

    melhor = {}  # idx_script -> (pontuação, idx_falado)
    for fi in range(len(transcricao)):
        a0, a1 = inicio_arq[fi], inicio_arq[fi + 1]
        fw = [f[0] for f in falado[a0:a1]]
        if not fw:
            continue
        # 1ª passada: onde este arquivo cai no roteiro (maior trecho em comum)
        blocos = [bl for bl in SequenceMatcher(None, sw, fw, autojunk=False).get_matching_blocks() if bl.size]
        if not blocos:
            continue
        maior = max(blocos, key=lambda bl: bl.size)
        # 2ª passada: alinhamento só na região do roteiro em volta desse trecho
        lo = max(0, maior.a - maior.b - 25)
        hi = min(len(sw), maior.a + (len(fw) - maior.b) + 25)
        for bl in SequenceMatcher(None, sw[lo:hi], fw, autojunk=False).get_matching_blocks():
            for k in range(bl.size):
                pont = (bl.size, fi)   # trecho contínuo maior vence; empate -> gravação mais recente
                i = lo + bl.a + k
                if i not in melhor or pont > melhor[i][0]:
                    melhor[i] = (pont, a0 + bl.b + k)
    mapa = {i: j for i, (_, j) in melhor.items()}

    # buracos no roteiro que um arquivo inteiro ainda não usado cobre (ex.: arquivo de 1 palavra)
    usados = {falado[j][1] for j in mapa.values()}
    i = 0
    while i < len(sw):
        if i in mapa:
            i += 1
            continue
        g1 = i
        while g1 < len(sw) and g1 not in mapa:
            g1 += 1
        for fi in range(len(transcricao)):
            a0, a1 = inicio_arq[fi], inicio_arq[fi + 1]
            if fi in usados or a1 == a0:
                continue
            fw = [f[0] for f in falado[a0:a1]]
            if SequenceMatcher(None, sw[i:g1], fw, autojunk=False).ratio() >= 0.75:
                for bl in SequenceMatcher(None, sw[i:g1], fw, autojunk=False).get_matching_blocks():
                    for k in range(bl.size):
                        mapa[i + bl.a + k] = a0 + bl.b + k
                usados.add(fi)
                break
        i = g1

    # posição (arquivo, tempo) de cada palavra do roteiro; não casadas -> vizinho mais próximo
    pos = [None] * len(script)
    for i, j in mapa.items():
        f = falado[j]
        pos[i] = (f[1], f[2], f[3])
    for i in range(len(pos)):
        if pos[i] is None:
            ant = next((pos[j] for j in range(i - 1, -1, -1) if pos[j]), None)
            prox = next((pos[j] for j in range(i + 1, len(pos)) if pos[j]), None)
            pos[i] = ant if ant and (not prox or ant[0] == prox[0]) else (prox or ant or (0, 0.0, 0.0))

    usados_por_arquivo = {}
    for j in mapa.values():
        usados_por_arquivo[falado[j][1]] = usados_por_arquivo.get(falado[j][1], 0) + 1
    return script, falado, pos, mapa, usados_por_arquivo


def achar_ancora(script, bloco_id, ancora):
    """Índice (no roteiro) da 1ª palavra da âncora dentro do bloco."""
    alvo = normalizar(ancora)
    idxs = [i for i, s in enumerate(script) if s[1] == bloco_id]
    palavras = [script[i][0] for i in idxs]
    n = len(alvo)
    for k in range(len(palavras) - n + 1):
        if palavras[k:k + n] == alvo:
            return idxs[k]
    melhor, mk = 0, 0  # aproximado
    for k in range(len(palavras)):
        r = SequenceMatcher(None, palavras[k:k + n], alvo).ratio()
        if r > melhor:
            melhor, mk = r, k
    if melhor < 0.6:
        print(f"  AVISO: âncora '{ancora}' não encontrada no bloco {bloco_id} (melhor {melhor:.2f})")
    return idxs[mk] if idxs else 0


def sincronizar(transcricao):
    script, falado, pos, mapa, usados = alinhar(transcricao)
    arquivos = []
    for fi, arq in enumerate(transcricao):
        n_pal = sum(len(normalizar(p["w"])) for p in arq["palavras"])
        taxa = usados.get(fi, 0) / max(1, n_pal)
        ws = arq["palavras"]
        arquivos.append({
            "n": arq["n"], "arquivo": arq["arquivo"], "dur": arq["dur"],
            "corte_in": round(max(0.0, ws[0]["ini"] - 0.25), 3) if ws else 0.0,
            "corte_out": round(min(arq["dur"], ws[-1]["fim"] + 0.45), 3) if ws else arq["dur"],
            "correspondencia": round(taxa, 3),
            "usar": taxa >= 0.3,
            "texto": " ".join(p["w"] for p in ws),
        })

    blocos = {}
    for b in roteiro.BLOCOS:
        if not b["narracao"]:
            continue
        idxs = [i for i, s in enumerate(script) if s[1] == b["id"]]
        ini, fim = pos[idxs[0]], pos[idxs[-1]]
        ancoras = {}
        for t in b.get("textos", []):
            for ln in t["linhas"]:
                p = pos[achar_ancora(script, b["id"], ln["ancora"])]
                ancoras[ln["ancora"]] = {"arq": p[0], "t": p[1]}
        blocos[b["id"]] = {"ini": {"arq": ini[0], "t": ini[1]}, "fim": {"arq": fim[0], "t": fim[2]},
                           "ancoras": ancoras}

    # relatório: quais palavras do roteiro cada arquivo cobre
    cobertura = {}
    for i, j in mapa.items():
        cobertura.setdefault(falado[j][1], []).append(i)
    faltando = [i for i in range(len(script)) if i not in mapa]
    return {"arquivos": arquivos, "blocos": blocos}, cobertura, script, faltando


def relatorio(sync, cobertura, script, faltando, destino):
    texto_roteiro = {}
    for b in roteiro.BLOCOS:
        if b["narracao"]:
            texto_roteiro[b["id"]] = b["narracao"].split()
    linhas = ["# Narração: arquivo -> frase do roteiro\n"]
    for fi, a in enumerate(sync["arquivos"]):
        idx = sorted(cobertura.get(fi, []))
        blocos = sorted({script[i][1] for i in idx})
        status = "✅" if a["usar"] else "⚠️ NÃO USADO (parece retake ou fala fora do roteiro)"
        linhas.append(f"## {a['n']:02d}. {Path(a['arquivo']).name} — {a['dur']:.1f} s — "
                      f"correspondência {a['correspondencia'] * 100:.0f}% {status}")
        linhas.append(f"- blocos do roteiro: {', '.join(blocos) or '—'}")
        linhas.append(f"- Whisper ouviu: _{a['texto']}_\n")
    if faltando:
        linhas.append("## Palavras do roteiro que não apareceram na narração")
        trechos, atual = [], []
        for i in faltando:
            if atual and i != atual[-1] + 1:
                trechos.append(atual)
                atual = []
            atual.append(i)
        if atual:
            trechos.append(atual)
        for tr in trechos:
            if len(tr) >= 3:
                linhas.append(f"- bloco {script[tr[0]][1]}: “{' '.join(script[i][0] for i in tr)}”")
    Path(destino).write_text("\n".join(linhas), encoding="utf-8")


def main():
    cfg = carregar_config()
    base = pasta_trabalho(cfg, "narracao_tratada")
    tratados = ler_json(base / "narracao_tratada.json")
    cache = base / "transcricao.json"
    if cache.exists() and "--refazer" not in sys.argv:
        transcricao = ler_json(cache)
        print(f"usando transcrição em cache ({cache}); rode com --refazer para transcrever de novo")
    else:
        transcricao = transcrever(tratados, cfg)
        salvar_json(cache, transcricao)
    sync, cobertura, script, faltando = sincronizar(transcricao)
    salvar_json(base / "narracao_sync.json", sync)
    relatorio(sync, cobertura, script, faltando, base / "relatorio_narracao.md")
    print(f"OK -> {base / 'narracao_sync.json'}  e  relatorio_narracao.md")


if __name__ == "__main__":
    main()
