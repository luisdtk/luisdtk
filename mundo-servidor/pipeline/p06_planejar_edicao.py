# -*- coding: utf-8 -*-
"""
PASSO 6 — Planeja a edição inteira e grava a EDL que o After Effects monta.

* Coloca os 33 áudios na ordem, com 1,5 s entre falas e pausas maiores nas viradas
  de capítulo, e distribui a folga para o vídeo fechar em EXATAMENTE 10:00.
* Para cada [VISUAL] do roteiro reparte o tempo entre Blender, gameplay boa,
  pinturas e elementos do AE (com dissolves), completando com material do ato.
* Sincroniza as frases na tela com o segundo em que cada âncora é falada.
* Calcula o ducking da música (voz 15 dB acima), silêncios, crossfades e SFX.
* Extrai só os trechos de gameplay usados (ProRes 422 HQ, crosshair removido).

Saída: <trabalho>/edl.json  +  <trabalho>/DECUPAGEM.md (timeline legível)
Uso:   python pipeline/p06_planejar_edicao.py [--sem-extrair]
"""
import math
import sys
from pathlib import Path

from common import (carregar_config, pasta_trabalho, salvar_json, ler_json, rodar, info_video, roteiro)

ATO = {a["id"]: a for a in roteiro.ATOS}
ELASTICOS = {"titulo", "final"}
LIMITES = {"img": (4.0, 11.0), "gameplay": (3.0, 14.0), "blender": (3.0, None)}
GRADES = {
    # Tritone (sombras, meios, altas) + mistura com original (%) + brilho/contraste + saturação extra do glow
    "dourado":          {"sombras": [0.05, 0.03, 0.01], "meios": [0.62, 0.42, 0.18], "altas": [1.0, 0.94, 0.80],
                         "mistura": 55, "brilho": -4, "contraste": 12, "vinheta": 55},
    "ambar_frio":       {"sombras": [0.04, 0.02, 0.02], "meios": [0.50, 0.27, 0.16], "altas": [0.98, 0.88, 0.78],
                         "mistura": 45, "brilho": -8, "contraste": 16, "vinheta": 62},
    "vermelho":         {"sombras": [0.03, 0.0, 0.0], "meios": [0.50, 0.06, 0.04], "altas": [1.0, 0.80, 0.72],
                         "mistura": 30, "brilho": -12, "contraste": 22, "vinheta": 70},
    "vermelho_escuro":  {"sombras": [0.015, 0.0, 0.0], "meios": [0.42, 0.03, 0.02], "altas": [0.96, 0.70, 0.62],
                         "mistura": 18, "brilho": -16, "contraste": 28, "vinheta": 78},
    "retorno_dourado":  {"sombras": [0.04, 0.02, 0.01], "meios": [0.60, 0.38, 0.17], "altas": [1.0, 0.95, 0.84],
                         "mistura": 58, "brilho": -3, "contraste": 10, "vinheta": 52},
}


# ------------------------------------------------------------------ entradas
def carregar_entradas(cfg):
    base = Path(cfg["pastas"]["trabalho"])
    organizada = base / "narracao_organizada" / "narracao_sync.json"
    if organizada.exists():
        print("usando a narração organizada por capítulo (passo 3b)")
        sync = ler_json(organizada)
    else:
        sync = ler_json(base / "narracao_tratada" / "narracao_sync.json")
    gp_path = base / "analise" / "gameplay_bons.json"
    if gp_path.exists():
        gameplay = ler_json(gp_path)["tags"]
    else:
        print("AVISO: sem analise/gameplay_bons.json — usando as janelas do roteiro sem filtro automático")
        vids = {"principal": cfg["gameplay"]["principal"], "curto": cfg["gameplay"]["curto"]}
        gameplay = {t: {"arquivo": s["arquivo"], "video": vids[s["arquivo"]],
                        "trechos": [{"ini": a, "fim": b} for a, b in s["janelas"]]}
                    for t, s in roteiro.GAMEPLAY_JANELAS.items()}
    img_path = base / "imagens" / "imagens.json"
    imagens = ler_json(img_path) if img_path.exists() else {}
    mus_path = base / "musicas_tratadas" / "musicas.json"
    musicas = ler_json(mus_path) if mus_path.exists() else {}
    return base, sync, gameplay, imagens, musicas


