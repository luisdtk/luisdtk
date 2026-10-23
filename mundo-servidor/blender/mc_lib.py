# -*- coding: utf-8 -*-
"""
mc_lib — blocos, terreno, personagens, efeitos e câmera de Minecraft no Blender.

* Texturas: usa as texturas ORIGINAIS extraídas do seu Minecraft (pipeline/p00) ou,
  se não houver, o resource pack padrão que vem com o addon MCprep. Sem nenhum dos
  dois, cai em cores sólidas.
* Personagens: modelo de caixas com as proporções do Minecraft (cabeça 8 px, corpo
  12 px...), totalmente animável por código (andar, golpear, agachar, olhar, tirar
  armadura). Se o MCprep estiver instalado, rode "MCprep > Prep Materials" depois
  para refinar materiais, ou troque pelos rigs do MCprep (Mob Spawner).
* Feito para Blender 4.2 LTS (funciona no 4.x; no 5.x os ajustes têm proteção).
"""
import math
import os
import random

import bpy
from mathutils import Vector

PX = 0.9 / 16          # 1 pixel do modelo do jogador (1,8 m de altura)
FPS = 30

# ---------------------------------------------------------------- utilidades
def definir(obj, attr, valor):
    """setattr tolerante a versões do Blender."""
    try:
        setattr(obj, attr, valor)
        return True
    except (AttributeError, TypeError, ValueError):
        return False


def f(seg):
    """segundos -> frame (a cena começa no frame 1)."""
    return int(round(seg * FPS)) + 1


def chave(obj, prop, frame, valor=None, indice=-1):
    if valor is not None:
        setattr(obj, prop, valor)
    obj.keyframe_insert(prop, frame=frame, index=indice)


def link(obj, colecao=None):
    (colecao or bpy.context.scene.collection).objects.link(obj)
    return obj


def colecao(nome):
    c = bpy.data.collections.get(nome) or bpy.data.collections.new(nome)
    if c.name not in bpy.context.scene.collection.children:
        bpy.context.scene.collection.children.link(c)
    return c


# ---------------------------------------------------------------- texturas e materiais
_PASTA_TEX = None
GRAMA = (0.47, 0.74, 0.33)
FOLHA = (0.30, 0.60, 0.18)
AGUA = (0.18, 0.36, 0.78)


def pasta_texturas():
    global _PASTA_TEX
    if _PASTA_TEX is not None:
        return _PASTA_TEX
    cands = [os.environ.get("MC_TEXTURAS", "")]
    trab = os.environ.get("MUNDO_TRABALHO")
    if trab:
        cands.append(os.path.join(trab, "mc_assets", "textures", "block"))
    try:
        import addon_utils
        for mod in addon_utils.modules():
            if "mcprep" in mod.__name__.lower():
                base = os.path.dirname(mod.__file__)
                cands.append(os.path.join(base, "MCprep_resources", "resourcepacks", "mcprep_default",
                                          "assets", "minecraft", "textures", "block"))
    except Exception:
        pass
    for c in cands:
        if c and os.path.isfile(os.path.join(c, "oak_planks.png")):
            _PASTA_TEX = c
            print("[mc_lib] texturas:", c)
            return c
    print("[mc_lib] AVISO: sem texturas do Minecraft — usando cores sólidas")
    _PASTA_TEX = ""
    return ""


def _socket(colecao_sockets, identificador, nome=None):
    for s in colecao_sockets:
        if s.identifier == identificador:
            return s
    if identificador == "Emission Color":   # Blender 3.x chamava de "Emission"
        for s in colecao_sockets:
            if s.name in ("Emission Color", "Emission"):
                return s
    return colecao_sockets[nome] if nome else None


def _mix_multiplica(nt, cor_a_socket, tint):
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.blend_type = "MULTIPLY"
    _socket(mix.inputs, "Factor_Float").default_value = 1.0
    nt.links.new(cor_a_socket, _socket(mix.inputs, "A_Color"))
    _socket(mix.inputs, "B_Color").default_value = (*tint, 1)
    return _socket(mix.outputs, "Result_Color")


_MATS = {}


def material(chave_mat, textura=None, cor=(0.5, 0.5, 0.5), tint=None, alpha=False, emissao=0.0,
             rugosidade=0.85, cor_emissao=None):
    """Material de bloco (textura pixelada, sem filtro)."""
    if chave_mat in _MATS:
        return _MATS[chave_mat]
    m = bpy.data.materials.new(chave_mat)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    bsdf.inputs["Roughness"].default_value = rugosidade
    pasta = pasta_texturas()
    caminho = os.path.join(pasta, textura + ".png") if (pasta and textura) else ""
    if caminho and os.path.isfile(caminho):
        img = bpy.data.images.load(caminho, check_existing=True)
        tex = nt.nodes.new("ShaderNodeTexImage")
        tex.image = img
        tex.interpolation = "Closest"
        if img.size[1] > img.size[0]:   # texturas animadas (água/lava) em tira: usa o 1º quadro
            mp = nt.nodes.new("ShaderNodeMapping")
            mp.inputs["Scale"].default_value = (1, img.size[0] / img.size[1], 1)
            uv = nt.nodes.new("ShaderNodeTexCoord")
            nt.links.new(uv.outputs["UV"], mp.inputs["Vector"])
            nt.links.new(mp.outputs["Vector"], tex.inputs["Vector"])
        saida_cor = tex.outputs["Color"]
        if tint:
            saida_cor = _mix_multiplica(nt, saida_cor, tint)
        nt.links.new(saida_cor, bsdf.inputs["Base Color"])
        if alpha:
            nt.links.new(tex.outputs["Alpha"], bsdf.inputs["Alpha"])
        if emissao:
            nt.links.new(saida_cor, _socket(bsdf.inputs, "Emission Color", "Emission Color"))
    else:
        c = tuple(a * b for a, b in zip(cor, tint)) if tint else cor
        bsdf.inputs["Base Color"].default_value = (*c, 1)
        if emissao:
            _socket(bsdf.inputs, "Emission Color", "Emission Color").default_value = (*(cor_emissao or c), 1)
        if alpha:
            bsdf.inputs["Alpha"].default_value = 0.45
    if emissao:
        bsdf.inputs["Emission Strength"].default_value = emissao
    if alpha:
        definir(m, "surface_render_method", "DITHERED") or definir(m, "blend_method", "HASHED")
        definir(m, "use_backface_culling", False)
    _MATS[chave_mat] = m
    return m


def material_cor(nome, cor, emissao=0.0, rugosidade=0.8, alpha=None):
    if nome in _MATS:
        return _MATS[nome]
    m = bpy.data.materials.new(nome)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = (*cor, 1)
    b.inputs["Roughness"].default_value = rugosidade
    if emissao:
        _socket(b.inputs, "Emission Color", "Emission Color").default_value = (*cor, 1)
        b.inputs["Emission Strength"].default_value = emissao
    if alpha is not None:
        b.inputs["Alpha"].default_value = alpha
        definir(m, "surface_render_method", "DITHERED") or definir(m, "blend_method", "BLEND")
    _MATS[nome] = m
    return m


def material_objeto_cor(nome, emissao=0.0):
    """Cor e transparência vêm de obj.color (anime com keyframes em 'color')."""
    if nome in _MATS:
        return _MATS[nome]
    m = bpy.data.materials.new(nome)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes.get("Principled BSDF")
    oi = nt.nodes.new("ShaderNodeObjectInfo")
    nt.links.new(oi.outputs["Color"], b.inputs["Base Color"])
    nt.links.new(oi.outputs["Alpha"], b.inputs["Alpha"])
    if emissao:
        nt.links.new(oi.outputs["Color"], _socket(b.inputs, "Emission Color", "Emission Color"))
        b.inputs["Emission Strength"].default_value = emissao
    definir(m, "surface_render_method", "DITHERED") or definir(m, "blend_method", "BLEND")
    _MATS[nome] = m
    return m


def material_lava():
    if "lava" in _MATS:
        return _MATS["lava"]
    m = bpy.data.materials.new("lava")
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes.get("Principled BSDF")
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    nz = nt.nodes.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 3.0
    rampa = nt.nodes.new("ShaderNodeValToRGB")
    rampa.color_ramp.interpolation = "CONSTANT"   # aspecto pixelado
    rampa.color_ramp.elements[0].color = (0.85, 0.22, 0.02, 1)
    rampa.color_ramp.elements[1].position = 0.55
    rampa.color_ramp.elements[1].color = (1.0, 0.65, 0.12, 1)
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    nt.links.new(mp.outputs["Vector"], nz.inputs["Vector"])
    nt.links.new(nz.outputs["Fac"], rampa.inputs["Fac"])
    nt.links.new(rampa.outputs["Color"], b.inputs["Base Color"])
    nt.links.new(rampa.outputs["Color"], _socket(b.inputs, "Emission Color", "Emission Color"))
    b.inputs["Emission Strength"].default_value = 6.0
    # movimento lento da lava
    mp.inputs["Location"].default_value = (0, 0, 0)
    mp.inputs["Location"].keyframe_insert("default_value", frame=1)
    mp.inputs["Location"].default_value = (0.6, 1.2, 0.4)
    mp.inputs["Location"].keyframe_insert("default_value", frame=900)
    _MATS["lava"] = m
    return m


