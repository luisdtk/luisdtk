# -*- coding: utf-8 -*-
"""
As 20 cenas 3D do roteiro (uma função por [VISUAL]).

Mapa fixo do "servidor" (mesmo em todas as cenas):
  * rio corre de sul a norte em x ≈ 0  ->  lado SUL = x < 0 (vermelhos), NORTE = x > 0 (azuis)
  * casinha do Ato 1 em (-14, 4); vila nos dois lados; ponte em y = -2
"""
import math
import os
import random

import mc_lib as mc  # importa bpy primeiro (necessário quando o Blender roda como módulo Python)
from mc_lib import f, Personagem, Camera
from mathutils import Vector

CASA = (-14, 4)
VILA_SUL = [(-22, -8), (-12, -16), (-26, 10), (-20, 20)]
VILA_NORTE = [(10, 6), (18, -6), (12, -18), (24, 12)]
PONTE_Y = -2
FONTE_MC = os.environ.get("MUNDO_FONTE_MC", "")


def pe(m, x, y, dx=0.5, dy=0.5):
    return Vector((x + dx, y + dy, m.chao(x, y)))


def mundo_base(seed=7, raio=52, arvores=55, evitar=()):
    m = mc.Mundo(seed)
    m.terreno(raio)
    m.arvores_aleatorias(arvores, raio - 6, evitar=list(evitar) + [(CASA[0] + 2, CASA[1] + 2, 6)])
    return m


def evitar_vila():
    return [(x + 2, y + 2, 6) for x, y in VILA_SUL + VILA_NORTE]


def objs_de(dyn, posicoes):
    return [dyn[p] for p, _ in posicoes if dyn.get(p)]


# ======================================================================= ATO 1
def A1_amanhecer(cfg, dur):
    mc.nova_cena("A1_amanhecer", dur, cfg)
    m = mundo_base()
    m.construir()
    mc.ceu([(0, -1.0), (dur, 7.0)], rot_graus=78, neblina=0.014, cor_neblina=(1.0, 0.82, 0.62))
    rnd = random.Random(4)
    for k in range(6):
        x, y = rnd.randint(-22, -8), rnd.randint(10, 24)
        r, c = mc.ovelha(f"ovelha{k}", pe(m, x, y), yaw=rnd.uniform(0, 6.28))
        mc.ovelha_pastando(r, c, f(0) + k * 9, f(dur), seed=k)
    st = Personagem("Steve", "steve", pe(m, -9, 12), yaw=-math.pi / 2)
    st.respirar(f(0), f(dur))
    st.cabeca_olhar(f(4), yaw=0.35)
    st.cabeca_olhar(f(8), yaw=-0.2, pitch=0.05)
    cam = Camera(lente=32, fstop=4.0)
    alvo = Vector(st.raiz.location) + Vector((0, 0, 1.5))
    cam.keys([(0, (6, -34, 5.5), alvo + Vector((6, 0, 0))), (dur, (-1, -6, 4.2), alvo)])
    cam.lente([(0, 30), (dur, 40)])


def A1_casinha(cfg, dur):
    mc.nova_cena("A1_casinha", dur, cfg)
    m = mundo_base()
    arvore = m.arvore(CASA[0] - 3, CASA[1] - 3, altura=5, dinamico=True)
    casa, z0 = mc.casinha(m, *CASA)
    dyn = m.construir()
    mc.ceu([(0, 18), (dur, 24)], rot_graus=60, neblina=0.006)
    x0, y0 = CASA
    st = Personagem("Steve", "steve", (x0 - 2.5, y0 - 4.5, m.chao(x0 - 3, y0 - 5)))
    st.mirar(f(0), (x0 - 2.5, y0 - 2.5, 0))
    st.golpe(f(0.3), vezes=6)
    tronco = dyn.get((x0 - 3, y0 - 3, m.chao(x0 - 3, y0 - 3) - 0)) or dyn.get(arvore[0][0])
    if tronco:
        mc.sumir(tronco, f(1.9))
        mc.fumaca_pequena(tronco.location, f(1.9))
    blocos = objs_de(dyn, casa)
    mc.construir_em_sequencia(blocos, f(2.8), f(8.6))
    rota = [(x0 - 1.5, y0 - 1.5, z0), (x0 + 6.5, y0 - 1.5, z0), (x0 + 6.5, y0 + 6.5, z0), (x0 - 1.5, y0 + 6.5, z0),
            (x0 + 2.5, y0 - 2.0, z0)]
    fr = st.andar(rota, f(2.6), vel=1.4)
    for fr_g in range(f(2.8), min(fr, f(8.6)), 14):
        st.golpe(fr_g)
    mc.tocha((x0 + 2.5, y0 + 3.5, z0 + 1.5), frame=f(9.0))
    mc.tocha((x0 + 1.5, y0 - 0.6, z0 + 1.5), frame=f(9.4))
    cam = Camera(lente=30, fstop=5.6)
    centro = (x0 + 2.5, y0 + 2.5, z0 + 2)
    cam.keys([(0, (x0 - 10, y0 - 12, z0 + 6), (x0 - 2.5, y0 - 3, z0 + 2)),
              (4.5, (x0 - 4, y0 - 13, z0 + 7), centro),
              (dur, (x0 + 9, y0 - 9, z0 + 6), centro)])