# ------------------------------------------------------------------ 1) sequência de itens
def montar_itens(sync, cfg):
    arqs = sync["arquivos"]
    colocados, itens, ato_ant = set(), [], None
    for b in roteiro.BLOCOS:
        novo_ato = b["ato"] != ato_ant
        ato_ant = b["ato"]
        primeiro_do_bloco = True
        if b["narracao"]:
            info = sync["blocos"][b["id"]]
            faixa = range(info["ini"]["arq"], info["fim"]["arq"] + 1)
            novos = [fi for fi in faixa if fi not in colocados and arqs[fi]["usar"]]
            for fi in novos:
                colocados.add(fi)
                itens.append({"tipo": "fala", "arq": fi, "bloco": b["id"], "novo_ato": novo_ato and primeiro_do_bloco,
                              "primeiro_do_bloco": primeiro_do_bloco,
                              "dur": arqs[fi]["corte_out"] - arqs[fi]["corte_in"]})
                novo_ato = primeiro_do_bloco = False
        else:
            dur = sum(desejado(f, roteiro.BLENDER_CENAS, cfg["video"]["dissolve_s"])[0] for f in b["fontes"])
            itens.append({"tipo": "fixo", "bloco": b["id"], "novo_ato": novo_ato, "primeiro_do_bloco": True, "dur": dur})
    # arquivos usáveis que o alinhamento não ligou a nenhum bloco entram onde caem na ordem
    for fi, a in enumerate(arqs):
        if a["usar"] and fi not in colocados:
            print(f"AVISO: o arquivo {Path(a['arquivo']).name} não casou com nenhum bloco — confira o relatório")
    return itens


def montar_pausas(itens, cfg):
    au = cfg["audio"]
    bloco = {b["id"]: b for b in roteiro.BLOCOS}
    pausas = []
    for k, it in enumerate(itens):
        b = bloco[it["bloco"]]
        if k == 0:
            # 'Gerando mundo...' + cartão do Capítulo I
            base, peso, minimo = 6.5 + au["pausa_capitulo_s"], 3.0, 6.5 + 4.0
        elif it["novo_ato"]:
            base, peso, minimo = au["pausa_capitulo_s"], 2.0, 4.5
        elif it["tipo"] == "fixo":
            base, peso, minimo = au["pausa_entre_falas_s"], 0.0, 0.9
        elif it["primeiro_do_bloco"]:
            base, peso, minimo = au["pausa_entre_falas_s"] + b.get("silencio_inicio_s", 0), b.get("pausa_peso", 1.0), 0.9
        else:
            base, peso, minimo = au["pausa_entre_falas_s"], 0.35, 0.8
        pausas.append({"base": base, "peso": peso, "min": minimo})
    pausas.append({"base": 0.0, "peso": 0.0, "min": 0.0})  # depois do último item (o cartão final é elástico)
    return pausas


def distribuir_folga(itens, pausas, alvo):
    total_itens = sum(i["dur"] for i in itens)
    vals = [p["base"] for p in pausas]
    extra = alvo - total_itens - sum(vals)
    if extra >= 0:
        soma_p = sum(p["peso"] for p in pausas) or 1
        vals = [v + extra * p["peso"] / soma_p for v, p in zip(vals, pausas)]
    else:
        folgas = [v - p["min"] for v, p in zip(vals, pausas)]
        tot = sum(folgas)
        corte = min(-extra, tot)
        vals = [v - corte * f / tot if tot else v for v, f in zip(vals, folgas)]
        if -extra > tot:
            print(f"AVISO: a narração + elementos fixos passam de {alvo} s mesmo com pausas mínimas "
                  f"(sobram {-extra - tot:.1f} s). O vídeo vai ficar um pouco maior que 10:00.")
    return vals