def material_agua():
    if "agua" in _MATS:
        return _MATS["agua"]
    m = material("agua_tex", "water_still", cor=(0.5, 0.5, 0.5), tint=AGUA, rugosidade=0.05)
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Alpha"].default_value = 0.78
    definir(m, "surface_render_method", "DITHERED") or definir(m, "blend_method", "HASHED")
    _MATS["agua"] = m
    return m


# tipo -> {face: (textura, tint)} ; faces: top, side, bottom
BLOCOS = {
    "grass_block": {"top": ("grass_block_top", GRAMA), "side": ("grass_block_side", None), "bottom": ("dirt", None),
                    "cor": (0.36, 0.55, 0.25)},
    "dirt": {"all": ("dirt", None), "cor": (0.45, 0.31, 0.20)},
    "coarse_dirt": {"all": ("coarse_dirt", None), "cor": (0.36, 0.26, 0.18)},
    "stone": {"all": ("stone", None), "cor": (0.48, 0.48, 0.48)},
    "cobblestone": {"all": ("cobblestone", None), "cor": (0.42, 0.42, 0.42)},
    "stone_bricks": {"all": ("stone_bricks", None), "cor": (0.46, 0.46, 0.46)},
    "sand": {"all": ("sand", None), "cor": (0.86, 0.80, 0.58)},
    "gravel": {"all": ("gravel", None), "cor": (0.52, 0.49, 0.47)},
    "oak_log": {"top": ("oak_log_top", None), "side": ("oak_log", None), "bottom": ("oak_log_top", None),
                "cor": (0.40, 0.31, 0.19)},
    "oak_planks": {"all": ("oak_planks", None), "cor": (0.66, 0.53, 0.32)},
    "oak_leaves": {"all": ("oak_leaves", FOLHA), "cor": (0.5, 0.5, 0.5), "alpha": True},
    "glass": {"all": ("glass", None), "cor": (0.8, 0.9, 0.95), "alpha": True},
    "tnt": {"top": ("tnt_top", None), "side": ("tnt_side", None), "bottom": ("tnt_bottom", None), "cor": (0.8, 0.2, 0.15)},
    "farmland": {"top": ("farmland_moist", None), "side": ("dirt", None), "bottom": ("dirt", None), "cor": (0.32, 0.2, 0.12)},
    "red_wool": {"all": ("red_wool", None), "cor": (0.62, 0.15, 0.13)},
    "blue_wool": {"all": ("blue_wool", None), "cor": (0.20, 0.24, 0.62)},
    "white_wool": {"all": ("white_wool", None), "cor": (0.92, 0.92, 0.92)},
    "obsidian": {"all": ("obsidian", None), "cor": (0.08, 0.06, 0.12)},
    "crafting_table": {"top": ("crafting_table_top", None), "side": ("crafting_table_front", None),
                       "bottom": ("oak_planks", None), "cor": (0.55, 0.40, 0.25)},
    "glowstone": {"all": ("glowstone", None), "cor": (0.95, 0.8, 0.5), "emissao": 4.0},
    "water": {"especial": "agua"},
    "lava": {"especial": "lava"},
    "wheat": {"all": ("wheat_stage7", None), "cor": (0.75, 0.65, 0.25), "alpha": True, "cruz": True},
}
TRANSPARENTES = {"glass", "oak_leaves", "water", "wheat", "lava"}


def mat_face(tipo, face):
    d = BLOCOS[tipo]
    if d.get("especial") == "agua":
        return material_agua()
    if d.get("especial") == "lava":
        return material_lava()
    tex, tint = d.get(face) or d.get("all") or d.get("side")
    return material(f"{tipo}_{tex}", tex, cor=d["cor"], tint=tint, alpha=d.get("alpha", False),
                    emissao=d.get("emissao", 0.0))


# ---------------------------------------------------------------- geometria de blocos
FACES = {   # nome: (vizinho, vértices do quad em cubo 0..1, tipo de face)
    "top":    ((0, 0, 1), [(0, 0, 1), (1, 0, 1), (1, 1, 1), (0, 1, 1)], "top"),
    "bottom": ((0, 0, -1), [(0, 1, 0), (1, 1, 0), (1, 0, 0), (0, 0, 0)], "bottom"),
    "north":  ((0, 1, 0), [(1, 1, 0), (0, 1, 0), (0, 1, 1), (1, 1, 1)], "side"),
    "south":  ((0, -1, 0), [(0, 0, 0), (1, 0, 0), (1, 0, 1), (0, 0, 1)], "side"),
    "east":   ((1, 0, 0), [(1, 0, 0), (1, 1, 0), (1, 1, 1), (1, 0, 1)], "side"),
    "west":   ((-1, 0, 0), [(0, 1, 0), (0, 0, 0), (0, 0, 1), (0, 1, 1)], "side"),
}
UV_QUAD = [(0, 0), (1, 0), (1, 1), (0, 1)]


def _malha(nome, quads):
    """quads: lista de (4 vértices, material). Cria malha com UVs por face."""
    me = bpy.data.meshes.new(nome)
    mats, idx_mat = [], {}
    verts, faces, mat_ids = [], [], []
    for vs, mat in quads:
        if mat.name not in idx_mat:
            idx_mat[mat.name] = len(mats)
            mats.append(mat)
        base = len(verts)
        verts += vs
        faces.append((base, base + 1, base + 2, base + 3))
        mat_ids.append(idx_mat[mat.name])
    me.from_pydata(verts, [], faces)
    for m in mats:
        me.materials.append(m)
    uv = me.uv_layers.new(name="UV")
    for poly, mi in zip(me.polygons, mat_ids):
        poly.material_index = mi
        poly.use_smooth = False
        for k, li in enumerate(poly.loop_indices):
            uv.data[li].uv = UV_QUAD[k]
    me.update()
    return me


def _quads_cruz(x, y, z, mat, c=0.5):
    a, b = 0.15, 0.85
    return [([(x + a, y + a, z), (x + b, y + b, z), (x + b, y + b, z + 1), (x + a, y + a, z + 1)], mat),
            ([(x + a, y + b, z), (x + b, y + a, z), (x + b, y + a, z + 1), (x + a, y + b, z + 1)], mat)]


_MALHA_BLOCO = {}


def malha_bloco(tipo):
    """Cubo de 1 m centrado na origem com os materiais de cada face (compartilhado)."""
    if tipo in _MALHA_BLOCO:
        return _MALHA_BLOCO[tipo]
    quads = []
    if BLOCOS[tipo].get("cruz"):
        quads = _quads_cruz(-0.5, -0.5, -0.5, mat_face(tipo, "side"))
    else:
        for nome, (_, vs, ft) in FACES.items():
            quads.append(([(vx - 0.5, vy - 0.5, vz - 0.5) for vx, vy, vz in vs], mat_face(tipo, ft)))
    me = _malha("bloco_" + tipo, quads)
    _MALHA_BLOCO[tipo] = me
    return me


# ---------------------------------------------------------------- mundo
def _hash(ix, iy, seed):
    n = (ix * 374761393 + iy * 668265263 + seed * 2147483647) & 0xFFFFFFFF
    n = (n ^ (n >> 13)) * 1274126177 & 0xFFFFFFFF
    return ((n ^ (n >> 16)) & 0xFFFF) / 65535.0


def ruido(x, y, seed=1):
    ix, iy = math.floor(x), math.floor(y)
    fx, fy = x - ix, y - iy
    sx, sy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
    a, b = _hash(ix, iy, seed), _hash(ix + 1, iy, seed)
    c, d = _hash(ix, iy + 1, seed), _hash(ix + 1, iy + 1, seed)
    return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy


class Mundo:
    """Grade de blocos. Blocos estáticos viram uma malha só (faces internas removidas);
    blocos 'dinâmicos' viram objetos individuais que aparecem/somem/voam."""

    def __init__(self, seed=7):
        self.b = {}
        self.seed = seed
        self.dinamicos = {}
        self.col_dyn = colecao("Blocos animados")

    # -- edição
    def por(self, x, y, z, tipo):
        self.b[(x, y, z)] = tipo

    def tirar(self, x, y, z):
        self.b.pop((x, y, z), None)

    def altura(self, x, y, ate=40):
        """z do bloco sólido mais alto (não-água) na coluna."""
        for z in range(ate, -12, -1):
            t = self.b.get((x, y, z))
            if t and t not in ("water", "wheat"):
                return z
        return -12

    def chao(self, x, y):
        return self.altura(x, y) + 1

    # -- terreno
    def meandro(self, y):
        return 2.2 * math.sin(y / 13.0) + 1.2 * math.sin(y / 5.3 + 1.0)

    def terreno(self, raio=56, rio=True, base=2, montanhas=1.0):
        for x in range(-raio, raio):
            for y in range(-raio, raio):
                h = base + montanhas * (2.4 * ruido(x / 17, y / 17, self.seed) + 1.2 * ruido(x / 6, y / 6, self.seed + 3)) - 1.6
                h = int(round(h))
                d = abs(x - self.meandro(y)) if rio else 99
                if d < 3.6:
                    for z in range(-5, -2):
                        self.por(x, y, z, "stone")
                    self.por(x, y, -2, "gravel" if ruido(x, y, 9) > 0.5 else "sand")
                    self.por(x, y, -1, "water")
                    self.por(x, y, 0, "water")
                    continue
                if d < 8:
                    h = min(h, int((d - 3.6) / 1.4) + 1)
                topo = "sand" if d < 5.2 else "grass_block"
                for z in range(h - 4, h + 1):
                    if z == h:
                        self.por(x, y, z, topo)
                    elif z >= h - 2:
                        self.por(x, y, z, "sand" if topo == "sand" else "dirt")
                    else:
                        self.por(x, y, z, "stone")

    def arvore(self, x, y, altura=None, dinamico=False):
        z0 = self.chao(x, y)
        altura = altura or 4 + int(ruido(x * 3.1, y * 2.7, self.seed) * 2.5)
        pos = []
        for k in range(altura):
            pos.append(((x, y, z0 + k), "oak_log"))
        topo = z0 + altura
        for dz, r in ((-2, 2), (-1, 2), (0, 1), (1, 1)):
            for dx in range(-r, r + 1):
                for dy in range(-r, r + 1):
                    if abs(dx) == r and abs(dy) == r and (r == 2 and _hash(x + dx, y + dy + dz, 5) > 0.45 or dz == 1):
                        continue
                    if (dx, dy) == (0, 0) and dz < 0:
                        continue
                    pos.append(((x + dx, y + dy, topo + dz), "oak_leaves"))
        for p, t in pos:
            self.por(*p, t)
        if dinamico:
            for p, _ in pos:
                self.dinamicos[p] = None
        return pos

    def arvores_aleatorias(self, n, raio=48, evitar=()):
        rnd = random.Random(self.seed)
        feitas = 0
        while feitas < n:
            x, y = rnd.randint(-raio, raio), rnd.randint(-raio, raio)
            if abs(x - self.meandro(y)) < 7 or any(abs(x - a) < r and abs(y - b) < r for a, b, r in evitar):
                continue
            if self.b.get((x, y, self.altura(x, y))) != "grass_block":
                continue
            self.arvore(x, y)
            feitas += 1

    # -- construção
    def marcar_dinamico(self, posicoes):
        for p in posicoes:
            self.dinamicos.setdefault(tuple(p), None)

    def construir(self, nome="Terreno"):
        """Gera a malha estática + objetos para os blocos dinâmicos. Devolve dict pos->obj."""
        quads = []
        for (x, y, z), t in self.b.items():
            if (x, y, z) in self.dinamicos:
                continue
            if BLOCOS[t].get("cruz"):
                quads += _quads_cruz(x, y, z, mat_face(t, "side"))
                continue
            for _, ((dx, dy, dz), vs, ft) in FACES.items():
                viz = (x + dx, y + dy, z + dz)
                tv = self.b.get(viz)
                if tv and viz not in self.dinamicos and (tv not in TRANSPARENTES or tv == t):
                    continue
                if t == "water" and tv == "water":
                    continue
                if t == "water" and ft == "bottom":
                    continue
                quads.append(([(x + vx, y + vy, z + vz) for vx, vy, vz in vs], mat_face(t, ft)))
        me = _malha(nome, quads)
        ob = bpy.data.objects.new(nome, me)
        link(ob)
        for p in list(self.dinamicos):
            t = self.b.get(p)
            if t:
                self.dinamicos[p] = bloco_obj(t, p, self.col_dyn)
            else:
                del self.dinamicos[p]
        return self.dinamicos


def bloco_obj(tipo, pos, col=None):
    ob = bpy.data.objects.new(f"{tipo}_{pos[0]}_{pos[1]}_{pos[2]}", malha_bloco(tipo))
    ob.location = (pos[0] + 0.5, pos[1] + 0.5, pos[2] + 0.5)
    link(ob, col)
    return ob


def aparecer(ob, frame, pop=True):
    """Bloco colocado: invisível até 'frame', depois um 'pop' rápido de escala."""
    ob.hide_render = True
    ob.hide_viewport = True
    ob.keyframe_insert("hide_render", frame=max(1, frame - 1))
    ob.keyframe_insert("hide_viewport", frame=max(1, frame - 1))
    ob.hide_render = False
    ob.hide_viewport = False
    ob.keyframe_insert("hide_render", frame=frame)
    ob.keyframe_insert("hide_viewport", frame=frame)
    if pop:
        chave(ob, "scale", frame, (0.82, 0.82, 0.82))
        chave(ob, "scale", frame + 3, (1, 1, 1))
    if frame > 1:   # garante invisível no início
        ob.hide_render = True
        ob.hide_viewport = True
        ob.keyframe_insert("hide_render", frame=1)
        ob.keyframe_insert("hide_viewport", frame=1)
        ob.hide_render = False
        ob.hide_viewport = False


def sumir(ob, frame):
    ob.hide_render = False
    ob.hide_viewport = False
    ob.keyframe_insert("hide_render", frame=frame - 1)
    ob.keyframe_insert("hide_viewport", frame=frame - 1)
    ob.hide_render = True
    ob.hide_viewport = True
    ob.keyframe_insert("hide_render", frame=frame)
    ob.keyframe_insert("hide_viewport", frame=frame)


def construir_em_sequencia(objs, f0, f1, ordem=None):
    """Faz os blocos aparecerem um a um entre f0 e f1 (de baixo pra cima por padrão)."""
    lista = sorted(objs, key=ordem or (lambda o: (o.location.z, o.location.x, o.location.y)))
    n = max(1, len(lista))
    for i, o in enumerate(lista):
        aparecer(o, int(f0 + (f1 - f0) * i / n))
    return lista


# ---------------------------------------------------------------- estruturas
def casinha(m, x0, y0, janela_grande=False, z0=None, dinamico=True):
    """Casinha de madeira 5x5 (porta virada para -y). Devolve posições na ordem de construção."""
    z0 = z0 if z0 is not None else max(m.chao(x0 + dx, y0 + dy) for dx in range(5) for dy in range(5))
    pos = []
    for dx in range(5):
        for dy in range(5):
            for z in range(m.chao(x0 + dx, y0 + dy), z0):
                pos.append(((x0 + dx, y0 + dy, z), "cobblestone"))   # fundação nivelada
    for dz in range(3):
        for dx in range(5):
            for dy in range(5):
                borda = dx in (0, 4) or dy in (0, 4)
                if not borda:
                    continue
                canto = dx in (0, 4) and dy in (0, 4)
                if dy == 0 and dx == 2 and dz < 2:
                    continue                                      # porta
                tipo = "oak_log" if canto else "oak_planks"
                if janela_grande and dy == 0 and dx in (1, 3) and dz in (1, 2):
                    tipo = "glass"
                if janela_grande and dx == 4 and dy in (1, 2, 3) and dz in (1, 2):
                    tipo = "glass"
                if not janela_grande and dx == 4 and dy == 2 and dz == 1:
                    tipo = "glass"
                pos.append(((x0 + dx, y0 + dy, z0 + dz), tipo))
    for dx in range(-1, 6):
        for dy in range(-1, 6):
            pos.append(((x0 + dx, y0 + dy, z0 + 3), "oak_planks"))
    for dx in range(1, 4):
        for dy in range(1, 4):
            pos.append(((x0 + dx, y0 + dy, z0 + 4), "oak_planks"))
    pos.append(((x0 + 2, y0 + 2, z0 + 5), "oak_planks"))
    for p, t in pos:
        m.por(*p, t)
    if dinamico:
        m.marcar_dinamico([p for p, _ in pos])
    return pos, z0