def A1_noite_zumbis(cfg, dur):
    mc.nova_cena("A1_noite_zumbis", dur, cfg)
    m = mundo_base()
    casa, z0 = mc.casinha(m, *CASA, dinamico=False)
    m.construir()
    mc.ceu([(0, -14), (dur, -14)], rot_graus=200, noite=True, neblina=0.01, cor_neblina=(0.35, 0.45, 0.7))
    x0, y0 = CASA
    mc.tocha((x0 + 1.5, y0 + 3.5, z0 + 1.5))
    st = Personagem("Steve", "steve", (x0 + 3.0, y0 + 2.5, z0), yaw=-math.pi / 2)
    st.respirar(f(0), f(dur))
    rnd = random.Random(2)
    for k in range(5):
        a0 = rnd.uniform(0, 6.28)
        pts = []
        for j in range(4):
            a = a0 + j * 0.7
            pts.append((x0 + 2.5 + 7.5 * math.cos(a), y0 + 2.5 + 7.5 * math.sin(a), 0))
        pts = [(x, y, m.chao(int(math.floor(x)), int(math.floor(y)))) for x, y, _ in pts]
        z = Personagem(f"Zumbi{k}", "zumbi", pts[0], zumbi=True)
        z.andar(pts[1:], f(0) + k * 7, vel=0.7, balanco=0.4)
    cam = Camera(lente=45, fstop=2.0)
    janela = (x0 + 4.5, y0 + 2.5, z0 + 1.5)
    cam.keys([(0, (x0 + 14, y0 - 6, z0 + 2.2), (x0 + 8, y0 + 1, z0 + 1.4)),
              (dur, (x0 + 6.6, y0 + 2.2, z0 + 1.7), (x0 + 3.0, y0 + 2.5, z0 + 1.55))])
    cam.foco_em(st.cabeca)
    mc.luz_ponto("luz_janela", janela, cor=(1, 0.65, 0.35), energia=40, raio=0.4)


def A1_segundo_jogador(cfg, dur):
    mc.nova_cena("A1_segundo_jogador", dur, cfg)
    m = mundo_base()
    casa, z0 = mc.casinha(m, *CASA, dinamico=False)
    m.construir()
    mc.ceu([(0, 1.5), (dur, 6)], rot_graus=85, neblina=0.012, cor_neblina=(1.0, 0.8, 0.6))
    x0, y0 = CASA
    st = Personagem("Steve", "steve", (x0 + 2.5, y0 - 3.0, m.chao(x0 + 2, y0 - 3)), yaw=-math.pi / 2)
    al = Personagem("Alex", "alex", pe(m, 34, -3))
    fr = al.andar([pe(m, 22, -3)], f(1.0), vel=2.2)
    al.mirar(fr + 6, st.raiz.location)
    st.cabeca_olhar(f(3), yaw=0.0)
    al.agachar(f(6.8), dur=6)
    al.agachar(f(7.8), dur=6)
    cam = Camera(lente=85, fstop=2.8)
    ombro = Vector(st.raiz.location) + Vector((-2.2, -1.3, 1.95))
    alvo = Vector(al.raiz.location) + Vector((-6, 0, 1.4))
    cam.keys([(0, ombro, alvo), (dur, ombro + Vector((0.4, 0.5, 0.05)), Vector(pe(m, 22, -3)) + Vector((0, 0, 1.3)))])
    cam.foco_em(al.cabeca)


# ======================================================================= ATO 2
def _vila(m, dinamico, todas=True):
    casas = []
    for (x, y) in (VILA_SUL + VILA_NORTE if todas else VILA_SUL):
        pos, z0 = mc.casinha(m, x, y, dinamico=dinamico)
        casas.append(((x, y), pos, z0))
    return casas


def A2_servidor_cresce(cfg, dur):
    mc.nova_cena("A2_servidor_cresce", dur, cfg)
    m = mundo_base(evitar=evitar_vila())
    casas = _vila(m, dinamico=True)
    pt = mc.ponte(m, PONTE_Y, -6, 6)
    fazenda = []
    for x in range(-34, -27):
        for y in range(-26, -20):
            z = m.altura(x, y)
            m.por(x, y, z, "farmland")
            m.por(x, y, z + 1, "wheat")
            fazenda += [((x, y, z), "farmland"), ((x, y, z + 1), "wheat")]
    m.marcar_dinamico([p for p, _ in fazenda])
    dyn = m.construir()
    mc.ceu([(0, 8), (dur * 0.5, 55), (dur, 12)], rot_graus=40, neblina=0.005)
    for k, (_, pos, _) in enumerate(casas):
        ini = 0.5 + k * 1.15
        mc.construir_em_sequencia(objs_de(dyn, pos), f(ini), f(ini + 3.2))
    mc.construir_em_sequencia(objs_de(dyn, pt), f(3.0), f(7.5), ordem=lambda o: o.location.x)
    mc.construir_em_sequencia(objs_de(dyn, fazenda), f(6.0), f(9.0), ordem=lambda o: (o.location.z, o.location.x))
    pl = mc.placa(pe(m, -8, PONTE_Y - 2), "BEM-VINDO", yaw=0, fonte=FONTE_MC)
    for ob in [pl] + list(pl.children_recursive):
        mc.aparecer(ob, f(9.5), pop=False)
    rnd = random.Random(8)
    skins = ["steve", "alex", "aldeao1", "aldeao2", "aldeao3"]
    for k in range(12):
        lado = -1 if k % 2 == 0 else 1
        x, y = lado * rnd.randint(8, 26), rnd.randint(-24, 22)
        p = Personagem(f"Jogador{k}", skins[k % len(skins)], pe(m, x, y))
        pts = [pe(m, lado * rnd.randint(8, 26), rnd.randint(-24, 22)) for _ in range(3)]
        fr = p.andar(pts, f(rnd.uniform(0, 3)), vel=3.0)
        p.golpe(min(fr, f(dur - 1)), vezes=2)
    for k, (x, y) in enumerate([(-7, -6), (-7, 3), (7, -6), (7, 3), (-16, -2), (16, -2)]):
        mc.tocha((x + 0.5, y + 0.5, m.chao(x, y) + 0.5), frame=f(10 + k * 0.3))
    cam = Camera(lente=28, fstop=8)
    cam.keys([(0, (-42, -44, 30), (-4, 0, 2)), (dur * 0.5, (6, -50, 27), (0, -2, 2)), (dur, (40, -24, 26), (2, 0, 2))])