# ------------------------------------------------------------------ 2) timeline
def colocar(itens, pausas, sync):
    t = 0.0
    for it, p in zip(itens, pausas):
        t += p
        it["ini"] = t
        t += it["dur"]
        it["fim"] = t
    fim_video = t + pausas[-1]
    pos_arq = {it["arq"]: it for it in itens if it["tipo"] == "fala"}

    def tl(arq, x):
        if arq not in pos_arq:  # palavra em arquivo descartado: usa o início do item mais próximo
            arq = min(pos_arq, key=lambda a: abs(a - arq))
            x = sync["arquivos"][arq]["corte_in"]
        it, a = pos_arq[arq], sync["arquivos"][arq]
        return it["ini"] + min(max(x, a["corte_in"]), a["corte_out"]) - a["corte_in"]
    return tl, fim_video


def intervalos_dos_blocos(itens, sync, tl, fim_video):
    """Fala (S,E) e visual (V0,V1) de cada bloco."""
    res = []
    por_bloco = {}
    for it in itens:
        por_bloco.setdefault(it["bloco"], []).append(it)
    for b in roteiro.BLOCOS:
        if b["id"] not in por_bloco and not (b["narracao"] and b["id"] in sync["blocos"]):
            continue
        if b["narracao"]:
            info = sync["blocos"][b["id"]]
            s, e = tl(info["ini"]["arq"], info["ini"]["t"]), tl(info["fim"]["arq"], info["fim"]["t"])
        else:
            s, e = por_bloco[b["id"]][0]["ini"], por_bloco[b["id"]][-1]["fim"]
        res.append({"bloco": b, "S": s, "E": max(e, s + 0.5)})
    for k, r in enumerate(res):
        if k == 0:
            r["V0"] = 0.0
        elif r["bloco"]["ato"] != res[k - 1]["bloco"]["ato"]:
            r["V0"] = res[k - 1]["E"] + 0.6
        elif not r["bloco"]["narracao"] or not res[k - 1]["bloco"]["narracao"]:
            r["V0"] = res[k - 1]["E"] + min(0.8, (r["S"] - res[k - 1]["E"]) / 2)
        else:
            r["V0"] = max((res[k - 1]["E"] + r["S"]) / 2, r["S"] - 2.5)
    for k in range(1, len(res)):
        if res[k]["V0"] < res[k - 1]["V0"] + 2.0:
            print(f"AVISO: o bloco {res[k]['bloco']['id']} começa a ser falado antes do bloco anterior terminar "
                  f"(um mesmo áudio cobre os dois?). Ajustado; confira na DECUPAGEM.")
            res[k]["V0"] = res[k - 1]["V0"] + 2.0
    for k, r in enumerate(res):
        r["V1"] = res[k + 1]["V0"] if k + 1 < len(res) else fim_video
    return res


# ------------------------------------------------------------------ 3) shots
class PoolGameplay:
    def __init__(self, gameplay):
        self.trechos = {t: [[x["ini"] + 0.3, x["fim"] - 0.3] for x in g["trechos"] if x["fim"] - x["ini"] > 1.2]
                        for t, g in gameplay.items()}
        self.video = {t: g["video"] for t, g in gameplay.items()}
        self.trechos_orig = {t: [list(x) for x in v] for t, v in self.trechos.items()}

    def disponivel(self, tag):
        return max((b - a for a, b in self.trechos.get(tag, [])), default=0)

    def pegar(self, tag, precisa, alternativas, fator_min=0.7):
        """(tag, video, ini, fim) com 'precisa' segundos de fonte (aceita até 70% disso, ficando mais lento)."""
        for t in [tag] + [x for x in alternativas if x != tag]:
            cands = sorted(self.trechos.get(t, []), key=lambda ab: ab[1] - ab[0], reverse=True)
            for tr in cands:
                if tr[1] - tr[0] >= precisa * fator_min:
                    usa = min(precisa, tr[1] - tr[0])
                    ini = tr[0]
                    tr[0] += usa + 0.5
                    return t, self.video[t], ini, ini + usa
        # tudo usado: reaproveita o maior trecho original
        orig = max(((t, tr) for t in [tag] + alternativas for tr in self.trechos_orig.get(t, [])),
                   key=lambda x: x[1][1] - x[1][0], default=None)
        if not orig:
            return None
        t, (a, b) = orig
        return t, self.video[t], a, min(b, a + precisa)


