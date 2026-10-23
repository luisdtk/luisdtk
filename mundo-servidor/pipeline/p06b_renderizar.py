# -*- coding: utf-8 -*-
"""
PASSO 6b — MONTA E RENDERIZA O VÍDEO (substitui o After Effects; sem 3D).

Lê o edl.json (passo 6) e gera o master de 10:00 em 4K:
  1. cada shot vira um clipe 3840x2160 30 fps:
       gameplay  -> câmera lenta 50%, zoom de 215% (esconde vida/itens nas barras), crosshair removido
       pinturas  -> zoom lento suave (Ken Burns) com movimento sub-pixel
       cartões / chat do Minecraft / título / final -> desenhados quadro a quadro
  2. cada ato: dissolves de 1,2 s entre shots + grade do ato (LUT tritone vermelho/dourado),
     glow suave, vinheta, grão + frases na tela (serifadas, pequenas) + cartão de capítulo
  3. junta os atos com dissolve, barras 2.39:1, marca d'água, fade final
  4. mix de áudio: narração + músicas com ducking + efeitos simples
Saída: <trabalho>/render/O_Mundo_e_um_Servidor_master.mp4  (depois rode o p07 para o MP4 final e o Reels)

Uso:  python pipeline/p06b_renderizar.py [--preview] [--atos 1,2] [--refazer]
  --preview  renderiza em 1280x720 (rápido, para conferir)
  --atos     só esses atos (o resto é reaproveitado se já existir)
  --refazer  ignora clipes já renderizados
Requer: pip install pillow numpy
"""
import math
import os
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

from common import carregar_config, ler_json, exigir, info_video

PREVIEW = "--preview" in sys.argv
REFAZER = "--refazer" in sys.argv
W, H = (1280, 720) if PREVIEW else (3840, 2160)
K = W / 3840.0                    # fator de escala de tudo que é medido em pixels 4K
FPS = 30
BARRA = round((H - W / 2.39) / 2)
CRF = "18" if PREVIEW else "12"
PRESET = "veryfast" if PREVIEW else "medium"


# ======================================================================= utilidades
def px(v):
    return int(round(v * K))


def rodar(cmd, cwd=None, entrada=None):
    r = subprocess.run([str(c) for c in cmd], cwd=cwd, input=entrada, capture_output=True)
    if r.returncode != 0:
        sys.stderr.write(r.stderr.decode("utf-8", "replace")[-3000:])
        raise RuntimeError(f"ffmpeg falhou: {' '.join(str(c) for c in cmd)[:300]}")


def suave(x):
    x = min(1.0, max(0.0, x))
    return x * x * (3 - 2 * x)


def achar_fonte(cands):
    for c in cands:
        if c and Path(c).is_file():
            return str(c)
    raise SystemExit(f"Nenhuma fonte encontrada entre: {cands}")


def fontes(cfg):
    win = Path(os.environ.get("WINDIR", "C:/Windows")) / "Fonts"
    loc = Path.home() / "AppData/Local/Microsoft/Windows/Fonts"
    lin = Path("/usr/share/fonts/truetype")
    f = cfg["fontes"]
    def em(*nomes):
        out = []
        for n in nomes:
            out += [win / n, loc / n]
        return out
    return {
        "serifa": achar_fonte([f.get("serifa_ttf")] + em("EBGaramond-Regular.ttf", "EBGaramond12-Regular.ttf",
                              "CormorantGaramond-Regular.ttf", "times.ttf", "georgia.ttf")
                             + [lin / "liberation/LiberationSerif-Regular.ttf", lin / "dejavu/DejaVuSerif.ttf"]),
        "italico": achar_fonte([f.get("serifa_italico_ttf")] + em("EBGaramond-Italic.ttf", "EBGaramond12-Italic.ttf",
                               "timesi.ttf", "georgiai.ttf")
                              + [lin / "liberation/LiberationSerif-Italic.ttf", lin / "dejavu/DejaVuSerif.ttf"]),
        "versalete": achar_fonte([f.get("versalete_ttf")] + em("CormorantGaramond-Medium.ttf", "EBGaramond-Regular.ttf",
                                 "times.ttf") + [lin / "liberation/LiberationSerif-Regular.ttf"]),
        "mc": achar_fonte([f.get("minecraft_ttf")] + em("Monocraft.ttf", "Monocraft.otf", "Minecraftia-Regular.ttf",
                          "consola.ttf", "cour.ttf") + [lin / "dejavu/DejaVuSansMono.ttf",
                                                      lin / "liberation/LiberationMono-Regular.ttf"]),
    }