def A2_tnt(cfg, dur):
    mc.nova_cena("A2_tnt", dur, cfg)
    m = mundo_base(evitar=evitar_vila())
    casas = _vila(m, dinamico=False)
    x0, y0 = VILA_SUL[0]
    z0 = casas[0][2]
    centro = (x0 + 2.5, y0 + 0.5, z0 + 0.5)
    regiao = [p for p in m.b if math.dist((p[0] + .5, p[1] + .5, p[2] + .5), centro) < 6.0]
    m.marcar_dinamico(regiao)
    m.por(x0 + 2, y0, z0, "tnt")
    m.marcar_dinamico([(x0 + 2, y0, z0)])
    dyn = m.construir()
    mc.ceu([(0, 30), (dur, 26)], rot_graus=120, neblina=0.007)
    tnt = dyn[(x0 + 2, y0, z0)]
    mc.aparecer(tnt, f(2.0))
    gr = Personagem("Griefer", "griefer", pe(m, x0 - 8, y0 - 6))
    fr = gr.andar([(x0 + 2.5, y0 - 1.6, z0)], f(0), vel=3.4)
    gr.mirar(fr, centro)
    gr.golpe(f(2.0) - 3)
    gr.andar([pe(m, x0 - 12, y0 - 14)], f(2.4), vel=4.5)
    mc.piscar_tnt(tnt, f(3.0), f(7.0))
    mc.explosao(m, dyn, centro, 4.3, f(7.0))
    for k, (x, y) in enumerate([(x0 + 10, y0 + 4), (x0 + 6, y0 - 7), (x0 + 13, y0 - 2)]):
        o = Personagem(f"Observador{k}", ["alex", "aldeao1", "aldeao2"][k], pe(m, x, y))
        fr = o.andar([pe(m, x + 2, y + (k - 1) * 2)], f(0.5 + k), vel=1.5)
        o.mirar(f(7.4 + k * 0.3), centro)
        o.cabeca_olhar(f(7.6 + k * 0.3), pitch=-0.15)
    cam = Camera(lente=35, fstop=5.6)
    cam.keys([(0, (x0 + 14, y0 - 16, z0 + 6), (x0 + 2, y0, z0 + 1.5)),
              (7.0, (x0 + 13, y0 - 15, z0 + 6), (x0 + 2, y0, z0 + 1.5)),
              (dur, (x0 + 9, y0 - 11, z0 + 4.5), (x0 + 2, y0, z0 + 0.5))])
    cam.solavanco(7.0, forca=0.35)


def _mundo_cratera(seed=7):
    m = mundo_base(evitar=evitar_vila())
    casas = _vila(m, dinamico=False)
    x0, y0 = VILA_SUL[0]
    z0 = casas[0][2]
    centro = (x0 + 2.5, y0 + 0.5, z0 + 0.5)
    for p in [p for p in m.b if math.dist((p[0] + .5, p[1] + .5, p[2] + .5), (centro[0], centro[1] + 2, centro[2])) < 4.5]:
        m.tirar(*p)
    mc.cratera(m, *centro, 4.3)
    return m, (x0, y0, z0), centro


def A2_dono_volta(cfg, dur):
    mc.nova_cena("A2_dono_volta", dur, cfg)
    m, (x0, y0, z0), centro = _mundo_cratera()
    m.construir()
    mc.ceu([(0, 12), (dur, 10)], rot_graus=150, neblina=0.012, cor_neblina=(0.8, 0.78, 0.75))
    mc.volume_fumaca("fumaca_residual", (centro[0], centro[1], centro[2] + 3), (9, 9, 7), [(1, 0.25)])
    st = Personagem("Steve", "steve", pe(m, x0 - 12, y0 - 4))
    borda = (centro[0] - 1.0, centro[1] - 5.5, m.chao(int(centro[0] - 1), int(centro[1] - 5.5)))
    fr = st.andar([borda], f(0), vel=2.0)
    st.mirar(fr + 2, centro)
    st.cabeca_olhar(f(4.2), pitch=-0.45)
    cam = Camera(lente=50, fstop=2.0)
    fundo = Vector((centro[0], centro[1], centro[2] - 1.5))
    cara = Vector(borda) + Vector((0, 0, 1.6))
    cam.keys([(0, fundo + Vector((1.5, 1.5, 0.6)), cara), (dur, fundo + Vector((0.4, -1.5, 1.2)), cara)])
    cam.lente([(0, 45), (dur, 70)])
    cam.foco_em(st.cabeca)