def desejado(f, blender_cenas, dissolve):
    if f["t"] == "blender":
        d = blender_cenas[f["cena"]]["dur"] - dissolve
        return d, LIMITES["blender"][0], d
    if f["t"] == "ae":
        s = f["s"]
        if f["gerador"] in ELASTICOS:
            return s, s, s * 1.5
        if f["gerador"] == "gerando_mundo":
            return s, s, s
        return s, s * 0.7, s * 1.6
    lo, hi = LIMITES[f["t"]]
    return f.get("s", 7.0), lo, hi


def repartir(fontes, disponivel, ato, dissolve, usados_img):
    """Durações por fonte; acrescenta preenchimento do ato se faltar material."""
    fontes = [dict(f) for f in fontes]
    lims = [desejado(f, roteiro.BLENDER_CENAS, dissolve) for f in fontes]
    soma = sum(d for d, _, _ in lims)
    if soma > disponivel:
        durs = [max(lo, d * disponivel / soma) for d, lo, _ in lims]
        while sum(durs) > disponivel + 0.01 and len(durs) > 1:
            menor = min(range(1, len(durs)), key=lambda i: durs[i] if fontes[i]["t"] != "blender" else 1e9)
            print(f"   (sem tempo para {fontes[menor].get('id') or fontes[menor].get('tag') or fontes[menor].get('cena')} "
                  f"no bloco — removido)")
            del durs[menor], fontes[menor], lims[menor]
            soma = sum(d for d, _, _ in lims)
            durs = [max(lo, d * disponivel / soma) for d, lo, _ in lims]
        if sum(durs) > disponivel:
            durs = [d * disponivel / sum(durs) for d in durs]
        return fontes, durs
    durs = [d for d, _, _ in lims]
    resto = disponivel - sum(durs)
    for _ in range(4):  # cresce até o máximo, proporcionalmente
        cresc = [i for i, (_, _, hi) in enumerate(lims) if durs[i] < hi - 1e-6]
        if resto < 0.05 or not cresc:
            break
        quota = resto / len(cresc)
        for i in cresc:
            add = min(quota, lims[i][2] - durs[i])
            durs[i] += add
            resto -= add
    preench = ATO[ato]["preenchimento"]
    k = 0
    while resto > 2.5:
        if k % 2 == 1 and preench["img"]:
            livres = [i for i in preench["img"] if i not in usados_img] or preench["img"]
            f = {"t": "img", "id": livres[0], "s": 7, "preenchimento": True}
            usados_img.add(livres[0])
        else:
            vizinhas = {x.get("tag") for x in fontes}
            tags = [g for g in preench["gameplay"] if g not in vizinhas] or preench["gameplay"]
            f = {"t": "gameplay", "tag": tags[(k // 2) % len(tags)], "s": 7, "preenchimento": True}
        d = min(8.0, resto)
        if resto - d < 2.5:
            d = resto
        # o preenchimento entra antes da última fonte (que costuma fechar a ideia do bloco)
        pos = max(1, len(fontes) - 1)
        fontes.insert(pos, f)
        durs.insert(pos, d)
        resto -= d
        k += 1
    if resto > 0:
        durs[-1] += resto
    return fontes, durs


def criar_shots(blocos, cfg, gameplay, imagens, base, pool):
    disp = cfg["video"]["dissolve_s"]
    vel = cfg["gameplay"]["velocidade"]
    usados_img = set()
    shots, n = [], 0
    for r in blocos:
        b = r["bloco"]
        fontes, durs = repartir(b["fontes"], r["V1"] - r["V0"], b["ato"], disp, usados_img)
        t = r["V0"]
        for f, d in zip(fontes, durs):
            n += 1
            sh = {"id": f"S{n:03d}", "bloco": b["id"], "ato": b["ato"], "ini": round(t, 3), "fim": round(t + d, 3),
                  "tipo": f["t"], "efeitos": []}
            if f["t"] == "blender":
                sh.update({"cena": f["cena"], "seq": (base / "renders" / f["cena"] / f"{f['cena']}_0001.png").as_posix(),
                           "src_in": 0.0, "vel": 1.0})
                if f["cena"] in ("A4_batalha", "A4_ponte", "A4_casinha_chamas"):
                    sh["efeitos"].append("tremor")
            elif f["t"] == "img":
                usados_img.add(f["id"])
                im = imagens.get(f["id"], {})
                sh.update({"img": f["id"], "arquivo": im.get("arquivo", (base / "imagens" / f"{f['id']}.jpg").as_posix()),
                           "obra": roteiro.IMAGENS[f["id"]]["obra"], "largura": im.get("largura"), "altura": im.get("altura"),
                           "kenburns": {"zoom_in": n % 3 != 0, "dx": [-1, 1, 0][n % 3], "dy": [0, -1, 1][n % 2]}})
                if b["ato"] in (3, 4):
                    sh["efeitos"].append("grao_forte")
            elif f["t"] == "gameplay":
                alts = ATO[b["ato"]]["preenchimento"]["gameplay"]
                precisa = (d + disp) * vel
                got = pool.pegar(f["tag"], precisa, alts)
                if not got:
                    print(f"AVISO: sem gameplay para {f['tag']}")
                    sh.update({"tipo": "vazio"})
                else:
                    tag, video, a, z = got
                    v = max(0.35, min(vel, (z - a) / (d + disp)))
                    sh.update({"tag": tag, "video": video, "src_in": round(a, 3), "src_out": round(z, 3), "vel": round(v, 4)})
            elif f["t"] == "ae":
                sh.update({"gerador": f["gerador"]})
            shots.append(sh)
            t += d
    # dissolve: cada shot invade o próximo
    for k, sh in enumerate(shots):
        sh["dissolve_in"] = 0.0 if k == 0 else disp
        if k + 1 < len(shots):
            sh["fim"] = round(shots[k + 1]["ini"] + disp, 3)
    return shots


# ------------------------------------------------------------------ 4) textos
def criar_textos(blocos, sync, tl):
    eventos = []
    for r in blocos:
        b = r["bloco"]
        if not b["narracao"]:
            continue
        anc = sync["blocos"][b["id"]]["ancoras"]
        ato = ATO[b["ato"]]
        for t in b.get("textos", []):
            linhas = []
            ult = -1
            for ln in t["linhas"]:
                a = anc.get(ln["ancora"])
                if not a:
                    continue
                tt = max(tl(a["arq"], a["t"]) - 0.15, ult + 0.6)
                linhas.append({"texto": ln["texto"], "t": round(tt, 3), "italico": ln.get("italico", False)})
                ult = tt
            if not linhas:
                continue
            eventos.append({"bloco": b["id"], "ato": b["ato"], "ref": t.get("ref") or f"{ato['romano']}  ·  {ato['nome']}",
                            "linhas": linhas, "ini": linhas[0]["t"], "destaque": t.get("destaque", False),
                            "_E": r["E"], "_V1": r["V1"]})
    eventos.sort(key=lambda e: e["ini"])
    for k, e in enumerate(eventos):
        ult = e["linhas"][-1]
        natural = ult["t"] + 2.4 + 0.05 * len(ult["texto"])
        lim = eventos[k + 1]["ini"] - 0.5 if k + 1 < len(eventos) else 1e9
        e["fim"] = round(max(ult["t"] + 1.8, min(natural, lim, e["_V1"] + 0.8, e["_E"] + 3.0)), 3)
        if k + 1 < len(eventos) and e["fim"] > eventos[k + 1]["ini"] - 0.3:
            e["fim"] = round(eventos[k + 1]["ini"] - 0.3, 3)
        del e["_E"], e["_V1"]
    return eventos


# ------------------------------------------------------------------ 5) áudio
def faixa_db(x):
    return 20 * math.log10(max(x, 1e-3))


def criar_audio(itens, sync, blocos, shots, cfg, musicas, base, fim_video):
    au = cfg["audio"]
    narr = [{"arquivo": sync["arquivos"][it["arq"]]["arquivo"], "ini": round(it["ini"], 3),
             "in": sync["arquivos"][it["arq"]]["corte_in"], "out": sync["arquivos"][it["arq"]]["corte_out"]}
            for it in itens if it["tipo"] == "fala"]

    # envelope de ducking (dB relativos)
    falas = sorted((n["ini"], n["ini"] + n["out"] - n["in"]) for n in narr)
    juntas = []
    for a, b in falas:
        if juntas and a - juntas[-1][1] < 2.2:
            juntas[-1][1] = b
        else:
            juntas.append([a, b])
    keys = [(0.0, au["musica_entre_falas_db"])]
    for a, b in juntas:
        keys += [(a - 0.6, au["musica_entre_falas_db"]), (a, au["ducking_db"]),
                 (b, au["ducking_db"]), (b + 0.9, au["musica_entre_falas_db"])]
    silencios = []
    for r in blocos:
        bl = r["bloco"]
        if bl.get("silencio"):
            silencios.append((r["V0"], r["V1"]))
        elif bl.get("silencio_inicio_s"):
            silencios.append((r["V0"], r["V0"] + bl["silencio_inicio_s"] + 1.5))
    keys.sort()

    def duck(t):
        v = keys[0][1]
        for (t0, v0), (t1, v1) in zip(keys, keys[1:]):
            if t0 <= t <= t1:
                v = v0 + (v1 - v0) * ((t - t0) / (t1 - t0) if t1 > t0 else 1)
                break
        else:
            if t > keys[-1][0]:
                v = keys[-1][1]
        for a, b in silencios:
            if a - 1.5 <= t <= b + 2.0:
                k = 1.0
                if t < a:
                    k = (t - (a - 1.5)) / 1.5
                elif t > b:
                    k = 1 - (t - b) / 2.0
                v = v * (1 - k) + (-60) * k
        return v

    # cues de música por ato (atos seguidos com a mesma música viram um cue só)
    cues = []
    for r in blocos:
        ato = r["bloco"]["ato"]
        mid = ATO[ato]["musica"]
        if mid not in musicas and ATO[ato].get("musica_alternativa") in musicas:
            mid = ATO[ato]["musica_alternativa"]   # ex.: Respite não enviada -> usa a alternativa
        if cues and cues[-1]["musica"] == mid:
            cues[-1]["fim"] = r["V1"]
        elif cues and cues[-1]["ato"] == ato:
            cues[-1]["fim"] = r["V1"]
        else:
            cues.append({"musica": mid, "ato": ato, "ini": r["V0"], "fim": r["V1"]})
    xf = 3.0
    camadas = []
    for k, c in enumerate(cues):
        if c["musica"] not in musicas:
            print(f"AVISO: música '{c['musica']}' não tratada (passo 5) — o AE vai deixar um marcador")
        m_info = musicas.get(c["musica"], {})
        inicio_m = m_info.get("inicio", 0.0)            # começa na parte principal da música
        dur_m = m_info.get("dur", 1e9) - inicio_m
        ini = 0.0 if k == 0 else c["ini"] - xf / 2
        fim = fim_video if k == len(cues) - 1 else c["fim"] + xf / 2
        t, parte = ini, 0
        while t < fim - 0.5:
            dur = min(dur_m, fim - t)
            camadas.append({"musica": c["musica"], "arquivo": musicas.get(c["musica"], {}).get("arquivo",
                            (base / "musicas_tratadas" / f"{c['musica']}.wav").as_posix()),
                            "ini": round(t, 3), "fim": round(t + dur, 3), "parte": parte,
                            "inicio_arquivo": inicio_m})
            if t + dur >= fim - 0.01:
                break
            t += dur - 4.0  # próxima volta da música entra com crossfade de 4 s
            parte += 1
    for k, cam in enumerate(camadas):
        a, b = cam["ini"], cam["fim"]
        fade_in = 4.0 if k == 0 else (xf if cam["parte"] == 0 else 4.0)
        fade_out = 7.0 if k == len(camadas) - 1 else (xf if k + 1 < len(camadas) and camadas[k + 1]["parte"] == 0 else 4.0)
        tempos = {a, b, a + fade_in, b - fade_out}
        tempos |= {a + fade_in * i / 5 for i in range(6)} | {b - fade_out * i / 5 for i in range(6)}
        tempos |= {t for t, _ in keys if a < t < b}
        for s0, s1 in silencios:
            tempos |= {s0 - 1.5, s0, s1, s1 + 2.0}
        env = []
        for t in sorted(x for x in tempos if a <= x <= b):
            fade = min(1.0, (t - a) / fade_in if fade_in else 1, (b - t) / fade_out if fade_out else 1)
            env.append((round(t - a, 3), round(max(-60.0, duck(t) + faixa_db(fade)), 2)))
        cam["niveis"] = env

    # SFX
    sfx_dirs = [base / "sfx" / "mc", base / "sfx" / "gerados"]

    def sfx_arquivo(sid):
        for d in sfx_dirs:
            if (d / f"{sid}.wav").exists():
                return (d / f"{sid}.wav").as_posix()
        return (sfx_dirs[0] / f"{sid}.wav").as_posix()
    sfx = []
    for r in blocos:
        bl = r["bloco"]
        for s in bl.get("sfx", []):
            t = (0.0 if s["em"] == "video_inicio" else r["V0"]) + s.get("offset", 0.0)
            sfx.append({"som": s["som"], "arquivo": sfx_arquivo(s["som"]), "ini": round(t, 3), "db": s.get("db", -12),
                        "dur": s.get("dur")})
    primeiro_do_ato = {}
    for r in blocos:
        primeiro_do_ato.setdefault(r["bloco"]["ato"], r)
    for ato, r in primeiro_do_ato.items():
        t_card = 6.5 if ato == 1 else r["V0"]
        # efeitos simples: só um impacto grave e discreto em cada cartão de capítulo
        sfx.append({"som": "boom", "arquivo": sfx_arquivo("boom"), "ini": round(t_card, 3), "db": -13})
    for sh in shots:
        if sh["tipo"] == "blender":
            for off, sid, db in roteiro.BLENDER_CENAS[sh["cena"]]["sons"]:
                if off < sh["fim"] - sh["ini"] - 0.3:
                    sfx.append({"som": sid, "arquivo": sfx_arquivo(sid), "ini": round(sh["ini"] + off, 3), "db": db})
    sfx.sort(key=lambda s: s["ini"])
    return {"narracao": narr, "musica": camadas, "sfx": sfx}


# ------------------------------------------------------------------ 6) cartões e reels
def criar_cartoes(blocos):
    cartoes, vistos = [], set()
    for r in blocos:
        ato = r["bloco"]["ato"]
        if ato in vistos:
            continue
        vistos.add(ato)
        a = ATO[ato]
        ini = 6.5 if ato == 1 else r["V0"] + 0.3
        fim = max(ini + 4.5, r["S"] - 0.3)
        cartoes.append({"ato": ato, "linha": f"CAPÍTULO {a['romano']}", "titulo": a["nome"], "citacao": a["citacao"],
                        "ini": round(ini, 3), "fim": round(fim, 3)})
    return cartoes


def criar_reels(textos, alvo=75):
    escolhidos = [e for e in textos if e["destaque"]]
    total, reels = 0.0, []
    for e in escolhidos:
        a, b = e["ini"] - 2.0, e["fim"] + 1.0
        if total + (b - a) > alvo + 10:
            break
        reels.append({"ini": round(a, 3), "fim": round(b, 3), "texto": " / ".join(l["texto"] for l in e["linhas"])})
        total += b - a
    return reels


# ------------------------------------------------------------------ extração de gameplay
def extrair_gameplay(shots, cfg, base):
    destino = pasta_trabalho(cfg, "gameplay_clips")
    tam = cfg["gameplay"]["crosshair_px"]
    medidas = {}
    for sh in shots:
        if sh["tipo"] != "gameplay":
            continue
        video = sh["video"]
        if video not in medidas:
            medidas[video] = info_video(video)
        w, h, _ = medidas[video]
        saida = destino / f"{sh['id']}_{sh['tag']}.mov"
        a = max(0.0, sh["src_in"] - 0.2)
        if not saida.exists():
            rodar(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{a:.3f}", "-to", f"{sh['src_out'] + 0.2:.3f}",
                   "-i", video, "-an", "-vf", f"delogo=x={w // 2 - tam // 2}:y={h // 2 - tam // 2}:w={tam}:h={tam}",
                   "-c:v", "prores_ks", "-profile:v", "3", "-pix_fmt", "yuv422p10le", saida])
        sh["clip"] = saida.as_posix()
        sh["clip_in"] = round(sh["src_in"] - a, 3)


# ------------------------------------------------------------------ decupagem
def tc(t):
    m, s = divmod(t, 60)
    return f"{int(m):02d}:{s:05.2f}"


def decupagem(edl, destino):
    L = ["# Decupagem — O MUNDO É UM SERVIDOR", "",
         f"Duração: **{tc(edl['duracao'])}**  ·  {len(edl['shots'])} shots  ·  {len(edl['textos'])} frases na tela", ""]
    for ato in roteiro.ATOS:
        L.append(f"## Capítulo {ato['romano']} — {ato['nome']}")
        for c in edl["cartoes"]:
            if c["ato"] == ato["id"]:
                L.append(f"- `{tc(c['ini'])}` **cartão** {c['linha']} — {c['titulo']} — _{c['citacao']}_")
        for sh in edl["shots"]:
            if sh["ato"] != ato["id"]:
                continue
            o = sh.get("cena") or sh.get("obra") or (f"{sh.get('tag')} @ {sh.get('src_in')}s" if sh["tipo"] == "gameplay" else "") \
                or sh.get("gerador", "")
            L.append(f"- `{tc(sh['ini'])}–{tc(sh['fim'])}` [{sh['bloco']}] {sh['tipo']}: {o}")
        for e in edl["textos"]:
            if e["ato"] == ato["id"]:
                L.append(f"  - `{tc(e['ini'])}` ✎ {' / '.join(l['texto'] for l in e['linhas'])}")
        L.append("")
    Path(destino).write_text("\n".join(L), encoding="utf-8")


def main():
    cfg = carregar_config()
    base, sync, gameplay, imagens, musicas = carregar_entradas(cfg)
    alvo = cfg["video"]["duracao_alvo_s"]

    itens = montar_itens(sync, cfg)
    pausas_spec = montar_pausas(itens, cfg)
    pausas = distribuir_folga(itens, pausas_spec, alvo)
    tl, fim_video = colocar(itens, pausas, sync)
    blocos = intervalos_dos_blocos(itens, sync, tl, fim_video)

    pool = PoolGameplay(gameplay)
    shots = criar_shots(blocos, cfg, gameplay, imagens, base, pool)
    textos = criar_textos(blocos, sync, tl)
    audio = criar_audio(itens, sync, blocos, shots, cfg, musicas, base, fim_video)
    cartoes = criar_cartoes(blocos)

    atos = []
    for ato in roteiro.ATOS:
        bs = [r for r in blocos if r["bloco"]["ato"] == ato["id"]]
        if bs:
            atos.append({"id": ato["id"], "nome": ato["nome"], "ini": round(bs[0]["V0"], 3), "fim": round(bs[-1]["V1"], 3),
                         "grade": GRADES[ato["grade"]], "grade_nome": ato["grade"]})

    if "--sem-extrair" not in sys.argv:
        print("Extraindo os trechos de gameplay usados (ProRes 422 HQ, sem crosshair)…")
        extrair_gameplay(shots, cfg, base)

    edl = {
        "versao": 1, "duracao": round(fim_video, 3), "fps": cfg["video"]["fps"],
        "largura": cfg["video"]["largura"], "altura": cfg["video"]["altura"], "aspecto": cfg["video"]["aspecto_cinema"],
        "fontes": cfg["fontes"], "gameplay_escala": cfg["gameplay"]["escala_no_4k"],
        "projeto_aep": (base / "after_effects" / "O_Mundo_e_um_Servidor.aep").as_posix(),
        "render_saida": (base / "render" / "O_Mundo_e_um_Servidor_master.mp4").as_posix(),
        "atos": atos, "shots": shots, "textos": textos, "cartoes": cartoes, "audio": audio,
        "chat": roteiro.CHAT, "reels": criar_reels(textos),
        "mc_texturas": (base / "mc_assets" / "textures" / "block").as_posix(),
        "titulo": {"linha": "SUPERNOVA STUDIO", "titulo": "O MUNDO É UM SERVIDOR"},
        "final": {"linhas": ["O mundo é um servidor.", "Cuide dele."], "assinatura": "SUPERNOVA STUDIO",
                  "arroba": "@ssupernova.studio"},
    }
    salvar_json(base / "edl.json", edl)
    decupagem(edl, base / "DECUPAGEM.md")
    print(f"\nOK -> {base / 'edl.json'}  ({tc(fim_video)}, {len(shots)} shots, {len(textos)} textos)")
    print(f"     {base / 'DECUPAGEM.md'}")


if __name__ == "__main__":
    main()
