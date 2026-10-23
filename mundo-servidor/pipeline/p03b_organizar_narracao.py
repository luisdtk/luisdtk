# -*- coding: utf-8 -*-
"""
PASSO 3b — Organiza a narração POR CAPÍTULO e corrige os cortes errados.

Os 33 arquivos originais foram gravados/cortados sem seguir o roteiro: há frases
que começam no fim de um arquivo e terminam no começo do outro, cortes no meio de
palavra, tropeços e repetições. Este passo usa as palavras com tempo do Whisper
(passo 3) e o texto do roteiro para remontar a narração:

  * cada bloco do roteiro vira UM arquivo, na pasta do capítulo:
        narracao_organizada/Capitulo_1_O_mundo_novo/1a.wav, 1b.wav ...
  * corta sempre no silêncio entre palavras (nunca no meio de uma palavra);
  * frase dividida entre dois arquivos é emendada (crossfade curto);
  * tropeço / repetição / fala fora do roteiro (trecho que não casa com o texto)
    é removido; quando uma frase foi gravada duas vezes, fica a take que casou
    melhor com o roteiro;
  * respiros naturais: mantém a pausa original entre frases (limitada a 0,25–0,9 s).
  * gera relatorio_cortes.md dizendo exatamente o que foi emendado e o que foi cortado.

Depois, o passo 6 usa automaticamente a narração organizada.
Uso:  python pipeline/p03b_organizar_narracao.py
"""
import re
import unicodedata
from pathlib import Path

from common import (carregar_config, pasta_trabalho, salvar_json, ler_json, exigir, rodar, duracao, normalizar,
                    roteiro)
import p03_transcrever_e_sincronizar as p03

MAX_BURACO_PALAVRAS = 3      # mais que isso de fala sem casar com o roteiro = tropeço/retake -> corta
PAUSA_MIN, PAUSA_MAX = 0.25, 0.9
PAUSA_EMENDA = 0.35          # entre pedaços vindos de arquivos diferentes
PRE, POS = 0.10, 0.18        # margem antes/depois das palavras (dentro do silêncio)


def slug(t):
    t = unicodedata.normalize("NFD", t)
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"[^A-Za-z0-9]+", "_", t).strip("_")


def pedacos_do_bloco(bloco_id, script, falado, mapa, transcricao, usar):
    """Lista de pedaços (arquivo_idx, ini, fim, [palavras]) que formam a fala do bloco."""
    idx_script = [i for i, s in enumerate(script) if s[1] == bloco_id]
    # na ORDEM DO ROTEIRO (não na ordem dos arquivos)
    js = [mapa[i] for i in idx_script if i in mapa and usar[falado[mapa[i]][1]]]
    if not js:
        return [], []
    corridas, atual = [], [js[0]]
    for a, b in zip(js, js[1:]):
        mesmo_arquivo = falado[a][1] == falado[b][1]
        if mesmo_arquivo and 0 <= b - a - 1 <= MAX_BURACO_PALAVRAS:
            atual.append(b)
        else:
            corridas.append(atual)
            atual = [b]
    corridas.append(atual)

    cortes = []   # o que ficou de fora, para o relatório
    pedacos = []
    for c in corridas:
        fi = falado[c[0]][1]
        palavras = transcricao[fi]["palavras"]
        # índice da palavra do whisper (não normalizada) que contém cada palavra falada
        w0, w1 = falado[c[0]][4], falado[c[-1]][4]
        ini = palavras[w0]["ini"] - PRE
        fim = palavras[w1]["fim"] + POS
        if w0 > 0:
            ini = max(ini, (palavras[w0 - 1]["fim"] + palavras[w0]["ini"]) / 2)
        if w1 + 1 < len(palavras):
            fim = min(fim, (palavras[w1]["fim"] + palavras[w1 + 1]["ini"]) / 2)
        ini = max(0.0, ini)
        fim = min(transcricao[fi]["dur"], fim)
        # palavras dentro da corrida que não casaram (até MAX_BURACO) ficam; buracos maiores viraram cortes
        pedacos.append({"arq": fi, "ini": round(ini, 3), "fim": round(fim, 3),
                        "palavras": [dict(p) for p in palavras[w0:w1 + 1]]})
    # descreve o que foi descartado entre pedaços do mesmo arquivo
    for a, b in zip(pedacos, pedacos[1:]):
        if a["arq"] == b["arq"]:
            meio = [p["w"] for p in transcricao[a["arq"]]["palavras"] if a["fim"] <= p["ini"] and p["fim"] <= b["ini"]]
            if meio:
                cortes.append((a["arq"], a["fim"], b["ini"], " ".join(meio)))
    return pedacos, cortes


def pausa_entre(a, b, transcricao):
    if a["arq"] == b["arq"] and b["ini"] >= a["fim"] - 0.01:
        orig = b["palavras"][0]["ini"] - a["palavras"][-1]["fim"]
        return max(PAUSA_MIN, min(PAUSA_MAX, orig)) - (PRE + POS) * 0.5
    return PAUSA_EMENDA