def A2_bunker(cfg, dur):
    mc.nova_cena("A2_bunker", dur, cfg)
    m, (x0, y0, z0), centro = _mundo_cratera()
    paredes, lava, zb = mc.bunker(m, int(centro[0]), int(centro[1]) + 1, lado=7, altura=4)
    dyn = m.construir()
    mc.ceu([(0, 8), (dur, 4)], rot_graus=160, neblina=0.01, cor_neblina=(0.85, 0.7, 0.6))
    mc.construir_em_sequencia(objs_de(dyn, paredes), f(0.5), f(7.2))
    mc.construir_em_sequencia(objs_de(dyn, lava), f(8.0), f(8.6))
    frente = Vector((centro[0], centro[1] - 5.5, zb))
    st = Personagem("Steve", "steve", frente, yaw=0)
    for fr in range(f(0.5), f(8.7), 9):
        st.golpe(fr)
    cam = Camera(lente=35, fstop=4.0)
    cam.keys([(0, frente + Vector((1.5, -12, 2.5)), Vector((centro[0], centro[1] + 1, zb + 2))),
              (dur, frente + Vector((0.5, -7, 1.4)), Vector((centro[0], centro[1] - 3, zb + 0.5)))])


def A2_vila_bunkers(cfg, dur):
    mc.nova_cena("A2_vila_bunkers", dur, cfg)
    m = mundo_base(evitar=evitar_vila())
    casas = _vila(m, dinamico=False)
    muros = [mc.muro_em_volta(m, x + 2, y + 2, 4, altura=3) for (x, y), _, _ in casas]
    dyn = m.construir()
    mc.ceu([(0, 6), (dur, 0.5)], rot_graus=190, neblina=0.012, cor_neblina=(0.85, 0.6, 0.45))
    ordem = list(range(len(muros)))
    random.Random(3).shuffle(ordem)
    for k, i in enumerate(ordem):
        ini = 0.8 + k * 1.15
        mc.construir_em_sequencia(objs_de(dyn, muros[i]), f(ini), f(ini + 1.6))
        (x, y), _, z0 = casas[i]
        mc.tocha((x + 2.5, y - 1.5, m.chao(x + 2, y - 2) + 2.5), frame=f(ini + 1.7))
    cam = Camera(lente=30, fstop=8)
    cam.keys([(0, (-4, -34, 18), (-2, -1, 1)), (dur, (-6, -56, 38), (-2, 0, 0))])


# ======================================================================= ATO 3
def A3_chat3d(cfg, dur):
    import roteiro
    mc.nova_cena("A3_chat3d", dur, cfg)
    mc.ceu([(0, -20)], noite=True)
    # bokeh ao fundo: tochas e lava fora de foco
    rnd = random.Random(5)
    for k in range(14):
        p = (rnd.uniform(-6, 6), rnd.uniform(8, 18), rnd.uniform(-2.5, 2.5))
        cor = (1, 0.5, 0.15) if k % 3 else (1, 0.3, 0.05)
        mc.caixa("brilho", (8, 8, 8), (0, 0, 0), mc.material_cor(f"brilho{k % 3}", cor, emissao=12)).location = p
    painel = mc.caixa("painel_chat", (60, 0.2, 34), (0, 0, 0), mc.material_cor("painel", (0, 0, 0), alpha=0.55))
    painel.scale = (1.6, 1, 1.4)
    painel.location = (0, 0.05, 0)
    rolo = mc.pivo("rolagem", (0, 0, 0))
    linhas = roteiro.CHAT["rolando"]
    lh = 0.17
    t_dest = 6.0
    for i, (nome, msg) in enumerate(linhas):
        ti = 0.4 + i * 0.5
        txt = f"<{nome}> {msg}"
        ob = mc.texto3d(txt, (-2.4, 0, -1.0 + -i * lh * 0 - 0), tamanho=0.11, cor=(1, 1, 1), emissao=1.5,
                        fonte=FONTE_MC, nome=f"chat{i}")
        ob.parent = rolo
        ob.location = (-2.4, 0, -1.05 - i * lh)
        mc.aparecer(ob, f(ti), pop=False)
        rolo.location = (0, 0, (i - 1) * lh if i else 0)
        rolo.keyframe_insert("location", frame=max(1, f(ti) - 3))
        rolo.location = (0, 0, i * lh)
        rolo.keyframe_insert("location", frame=f(ti))
        if msg == roteiro.CHAT["destaque"]:
            vermelho = mc.texto3d(txt, (0, 0, 0), tamanho=0.11, cor=(1, 0.18, 0.12), emissao=9,
                                  fonte=FONTE_MC, nome="chat_destaque")
            vermelho.location = (-2.4, -0.02, -1.05 - i * lh + (len(linhas) - 1) * lh)
            mc.aparecer(vermelho, f(t_dest), pop=False)
            mc.sumir(ob, f(t_dest))
            vermelho.keyframe_insert("location", frame=f(t_dest))
            vermelho.keyframe_insert("scale", frame=f(t_dest))
            vermelho.location = (-2.5, -0.15, 0.95)
            vermelho.scale = (1.25, 1.25, 1.25)
            vermelho.keyframe_insert("location", frame=f(t_dest + 1.2))
            vermelho.keyframe_insert("scale", frame=f(t_dest + 1.2))
            mc.luz_ponto("luz_raiva", (0, -0.6, 0.9), cor=(1, 0.2, 0.1), energia=0)
    cam = Camera(lente=50, fstop=1.6)
    cam.keys([(0, (0.6, -6.5, -0.3), (0, 0, -0.2)), (dur, (0.1, -3.4, 0.2), (-0.6, 0, 0.6))])


