# -*- coding: utf-8 -*-
"""Utilidades compartilhadas pelos passos do pipeline."""
import json
import os
import re
import shutil
import subprocess
import sys
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ))

import roteiro  # noqa: E402


def carregar_config(caminho=None):
    caminho = Path(caminho or os.environ.get("MUNDO_CONFIG") or RAIZ / "config.json")
    with open(caminho, encoding="utf-8") as f:
        cfg = json.load(f)
    cfg["_arquivo"] = str(caminho)
    return cfg


def pasta_trabalho(cfg, *sub):
    p = Path(cfg["pastas"]["trabalho"]).joinpath(*sub)
    p.mkdir(parents=True, exist_ok=True)
    return p


def salvar_json(caminho, dados):
    caminho = Path(caminho)
    caminho.parent.mkdir(parents=True, exist_ok=True)
    with open(caminho, "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=2)


def ler_json(caminho):
    with open(caminho, encoding="utf-8") as f:
        return json.load(f)


def exigir(binario):
    if shutil.which(binario) is None:
        sys.exit(f"ERRO: '{binario}' não encontrado no PATH. Instale-o (veja o README).")


def rodar(cmd, capturar=False):
    """Roda um comando; com capturar=True devolve stderr+stdout (ffmpeg escreve no stderr)."""
    print("  $", " ".join(str(c) if " " not in str(c) else f'"{c}"' for c in cmd)[:400])
    r = subprocess.run([str(c) for c in cmd], capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode != 0:
        sys.stderr.write(r.stderr[-4000:])
        raise RuntimeError(f"comando falhou ({r.returncode}): {cmd[0]}")
    return (r.stdout or "") + (r.stderr or "") if capturar else None


def duracao(arquivo):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "default=nw=1:nk=1", str(arquivo)], capture_output=True, text=True)
    try:
        return float(out.stdout.strip())
    except ValueError:
        raise RuntimeError(f"não consegui ler a duração de {arquivo}")


def info_video(arquivo):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                          "stream=width,height,r_frame_rate", "-of", "json", str(arquivo)],
                         capture_output=True, text=True)
    s = json.loads(out.stdout)["streams"][0]
    n, d = s["r_frame_rate"].split("/")
    return int(s["width"]), int(s["height"]), float(n) / float(d)


def normalizar(texto):
    """minúsculas, sem acento, sem pontuação — para comparar fala x roteiro."""
    t = unicodedata.normalize("NFD", texto.lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    t = re.sub(r"[^a-z0-9 ]+", " ", t.replace("’", "'").replace("'", " "))
    return t.split()


def caminho_posix(p):
    return Path(p).as_posix()


def medir_loudness(arquivo):
    """Primeira passada do loudnorm: devolve dict com input_i, input_tp, input_lra, input_thresh, target_offset."""
    out = rodar(["ffmpeg", "-hide_banner", "-nostats", "-i", arquivo, "-af",
                 "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capturar=True)
    bloco = out[out.rfind("{"): out.rfind("}") + 1]
    return json.loads(bloco)


def filtro_loudnorm(medida, alvo_i, alvo_tp, lra=11):
    return (f"loudnorm=I={alvo_i}:TP={alvo_tp}:LRA={lra}:measured_I={medida['input_i']}:"
            f"measured_TP={medida['input_tp']}:measured_LRA={medida['input_lra']}:"
            f"measured_thresh={medida['input_thresh']}:offset={medida['target_offset']}:linear=true")
