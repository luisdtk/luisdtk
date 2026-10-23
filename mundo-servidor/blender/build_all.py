# -*- coding: utf-8 -*-
"""
Gera (e opcionalmente renderiza) as cenas 3D do roteiro.

Uso (no Prompt do Windows, na pasta do projeto):
  "C:\\Program Files\\Blender Foundation\\Blender 4.2\\blender.exe" -b -P blender/build_all.py -- [opções]

Opções (depois do --):
  --cenas A2_tnt,A4_batalha   só essas cenas (padrão: todas)
  --render                    renderiza a animação depois de salvar o .blend
  --preview                   render em 25% da resolução (para conferir rápido)
  --motor CYCLES|EEVEE        sobrepõe o config.json

Saída:  <trabalho>/blender/cenas/<CENA>.blend   e   <trabalho>/renders/<CENA>/<CENA>_0001.png ...
Dica: abra o .blend, ajuste câmera/luz à vontade e renderize de novo pela interface.
"""
import json
import os
import sys
import time

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
sys.path.insert(0, AQUI)
sys.path.insert(0, RAIZ)

import roteiro  # noqa: E402


def args():
    a = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    op = {"cenas": None, "render": False, "preview": False, "motor": None}
    i = 0
    while i < len(a):
        if a[i] == "--cenas":
            op["cenas"] = a[i + 1].split(",")
            i += 1
        elif a[i] == "--render":
            op["render"] = True
        elif a[i] == "--preview":
            op["preview"] = True
        elif a[i] == "--motor":
            op["motor"] = a[i + 1]
            i += 1
        i += 1
    return op


def main():
    op = args()
    with open(os.environ.get("MUNDO_CONFIG") or os.path.join(RAIZ, "config.json"), encoding="utf-8") as fh:
        cfg = json.load(fh)
    trabalho = cfg["pastas"]["trabalho"]
    os.environ["MUNDO_TRABALHO"] = trabalho
    os.environ.setdefault("MUNDO_FONTE_MC", cfg["fontes"].get("minecraft_ttf", ""))
    if op["preview"]:
        os.environ["MUNDO_RES_PCT"] = "25"
    bcfg = dict(cfg["blender"])
    if op["motor"]:
        bcfg["motor"] = op["motor"]

    import cenas  # importa depois de configurar o ambiente
    nomes = op["cenas"] or list(roteiro.BLENDER_CENAS)
    for nome in nomes:
        if nome not in cenas.CENAS:
            print(f"!! cena desconhecida: {nome}")
            continue
        t0 = time.time()
        print(f"\n=== {nome} ===")
        cenas.CENAS[nome](bcfg, roteiro.BLENDER_CENAS[nome]["dur"])
        import mc_lib
        mc_lib.salvar_e_renderizar(os.path.join(trabalho, "blender", "cenas", nome + ".blend"), op["render"])
        print(f"=== {nome} pronto em {time.time() - t0:.0f} s")


if __name__ == "__main__":
    main()