def A3_quarto_bunker(cfg, dur):
    mc.nova_cena("A3_quarto_bunker", dur, cfg)
    m = mc.Mundo(3)
    for x in range(-6, 7):
        for y in range(-6, 7):
            m.por(x, y, -1, "stone")
    for z in range(0, 4):
        for x in range(-3, 4):
            for y in range(-3, 4):
                if max(abs(x), abs(y)) == 3 and not (x == 3 and y == 0 and z == 2):   # fresta
                    m.por(x, y, z, "cobblestone")
    for x in range(-3, 4):
        for y in range(-3, 4):
            m.por(x, y, 4, "stone")
    m.por(5, 0, 1, "lava")
    m.por(5, 1, 1, "lava")
    m.construir()
    mc.ceu([(0, -20)], noite=True)
    mc.tocha((-2.5, 2.4, 2.4))
    mc.luz_ponto("lava_fora", (4.6, 0.5, 2.2), cor=(1, 0.35, 0.08), energia=120, raio=0.5)
    st = Personagem("Steve", "steve", (0.5, -0.6, 0), yaw=0)
    st.cabeca_olhar(f(0), pitch=-0.1)
    st.cabeca_olhar(f(dur), pitch=-0.18, yaw=0.05)
    tela = mc.caixa("tela_chat", (22, 0.2, 13), (0, 0, 0), mc.material_cor("tela", (0.9, 0.85, 0.85), emissao=3))
    tela.location = (0.5, 1.2, 1.5)
    rnd = random.Random(9)
    luz = mc.luz_ponto("luz_tela", (0.5, 1.0, 1.5), cor=(1, 0.75, 0.75), energia=25, raio=0.6)
    for fr in range(f(0), f(dur), 6):
        luz.data.energy = rnd.uniform(14, 34)
        luz.data.keyframe_insert("energy", frame=fr)
    cam = Camera(lente=40, fstop=1.8)
    cam.keys([(0, (-2.2, -2.6, 1.9), (0.5, 0.6, 1.5)), (dur, (-0.9, -0.2, 1.75), (0.5, -0.4, 1.62))])
    cam.foco_em(st.cabeca)


# ======================================================================= ATO 4
def _times(m, n=5, x_azul=7, x_verm=-8, y0=-8):
    azuis, vermelhos = [], []
    for k in range(n):
        y = y0 + k * 3
        a = Personagem(f"Azul{k}", ["steve", "alex", "aldeao1", "aldeao2", "aldeao3"][k], pe(m, x_azul + k % 2, y),
                       yaw=math.pi / 2, armadura="azul")
        v = Personagem(f"Vermelho{k}", ["aldeao3", "aldeao2", "steve", "alex", "aldeao1"][k], pe(m, x_verm - k % 2, y),
                       yaw=-math.pi / 2, armadura="vermelho")
        azuis.append(a)
        vermelhos.append(v)
    return azuis, vermelhos


def A4_faccoes(cfg, dur):
    mc.nova_cena("A4_faccoes", dur, cfg)
    m = mundo_base(arvores=35)
    m.construir()
    mc.ceu([(0, 16), (dur, 14)], rot_graus=10, neblina=0.009, cor_neblina=(0.75, 0.55, 0.5))
    for k, y in enumerate((-10, 0, 10)):
        mc.bandeira(pe(m, 9, y), "azul", frame_sobe=f(1.5 + k))
        mc.bandeira(pe(m, -10, y), "vermelho", frame_sobe=f(1.8 + k))
    azuis, verms = _times(m)
    for k, (a, v) in enumerate(zip(azuis, verms)):
        a.andar([Vector(a.raiz.location) + Vector((-1.5, 0, 0))], f(0.2 + k * 0.3), vel=1.2)
        v.andar([Vector(v.raiz.location) + Vector((1.5, 0, 0))], f(0.3 + k * 0.3), vel=1.2)
    cam = Camera(lente=26, fstop=5.6)
    cam.keys([(0, (0.5, -24, 1.4), (0, 0, 2.2)), (dur, (0.5, -14, 1.7), (0, 2, 2.4))])