class Saida:
    """Recebe quadros RGB (PIL ou numpy) e grava um clipe com o ffmpeg."""

    def __init__(self, caminho):
        self.p = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                                   "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", PRESET,
                                   "-crf", CRF, "-pix_fmt", "yuv420p", str(caminho)], stdin=subprocess.PIPE)

    def quadro(self, img):
        self.p.stdin.write(img.tobytes() if isinstance(img, Image.Image) else np.ascontiguousarray(img).tobytes())

    def fechar(self):
        self.p.stdin.close()
        if self.p.wait() != 0:
            raise RuntimeError("ffmpeg falhou ao gravar quadros")


def texto_img(txt, fonte, tam, cor=(245, 242, 235), tracking=0.0, sombra=True):
    """Texto como imagem RGBA (com sombra suave para contraste)."""
    f = ImageFont.truetype(fonte, max(8, int(tam)))
    larg = 0
    for ch in txt:
        larg += f.getlength(ch) + tracking
    asc, desc = f.getmetrics()
    m = int(tam * 0.6)
    img = Image.new("RGBA", (int(larg + 2 * m), asc + desc + 2 * m), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    x = m
    for ch in txt:
        d.text((x, m), ch, font=f, fill=cor + (255,))
        x += f.getlength(ch) + tracking
    if sombra:
        a = img.split()[3].filter(ImageFilter.GaussianBlur(max(1, tam * 0.25)))
        sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
        sh.putalpha(a.point(lambda v: int(v * 0.55)))
        sh.alpha_composite(img)
        img = sh
    return img


def colar(base, img, cx, cy, alpha=1.0, esquerda=False):
    if alpha <= 0.003:
        return
    if alpha < 0.999:
        img = img.copy()
        img.putalpha(img.split()[3].point(lambda v: int(v * alpha)))
    x = int(cx if esquerda else cx - img.width / 2)
    base.alpha_composite(img, (max(0, x), max(0, int(cy - img.height / 2))) if x >= 0 else (0, int(cy - img.height / 2)))


def fade(t, t0, t1, ent=1.0, sai=0.9):
    if t < t0 or t > t1:
        return 0.0
    return suave(min((t - t0) / ent if ent else 1, (t1 - t) / sai if sai else 1, 1.0))


def gradiente(cor_centro, cor_borda, cx=0.5, cy=0.45):
    y, x = np.mgrid[0:H, 0:W]
    d = np.sqrt(((x / W - cx) * 1.6) ** 2 + ((y / H - cy) * 1.2) ** 2)
    k = np.clip(d / 0.9, 0, 1)[..., None]
    arr = np.array(cor_centro) * (1 - k) + np.array(cor_borda) * k
    return Image.fromarray(arr.astype(np.uint8), "RGB").convert("RGBA")


# ======================================================================= shots
def shot_gameplay(sh, edl, cfg, saida, dur):
    src = sh.get("clip") or sh["video"]
    ofs = sh.get("clip_in", 0.0) if sh.get("clip") else sh["src_in"]
    w, h, _ = info_video(src)
    esc = edl["gameplay_escala"] / 100.0 * (W / 1920.0) * (1920.0 / w)
    sw, shh = int(round(w * esc / 2) * 2), int(round(h * esc / 2) * 2)
    tam = int(cfg["gameplay"]["crosshair_px"] * w / 1920)
    # zoom lento extra de 3,5% ao longo do shot (respiração da imagem)
    vf = (f"delogo=x={w // 2 - tam // 2}:y={h // 2 - tam // 2}:w={tam}:h={tam},"
          f"setpts=PTS/{sh['vel']},fps={FPS},scale={sw}:{shh}:flags=lanczos,"
          f"crop={W}:{H}:(iw-{W})/2:(ih-{H})/2,"
          f"scale=w='{W}*(1+0.035*t/{dur:.3f})':h=-2:eval=frame:flags=bicubic,crop={W}:{H},"
          f"unsharp=5:5:{0.5 if not PREVIEW else 0.2},format=yuv420p")
    rodar(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{ofs:.3f}", "-i", src, "-an", "-vf", vf,
           "-frames:v", int(round(dur * FPS)), "-c:v", "libx264", "-preset", PRESET, "-crf", CRF, saida])