def renderizar(pedacos, transcricao, saida):
    """Corta e emenda os pedaços com micro-fades (sem estalos) e silêncio entre eles."""
    entradas, filtros, rotulos = [], [], []
    arquivos = sorted({p["arq"] for p in pedacos})
    idx = {a: k for k, a in enumerate(arquivos)}
    for a in arquivos:
        entradas += ["-i", transcricao[a]["arquivo"]]
    for k, p in enumerate(pedacos):
        d = p["fim"] - p["ini"]
        filtros.append(f"[{idx[p['arq']]}:a]atrim=start={p['ini']:.3f}:end={p['fim']:.3f},asetpts=PTS-STARTPTS,"
                       f"afade=t=in:d=0.012,afade=t=out:st={max(0, d - 0.025):.3f}:d=0.025,"
                       f"aformat=sample_rates=48000:channel_layouts=stereo[p{k}]")
        rotulos.append(f"[p{k}]")
        if k + 1 < len(pedacos):
            s = max(0.05, pausa_entre(p, pedacos[k + 1], transcricao))
            filtros.append(f"anullsrc=r=48000:cl=stereo,atrim=duration={s:.3f}[s{k}]")
            rotulos.append(f"[s{k}]")
    filtros.append("".join(rotulos) + f"concat=n={len(rotulos)}:v=0:a=1[out]")
    rodar(["ffmpeg", "-y", "-loglevel", "error", *entradas, "-filter_complex", ";".join(filtros),
           "-map", "[out]", "-c:a", "pcm_s24le", saida])


def main():
    cfg = carregar_config()
    exigir("ffmpeg")
    base = pasta_trabalho(cfg, "narracao_tratada")
    transcricao = ler_json(base / "transcricao.json")
    sync = ler_json(base / "narracao_sync.json")
    usar = [a["usar"] for a in sync["arquivos"]]

    script = p03.palavras_do_roteiro()
    falado = []   # (palavra_norm, arquivo, ini, fim, índice_da_palavra_whisper)
    for fi, arq in enumerate(transcricao):
        for wi, p in enumerate(arq["palavras"]):
            for w in normalizar(p["w"]):
                falado.append((w, fi, p["ini"], p["fim"], wi))
    _, _, _, mapa, _ = p03.alinhar(transcricao)

    destino = pasta_trabalho(cfg, "narracao_organizada")
    atos = {a["id"]: a for a in roteiro.ATOS}
    nova_trans, nova_lista = [], []
    rel = ["# Narração reorganizada por capítulo\n",
           "Cada bloco do roteiro virou um arquivo. ✂️ = trecho removido (tropeço, repetição ou fora do roteiro); "
           "🔗 = frase emendada de dois arquivos originais.\n"]
    ato_atual = None
    for b in roteiro.BLOCOS:
        if not b["narracao"]:
            continue
        ato = atos[b["ato"]]
        pasta = destino / f"Capitulo_{ato['id']}_{slug(ato['nome'])}"
        pasta.mkdir(parents=True, exist_ok=True)
        if ato_atual != ato["id"]:
            rel.append(f"\n## Capítulo {ato['romano']} — {ato['nome']}\n")
            ato_atual = ato["id"]
        pedacos, cortes = pedacos_do_bloco(b["id"], script, falado, mapa, transcricao, usar)
        if not pedacos:
            rel.append(f"- **{b['id']}** ⚠️ nenhuma fala encontrada para este bloco — grave de novo")
            continue
        saida = pasta / f"{b['id']}.wav"
        renderizar(pedacos, transcricao, saida)

        # transcrição do arquivo novo (tempos deslocados) para o passo 3 / 6
        t, palavras = 0.0, []
        for k, p in enumerate(pedacos):
            for w in p["palavras"]:
                palavras.append({"w": w["w"], "ini": round(w["ini"] - p["ini"] + t, 3), "fim": round(w["fim"] - p["ini"] + t, 3)})
            t += p["fim"] - p["ini"]
            if k + 1 < len(pedacos):
                t += max(0.05, pausa_entre(p, pedacos[k + 1], transcricao))
        dur = round(duracao(saida), 3)
        n = len(nova_lista) + 1
        nova_lista.append({"n": n, "original": f"{b['id']}.wav", "arquivo": saida.as_posix(), "dur": dur})
        nova_trans.append({"n": n, "arquivo": saida.as_posix(), "dur": dur, "palavras": palavras})

        origem = sorted({Path(transcricao[p["arq"]]["arquivo"]).name for p in pedacos})
        rel.append(f"- **{b['id']}.wav** ({dur:.1f} s) ← {', '.join(origem)}")
        for a, c in zip(pedacos, pedacos[1:]):
            if a["arq"] != c["arq"]:
                rel.append(f"  - 🔗 emenda: {Path(transcricao[a['arq']]['arquivo']).name} @ {a['fim']:.2f}s  +  "
                           f"{Path(transcricao[c['arq']]['arquivo']).name} @ {c['ini']:.2f}s")
        for fi, x, y, txt in cortes:
            rel.append(f"  - ✂️ cortado de {Path(transcricao[fi]['arquivo']).name} {x:.2f}–{y:.2f}s: “{txt}”")

    # sobras: falas dos arquivos originais que não entraram em bloco nenhum
    usadas = set()
    for j in mapa.values():
        usadas.add((falado[j][1], falado[j][4]))
    rel.append("\n## Falas que ficaram de fora (não estão no roteiro)\n")
    for fi, arq in enumerate(transcricao):
        sobra = [p["w"] for wi, p in enumerate(arq["palavras"]) if (fi, wi) not in usadas]
        if len(sobra) >= 3:
            rel.append(f"- {Path(arq['arquivo']).name}: “{' '.join(sobra)}”")

    salvar_json(destino / "narracao_tratada.json", nova_lista)
    salvar_json(destino / "transcricao.json", nova_trans)
    sync_novo, cob, scr, falt = p03.sincronizar(nova_trans)
    salvar_json(destino / "narracao_sync.json", sync_novo)
    (destino / "relatorio_cortes.md").write_text("\n".join(rel), encoding="utf-8")
    print(f"OK -> {len(nova_lista)} arquivos por capítulo em {destino}")
    print(f"     confira {destino / 'relatorio_cortes.md'}")


if __name__ == "__main__":
    main()
