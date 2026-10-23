# -*- coding: utf-8 -*-
"""
PASSO 0 — Extrai do SEU Minecraft instalado:
  * as texturas originais dos blocos (para o Blender ficar com cara de Minecraft
    mesmo sem resource pack do MCprep);
  * os sons originais (chuva, TNT, zumbi, blocos, flechas...) convertidos para WAV.

Uso:  python pipeline/p00_preparar_assets_minecraft.py
Saída: <trabalho>/mc_assets/textures/block/*.png  e  <trabalho>/sfx/mc/*.wav
"""
import json
import zipfile
from pathlib import Path

from common import carregar_config, pasta_trabalho, exigir, rodar

# id usado no roteiro -> caminhos no índice de assets (o primeiro que existir)
SONS_MC = {
    "chuva":            ["minecraft/sounds/ambient/weather/rain1.ogg", "minecraft/sounds/ambient/weather/rain2.ogg",
                         "minecraft/sounds/ambient/weather/rain3.ogg", "minecraft/sounds/ambient/weather/rain4.ogg"],
    "ovelha":           ["minecraft/sounds/mob/sheep/say1.ogg"],
    "madeira":          ["minecraft/sounds/dig/wood1.ogg"],
    "colocar_madeira":  ["minecraft/sounds/dig/wood2.ogg"],
    "quebrar_madeira":  ["minecraft/sounds/dig/wood3.ogg"],
    "colocar_pedra":    ["minecraft/sounds/dig/stone1.ogg"],
    "colocar_vidro":    ["minecraft/sounds/dig/stone2.ogg"],
    "colocar_terra":    ["minecraft/sounds/dig/gravel1.ogg"],
    "tocha":            ["minecraft/sounds/fire/ignite.ogg"],
    "zumbi":            ["minecraft/sounds/mob/zombie/say1.ogg", "minecraft/sounds/mob/zombie/say2.ogg"],
    "passos":           ["minecraft/sounds/step/grass1.ogg", "minecraft/sounds/step/grass2.ogg",
                         "minecraft/sounds/step/grass3.ogg", "minecraft/sounds/step/grass4.ogg"],
    "pavio":            ["minecraft/sounds/random/fuse.ogg"],
    "explosao":         ["minecraft/sounds/random/explode1.ogg"],
    "lava":             ["minecraft/sounds/liquid/lava.ogg"],
    "fogo":             ["minecraft/sounds/fire/fire.ogg"],
    "caverna":          ["minecraft/sounds/ambient/cave/cave1.ogg"],
    "arco":             ["minecraft/sounds/random/bow.ogg"],
    "flecha_acerta":    ["minecraft/sounds/random/bowhit1.ogg"],
    "dano":             ["minecraft/sounds/damage/hit1.ogg"],
    "armadura":         ["minecraft/sounds/item/armor/equip_leather1.ogg"],
}
# Sons que tocam em sequência (passos, chuva) são concatenados.
CONCATENAR = {"chuva", "passos"}


def achar_jar(raizes):
    """O .jar mais recente do cliente que contenha texturas de bloco."""
    candidatos = []
    for raiz in raizes:
        versoes = Path(raiz) / "versions"
        if versoes.is_dir():
            candidatos += list(versoes.glob("*/*.jar"))
    candidatos.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    for jar in candidatos:
        try:
            with zipfile.ZipFile(jar) as z:
                if "assets/minecraft/textures/block/oak_planks.png" in z.namelist():
                    return jar
        except zipfile.BadZipFile:
            continue
    return None


def achar_indice(raizes):
    """O índice de assets mais recente (assets/indexes/*.json) e a pasta objects ao lado."""
    melhores = []
    for raiz in raizes:
        idx = Path(raiz) / "assets" / "indexes"
        if idx.is_dir():
            melhores += [(p, Path(raiz) / "assets" / "objects") for p in idx.glob("*.json")]
    melhores.sort(key=lambda t: t[0].stat().st_mtime, reverse=True)
    for p, obj in melhores:
        with open(p, encoding="utf-8") as f:
            dados = json.load(f).get("objects", {})
        if "minecraft/sounds/random/explode1.ogg" in dados:
            return dados, obj
    return None, None


def main():
    cfg = carregar_config()
    exigir("ffmpeg")
    raizes = [cfg["pastas"]["minecraft"], str(Path.home() / ".lunarclient" / "offline" / "multiver"),
              str(Path.home() / "AppData" / "Roaming" / ".minecraft")]

    # ---- texturas
    destino_tex = pasta_trabalho(cfg, "mc_assets", "textures", "block")
    jar = achar_jar(raizes)
    if jar:
        print(f"Texturas: {jar}")
        with zipfile.ZipFile(jar) as z:
            n = 0
            for nome in z.namelist():
                if nome.startswith("assets/minecraft/textures/block/") and nome.endswith(".png"):
                    (destino_tex / Path(nome).name).write_bytes(z.read(nome))
                    n += 1
        print(f"  {n} texturas extraídas para {destino_tex}")
    else:
        print("AVISO: nenhum .jar do Minecraft encontrado. Abra o launcher oficial uma vez, ou instale o MCprep "
              "(ele traz um pacote de texturas padrão que o Blender usará automaticamente).")

    # ---- sons
    destino_sfx = pasta_trabalho(cfg, "sfx", "mc")
    indice, objetos = achar_indice(raizes)
    if not indice:
        print("AVISO: índice de assets do Minecraft não encontrado — sons do jogo serão pulados.")
        return
    for sid, caminhos in SONS_MC.items():
        arquivos = []
        for c in caminhos:
            if c in indice:
                h = indice[c]["hash"]
                arquivos.append(objetos / h[:2] / h)
                if sid not in CONCATENAR:
                    break
        if not arquivos:
            print(f"  (sem som para '{sid}')")
            continue
        saida = destino_sfx / f"{sid}.wav"
        if len(arquivos) == 1:
            rodar(["ffmpeg", "-y", "-loglevel", "error", "-i", arquivos[0], "-ar", "48000", "-ac", "2", saida])
        else:
            entradas = []
            for a in arquivos:
                entradas += ["-i", a]
            filtro = "".join(f"[{i}:a]" for i in range(len(arquivos))) + f"concat=n={len(arquivos)}:v=0:a=1"
            rodar(["ffmpeg", "-y", "-loglevel", "error", *entradas, "-filter_complex", filtro,
                   "-ar", "48000", "-ac", "2", saida])
        print(f"  som '{sid}' -> {saida.name}")


if __name__ == "__main__":
    main()