def shot_imagem(sh, saida, dur):
    if not Path(sh["arquivo"]).exists():
        return shot_falta(f"imagem {sh['img']}", saida, dur)
    im = Image.open(sh["arquivo"]).convert("RGB")
    alvo_h = H - 2 * BARRA
    cobre = max(W / im.width, alvo_h / im.height) * 1.04
    # reduz a fonte para no máx. 1,3x o necessário (mais rápido, mesma nitidez)
    lim = cobre * 1.12 * 1.3
    if lim < 1:
        im = im.resize((int(im.width * lim), int(im.height * lim)), Image.LANCZOS)
        cobre /= lim
    kb = sh["kenburns"]
    z0, z1 = (1.0, 1.12) if kb["zoom_in"] else (1.12, 1.0)
    n = int(round(dur * FPS))
    out = Saida(saida)
    for i in range(n):
        u = suave(i / max(1, n - 1)) * 0.85 + (i / max(1, n - 1)) * 0.15
        z = cobre * (z0 + (z1 - z0) * u)
        cw, ch = W / z, H / z
        cx = im.width / 2 + kb["dx"] * im.width * 0.018 * (u - 0.5) * 2
        cy = im.height / 2 + kb["dy"] * im.height * 0.012 * (u - 0.5) * 2
        x0 = min(max(0, cx - cw / 2), max(0, im.width - cw))
        y0 = min(max(0, cy - ch / 2), max(0, im.height - ch))
        out.quadro(im.transform((W, H), Image.EXTENT, (x0, y0, x0 + cw, y0 + ch), Image.BICUBIC))
    out.fechar()


def shot_falta(nome, saida, dur):
    img = Image.new("RGBA", (W, H), (20, 5, 5, 255))
    colar(img, texto_img(f"FALTA: {nome}", FONTES["mc"], px(50), (255, 110, 110)), W / 2, H / 2)
    rgb = img.convert("RGB")
    out = Saida(saida)
    for _ in range(int(round(dur * FPS))):
        out.quadro(rgb)
    out.fechar()


