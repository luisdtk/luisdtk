# -*- coding: utf-8 -*-
"""
PASSO 4 — Baixa as pinturas / imagens históricas em alta resolução do Wikimedia
Commons e CONFERE a licença de cada uma (só aceita domínio público / CC0).

Saída: <trabalho>/imagens/<id>.jpg  +  imagens.json  +  CREDITOS_IMAGENS.txt
Uso:   python pipeline/p04_baixar_imagens.py
Para trocar uma imagem: edite "arquivo"/"busca" em IMAGENS no roteiro.py, apague o
.jpg correspondente e rode de novo.
"""
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

from common import carregar_config, pasta_trabalho, salvar_json, roteiro

API = "https://commons.wikimedia.org/w/api.php"
UA = "SupernovaStudio-MundoServidor/1.0 (video essay; contato via Instagram @ssupernova.studio)"
LARGURA_MAX = 6000
LARGURA_MIN = 1800
LICENCAS_OK = re.compile(r"(public domain|^pd\b|pd-|cc0|no restrictions)", re.I)


def api(**params):
    params.update({"format": "json", "formatversion": "2"})
    req = urllib.request.Request(API + "?" + urllib.parse.urlencode(params), headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def info(titulos):
    d = api(action="query", titles="|".join(titulos), prop="imageinfo",
            iiprop="url|size|extmetadata|mime", iiurlwidth=LARGURA_MAX)
    return [p for p in d.get("query", {}).get("pages", []) if "imageinfo" in p]


def licenca_ok(ii):
    meta = ii.get("extmetadata", {})
    textos = " ".join(str(meta.get(k, {}).get("value", "")) for k in ("LicenseShortName", "License", "UsageTerms"))
    return bool(LICENCAS_OK.search(textos)), re.sub("<[^>]+>", "", textos).strip()[:120]


def candidato(pagina):
    ii = pagina["imageinfo"][0]
    ok, lic = licenca_ok(ii)
    if not ok or not ii.get("mime", "").startswith("image/") or ii.get("width", 0) < LARGURA_MIN:
        return None
    meta = ii.get("extmetadata", {})
    autor = re.sub("<[^>]+>", "", meta.get("Artist", {}).get("value", "")).strip()
    return {"titulo": pagina["title"], "url": ii.get("thumburl") or ii["url"], "largura": ii["width"],
            "altura": ii["height"], "licenca": lic, "autor": autor[:120],
            "pagina": ii.get("descriptionurl", "")}


def escolher(spec):
    if spec.get("arquivo"):
        for p in info(["File:" + spec["arquivo"]]):
            c = candidato(p)
            if c:
                return c
    d = api(action="query", list="search", srnamespace=6, srsearch=spec["busca"] + " filetype:bitmap", srlimit=15)
    titulos = [r["title"] for r in d.get("query", {}).get("search", [])]
    melhores = [c for c in (candidato(p) for p in info(titulos)) if c] if titulos else []
    melhores.sort(key=lambda c: -(c["largura"] * c["altura"]))
    # privilegia a ordem de relevância da busca entre os 3 maiores
    return melhores[0] if melhores else None


def baixar(url, destino):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=180) as r, open(destino, "wb") as f:
        while True:
            bloco = r.read(1 << 20)
            if not bloco:
                break
            f.write(bloco)


def main():
    cfg = carregar_config()
    pasta = pasta_trabalho(cfg, "imagens")
    indice_path = pasta / "imagens.json"
    indice = json.loads(indice_path.read_text(encoding="utf-8")) if indice_path.exists() else {}
    falhas = []
    for iid in roteiro.todos_os_ids_de_imagem():
        spec = roteiro.IMAGENS[iid]
        destino = pasta / f"{iid}.jpg"
        if destino.exists() and iid in indice:
            continue
        print(f"[{iid}] {spec['obra']}")
        try:
            c = escolher(spec)
        except Exception as e:  # rede, API
            c = None
            print("   erro:", e)
        if not c:
            falhas.append(iid)
            print("   ✗ nada em domínio público encontrado — troque 'busca' no roteiro.py")
            continue
        baixar(c["url"], destino)
        c.update({"obra": spec["obra"], "arquivo": destino.as_posix()})
        indice[iid] = c
        print(f"   ✓ {c['titulo']}  ({c['largura']}x{c['altura']}, {c['licenca']})")
        time.sleep(1.0)  # gentileza com a API
    salvar_json(indice_path, indice)
    creditos = ["IMAGENS — todas de domínio público (Wikimedia Commons)\n"]
    for iid, c in indice.items():
        creditos.append(f"{c['obra']}\n  {c['titulo']}\n  Licença: {c['licenca']}\n  {c['pagina']}\n")
    (pasta / "CREDITOS_IMAGENS.txt").write_text("\n".join(creditos), encoding="utf-8")
    print(f"\nOK -> {len(indice)} imagens em {pasta}")
    if falhas:
        print("Faltaram:", ", ".join(falhas))


if __name__ == "__main__":
    main()