def A4_arvore(cfg, dur):
    mc.nova_cena("A4_arvore", dur, cfg)
    m = mundo_base(arvores=35)
    arv = m.arvore(8, 16, altura=5, dinamico=True)
    dyn = m.construir()
    mc.ceu([(0, 20), (dur, 18)], rot_graus=20, neblina=0.008, cor_neblina=(0.8, 0.6, 0.55))
    az = Personagem("Azul", "steve", pe(m, 8, 13), yaw=0, armadura="azul")
    az.golpe(f(0.4), vezes=14)
    logs = sorted([dyn[p] for p, t in arv if t == "oak_log" and dyn.get(p)], key=lambda o: o.location.z)
    for k, o in enumerate(logs):
        mc.sumir(o, f(1.0 + k * 0.7))
        mc.fumaca_pequena(o.location, f(1.0 + k * 0.7), n=3)
    folhas = [dyn[p] for p, t in arv if t == "oak_leaves" and dyn.get(p)]
    rnd = random.Random(1)
    for o in folhas:
        mc.sumir(o, f(rnd.uniform(4.2, 8.5)))
    verms = []
    for k in range(3):
        v = Personagem(f"Vermelho{k}", ["alex", "aldeao1", "aldeao2"][k], pe(m, -9, 12 + k * 2.5), yaw=-math.pi / 2,
                       armadura="vermelho")
        v.mirar(f(4.6 + k * 0.25), (8.5, 16.5, 2))
        verms.append(v)
    verms[1].apontar(f(5.2), dur=40)
    cam = Camera(lente=38, fstop=4.0)
    cam.keys([(0, (3, 6, 3.5), (8.5, 16, 3.5)), (dur, (0, 9, 3.0), (6, 15, 2.5))])


def A4_ponte(cfg, dur):
    mc.nova_cena("A4_ponte", dur, cfg)
    m = mundo_base(arvores=30)
    pt = mc.ponte(m, PONTE_Y, -6, 6)
    dyn = m.construir()
    mc.ceu([(0, 4), (dur, 2)], rot_graus=95, neblina=0.012, cor_neblina=(0.85, 0.45, 0.35))
    az = Personagem("Azul", "steve", (1.5, PONTE_Y + 1.5, 2), yaw=math.pi / 2, armadura="azul")
    vm = Personagem("Vermelho", "alex", (-0.5, PONTE_Y + 1.5, 2), yaw=-math.pi / 2, armadura="vermelho")
    # cada um quebra o bloco à frente (em direção ao meio) e recua para o próprio lado
    az.mirar(f(0), (-5, PONTE_Y + 1.5, 2))
    vm.mirar(f(0), (5, PONTE_Y + 1.5, 2))
    passos = 6
    for k in range(passos + 1):
        t = 1.0 + k * 1.55
        for x_quebra, quem in ((k, az), (-k - 1 if k < passos else -6, vm)):
            if quem is az and x_quebra > 6:
                continue
            quem.golpe(f(t) - 6, vezes=1)
            for dy in (0, 1, 2):
                o = dyn.get((x_quebra, PONTE_Y + dy, 2)) or dyn.get((x_quebra, PONTE_Y + dy, 1))
                if o:
                    mc.sumir(o, f(t))
                    mc.fumaca_pequena(o.location, f(t), n=2)
        az.andar([(k + 2.5, PONTE_Y + 1.5, 2)], f(t) + 3, vel=2.0)
        az.mirar(f(t) + 12, (-5, PONTE_Y + 1.5, 2))
        vm.andar([(-k - 1.5 - 0.5, PONTE_Y + 1.5, 2)], f(t) + 3, vel=2.0)
        vm.mirar(f(t) + 12, (5, PONTE_Y + 1.5, 2))
    cam = Camera(lente=55, fstop=4.0)
    cam.keys([(0, (0.3, -20, 0.9), (0.3, PONTE_Y + 1, 2.2)), (dur, (0.3, -15, 1.2), (0.3, PONTE_Y + 1, 2.0))])


def A4_batalha(cfg, dur):
    mc.nova_cena("A4_batalha", dur, cfg)
    m = mundo_base(arvores=25)
    bx, by = -12, -14
    regiao = [p for p in m.b if math.dist((p[0], p[1], p[2]), (bx, by, m.chao(bx, by))) < 5.5]
    m.marcar_dinamico(regiao)
    dyn = m.construir()
    mc.ceu([(0, 3), (dur, 0.5)], rot_graus=100, neblina=0.014, cor_neblina=(0.8, 0.35, 0.25))
    azuis, verms = _times(m)
    rnd = random.Random(11)
    todos = azuis + verms
    for p in todos:
        for fr in range(f(rnd.uniform(0, 1.5)), f(dur), int(rnd.uniform(40, 70))):
            p.golpe(fr)
            p.cabeca_olhar(fr, yaw=rnd.uniform(-0.3, 0.3))
    for k in range(34):   # flechas em câmera lenta (voo de 1,6 a 2,4 s)
        a, v = rnd.choice(azuis), rnd.choice(verms)
        src, dst = (a, v) if k % 2 else (v, a)
        t0 = rnd.uniform(0, dur - 2.5)
        p0 = Vector(src.raiz.location) + Vector((0, 0, 1.5))
        p1 = Vector(dst.raiz.location) + Vector((rnd.uniform(-1.5, 1.5), rnd.uniform(-1.5, 1.5), 0.8))
        mc.flecha(p0, p1, f(t0), f(t0 + rnd.uniform(1.6, 2.4)), altura=rnd.uniform(1.2, 3))
    for (x, y, t0) in [(-9, 4, 0.5), (10, -10, 2.0), (-14, 8, 4.0), (11, 6, 6.0), (-6, -16, 9.0)]:
        mc.fogo((x + 0.5, y + 0.5, m.chao(x, y)), f(t0), f(dur), tamanho=1.2)
    tnt = mc.bloco_obj("tnt", (bx, by, m.chao(bx, by)))
    mc.aparecer(tnt, f(5.0))
    mc.piscar_tnt(tnt, f(5.5), f(8.0))
    mc.explosao(m, dyn, (bx + .5, by + .5, m.chao(bx, by) + .5), 4.5, f(8.0), intensidade=1.3)
    cam = Camera(lente=32, fstop=3.2)
    cam.keys([(0, (-3, -26, 2.6), (0, -8, 2)), (dur * 0.5, (1, -12, 3.2), (-4, -6, 2)), (dur, (3, 4, 3), (0, 8, 2))])
    cam.tremor(0, dur, amp=0.12)
    cam.solavanco(8.0, forca=0.4)