# ---------- elementos desenhados (antes eram precomps do After Effects)
def chat_linha(nome, msg, tam, cor_msg=(255, 255, 255)):
    cor_nome = (255, 255, 255)
    if nome.startswith("§9"):
        cor_nome, nome = (85, 85, 255), nome[2:]
    elif nome.startswith("§c"):
        cor_nome, nome = (255, 85, 85), nome[2:]
    f = ImageFont.truetype(FONTES["mc"], tam)
    a = f"<{nome}> "
    la = f.getlength(a)
    img = Image.new("RGBA", (int(la + f.getlength(msg) + tam), int(tam * 1.4)), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    s = max(1, tam // 8)
    for (dx, dy, c) in ((s, s, (40, 40, 40)), (0, 0, None)):   # sombra dura do Minecraft
        d.text((dx, dy), a, font=f, fill=c or cor_nome)
        d.text((la + dx, dy), msg, font=f, fill=c or cor_msg)
    return img


def fundo_chat():
    return gradiente((60, 10, 8), (6, 2, 2), cx=0.35, cy=0.4)


def painel(img, x, y, w, h, alpha=115):
    ov = Image.new("RGBA", (int(w), int(h)), (0, 0, 0, alpha))
    img.alpha_composite(ov, (int(x), int(y)))


def gerador(nome, edl):
    chat = edl["chat"]
    tam_mc = px(64)

    if nome == "gerando_mundo":
        terra = Path(edl.get("mc_texturas", "")) / "dirt.png"
        if terra.exists():
            t = Image.open(terra).convert("RGB").resize((px(160), px(160)), Image.NEAREST)
            bg = Image.new("RGB", (W, H))
            for x in range(0, W, t.width):
                for y in range(0, H, t.height):
                    bg.paste(t, (x, y))
            bg = Image.eval(bg, lambda v: int(v * 0.3)).convert("RGBA")
        else:
            bg = Image.new("RGBA", (W, H), (40, 28, 18, 255))
        t1 = texto_img("Gerando mundo", FONTES["mc"], px(64), sombra=False)

        def f(t, dur):
            img = bg.copy()
            colar(img, t1, W / 2, H / 2 - px(40), fade(t, 1.4, dur, 0.6, 0.6))
            p = min(100, int(max(0, (t - 1.8)) / max(0.1, dur - 2.6) * 100))
            msg = ("Construindo terreno " if p < 60 else "Gerando estruturas " if p < 95 else "Pronto ") + f"{p}%"
            colar(img, texto_img(msg, FONTES["mc"], px(48), (190, 190, 190), sombra=False), W / 2, H / 2 + px(60),
                  fade(t, 1.8, dur, 0.6, 0.6))
            if t < 1.2:
                img = Image.blend(Image.new("RGBA", (W, H), (0, 0, 0, 255)), img, t / 1.2)
            return img
        return f

    if nome == "titulo":
        bg = gradiente((44, 12, 8), (4, 2, 2))
        a = texto_img(edl["titulo"]["linha"], FONTES["versalete"], px(38), (215, 205, 185), tracking=px(30))
        tt = texto_img(edl["titulo"]["titulo"], FONTES["serifa"], px(150), tracking=px(14))
        brilho = tt.filter(ImageFilter.GaussianBlur(px(30)))

        def f(t, dur):
            img = bg.copy()
            colar(img, a, W / 2, H / 2 - px(150), 0.75 * fade(t, 0.8, dur - 0.5, 1.0, 1.0))
            al = fade(t, 2.0, dur - 0.5, 1.8, 1.4)
            colar(img, brilho, W / 2, H / 2 + px(40), al * 0.6)
            colar(img, tt, W / 2, H / 2 + px(40) + px(14) * (1 - suave((t - 2.0) / 2.0)), al)
            return img
        return f

    if nome == "final":
        l1 = texto_img(edl["final"]["linhas"][0], FONTES["serifa"], px(96))
        l2 = texto_img(edl["final"]["linhas"][1], FONTES["italico"], px(96))
        sg = texto_img(edl["final"]["assinatura"], FONTES["versalete"], px(44), (215, 205, 185), tracking=px(40))
        ar = texto_img(edl["final"]["arroba"], FONTES["serifa"], px(34), (180, 175, 165))

        def f(t, dur):
            img = Image.new("RGBA", (W, H), (0, 0, 0, 255))
            colar(img, l1, W / 2, H / 2 - px(30), fade(t, 2.0, dur - 5.5, 1.6, 1.6))
            colar(img, l2, W / 2, H / 2 + px(90), fade(t, 4.6, dur - 5.5, 1.6, 1.6))
            colar(img, sg, W / 2, H / 2 + px(10), 0.85 * fade(t, dur - 5.0, dur - 0.6, 1.0, 0.8))
            colar(img, ar, W / 2, H / 2 + px(90), 0.7 * fade(t, dur - 4.3, dur - 0.6, 1.0, 0.8))
            return img
        return f

    if nome in ("chat_rolando", "chat_faccoes"):
        linhas = chat["rolando" if nome == "chat_rolando" else "faccoes"]
        imgs = [chat_linha(n, m, tam_mc) for n, m in linhas]
        bg = fundo_chat()
        x, y_base, lh = px(760), px(1450), tam_mc * 1.35

        def f(t, dur):
            img = bg.copy()
            painel(img, x - px(30), px(520), px(2380), px(1060))
            passo = (dur - 0.9) / (len(imgs) + 1)
            vis = [i for i in range(len(imgs)) if t >= 0.4 + i * passo]
            for k, i in enumerate(reversed(vis)):
                yy = y_base - k * lh
                if yy > px(540):
                    colar(img, imgs[i], x, yy, min(1, (t - 0.4 - i * passo) / 0.12), esquerda=True)
            return img
        return f

    if nome == "chat_destaque":
        linhas = chat["rolando"]
        imgs = [chat_linha(n, m, tam_mc) for n, m in linhas]
        i_dst = next(i for i, (n, m) in enumerate(linhas) if m == chat["destaque"])
        i_calma = next(i for i, (n, m) in enumerate(linhas) if m == chat["calma"])
        verm = chat_linha(linhas[i_dst][0], linhas[i_dst][1], tam_mc, (255, 70, 55))
        glow = verm.filter(ImageFilter.GaussianBlur(px(18)))
        fixada = texto_img("[FIXADA]", FONTES["mc"], px(44), (255, 170, 0), sombra=False)
        bg = fundo_chat()
        x, y_base, lh, topo, td = px(760), px(1450), tam_mc * 1.35, px(640), 1.4
        n = len(imgs)

        def f(t, dur):
            img = bg.copy()
            painel(img, x - px(30), px(520), px(2380), px(1060))
            for i in range(n):
                yy = y_base - (n - 1 - i) * lh
                if i == i_dst:
                    u = suave((t - td) / 1.2)
                    yy = yy + (topo - yy) * u
                    s = 1 + 0.18 * u
                    lin = verm if t > td else imgs[i]
                    if s != 1:
                        lin = lin.resize((int(lin.width * s), int(lin.height * s)), Image.BICUBIC)
                    if t > td:
                        g = glow.resize(lin.size)
                        colar(img, g, x, yy, min(1, (t - td) / 1.5) * 0.9, esquerda=True)
                    colar(img, lin, x, yy, 1, esquerda=True)
                elif i == i_calma:
                    u = suave((t - td - 0.6) / max(0.1, dur - 2.5 - td))
                    colar(img, imgs[i], x, yy + px(900) * u, 1 - u, esquerda=True)
                elif yy > px(540):
                    colar(img, imgs[i], x, yy, 1, esquerda=True)
            if t > td + 1.0:
                al = min(1, (t - td - 1.0) / 0.6)
                colar(img, fixada, x, topo - px(95), al, esquerda=True)
                reac = int(12 + (48700 - 12) * suave((t - td - 1) / max(0.1, dur - td - 1)))
                colar(img, texto_img(f"+{reac} reações", FONTES["mc"], px(40), (255, 85, 85), sombra=False),
                      x + px(1650), topo - px(95), al, esquerda=True)
            return img
        return f

    if nome == "chat_split":
        lados = [("chat que o sul vê", chat["sul"], px(180)), ("chat que o norte vê", chat["norte"], W / 2 + px(120))]
        prep = [(texto_img(c, FONTES["versalete"], px(40), (215, 190, 175), tracking=px(25)),
                 [chat_linha(n, m, px(52)) for n, m in ls], x0) for c, ls, x0 in lados]
        bg = fundo_chat()
        d_ = ImageDraw.Draw(bg)
        d_.rectangle([W / 2 - px(2), BARRA + px(100), W / 2 + px(2), H - BARRA - px(100)], fill=(180, 40, 25, 255))

        def f(t, dur):
            img = bg.copy()
            for k, (cab, ims, x0) in enumerate(prep):
                colar(img, cab, x0 + px(760), px(470), 0.8 * fade(t, 0.3, dur, 0.8, 0.5))
                painel(img, x0 - px(30), px(540), px(1580), px(1040))
                passo = (dur - 1.2) / (len(ims) + 1)
                vis = [i for i in range(len(ims)) if t >= 0.6 + k * 0.35 + i * passo]
                for j, i in enumerate(reversed(vis)):
                    colar(img, ims[i], x0, px(1440) - j * px(52) * 1.35, 1, esquerda=True)
            return img
        return f

    raise ValueError(f"gerador desconhecido: {nome}")


def shot_gerado(sh, edl, saida, dur):
    f = gerador(sh["gerador"], edl)
    out = Saida(saida)
    for i in range(int(round(dur * FPS))):
        out.quadro(f(i / FPS, dur).convert("RGB"))
    out.fechar()


# ======================================================================= grade (LUT por ato)
def escrever_lut(g, caminho, n=33):
    """Tritone (sombras/meios/altas) misturado com o original + brilho/contraste -> .cube"""
    sh, md, hi = (np.array(g[k]) for k in ("sombras", "meios", "altas"))
    mix = g["mistura"] / 100.0
    linhas = [f"LUT_3D_SIZE {n}"]
    for b in range(n):
        for gg in range(n):
            for r in range(n):
                c = np.array([r, gg, b]) / (n - 1)
                lum = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
                tri = sh + (md - sh) * (lum / 0.5) if lum < 0.5 else md + (hi - md) * ((lum - 0.5) / 0.5)
                o = tri * (1 - mix) + c * mix
                o = (o - 0.5) * (1 + g["contraste"] / 100.0) + 0.5 + g["brilho"] / 200.0
                o = np.clip(o, 0, 1)
                linhas.append(f"{o[0]:.5f} {o[1]:.5f} {o[2]:.5f}")
    Path(caminho).write_text("\n".join(linhas), encoding="ascii")


# ======================================================================= textos (drawtext)
def esc(caminho):
    return str(caminho).replace("\\", "/").replace(":", "\\:").replace("'", "\\'")


def drawtext(arqtxt, fonte, tam, y, a, b, cor="white", alpha_max=1.0, subida=10):
    alpha = (f"{alpha_max}*if(lt(t,{a:.3f}),0,if(lt(t,{a + 1.0:.3f}),(t-{a:.3f})/1.0,"
             f"if(lt(t,{b - 0.9:.3f}),1,if(lt(t,{b:.3f}),({b:.3f}-t)/0.9,0))))")
    yy = f"{y:.0f}+{px(subida)}*max(0,1-(t-{a:.3f})/1.3)"
    return (f"drawtext=fontfile='{esc(fonte)}':textfile='{esc(arqtxt)}':fontsize={tam}:fontcolor={cor}:"
            f"x=(w-text_w)/2:y='{yy}':alpha='{alpha}':shadowcolor=black@0.6:shadowx={max(1, px(3))}:"
            f"shadowy={max(1, px(3))}:enable='between(t,{a:.3f},{b:.3f})'")


def filtros_textos(edl, ato, base, pasta_txt):
    fs, k = [], 0

    def txt(s):
        nonlocal k
        k += 1
        p = pasta_txt / f"a{ato['id']}_{k}.txt"
        p.write_text(s, encoding="utf-8")
        return p
    tam = px(56)
    for e in edl["textos"]:
        if e["ato"] != ato["id"]:
            continue
        a, b = e["ini"] - base, e["fim"] - base
        n = len(e["linhas"])
        entre = tam * 1.45
        y0 = H * 0.43 - (n - 1) * entre * 0.5 - tam / 2
        fs.append(drawtext(txt(e["ref"]), FONTES["serifa"], tam, y0, a, b, alpha_max=0.92))
        for i, ln in enumerate(e["linhas"]):
            fs.append(drawtext(txt(ln["texto"]), FONTES["italico"] if ln.get("italico") else FONTES["serifa"],
                               tam, y0 + entre * (i + 1), ln["t"] - base, b))
    for c in edl["cartoes"]:
        if c["ato"] != ato["id"]:
            continue
        a, b = c["ini"] - base, c["fim"] - base
        fs.append(f"drawbox=x=0:y=0:w=iw:h=ih:color=black@0.62:t=fill:enable='between(t,{a + 0.6:.3f},{b - 0.6:.3f})'")
        fs.append(drawtext(txt(c["linha"]), FONTES["versalete"], px(40), H / 2 - px(155), a + 0.3, b, cor="0xD9C8B3",
                           alpha_max=0.85))
        fs.append(drawtext(txt(c["titulo"]), FONTES["serifa"], px(118), H / 2 - px(60), a + 0.7, b))
        fs.append(drawtext(txt(c["citacao"]), FONTES["italico"], px(54), H / 2 + px(100), a + 1.6, b, cor="0xE0DBD0",
                           alpha_max=0.9))
    return fs


# ======================================================================= montagem
def montar_ato(ato, shots, edl, trab, luts, pasta_txt):
    lista = [s for s in shots if s["ato"] == ato["id"]]
    base = ato["ini"]
    saida = trab / f"ato{ato['id']}.mp4"
    entradas, fc = [], []
    for s in lista:
        entradas += ["-i", s["_clip"]]
    rot = "[0:v]"
    for i in range(1, len(lista)):
        off = lista[i]["ini"] - base
        d = lista[i]["dissolve_in"]
        fc.append(f"{rot}[{i}:v]xfade=transition=fade:duration={d:.3f}:offset={off:.3f}[x{i}]")
        rot = f"[x{i}]"
    vig = 0.35 + 0.5 * ato["grade"]["vinheta"] / 100
    graos = {1: 5, 2: 6, 3: 8, 4: 10, 5: 5}[ato["id"]]
    glow_r = max(2, px(28))
    efeitos = [f"lut3d=file='{esc(luts[ato['id']])}'",
               "split[g1][g2];[g2]gblur=sigma=%d,format=yuv420p[g3];[g1][g3]blend=all_mode=screen:all_opacity=0.18" % glow_r,
               f"vignette=angle={vig:.3f}",
               f"noise=alls={graos}:allf=t"]
    efeitos += filtros_textos(edl, ato, base, pasta_txt)
    fc.append(f"{rot}{','.join(efeitos)},format=yuv420p[v]")
    script = trab / f"ato{ato['id']}_filtro.txt"
    script.write_text(";".join(fc), encoding="utf-8")
    dur = lista[-1]["fim"] - base
    rodar(["ffmpeg", "-y", "-loglevel", "error", *entradas, "-filter_complex_script", script, "-map", "[v]",
           "-t", f"{dur:.3f}", "-r", FPS, "-c:v", "libx264", "-preset", PRESET, "-crf", CRF, saida])
    return saida


def expr_envelope(niveis, ini):
    """Lista [(t_rel, dB)] -> expressão de ganho linear para o filtro volume (t absoluto)."""
    pts = [(ini + t, 10 ** (db / 20.0)) for t, db in niveis]
    if not pts:
        return "1"
    e = f"{pts[-1][1]:.5f}"
    for (t0, v0), (t1, v1) in reversed(list(zip(pts, pts[1:]))):
        if t1 - t0 < 1e-4:
            continue
        e = f"if(lt(t,{t1:.3f}),{v0:.5f}+({v1 - v0:.5f})*(t-{t0:.3f})/{t1 - t0:.3f},{e})"
    return f"if(lt(t,{pts[0][0]:.3f}),{pts[0][1]:.5f},{e})"


def mix_audio(edl, trab):
    au = edl["audio"]
    entradas, fc, rotulos = [], [], []
    k = 0
    for n in au["narracao"]:
        if not Path(n["arquivo"]).exists():
            print("  (falta narração)", n["arquivo"])
            continue
        entradas += ["-i", n["arquivo"]]
        ms = int(n["ini"] * 1000)
        fc.append(f"[{k}:a]atrim=start={n['in']:.3f}:end={n['out']:.3f},asetpts=PTS-STARTPTS,"
                  f"aformat=sample_rates=48000:channel_layouts=stereo,adelay={ms}|{ms}[n{k}]")
        rotulos.append(f"[n{k}]")
        k += 1
    for m in au["musica"]:
        if not Path(m["arquivo"]).exists():
            print("  (falta música)", m["arquivo"])
            continue
        entradas += ["-i", m["arquivo"]]
        ms = int(m["ini"] * 1000)
        i0 = m.get("inicio_arquivo", 0.0)
        fc.append(f"[{k}:a]atrim=start={i0:.3f}:end={i0 + m['fim'] - m['ini']:.3f},asetpts=PTS-STARTPTS,"
                  f"aformat=sample_rates=48000:channel_layouts=stereo,adelay={ms}|{ms},"
                  f"volume='{expr_envelope(m['niveis'], m['ini'])}':eval=frame[m{k}]")
        rotulos.append(f"[m{k}]")
        k += 1
    for s in au["sfx"]:
        if not Path(s["arquivo"]).exists():
            continue
        entradas += ["-i", s["arquivo"]]
        ms = int(s["ini"] * 1000)
        cauda = ""
        if s.get("dur"):
            cauda = f"atrim=end={s['dur']:.3f},afade=t=in:d=1.5,afade=t=out:st={max(0, s['dur'] - 2.5):.3f}:d=2.5,"
        fc.append(f"[{k}:a]{cauda}asetpts=PTS-STARTPTS,aformat=sample_rates=48000:channel_layouts=stereo,"
                  f"volume={s['db']}dB,adelay={ms}|{ms}[s{k}]")
        rotulos.append(f"[s{k}]")
        k += 1
    if not rotulos:
        raise SystemExit("Nenhum áudio encontrado (rode os passos 2, 3b e 5).")
    fc.append("".join(rotulos) + f"amix=inputs={len(rotulos)}:normalize=0:dropout_transition=0,"
              f"atrim=end={edl['duracao']:.3f},apad=whole_dur={edl['duracao']:.3f}[a]")
    script = trab / "audio_filtro.txt"
    script.write_text(";".join(fc), encoding="utf-8")
    saida = trab / "mix.wav"
    rodar(["ffmpeg", "-y", "-loglevel", "error", *entradas, "-filter_complex_script", script, "-map", "[a]",
           "-c:a", "pcm_s24le", "-ar", "48000", saida])
    return saida


def main():
    global FONTES
    cfg = carregar_config()
    exigir("ffmpeg")
    base = Path(cfg["pastas"]["trabalho"])
    edl = ler_json(base / "edl.json")
    FONTES = fontes(cfg)
    trab = base / "render" / ("preview" if PREVIEW else "4k")
    (trab / "shots").mkdir(parents=True, exist_ok=True)
    pasta_txt = trab / "textos"
    pasta_txt.mkdir(exist_ok=True)
    so_atos = None
    if "--atos" in sys.argv:
        so_atos = {int(x) for x in sys.argv[sys.argv.index("--atos") + 1].split(",")}

    luts = {}
    for ato in edl["atos"]:
        luts[ato["id"]] = trab / f"grade_ato{ato['id']}.cube"
        escrever_lut(ato["grade"], luts[ato["id"]])

    shots = edl["shots"]
    print(f"Renderizando {len(shots)} shots em {W}x{H}…")
    for i, sh in enumerate(shots):
        dur = sh["fim"] - sh["ini"]
        sh["_clip"] = str(trab / "shots" / f"{sh['id']}.mp4")
        if so_atos and sh["ato"] not in so_atos and Path(sh["_clip"]).exists():
            continue
        if Path(sh["_clip"]).exists() and not REFAZER:
            continue
        print(f"  [{i + 1}/{len(shots)}] {sh['id']} {sh['tipo']} {sh.get('tag') or sh.get('img') or sh.get('gerador') or ''}"
              f" ({dur:.1f} s)")
        tmp = sh["_clip"] + ".tmp.mp4"
        if sh["tipo"] == "gameplay":
            shot_gameplay(sh, edl, cfg, tmp, dur)
        elif sh["tipo"] == "img":
            shot_imagem(sh, tmp, dur)
        elif sh["tipo"] == "ae":
            shot_gerado(sh, edl, tmp, dur)
        else:
            shot_falta(sh.get("cena") or sh["id"], tmp, dur)
        os.replace(tmp, sh["_clip"])

    atos = []
    for ato in edl["atos"]:
        saida = trab / f"ato{ato['id']}.mp4"
        if not saida.exists() or REFAZER or (so_atos and ato["id"] in so_atos) or not so_atos:
            print(f"Montando o Ato {ato['id']} (dissolves, grade, textos)…")
            saida = montar_ato(ato, shots, edl, trab, luts, pasta_txt)
        atos.append((ato, saida))

    print("Mixando o áudio…")
    mix = mix_audio(edl, trab)

    print("Juntando os atos + barras de cinema + marca d'água…")
    entradas, fc = [], []
    for _, s in atos:
        entradas += ["-i", s]
    rot = "[0:v]"
    for i in range(1, len(atos)):
        off = atos[i][0]["ini"]
        fc.append(f"{rot}[{i}:v]xfade=transition=fade:duration=1.2:offset={off:.3f}[j{i}]")
        rot = f"[j{i}]"
    marca = pasta_txt / "marca.txt"
    marca.write_text("SUPERNOVA", encoding="utf-8")
    dur = edl["duracao"]
    fc.append(f"{rot}drawbox=x=0:y=0:w=iw:h={BARRA}:color=black:t=fill,"
              f"drawbox=x=0:y=ih-{BARRA}:w=iw:h={BARRA}:color=black:t=fill,"
              f"drawtext=fontfile='{esc(FONTES['versalete'])}':textfile='{esc(marca)}':fontsize={px(30)}:"
              f"fontcolor=0xE6E0D6@0.4:x=w-text_w-{px(110)}:y=h-{BARRA}-{px(70)},"
              f"fade=t=out:st={dur - 1.5:.3f}:d=1.5,format=yuv420p[v]")
    script = trab / "final_filtro.txt"
    script.write_text(";".join(fc), encoding="utf-8")
    nome = "O_Mundo_e_um_Servidor_PREVIEW_720p.mp4" if PREVIEW else "O_Mundo_e_um_Servidor_master.mp4"
    saida = base / "render" / nome
    rodar(["ffmpeg", "-y", "-loglevel", "error", *entradas, "-i", mix, "-filter_complex_script", script,
           "-map", "[v]", "-map", f"{len(atos)}:a", "-t", f"{dur:.3f}", "-r", FPS, "-c:v", "libx264",
           "-preset", PRESET, "-crf", CRF, "-c:a", "aac", "-b:a", "320k", "-movflags", "+faststart", saida])
    if PREVIEW:
        shutil.copy(saida, Path(cfg["pastas"]["medal"]) / nome)
    print(f"\nOK -> {saida}")
    if not PREVIEW:
        print("Agora rode: python pipeline/p07_exportar.py   (MP4 final em -14 LUFS + Reels 9:16)")


FONTES = {}

if __name__ == "__main__":
    main()