def bunker(m, cx, cy, lado=7, altura=4, lava=True, tipo="cobblestone"):
    x0, y0 = cx - lado // 2, cy - lado // 2
    z0 = max(m.chao(x0 + dx, y0 + dy) for dx in range(lado) for dy in range(lado))
    pos = []
    for dz in range(altura):
        for dx in range(lado):
            for dy in range(lado):
                if dx in (0, lado - 1) or dy in (0, lado - 1):
                    if dy == 0 and dx == lado // 2 and dz < 2:
                        continue
                    pos.append(((x0 + dx, y0 + dy, z0 + dz), tipo))
    for dx in range(lado):
        for dy in range(lado):
            pos.append(((x0 + dx, y0 + dy, z0 + altura), "stone"))
    lav = []
    if lava:
        for dx in (-1, 0, 1):
            for dy in (-1, -2):
                p = (x0 + lado // 2 + dx, y0 + dy, z0 - 1)
                m.tirar(*p)
                lav.append((p, "lava"))
    for p, t in pos + lav:
        m.por(*p, t)
    m.marcar_dinamico([p for p, _ in pos + lav])
    return pos, lav, z0


def muro_em_volta(m, cx, cy, raio, altura=3):
    res = []
    for dx in range(-raio, raio + 1):
        for dy in range(-raio, raio + 1):
            if max(abs(dx), abs(dy)) != raio or (dy == -raio and dx == 0):
                continue
            x, y = cx + dx, cy + dy
            z0 = m.chao(x, y)
            for dz in range(altura):
                res.append(((x, y, z0 + dz), "cobblestone"))
    for p, t in res:
        m.por(*p, t)
    m.marcar_dinamico([p for p, _ in res])
    return res


def ponte(m, y, x_ini, x_fim, z=1):
    pos = []
    for x in range(x_ini, x_fim + 1):
        for dy in (0, 1, 2):
            pos.append(((x, y + dy, z), "oak_planks"))
    for p, t in pos:
        m.por(*p, t)
    m.marcar_dinamico([p for p, _ in pos])
    return pos


def cratera(m, cx, cy, cz, raio):
    """Remove uma esfera de blocos (deixa terra grossa no fundo). Devolve as posições removidas."""
    rem = []
    for (x, y, z) in list(m.b):
        d = math.sqrt((x - cx) ** 2 + (y - cy) ** 2 + ((z - cz) * 1.3) ** 2)
        if d <= raio + (_hash(x, y + z, 11) - 0.5) * 1.2 and m.b[(x, y, z)] != "water":
            rem.append((x, y, z))
    for p in rem:
        m.tirar(*p)
    for (x, y, z) in rem:
        if (x, y, z - 1) in m.b and (x, y, z - 1) not in rem and m.b[(x, y, z - 1)] in ("dirt", "stone", "grass_block"):
            m.b[(x, y, z - 1)] = "coarse_dirt"
    return rem


# ---------------------------------------------------------------- personagens
SKINS = {
    "steve":   {"pele": (0.72, 0.50, 0.38), "cabelo": (0.20, 0.12, 0.06), "camisa": (0.0, 0.62, 0.66),
                "calca": (0.24, 0.22, 0.58), "sapato": (0.30, 0.30, 0.32), "olho": (0.32, 0.25, 0.65)},
    "alex":    {"pele": (0.92, 0.74, 0.60), "cabelo": (0.86, 0.45, 0.13), "camisa": (0.42, 0.62, 0.30),
                "calca": (0.42, 0.28, 0.16), "sapato": (0.28, 0.22, 0.18), "olho": (0.20, 0.55, 0.30)},
    "griefer": {"pele": (0.62, 0.45, 0.35), "cabelo": (0.05, 0.05, 0.06), "camisa": (0.07, 0.07, 0.08),
                "calca": (0.12, 0.12, 0.14), "sapato": (0.05, 0.05, 0.05), "olho": (0.75, 0.10, 0.10)},
    "zumbi":   {"pele": (0.30, 0.50, 0.26), "cabelo": (0.22, 0.38, 0.20), "camisa": (0.0, 0.55, 0.58),
                "calca": (0.24, 0.22, 0.55), "sapato": (0.25, 0.25, 0.28), "olho": (0.05, 0.05, 0.05)},
    "aldeao1": {"pele": (0.80, 0.60, 0.45), "cabelo": (0.35, 0.22, 0.10), "camisa": (0.70, 0.30, 0.25),
                "calca": (0.30, 0.30, 0.36), "sapato": (0.2, 0.2, 0.2), "olho": (0.3, 0.2, 0.1)},
    "aldeao2": {"pele": (0.55, 0.38, 0.28), "cabelo": (0.10, 0.07, 0.05), "camisa": (0.85, 0.75, 0.30),
                "calca": (0.25, 0.35, 0.25), "sapato": (0.2, 0.2, 0.2), "olho": (0.2, 0.15, 0.1)},
    "aldeao3": {"pele": (0.88, 0.70, 0.58), "cabelo": (0.60, 0.50, 0.30), "camisa": (0.55, 0.55, 0.60),
                "calca": (0.45, 0.30, 0.20), "sapato": (0.2, 0.2, 0.2), "olho": (0.2, 0.4, 0.6)},
}
TIME = {"azul": (0.16, 0.25, 0.72), "vermelho": (0.70, 0.12, 0.10)}


def caixa(nome, tam_px, centro_px, mat, parent=None, col=None):
    """Caixa de tam_px (x,y,z) com centro em centro_px relativo ao pivô (parent)."""
    sx, sy, sz = (t * PX / 2 for t in tam_px)
    cx, cy, cz = (c * PX for c in centro_px)
    vs = [(cx + a * sx, cy + b * sy, cz + c * sz) for a in (-1, 1) for b in (-1, 1) for c in (-1, 1)]
    fs = [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]
    me = bpy.data.meshes.new(nome)
    me.from_pydata(vs, [], fs)
    me.materials.append(mat)
    ob = bpy.data.objects.new(nome, me)
    link(ob, col)
    if parent:
        ob.parent = parent
    return ob


def pivo(nome, pos_px, parent=None, col=None):
    e = bpy.data.objects.new(nome, None)
    e.empty_display_size = 0.05
    e.location = tuple(p * PX for p in pos_px)
    link(e, col)
    if parent:
        e.parent = parent
    return e


class Personagem:
    """Modelo de caixas do Minecraft. Frente = +Y local. Pés na origem do 'raiz'."""

    def __init__(self, nome, skin="steve", pos=(0, 0, 0), yaw=0.0, armadura=None, zumbi=False):
        s = SKINS[skin]
        self.nome = nome
        self.col = colecao("Personagens")
        mt = {k: material_cor(f"{skin}_{k}", v, rugosidade=0.9) for k, v in s.items()}
        branco = material_cor("olho_branco", (0.95, 0.95, 0.95))
        self.raiz = pivo(nome, (0, 0, 0), col=self.col)
        self.raiz.location = pos
        self.raiz.rotation_euler = (0, 0, yaw)
        self.quadril = pivo(nome + "_quadril", (0, 0, 12), self.raiz, self.col)
        self.tronco = pivo(nome + "_tronco", (0, 0, 0), self.quadril, self.col)
        caixa(nome + "_corpo", (8, 4, 12), (0, 0, 6), mt["camisa"], self.tronco, self.col)
        self.cabeca = pivo(nome + "_cabeca", (0, 0, 12), self.tronco, self.col)
        caixa(nome + "_cabeca_m", (8, 8, 8), (0, 0, 4), mt["pele"], self.cabeca, self.col)
        caixa(nome + "_cabelo", (8.3, 8.3, 2.2), (0, -0.2, 7.0), mt["cabelo"], self.cabeca, self.col)
        caixa(nome + "_nuca", (8.3, 1.2, 6), (0, -3.6, 4.6), mt["cabelo"], self.cabeca, self.col)
        for lado in (-1, 1):
            caixa(nome + f"_olhoB{lado}", (2, 0.3, 1), (lado * 2.0, 4.05, 3.5), branco, self.cabeca, self.col)
            caixa(nome + f"_olhoP{lado}", (1, 0.35, 1), (lado * 1.5, 4.1, 3.5), mt["olho"], self.cabeca, self.col)
        self.braco = {}
        self.perna = {}
        for lado, nm in ((1, "d"), (-1, "e")):
            b = pivo(nome + f"_braco_{nm}", (lado * 6, 0, 10), self.tronco, self.col)
            caixa(nome + f"_braco_{nm}_m", (4, 4, 12), (0, 0, -4), mt["camisa"], b, self.col)
            caixa(nome + f"_mao_{nm}", (4.05, 4.05, 5), (0, 0, -7.5), mt["pele"], b, self.col)
            self.braco[nm] = b
            p = pivo(nome + f"_perna_{nm}", (lado * 2, 0, 0), self.quadril, self.col)
            caixa(nome + f"_perna_{nm}_m", (4, 4, 12), (0, 0, -6), mt["calca"], p, self.col)
            caixa(nome + f"_sapato_{nm}", (4.05, 4.05, 2.5), (0, 0, -10.8), mt["sapato"], p, self.col)
            self.perna[nm] = p
        self.armadura = []
        if armadura:
            ma = material_cor(f"couro_{armadura}", TIME[armadura], rugosidade=0.6)
            mb = material_cor(f"couro_{armadura}_esc", tuple(c * 0.6 for c in TIME[armadura]), rugosidade=0.6)
            self.armadura += [
                caixa(nome + "_elmo", (9, 9, 4), (0, 0, 7), ma, self.cabeca, self.col),
                caixa(nome + "_peitoral", (9, 5, 12.5), (0, 0, 6), ma, self.tronco, self.col),
                caixa(nome + "_cinto", (9.1, 5.1, 1.2), (0, 0, 0.6), mb, self.tronco, self.col),
            ]
            for nm in ("d", "e"):
                self.armadura.append(caixa(nome + f"_ombreira_{nm}", (5, 5, 6), (0, 0, 0), ma, self.braco[nm], self.col))
                self.armadura.append(caixa(nome + f"_calca_{nm}", (4.6, 4.6, 10), (0, 0, -5), ma, self.perna[nm], self.col))
                self.armadura.append(caixa(nome + f"_bota_{nm}", (4.8, 4.8, 3), (0, 0, -10.6), mb, self.perna[nm], self.col))
        self.zumbi = zumbi
        if zumbi:
            for b in self.braco.values():
                b.rotation_euler = (math.radians(90), 0, 0)
        self._yaw = yaw

    # -- poses
    def _rot(self, ob, frame, x=None, z=None):
        r = list(ob.rotation_euler)
        if x is not None:
            r[0] = x
        if z is not None:
            r[2] = z
        ob.rotation_euler = r
        ob.keyframe_insert("rotation_euler", frame=frame)

    def neutro(self, frame):
        for nm in ("d", "e"):
            self._rot(self.braco[nm], frame, x=math.radians(90) if self.zumbi else 0)
            self._rot(self.perna[nm], frame, x=0)

    def virar(self, frame, yaw):
        # escolhe o ângulo equivalente mais próximo (sem giro de 360°)
        while yaw - self._yaw > math.pi:
            yaw -= 2 * math.pi
        while yaw - self._yaw < -math.pi:
            yaw += 2 * math.pi
        self._yaw = yaw
        self._rot(self.raiz, frame, z=yaw)

    def mirar(self, frame, alvo):
        p = self.raiz.location
        d = Vector(alvo) - Vector(p)
        self.virar(frame, math.atan2(-d.x, d.y))

    def andar(self, pontos, f0, vel=2.6, balanco=0.6):
        """Anda pelos pontos (x,y,z do pé) a 'vel' m/s. Devolve o frame final."""
        fr = f0
        self.raiz.keyframe_insert("location", frame=fr)
        ant = Vector(self.raiz.location)
        for p in pontos:
            p = Vector(p)
            d = p - ant
            self.mirar(max(1, fr), p) if d.length > 0.05 else None
            dur = max(4, int(d.length / vel * FPS))
            # balanço de braços e pernas
            passo = max(4, int(0.5 / vel * FPS * 1.6))
            for k, fk in enumerate(range(fr, fr + dur, passo)):
                s = 1 if k % 2 == 0 else -1
                a = math.radians(32) * balanco * s
                self._rot(self.perna["d"], fk, x=a)
                self._rot(self.perna["e"], fk, x=-a)
                if not self.zumbi:
                    self._rot(self.braco["d"], fk, x=-a * 0.8)
                    self._rot(self.braco["e"], fk, x=a * 0.8)
            fr += dur
            self.raiz.location = p
            self.raiz.keyframe_insert("location", frame=fr)
            self.mirar(fr, p + d.normalized() if d.length > 0.05 else p + Vector((0, 1, 0)))
            ant = p
        self.neutro(fr + 3)
        return fr

    def golpe(self, frame, vezes=1, braco="d"):
        b = self.braco[braco]
        base = math.radians(90) if self.zumbi else 0
        for k in range(vezes):
            fk = frame + k * 7
            self._rot(b, fk, x=base)
            self._rot(b, fk + 3, x=base + math.radians(75))
            self._rot(b, fk + 7, x=base)
        return frame + vezes * 7

    def agachar(self, frame, dur=8):
        z = self.raiz.location.z
        self._rot(self.tronco, frame, x=0)
        self.raiz.keyframe_insert("location", frame=frame)
        self._rot(self.tronco, frame + 3, x=math.radians(-28))
        self.raiz.location.z = z - 0.18
        self.raiz.keyframe_insert("location", frame=frame + 3)
        self._rot(self.tronco, frame + dur, x=math.radians(-28))
        self.raiz.keyframe_insert("location", frame=frame + dur)
        self._rot(self.tronco, frame + dur + 3, x=0)
        self.raiz.location.z = z
        self.raiz.keyframe_insert("location", frame=frame + dur + 3)
        return frame + dur + 3

    def cabeca_olhar(self, frame, yaw=0.0, pitch=0.0):
        self.cabeca.rotation_euler = (pitch, 0, yaw)
        self.cabeca.keyframe_insert("rotation_euler", frame=frame)

    def apontar(self, frame, dur=20, braco="d"):
        b = self.braco[braco]
        self._rot(b, frame, x=0)
        self._rot(b, frame + 5, x=math.radians(95))
        self._rot(b, frame + dur, x=math.radians(95))
        self._rot(b, frame + dur + 6, x=0)

    def respirar(self, f0, f1):
        for k, fk in enumerate(range(f0, f1, 40)):
            self._rot(self.cabeca, fk, x=math.radians(2 if k % 2 else -2))

    def tirar_armadura(self, frame):
        base = Vector(self.raiz.location) + Vector((0, 0, 1.0))
        for k, a in enumerate(self.armadura):
            sumir(a, frame + k * 2)
        for k in range(3):
            fumaca_pequena(base + Vector((0, 0, 0.4 * k - 0.4)), frame + k * 4)

    def esconder_ate(self, frame):
        for ob in [self.raiz] + list(self.raiz.children_recursive):
            if ob.type == "MESH":
                aparecer(ob, frame, pop=False)


def ovelha(nome, pos, yaw=0.0):
    col = colecao("Mobs")
    la = material("ovelha_la", "white_wool", cor=(0.92, 0.92, 0.9))
    pele = material_cor("ovelha_pele", (0.75, 0.65, 0.6))
    raiz = pivo(nome, (0, 0, 0), col=col)
    raiz.location = pos
    raiz.rotation_euler = (0, 0, yaw)
    caixa(nome + "_corpo", (10, 18, 8), (0, 0, 16), la, raiz, col)
    cab = pivo(nome + "_cab", (0, 8, 18), raiz, col)
    caixa(nome + "_cabeca", (6, 8, 6), (0, 3, 0), pele, cab, col)
    caixa(nome + "_la_cab", (7, 5, 6.5), (0, 1, 0.5), la, cab, col)
    for dx in (-3, 3):
        for dy in (-6, 6):
            caixa(nome + f"_pata{dx}{dy}", (4, 4, 12), (dx, dy, 6), pele, raiz, col)
    return raiz, cab


def ovelha_pastando(raiz, cab, f0, f1, seed=0):
    rnd = random.Random(seed)
    fr = f0
    while fr < f1:
        cab.rotation_euler = (0, 0, 0)
        cab.keyframe_insert("rotation_euler", frame=fr)
        cab.rotation_euler = (math.radians(55), 0, 0)
        cab.keyframe_insert("rotation_euler", frame=fr + 10)
        cab.keyframe_insert("rotation_euler", frame=fr + 40)
        cab.rotation_euler = (0, 0, 0)
        cab.keyframe_insert("rotation_euler", frame=fr + 50)
        raiz.keyframe_insert("location", frame=fr + 50)
        raiz.location.x += rnd.uniform(-1, 1)
        raiz.location.y += rnd.uniform(-1, 1)
        raiz.keyframe_insert("location", frame=fr + 90)
        fr += 90 + rnd.randint(0, 40)


# ---------------------------------------------------------------- efeitos
def luz_ponto(nome, pos, cor=(1.0, 0.62, 0.3), energia=150, raio=0.1):
    lu = bpy.data.lights.new(nome, "POINT")
    lu.color = cor
    lu.energy = energia
    definir(lu, "shadow_soft_size", raio)
    ob = bpy.data.objects.new(nome, lu)
    ob.location = pos
    link(ob)
    return ob


def tocha(pos, frame=None, tremula=True, col=None):
    """Tocha de parede/chão: cabo + chama emissiva + luz quente. pos = centro do bloco."""
    x, y, z = pos
    cabo = material_cor("tocha_cabo", (0.40, 0.28, 0.14))
    chama = material_cor("tocha_chama", (1.0, 0.75, 0.3), emissao=18)
    raiz = pivo("tocha", (0, 0, 0), col=col)
    raiz.location = (x, y, z - 0.5)
    caixa("tocha_cabo", (2 * 16 / 14.4, 2 * 16 / 14.4, 9 * 16 / 14.4), (0, 0, 4.5 * 16 / 14.4), cabo, raiz, col)
    ch = caixa("tocha_chama", (2.2 * 16 / 14.4, 2.2 * 16 / 14.4, 2.2 * 16 / 14.4), (0, 0, 10 * 16 / 14.4), chama, raiz, col)
    luz = luz_ponto("tocha_luz", (x, y, z + 0.2), energia=60, raio=0.05)
    luz.parent = None
    if frame:
        aparecer(ch, frame, pop=False)
        for ob in raiz.children:
            aparecer(ob, frame, pop=False)
        luz.data.energy = 0
        luz.data.keyframe_insert("energy", frame=frame - 1)
        luz.data.energy = 60
        luz.data.keyframe_insert("energy", frame=frame + 4)
    if tremula:
        rnd = random.Random(int(x * 13 + y * 7))
        for fr in range((frame or 1) + 6, 1200, 4):
            luz.data.energy = 60 * rnd.uniform(0.75, 1.15)
            luz.data.keyframe_insert("energy", frame=fr)
    return raiz, luz


def fumaca_pequena(pos, frame, n=5):
    mat = material_objeto_cor("fumaca")
    rnd = random.Random(frame)
    for k in range(n):
        ob = caixa("poof", (3, 3, 3), (0, 0, 0), mat, col=colecao("Efeitos"))
        p = Vector(pos) + Vector((rnd.uniform(-.3, .3), rnd.uniform(-.3, .3), rnd.uniform(0, .4)))
        ob.location = p
        ob.color = (0.9, 0.9, 0.9, 0.0)
        ob.keyframe_insert("color", frame=max(1, frame - 1))
        ob.color = (0.9, 0.9, 0.9, 0.9)
        ob.keyframe_insert("color", frame=frame)
        ob.keyframe_insert("location", frame=frame)
        ob.location = p + Vector((0, 0, 0.6))
        ob.keyframe_insert("location", frame=frame + 18)
        ob.color = (0.9, 0.9, 0.9, 0.0)
        ob.keyframe_insert("color", frame=frame + 18)


def volume_fumaca(nome, centro, tamanho, frames_densidade, cor=(0.25, 0.24, 0.23)):
    """Cubo volumétrico de fumaça; frames_densidade = [(frame, densidade), ...]."""
    m = bpy.data.materials.new(nome)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type == "BSDF_PRINCIPLED":
            nt.nodes.remove(n)
    out = nt.nodes.get("Material Output")
    vol = nt.nodes.new("ShaderNodeVolumePrincipled")
    vol.inputs["Color"].default_value = (*cor, 1)
    nz = nt.nodes.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 1.4
    nz.inputs["Detail"].default_value = 6
    rampa = nt.nodes.new("ShaderNodeValToRGB")
    rampa.color_ramp.elements[0].position = 0.45
    grad = nt.nodes.new("ShaderNodeTexGradient")
    grad.gradient_type = "SPHERICAL"
    mult = nt.nodes.new("ShaderNodeMath")
    mult.operation = "MULTIPLY"
    dens = nt.nodes.new("ShaderNodeMath")
    dens.operation = "MULTIPLY"
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    nt.links.new(mp.outputs["Vector"], nz.inputs["Vector"])
    nt.links.new(tc.outputs["Object"], grad.inputs["Vector"])
    nt.links.new(nz.outputs["Fac"], rampa.inputs["Fac"])
    nt.links.new(rampa.outputs["Color"], mult.inputs[0])
    nt.links.new(grad.outputs["Fac"], mult.inputs[1])
    nt.links.new(mult.outputs[0], dens.inputs[0])
    nt.links.new(dens.outputs[0], vol.inputs["Density"])
    nt.links.new(vol.outputs[0], out.inputs["Volume"])
    for fr, d in frames_densidade:
        dens.inputs[1].default_value = d
        dens.inputs[1].keyframe_insert("default_value", frame=fr)
    mp.inputs["Location"].keyframe_insert("default_value", frame=1)
    mp.inputs["Location"].default_value = (0.2, -0.3, -0.8)   # fumaça subindo
    mp.inputs["Location"].keyframe_insert("default_value", frame=600)
    bpy.ops.mesh.primitive_cube_add(size=1, location=centro)
    ob = bpy.context.active_object
    ob.name = nome
    ob.scale = tamanho
    ob.data.materials.append(m)
    return ob


def explosao(m, dyn, centro, raio, frame, intensidade=1.0):
    """Explosão de TNT: remove blocos dinâmicos no raio, solta 'drops', clarão, fumaça."""
    cx, cy, cz = centro
    rnd = random.Random(int(cx * 31 + cy * 17))
    removidos = []
    for p, ob in list(dyn.items()):
        if ob is None:
            continue
        d = math.sqrt((p[0] + .5 - cx) ** 2 + (p[1] + .5 - cy) ** 2 + ((p[2] + .5 - cz) * 1.2) ** 2)
        if d <= raio + rnd.uniform(-0.6, 0.6):
            sumir(ob, frame + int(d * 0.6))
            removidos.append((p, ob))
    # drops: cubinhos girando que caem no chão
    col = colecao("Efeitos")
    for p, ob in removidos:
        if rnd.random() > 0.35:
            continue
        drop = bpy.data.objects.new("drop", ob.data)
        link(drop, col)
        p0 = Vector((p[0] + .5, p[1] + .5, p[2] + .5))
        drop.scale = (0.25, 0.25, 0.25)
        aparecer(drop, frame, pop=False)
        v = (p0 - Vector(centro)).normalized() * rnd.uniform(3, 7) + Vector((0, 0, rnd.uniform(4, 8)))
        chao_z = max(m.chao(int(p0.x + v.x * 0.5), int(p0.y + v.y * 0.5)), cz - raio) + 0.15
        t, pos = 0.0, Vector(p0)
        for k in range(0, 40, 2):
            t = k / FPS
            q = p0 + v * t + Vector((0, 0, -0.5 * 20 * t * t))
            if q.z < chao_z:
                q.z = chao_z
                v *= 0.0
            drop.location = q
            drop.keyframe_insert("location", frame=frame + k)
            pos = q
        for k, fr in enumerate(range(frame + 40, frame + 400, 20)):   # flutuando como item no chão
            drop.location = pos + Vector((0, 0, 0.08 * math.sin(k)))
            drop.keyframe_insert("location", frame=fr)
            drop.rotation_euler = (0, 0, k * 0.8)
            drop.keyframe_insert("rotation_euler", frame=fr)
    # clarão
    luz = luz_ponto("clarao", centro, cor=(1.0, 0.75, 0.45), energia=0, raio=1.5)
    for fr, e in ((frame - 1, 0), (frame, 2.5e5 * intensidade), (frame + 3, 1.2e5 * intensidade), (frame + 14, 0)):
        luz.data.energy = e
        luz.data.keyframe_insert("energy", frame=fr)
    bola = caixa("bola_fogo", (16, 16, 16), (0, 0, 0), material_objeto_cor("bola_fogo", emissao=25), col=col)
    bola.location = centro
    bola.color = (1, 0.8, 0.5, 0)
    bola.keyframe_insert("color", frame=frame - 1)
    bola.color = (1, 0.85, 0.6, 1)
    bola.scale = (0.3, 0.3, 0.3)
    bola.keyframe_insert("color", frame=frame)
    bola.keyframe_insert("scale", frame=frame)
    bola.scale = (raio * 2.2,) * 3
    bola.color = (0.6, 0.25, 0.1, 0)
    bola.keyframe_insert("scale", frame=frame + 10)
    bola.keyframe_insert("color", frame=frame + 10)
    # partículas brancas de explosão do Minecraft
    mat = material_objeto_cor("fumaca_exp")
    for k in range(int(28 * intensidade)):
        pf = caixa("puff", (10, 10, 10), (0, 0, 0), mat, col=col)
        dirv = Vector((rnd.uniform(-1, 1), rnd.uniform(-1, 1), rnd.uniform(-0.2, 1))).normalized()
        pf.location = centro
        pf.color = (0.85, 0.85, 0.85, 0)
        pf.keyframe_insert("color", frame=frame - 1)
        pf.color = (0.92, 0.9, 0.88, 0.95)
        pf.scale = (0.4, 0.4, 0.4)
        pf.keyframe_insert("color", frame=frame + 1)
        pf.keyframe_insert("location", frame=frame + 1)
        pf.keyframe_insert("scale", frame=frame + 1)
        pf.location = Vector(centro) + dirv * raio * rnd.uniform(0.8, 1.6)
        pf.scale = (rnd.uniform(1.2, 2.2),) * 3
        pf.color = (0.4, 0.4, 0.4, 0)
        fim = frame + rnd.randint(20, 40)
        pf.keyframe_insert("location", frame=fim)
        pf.keyframe_insert("scale", frame=fim)
        pf.keyframe_insert("color", frame=fim)
    volume_fumaca("fumaca_explosao", (cx, cy, cz + raio), (raio * 3.5, raio * 3.5, raio * 4),
                  [(1, 0.0), (frame, 0.0), (frame + 8, 3.0 * intensidade), (frame + 90, 1.2 * intensidade),
                   (frame + 400, 0.4 * intensidade)])
    return removidos


def piscar_tnt(ob_tnt, f0, f1):
    """O TNT aceso pisca branco antes de explodir."""
    mat_br = material_cor("tnt_branco", (1, 1, 1), emissao=3)
    clone = bpy.data.objects.new("tnt_flash", malha_bloco("tnt"))
    clone.location = ob_tnt.location
    clone.scale = (1.02, 1.02, 1.02)
    clone.data = clone.data.copy()
    clone.data.materials.clear()
    clone.data.materials.append(mat_br)
    for poly in clone.data.polygons:
        poly.material_index = 0
    link(clone)
    clone.hide_render = True
    clone.keyframe_insert("hide_render", frame=1)
    for k, fr in enumerate(range(f0, f1, 8)):
        clone.hide_render = (k % 2 == 1)
        clone.keyframe_insert("hide_render", frame=fr)
    clone.hide_render = True
    clone.keyframe_insert("hide_render", frame=f1)
    # o TNT inflando
    ob_tnt.keyframe_insert("scale", frame=f1 - 12)
    ob_tnt.scale = (1.15, 1.15, 1.15)
    ob_tnt.keyframe_insert("scale", frame=f1 - 1)
    sumir(ob_tnt, f1)
    return clone


def fogo(pos, f0, f1, tamanho=1.0, luz=True):
    """Chamas (caixas emissivas tremulando) + luz quente piscando."""
    col = colecao("Efeitos")
    mat = material_objeto_cor("chama", emissao=14)
    rnd = random.Random(int(pos[0] * 97 + pos[1] * 31 + pos[2]))
    for k in range(4):
        ch = caixa("chama", (6 * tamanho, 6 * tamanho, 14 * tamanho), (0, 0, 7 * tamanho), mat, col=col)
        ch.location = Vector(pos) + Vector((rnd.uniform(-.3, .3), rnd.uniform(-.3, .3), 0))
        ch.color = (1, 0.5, 0.1, 0)
        ch.keyframe_insert("color", frame=max(1, f0 - 1))
        for fr in range(f0, f1, 3):
            ch.color = (1.0, rnd.uniform(0.35, 0.75), 0.08, rnd.uniform(0.7, 1.0))
            ch.keyframe_insert("color", frame=fr)
            ch.scale = (1, 1, rnd.uniform(0.7, 1.3))
            ch.keyframe_insert("scale", frame=fr)
        ch.color = (1, 0.4, 0.1, 0)
        ch.keyframe_insert("color", frame=f1)
    if luz:
        lz = luz_ponto("fogo_luz", Vector(pos) + Vector((0, 0, 0.8)), cor=(1, 0.5, 0.18), energia=0, raio=0.6)
        lz.data.keyframe_insert("energy", frame=max(1, f0 - 1))
        for fr in range(f0, f1, 3):
            lz.data.energy = 400 * tamanho * rnd.uniform(0.6, 1.2)
            lz.data.keyframe_insert("energy", frame=fr)
        lz.data.energy = 0
        lz.data.keyframe_insert("energy", frame=f1 + 3)


def bandeira(pos, time, frame_sobe=None, rasgada=False):
    """Mastro + estandarte de lã com ondulação (modificador Wave)."""
    col = colecao("Bandeiras")
    x, y, z = pos
    mastro = caixa("mastro", (1.6, 1.6, 80), (0, 0, 40),
                   material("mastro", "oak_planks", cor=(0.5, 0.4, 0.25)), col=col)
    mastro.location = (x, y, z)
    cor = TIME[time]
    me = bpy.data.meshes.new("estandarte")
    w, h = 1.0, 1.9
    verts, faces = [], []
    nx, nz = 6, 12
    for i in range(nx + 1):
        for j in range(nz + 1):
            verts.append((i / nx * w, 0, -j / nz * h))
    for i in range(nx):
        for j in range(nz):
            a = i * (nz + 1) + j
            if rasgada and (i + j * 3) % 7 == 0 and j > nz // 2:
                continue
            faces.append((a, a + nz + 1, a + nz + 2, a + 1))
    me.from_pydata(verts, [], faces)
    mat = material_cor(f"estandarte_{time}" + ("_rasgado" if rasgada else ""),
                       tuple(c * (0.45 if rasgada else 1) for c in cor), rugosidade=0.95)
    definir(mat, "use_backface_culling", False)
    me.materials.append(mat)
    est = bpy.data.objects.new("estandarte", me)
    link(est, col)
    est.parent = mastro
    topo = 80 * PX
    est.location = (0.05, 0, topo)
    if rasgada:
        mastro.rotation_euler = (math.radians(14), math.radians(-9), 0)
    wave = est.modifiers.new("vento", "WAVE")
    wave.use_normal = False
    wave.use_y = True
    wave.use_x = False
    wave.height = 0.12
    wave.width = 0.9
    wave.speed = 0.04 if not rasgada else 0.015
    if frame_sobe:
        est.location = (0.05, 0, 2.0)
        est.keyframe_insert("location", frame=frame_sobe)
        est.location = (0.05, 0, topo)
        est.keyframe_insert("location", frame=frame_sobe + 60)
    return mastro, est


def flecha(p0, p1, f0, f1, altura=2.0, col=None):
    col = col or colecao("Efeitos")
    raiz = pivo("flecha", (0, 0, 0), col=col)
    caixa("haste", (0.6, 9, 0.6), (0, 0, 0), material_cor("haste", (0.45, 0.32, 0.18)), raiz, col)
    caixa("ponta", (1.2, 1.6, 1.2), (0, 5, 0), material_cor("ponta", (0.5, 0.5, 0.55), rugosidade=0.3), raiz, col)
    caixa("pena", (0.3, 2.4, 1.8), (0, -4.2, 0), material_cor("pena", (0.92, 0.92, 0.92)), raiz, col)
    p0, p1 = Vector(p0), Vector(p1)
    aparecer(raiz, f0, pop=False)
    for ob in raiz.children:
        aparecer(ob, f0, pop=False)
    n = max(2, (f1 - f0) // 2)
    ant = p0
    for k in range(n + 1):
        t = k / n
        q = p0.lerp(p1, t) + Vector((0, 0, 4 * altura * t * (1 - t)))
        raiz.location = q
        raiz.keyframe_insert("location", frame=int(f0 + (f1 - f0) * t))
        d = (q - ant) if k else (p0.lerp(p1, 0.05) + Vector((0, 0, 4 * altura * 0.05 * 0.95)) - p0)
        if d.length > 1e-4:
            yaw = math.atan2(-d.x, d.y)
            pitch = math.atan2(d.z, math.hypot(d.x, d.y))
            raiz.rotation_euler = (pitch, 0, yaw)
            raiz.keyframe_insert("rotation_euler", frame=int(f0 + (f1 - f0) * t))
        ant = q
    return raiz


def texto3d(corpo, pos, tamanho=0.3, cor=(1, 1, 1), emissao=2.0, fonte=None, nome="texto", col=None):
    cu = bpy.data.curves.new(nome, "FONT")
    cu.body = corpo
    cu.size = tamanho
    cu.align_x = "LEFT"
    if fonte and os.path.isfile(fonte):
        try:
            cu.font = bpy.data.fonts.load(fonte, check_existing=True)
        except Exception:
            pass
    ob = bpy.data.objects.new(nome, cu)
    ob.location = pos
    ob.rotation_euler = (math.radians(90), 0, 0)
    ob.data.materials.append(material_cor(f"txt_{cor}_{emissao}", cor, emissao=emissao))
    link(ob, col)
    return ob


def placa(pos, texto, yaw=0.0, fonte=None):
    col = colecao("Placas")
    mat = material("placa", "oak_planks", cor=(0.6, 0.48, 0.3))
    raiz = pivo("placa", (0, 0, 0), col=col)
    raiz.location = pos
    raiz.rotation_euler = (0, 0, yaw)
    caixa("placa_tabua", (24, 2, 12), (0, 0, 22), mat, raiz, col)
    caixa("placa_poste", (2, 2, 16), (0, 0, 8), material("poste", "oak_log", cor=(0.4, 0.3, 0.2)), raiz, col)
    t = texto3d(texto, (-0.55, -0.07, 22 * PX - 0.05), tamanho=0.17, cor=(0.08, 0.06, 0.04), emissao=0, fonte=fonte,
                nome="placa_txt", col=col)
    t.parent = raiz
    return raiz


# ---------------------------------------------------------------- cena, céu, câmera, render
def nova_cena(nome, dur_s, cfg):
    bpy.ops.wm.read_homefile(use_empty=True)
    _MATS.clear()
    _MALHA_BLOCO.clear()
    sc = bpy.context.scene
    sc.name = nome
    sc.frame_start = 1
    sc.frame_end = int(dur_s * FPS)
    sc.render.fps = FPS
    sc.render.resolution_x = 3840
    sc.render.resolution_y = 1608          # já no 2.39:1 (o AE só centraliza)
    sc.render.resolution_percentage = int(os.environ.get("MUNDO_RES_PCT", "100"))
    motor = cfg.get("motor", "EEVEE").upper()
    if motor == "CYCLES":
        sc.render.engine = "CYCLES"
        sc.cycles.samples = cfg.get("amostras_cycles", 128)
        definir(sc.cycles, "use_denoising", True)
        definir(sc.cycles, "device", "GPU")
        try:
            prefs = bpy.context.preferences.addons["cycles"].preferences
            for tipo in ("OPTIX", "CUDA", "HIP", "METAL", "ONEAPI"):
                try:
                    prefs.compute_device_type = tipo
                    prefs.get_devices()
                    if any(d.type == tipo for d in prefs.devices):
                        for d in prefs.devices:
                            d.use = True
                        break
                except TypeError:
                    continue
        except Exception:
            pass
    else:
        for eng in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
            if definir(sc.render, "engine", eng):
                break
        ee = sc.eevee
        definir(ee, "taa_render_samples", 64)
        definir(ee, "use_gtao", True)
        definir(ee, "use_raytracing", True)
        definir(ee, "use_shadows", True)
        definir(ee, "use_volumetric_shadows", True)
        definir(ee, "volumetric_tile_size", "4")
        definir(ee, "volumetric_end", 160.0)
        definir(ee, "use_bloom", True)           # Eevee antigo
        definir(ee, "bloom_intensity", 0.04)
        definir(ee, "shadow_cube_size", "2048")
        definir(ee, "shadow_cascade_size", "4096")
    if not definir(sc.render, "use_motion_blur", True):
        definir(sc.eevee, "use_motion_blur", True)
    definir(sc.render, "motion_blur_shutter", 0.5)
    vs = sc.view_settings
    definir(vs, "view_transform", "AgX") or definir(vs, "view_transform", "Filmic")
    definir(vs, "look", "AgX - Medium High Contrast") or definir(vs, "look", "Medium High Contrast")
    im = sc.render.image_settings
    fmt = cfg.get("formato", "PNG").upper()
    im.file_format = "PNG" if fmt == "PNG" else "JPEG"
    im.color_mode = "RGB"
    if fmt == "PNG":
        im.color_depth = "8"
        im.compression = 15
    else:
        im.quality = 95
    pasta = os.path.join(os.environ.get("MUNDO_TRABALHO", "//"), "renders", nome)
    sc.render.filepath = os.path.join(pasta, nome + "_")
    return sc


def ceu(elev_keys, rot_graus=70, forca=1.0, noite=False, neblina=0.0, cor_neblina=(0.9, 0.8, 0.7)):
    """Céu físico (Nishita) com o sol animado: elev_keys = [(seg, elevação_graus), ...]."""
    sc = bpy.context.scene
    w = bpy.data.worlds.new("Ceu")
    sc.world = w
    w.use_nodes = True
    nt = w.node_tree
    bg = nt.nodes.get("Background")
    if noite:
        estrelas(nt, bg)
    sky = nt.nodes.new("ShaderNodeTexSky")
    for tipo in ("NISHITA", "MULTIPLE_SCATTERING", "SINGLE_SCATTERING", "HOSEK_WILKIE"):
        if definir(sky, "sky_type", tipo):
            break
    definir(sky, "sun_rotation", math.radians(rot_graus))
    definir(sky, "sun_disc", True)
    definir(sky, "dust_density", 1.6)
    definir(sky, "air_density", 1.0)
    definir(sky, "altitude", 200)
    if not noite:
        nt.links.new(sky.outputs["Color"], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = forca
    sol = bpy.data.lights.new("Sol", "SUN")
    sol.energy = 4.0
    definir(sol, "angle", math.radians(1.5))
    ob_sol = bpy.data.objects.new("Sol", sol)
    link(ob_sol)
    for seg, el in elev_keys:
        fr = f(seg)
        if hasattr(sky, "sun_elevation"):
            sky.sun_elevation = math.radians(el)
            sky.keyframe_insert("sun_elevation", frame=fr)
        ob_sol.rotation_euler = (math.radians(90 - el), 0, math.radians(rot_graus + 90))
        ob_sol.keyframe_insert("rotation_euler", frame=fr)
        sol.energy = max(0.0, min(4.0, el * 0.45)) if not noite else 0.0
        sol.keyframe_insert("energy", frame=fr)
        # luz quente perto do horizonte
        quente = max(0.0, 1 - el / 25)
        sol.color = (1.0, 0.85 - 0.3 * quente, 0.7 - 0.45 * quente)
        sol.keyframe_insert("color", frame=fr)
        if not noite:
            bg.inputs["Strength"].default_value = forca * (0.12 + 0.88 * max(0, min(1, (el + 4) / 14)))
            bg.inputs["Strength"].keyframe_insert("default_value", frame=fr)
    if neblina > 0:
        bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 10))
        nb = bpy.context.active_object
        nb.name = "Neblina volumetrica"
        nb.scale = (150, 150, 40)
        m = bpy.data.materials.new("neblina")
        m.use_nodes = True
        mt = m.node_tree
        for n in list(mt.nodes):
            if n.type == "BSDF_PRINCIPLED":
                mt.nodes.remove(n)
        v = mt.nodes.new("ShaderNodeVolumePrincipled")
        v.inputs["Density"].default_value = neblina
        v.inputs["Color"].default_value = (*cor_neblina, 1)
        v.inputs["Anisotropy"].default_value = 0.6       # raios de luz / god rays
        mt.links.new(v.outputs[0], mt.nodes.get("Material Output").inputs["Volume"])
        nb.data.materials.append(m)
        definir(nb, "display_type", "BOUNDS")
    return ob_sol, sky


def estrelas(nt, bg):
    """Noite: azul escuro + estrelas pixeladas + lua quadrada."""
    tc = nt.nodes.new("ShaderNodeTexCoord")
    vor = nt.nodes.new("ShaderNodeTexVoronoi")
    vor.inputs["Scale"].default_value = 220
    rampa = nt.nodes.new("ShaderNodeValToRGB")
    rampa.color_ramp.elements[0].position = 0.0
    rampa.color_ramp.elements[0].color = (1, 1, 1, 1)
    rampa.color_ramp.elements[1].position = 0.035
    rampa.color_ramp.elements[1].color = (0, 0, 0, 1)
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.blend_type = "ADD"
    _socket(mix.inputs, "Factor_Float").default_value = 1.0
    _socket(mix.inputs, "A_Color").default_value = (0.004, 0.008, 0.025, 1)
    nt.links.new(tc.outputs["Generated"], vor.inputs["Vector"])
    nt.links.new(vor.outputs["Distance"], rampa.inputs["Fac"])
    nt.links.new(rampa.outputs["Color"], _socket(mix.inputs, "B_Color"))
    nt.links.new(_socket(mix.outputs, "Result_Color"), bg.inputs["Color"])
    bg.inputs["Strength"].default_value = 0.6
    lua = caixa("Lua", (14, 0.1, 14), (0, 0, 0), material_cor("lua", (0.85, 0.88, 1.0), emissao=6))
    lua.scale = (60, 60, 60)
    lua.location = (-120, 260, 140)
    lua.rotation_euler = (math.radians(-20), 0, math.radians(25))
    luar = bpy.data.lights.new("Luar", "SUN")
    luar.energy = 0.25
    luar.color = (0.55, 0.65, 1.0)
    ob = bpy.data.objects.new("Luar", luar)
    ob.rotation_euler = (math.radians(55), 0, math.radians(200))
    link(ob)


class Camera:
    """Câmera cinematográfica: keys de posição + alvo, DOF no alvo, tremor opcional."""

    def __init__(self, lente=35, fstop=2.8, sensor=36):
        cam = bpy.data.cameras.new("Camera")
        cam.lens = lente
        cam.sensor_width = sensor
        cam.clip_end = 1000
        cam.dof.use_dof = True
        cam.dof.aperture_fstop = fstop
        self.ob = bpy.data.objects.new("Camera", cam)
        link(self.ob)
        bpy.context.scene.camera = self.ob
        self.alvo = bpy.data.objects.new("Alvo_camera", None)
        link(self.alvo)
        c = self.ob.constraints.new("TRACK_TO")
        c.target = self.alvo
        c.track_axis = "TRACK_NEGATIVE_Z"
        c.up_axis = "UP_Y"
        cam.dof.focus_object = self.alvo

    def keys(self, lista):
        """lista = [(seg, (x,y,z) posição, (x,y,z) alvo), ...] — interpolação bezier (ease in/out)."""
        for seg, pos, alvo in lista:
            fr = f(seg)
            self.ob.location = pos
            self.ob.keyframe_insert("location", frame=fr)
            self.alvo.location = alvo
            self.alvo.keyframe_insert("location", frame=fr)

    def lente(self, keys):
        for seg, mm in keys:
            self.ob.data.lens = mm
            self.ob.data.keyframe_insert("lens", frame=f(seg))

    def foco_em(self, obj):
        self.ob.data.dof.focus_object = obj

    def tremor(self, s0, s1, amp=0.06, seed=3):
        """Câmera na mão: o alvo do Track To balança um pouco (a câmera segue)."""
        rnd = random.Random(seed)
        for fr in range(f(s0), f(s1), 3):
            self.alvo.delta_location = (rnd.uniform(-amp, amp), rnd.uniform(-amp, amp), rnd.uniform(-amp, amp) * 0.6)
            self.alvo.keyframe_insert("delta_location", frame=fr)

    def solavanco(self, seg, forca=0.25):
        rnd = random.Random(int(seg * 100))
        base = f(seg)
        for k, fr in enumerate(range(base, base + 24, 2)):
            a = forca * (1 - k / 12)
            self.ob.delta_location = (rnd.uniform(-a, a), rnd.uniform(-a, a), rnd.uniform(-a, a))
            self.ob.keyframe_insert("delta_location", frame=fr)
        self.ob.delta_location = (0, 0, 0)
        self.ob.keyframe_insert("delta_location", frame=base + 26)


def salvar_e_renderizar(caminho_blend, renderizar):
    os.makedirs(os.path.dirname(caminho_blend), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=caminho_blend)
    if renderizar:
        os.makedirs(os.path.dirname(bpy.context.scene.render.filepath), exist_ok=True)
        bpy.ops.render.render(animation=True)