def A4_casinha_chamas(cfg, dur):
    mc.nova_cena("A4_casinha_chamas", dur, cfg)
    m = mundo_base()
    casa, z0 = mc.casinha(m, *CASA, dinamico=False)
    m.construir()
    mc.ceu([(0, -6)], rot_graus=200, noite=True, neblina=0.012, cor_neblina=(0.6, 0.3, 0.2))
    x0, y0 = CASA
    for (dx, dy, dz) in [(0, 0, 3), (2, 1, 4), (4, 4, 3), (1, 4, 3), (2, 2, 5), (4, 0, 1), (0, 3, 1), (3, 0, 2)]:
        mc.fogo((x0 + dx + 0.5, y0 + dy + 0.5, z0 + dz + 1), f(0), f(dur) + 30, tamanho=1.4)
    mc.volume_fumaca("fumaca_casa", (x0 + 2.5, y0 + 2.5, z0 + 9), (8, 8, 10), [(1, 1.6)])
    cam = Camera(lente=35, fstop=2.8)
    cam.keys([(0, (x0 - 6, y0 - 11, z0 + 3.2), (x0 + 2.5, y0 + 2.5, z0 + 3)),
              (dur, (x0 - 3, y0 - 6.5, z0 + 2.4), (x0 + 2.5, y0 + 2.5, z0 + 3.5))])


# ======================================================================= ATO 5
def A5_drone_ruinas(cfg, dur):
    mc.nova_cena("A5_drone_ruinas", dur, cfg)
    m = mundo_base(arvores=30, evitar=evitar_vila())
    _vila(m, dinamico=False)
    for (x, y) in VILA_SUL[:2] + VILA_NORTE[:2]:
        mc.bunker(m, x + 2, y + 2, lado=7, altura=3, lava=False)
    crateras = [(-20, -6), (-10, -14), (12, 8), (19, -4), (-25, 12), (2, 22)]
    for k, (x, y) in enumerate(crateras):
        z = m.chao(x, y)
        mc.cratera(m, x, y, z, 3.8 + (k % 3) * 0.6)
        if k % 2 == 0:
            zb = m.chao(x, y)
            for dx in (-1, 0, 1):
                for dy in (-1, 0):
                    m.por(x + dx, y + dy, zb, "lava")
    m.dinamicos.clear()
    m.construir()
    mc.ceu([(0, 6), (dur, 11)], rot_graus=80, neblina=0.016, cor_neblina=(0.72, 0.72, 0.74))
    for k, (x, y) in enumerate(crateras[:4]):
        mc.volume_fumaca(f"fumaca{k}", (x, y, m.chao(x, y) + 8), (4, 4, 16), [(1, 0.9)], cor=(0.2, 0.2, 0.2))
    for k, (x, y) in enumerate([(-11, 0), (9, -11), (-10, 10), (9, 10)]):
        mc.bandeira(pe(m, x, y), "vermelho" if x < 0 else "azul", rasgada=True)
    for (x, y) in [(-20, -6), (-25, 12)]:
        mc.fogo((x + 0.5, y + 0.5, m.chao(x, y)), f(0), f(dur) + 20, tamanho=0.6)
    cam = Camera(lente=24, fstop=8)
    cam.keys([(0, (-44, -40, 24), (-14, -10, 0)), (dur, (6, 2, 19), (24, 18, 0))])


def _cratera_para_tapar(m, cx, cy):
    z = m.chao(cx, cy)
    rem = mc.cratera(m, cx, cy, z, 3.6)
    fundo = sorted(rem, key=lambda p: (p[2], math.dist(p[:2], (cx, cy))))
    return z, fundo


def A5_tapando_cratera(cfg, dur):
    mc.nova_cena("A5_tapando_cratera", dur, cfg)
    m = mundo_base(arvores=30)
    cx, cy = -18, -6
    z, fundo = _cratera_para_tapar(m, cx, cy)
    tapar = fundo[:12]
    for p in tapar:
        m.por(*p, "dirt")
    m.marcar_dinamico(tapar)
    dyn = m.construir()
    mc.ceu([(0, 9), (dur, 12)], rot_graus=70, neblina=0.01, cor_neblina=(1.0, 0.85, 0.65))
    st = Personagem("Steve", "steve", pe(m, cx + 4, cy - 4))
    for k, p in enumerate(tapar):
        t = 1.0 + k * 0.8
        o = dyn.get(p)
        if o:
            mc.aparecer(o, f(t))
        st.mirar(f(t) - 4, (p[0] + .5, p[1] + .5, p[2]))
        st.golpe(f(t) - 3)
    cam = Camera(lente=30, fstop=3.5)
    cam.keys([(0, (cx - 6, cy + 7, z + 1.5), (cx + 1, cy - 1, z - 1.5)), (dur, (cx - 4.5, cy + 5, z + 1.1), (cx + 2, cy - 2, z))])
    cam.foco_em(st.cabeca)


def A5_tres_trabalham(cfg, dur):
    mc.nova_cena("A5_tres_trabalham", dur, cfg)
    m = mundo_base(arvores=30)
    cx, cy = -18, -6
    z, fundo = _cratera_para_tapar(m, cx, cy)
    for p in fundo[:12]:
        m.por(*p, "dirt")
    tapar = fundo[12:34]
    for p in tapar:
        m.por(*p, "dirt")
    m.marcar_dinamico(tapar)
    dyn = m.construir()
    mc.ceu([(0, 12), (dur, 15)], rot_graus=70, neblina=0.009, cor_neblina=(1.0, 0.85, 0.65))
    st = Personagem("Steve", "steve", pe(m, cx + 3, cy - 3))
    vm = Personagem("Vermelho", "alex", pe(m, cx - 14, cy - 10), armadura="vermelho")
    az = Personagem("Azul", "aldeao1", pe(m, cx + 4, cy + 14), armadura="azul")
    fr = vm.andar([pe(m, cx - 4, cy - 4)], f(0), vel=2.0)
    vm.mirar(fr, st.raiz.location)
    vm.tirar_armadura(f(3.2))
    fr = az.andar([pe(m, cx + 4, cy + 4)], f(5.5), vel=2.2)
    az.mirar(fr, st.raiz.location)
    az.tirar_armadura(f(8.3))
    trabalhadores = [(st, 0.6), (vm, 5.0), (az, 9.2)]
    k = 0
    for p in tapar:
        quem, ini = trabalhadores[k % 3]
        t = ini + (k // 3) * 0.9
        if t > dur - 0.5:
            t = 0.6 + k * 0.45
            quem = st
        o = dyn.get(p)
        if o:
            mc.aparecer(o, f(t))
        quem.mirar(f(t) - 4, (p[0] + .5, p[1] + .5, p[2]))
        quem.golpe(f(t) - 3)
        k += 1
    cam = Camera(lente=35, fstop=4.0)
    cam.keys([(0, (cx - 9, cy - 13, z + 3.5), (cx, cy, z)), (dur * 0.5, (cx + 1, cy - 14, z + 4), (cx, cy, z)),
              (dur, (cx + 10, cy - 9, z + 3.5), (cx, cy, z + 0.5))])


def A5_casinha_janela_grande(cfg, dur):
    mc.nova_cena("A5_casinha_janela_grande", dur, cfg)
    m = mundo_base()
    casa, z0 = mc.casinha(m, *CASA, janela_grande=True)
    dyn = m.construir()
    mc.ceu([(0, 9), (dur * 0.65, 0.5), (dur, -4)], rot_graus=250, neblina=0.012, cor_neblina=(1.0, 0.75, 0.55))
    x0, y0 = CASA
    mc.construir_em_sequencia(objs_de(dyn, casa), f(0.3), f(7.2))
    tres = [Personagem("Steve", "steve", (x0 - 1.5, y0 - 1.5, z0)),
            Personagem("Ex_vermelho", "alex", (x0 + 6.5, y0 - 1.5, z0)),
            Personagem("Ex_azul", "aldeao1", (x0 + 6.5, y0 + 6.5, z0))]
    for k, p in enumerate(tres):
        p.mirar(f(0), (x0 + 2.5, y0 + 2.5, z0))
        for fr in range(f(0.3 + k * 0.2), f(7.2), 10):
            p.golpe(fr)
    tres[0].andar([(x0 + 2.5, y0 - 2.2, z0)], f(7.6), vel=1.5)
    tres[0].mirar(f(9.4), (x0 + 2.5, y0 + 2.5, z0))
    mc.tocha((x0 + 2.5, y0 + 3.5, z0 + 1.5), frame=f(10.0))
    mc.tocha((x0 + 1.5, y0 - 0.6, z0 + 1.5), frame=f(10.6))
    cam = Camera(lente=35, fstop=4.0)
    centro = (x0 + 2.5, y0 + 2.5, z0 + 2)
    cam.keys([(0, (x0 + 2.5, y0 - 9, z0 + 2.2), centro), (dur, (x0 - 1, y0 - 21, z0 + 6.5), centro)])


CENAS = {nome: fn for nome, fn in globals().items() if nome[:2] in ("A1", "A2", "A3", "A4", "A5") and callable(fn)}
