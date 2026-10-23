/*
 * O MUNDO É UM SERVIDOR — montagem automática no After Effects
 * SUPERNOVA STUDIO (@ssupernova.studio)
 *
 * Lê o edl.json (gerado por pipeline/p06_planejar_edicao.py) e monta o projeto:
 *   00_MASTER ............ comp final 3840x2160 30 fps, 10:00
 *   ATO 1..5 ............. uma comp por ato (shots + grade + vinheta + textos + cartão)
 *   PRE_* ................ precomps geradas (Gerando mundo, título, chats, final)
 * Grade: Tritone + Brilho/Contraste + Glow + Ruído por ato (dourado -> vermelho -> dourado)
 *        + Lumetri vazio (desligado) em cada ato para o seu ajuste fino / Magic Bullet Looks.
 * Textos: EB Garamond / Cormorant / Monocraft, fade + subida + tracking abrindo + blur saindo.
 * Áudio: narração, músicas com ducking em keyframes, SFX. Barras 2.39:1 na master.
 *
 * Uso: File > Scripts > Run Script File… > montar_projeto.jsx  (e escolha o edl.json)
 * Testado para AE 2023+ (ExtendScript / ES3).
 */
(function () {
    // ------------------------------------------------------------ utilidades
    function lerJSON(arq) {
        arq.encoding = "UTF-8";
        if (!arq.open("r")) { throw new Error("não consegui abrir " + arq.fsName); }
        var txt = arq.read();
        arq.close();
        return eval("(" + txt + ")");
    }
    function existe(p) { return p && (new File(p)).exists; }
    function cor(hex) {
        return [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];
    }
    function rgba(c) { return [c[0], c[1], c[2], 1]; }
    var faltando = [];

    var edlArq = File.openDialog("Selecione o edl.json do projeto", "JSON:*.json");
    if (!edlArq) { return; }
    var E = lerJSON(edlArq);
    var W = E.largura, H = E.altura, FPS = E.fps, DUR = E.duracao;
    var BARRA = Math.round((H - W / E.aspecto) / 2);   // 277 px em 4K
    var DISS = 1.2;
    var F = E.fontes;

    function fonteOk(nome) {
        try {
            if (app.fonts && app.fonts.getFontsByPostScriptName) {
                var r = app.fonts.getFontsByPostScriptName(nome);
                return r && r.length > 0;
            }
        } catch (e) {}
        return true;
    }
    var FONTE = {
        serifa: fonteOk(F.serifa) ? F.serifa : F.fallback,
        italico: fonteOk(F.serifa_italico) ? F.serifa_italico : "TimesNewRomanPS-ItalicMT",
        versalete: fonteOk(F.versalete) ? F.versalete : F.fallback,
        mc: fonteOk(F.minecraft) ? F.minecraft : "CourierNewPSMT"
    };

    if (app.project && app.project.numItems > 0) {
        if (!confirm("Isto cria um projeto NOVO (o atual será fechado e você poderá salvar). Continuar?")) { return; }
        app.project.close(CloseOptions.PROMPT_TO_SAVE_CHANGES);
    }
    app.newProject();
    var P = app.project;
    try { P.bitsPerChannel = 16; } catch (e) {}
    app.beginUndoGroup("Montar O Mundo é um Servidor");

    // ------------------------------------------------------------ pastas e importação
    function pasta(nome) { return P.items.addFolder(nome); }
    var PASTA = {
        master: pasta("00_MASTER"), atos: pasta("01_ATOS"), pre: pasta("02_PRECOMPS"),
        blender: pasta("03_BLENDER"), gameplay: pasta("04_GAMEPLAY"), imagens: pasta("05_IMAGENS"),
        narr: pasta("06_NARRACAO"), musica: pasta("07_MUSICA"), sfx: pasta("08_SFX"), solidos: pasta("09_SOLIDOS")
    };
    var cache = {};
    function importar(caminho, destino, sequencia) {
        if (cache[caminho] !== undefined) { return cache[caminho]; }
        var item = null;
        if (existe(caminho)) {
            try {
                var io = new ImportOptions(new File(caminho));
                if (sequencia) { io.sequence = true; io.forceAlphabetical = true; }
                item = P.importFile(io);
                if (sequencia) { item.mainSource.conformFrameRate = FPS; }
                item.parentFolder = destino;
            } catch (e) { item = null; }
        }
        if (!item) { faltando.push(caminho); }
        cache[caminho] = item;
        return item;
    }

    // ------------------------------------------------------------ keyframes
    function dims(prop) {
        var t = prop.propertyValueType;
        if (t === PropertyValueType.TwoD) { return 2; }
        if (t === PropertyValueType.ThreeD) { return 3; }
        return 1;
    }
    function suavizar(prop, influencia) {
        var n = dims(prop), e = [], i, k;
        for (i = 0; i < n; i++) { e.push(new KeyframeEase(0, influencia || 80)); }
        for (k = 1; k <= prop.numKeys; k++) {
            try { prop.setTemporalEaseAtKey(k, e, e); } catch (x) {}
        }
    }
    function chaves(prop, lista, influencia) {   // lista = [[t, v], ...]
        for (var i = 0; i < lista.length; i++) { prop.setValueAtTime(lista[i][0], lista[i][1]); }
        suavizar(prop, influencia);
    }
    function tr(layer, nome) { return layer.property("ADBE Transform Group").property(nome); }
    function efeito(layer, matchName, nome) {
        var fx = layer.property("ADBE Effect Parade").addProperty(matchName);
        if (nome) { fx.name = nome; }
        return fx;
    }
    function setP(fx, idx, v) { try { fx.property(idx).setValue(v); } catch (e) {} }

    function solido(comp, nome, c, w, h, dur) {
        var l = comp.layers.addSolid(c, nome, w || W, h || H, 1, dur || comp.duration);
        try { l.source.parentFolder = PASTA.solidos; } catch (e) {}
        return l;
    }
    function ajuste(comp, nome) {
        var l = solido(comp, nome, [1, 1, 1]);
        l.adjustmentLayer = true;
        return l;
    }
    function elipse(w, h, cx, cy) {
        var s = new Shape(), k = 0.5523, rx = w / 2, ry = h / 2;
        s.vertices = [[cx, cy - ry], [cx + rx, cy], [cx, cy + ry], [cx - rx, cy]];
        s.inTangents = [[-rx * k, 0], [0, -ry * k], [rx * k, 0], [0, ry * k]];
        s.outTangents = [[rx * k, 0], [0, ry * k], [-rx * k, 0], [0, -ry * k]];
        s.closed = true;
        return s;
    }

    // ------------------------------------------------------------ texto
    function texto(comp, str, o) {
        var l = comp.layers.addText(str);
        var p = l.property("ADBE Text Properties").property("ADBE Text Document");
        var d = p.value;
        try { d.resetCharStyle(); } catch (e) {}
        d.font = o.fonte || FONTE.serifa;
        d.fontSize = o.tam || 72;
        d.applyFill = true;
        d.fillColor = o.cor || [0.96, 0.95, 0.92];
        d.applyStroke = false;
        d.tracking = o.tracking || 0;
        d.justification = o.esquerda ? ParagraphJustification.LEFT_JUSTIFY : ParagraphJustification.CENTER_JUSTIFY;
        p.setValue(d);
        tr(l, "ADBE Position").setValue([o.x === undefined ? W / 2 : o.x, o.y]);
        if (o.sombra !== false) {
            var ds = efeito(l, "ADBE Drop Shadow", "Contraste");
            setP(ds, 2, 140); setP(ds, 4, 0); setP(ds, 5, 45);
        }
        return l;
    }
    /* entrada: fade + leve subida + blur saindo; tracking abrindo durante a frase; saída com blur */
    function animarTexto(l, t0, t1, o) {
        o = o || {};
        l.inPoint = t0;
        l.outPoint = t1;
        var ent = o.entrada || 1.0, sai = o.saida || 0.9;
        chaves(tr(l, "ADBE Opacity"), [[t0, 0], [t0 + ent, o.opacidade || 100], [t1 - sai, o.opacidade || 100], [t1, 0]], 75);
        var pos = tr(l, "ADBE Position"), v = pos.value;
        chaves(pos, [[t0, [v[0], v[1] + (o.subida === undefined ? 26 : o.subida)]], [t0 + ent * 1.3, v]], 85);
        var bl = efeito(l, "ADBE Gaussian Blur 2", "Blur entrada/saída");
        chaves(bl.property(1), [[t0, 14], [t0 + ent * 0.9, 0], [t1 - sai, 0], [t1, 16]], 70);
        try {
            var anim = l.property("ADBE Text Properties").property("ADBE Text Animators").addProperty("ADBE Text Animator");
            anim.name = "Tracking abrindo";
            var trk = anim.property("ADBE Text Animator Properties").addProperty("ADBE Text Tracking Amount");
            var a0 = o.trackIni === undefined ? -8 : o.trackIni, a1 = o.trackFim === undefined ? 6 : o.trackFim;
            chaves(trk, [[t0, a0], [t1, a1]], 40);
        } catch (e) {}
    }

    // ------------------------------------------------------------ precomps geradas
    function novaComp(nome, dur, pastaDest) {
        var c = P.items.addComp(nome, W, H, 1, Math.max(dur, 1 / FPS), FPS);
        c.parentFolder = pastaDest || PASTA.pre;
        c.bgColor = [0, 0, 0];
        return c;
    }

    function preGerandoMundo(dur) {
        var c = novaComp("PRE_Gerando_mundo", dur);
        var fundo = null, terra = E.mc_texturas + "/dirt.png";
        if (existe(terra)) {
            var it = importar(terra, PASTA.solidos, false);
            if (it) {
                fundo = c.layers.add(it);
                fundo.quality = LayerQuality.DRAFT;            // vizinho mais próximo = pixel de Minecraft
                tr(fundo, "ADBE Scale").setValue([1000, 1000]);
                var mt = efeito(fundo, "ADBE Tile", "Mosaico de terra");
                setP(mt, 4, 2500); setP(mt, 5, 1400);
                var bc = efeito(fundo, "ADBE Brightness & Contrast 2");
                setP(bc, 1, -95);
            }
        }
        if (!fundo) { solido(c, "Fundo terra", [0.16, 0.11, 0.07]); }
        var t1 = texto(c, "Gerando mundo", {fonte: FONTE.mc, tam: 64, y: H / 2 - 40, sombra: false});
        animarTexto(t1, 1.4, dur, {subida: 0, saida: 0.6});
        var t2 = texto(c, "Construindo terreno", {fonte: FONTE.mc, tam: 48, y: H / 2 + 60, cor: [0.75, 0.75, 0.75], sombra: false});
        animarTexto(t2, 1.8, dur, {subida: 0, saida: 0.6, trackIni: 0, trackFim: 0});
        t2.property("ADBE Text Properties").property("ADBE Text Document").expression =
            "var p = Math.min(100, Math.floor(linear(time, 1.8, " + (dur - 0.8) + ", 0, 100)));\n" +
            "(p < 60 ? 'Construindo terreno ' : (p < 95 ? 'Gerando estruturas ' : 'Pronto ')) + p + '%';";
        var preto = solido(c, "Preto inicial", [0, 0, 0]);
        chaves(tr(preto, "ADBE Opacity"), [[0, 100], [1.2, 0]], 60);
        return c;
    }

    function preTitulo(dur) {
        var c = novaComp("PRE_Titulo", dur);
        var f = solido(c, "Fundo", [0.02, 0.01, 0.01]);
        var rp = efeito(f, "ADBE Ramp", "Luz central");
        setP(rp, 1, [W / 2, H / 2]); setP(rp, 2, [0.16, 0.05, 0.03, 1]); setP(rp, 3, [W / 2, H * 1.25]);
        setP(rp, 4, [0, 0, 0, 1]); setP(rp, 5, 2);
        var a = texto(c, E.titulo.linha, {fonte: FONTE.versalete, tam: 38, y: H / 2 - 150, tracking: 600, cor: [0.85, 0.80, 0.72]});
        animarTexto(a, 0.8, dur - 0.5, {opacidade: 75, trackIni: 0, trackFim: 120});
        var t = texto(c, E.titulo.titulo, {tam: 168, y: H / 2 + 40, tracking: 220});
        animarTexto(t, 2.0, dur - 0.5, {entrada: 1.8, saida: 1.4, trackIni: -40, trackFim: 60, subida: 18});
        var g = efeito(t, "ADBE Glo2", "Glow");
        setP(g, 2, 55); setP(g, 3, 60); setP(g, 4, 0.6);
        return c;
    }

    function preFinal(dur) {
        var c = novaComp("PRE_Final", dur);
        solido(c, "Preto", [0, 0, 0]);
        var l1 = texto(c, E.final.linhas[0], {tam: 96, y: H / 2 - 30});
        animarTexto(l1, 2.0, dur - 5.5, {entrada: 1.6, saida: 1.6});
        var l2 = texto(c, E.final.linhas[1], {fonte: FONTE.italico, tam: 96, y: H / 2 + 90});
        animarTexto(l2, 4.6, dur - 5.5, {entrada: 1.6, saida: 1.6});
        var s = texto(c, E.final.assinatura, {fonte: FONTE.versalete, tam: 44, y: H / 2 + 10, tracking: 700, cor: [0.85, 0.80, 0.72]});
        animarTexto(s, dur - 5.0, dur - 0.6, {trackIni: 0, trackFim: 120, opacidade: 85});
        var ar = texto(c, E.final.arroba, {tam: 34, y: H / 2 + 90, cor: [0.7, 0.68, 0.64]});
        animarTexto(ar, dur - 4.3, dur - 0.6, {opacidade: 70, trackIni: 0, trackFim: 30});
        return c;
    }

    /* uma linha do chat do Minecraft: "<Nome> mensagem"; §9 = azul, §c = vermelho */
    function linhaChat(c, nome, msg, x, y, tam, corMsg) {
        var corNome = [1, 1, 1];
        if (nome.indexOf("§9") === 0) { corNome = cor(0x5555FF); nome = nome.substring(2); }
        if (nome.indexOf("§c") === 0) { corNome = cor(0xFF5555); nome = nome.substring(2); }
        var n = texto(c, "<" + nome + "> ", {fonte: FONTE.mc, tam: tam, x: x, y: y, esquerda: true, cor: corNome, sombra: false});
        var largura = n.sourceRectAtTime(0, false).width;
        var m = texto(c, msg, {fonte: FONTE.mc, tam: tam, x: x + largura + tam * 0.25, y: y, esquerda: true,
            cor: corMsg || [1, 1, 1], sombra: false});
        var ds;
        ds = efeito(n, "ADBE Drop Shadow"); setP(ds, 2, 255); setP(ds, 4, tam / 8); setP(ds, 5, 0);
        ds = efeito(m, "ADBE Drop Shadow"); setP(ds, 2, 255); setP(ds, 4, tam / 8); setP(ds, 5, 0);
        return [n, m];
    }
    function fundoEscuro(c) {
        var f = solido(c, "Fundo", [0.03, 0.01, 0.01]);
        var rp = efeito(f, "ADBE Ramp");
        setP(rp, 1, [W * 0.35, H * 0.4]); setP(rp, 2, [0.22, 0.04, 0.03, 1]); setP(rp, 3, [W, H]);
        setP(rp, 4, [0, 0, 0, 1]); setP(rp, 5, 2);
        var nz = efeito(f, "ADBE Noise"); setP(nz, 1, 6); setP(nz, 2, 0);
        return f;
    }
    function painel(c, x, y, w, h) {
        var p = solido(c, "Painel do chat", [0, 0, 0], Math.round(w), Math.round(h));
        tr(p, "ADBE Position").setValue([x + w / 2, y + h / 2]);
        tr(p, "ADBE Opacity").setValue(45);
        return p;
    }
    /* chat rolando: cada mensagem nova empurra as outras pra cima */
    function chatRolando(c, linhas, x, yBase, tam, t0, t1, instantaneo) {
        var lh = tam * 1.35, passo = (t1 - t0) / (linhas.length + 1);
        var rolo = c.layers.addNull();
        rolo.name = "Rolagem";
        tr(rolo, "ADBE Position").setValue([0, 0]);
        try { tr(rolo, "ADBE Anchor Point").setValue([0, 0]); } catch (e) {}
        var pos = tr(rolo, "ADBE Position"), camadas = {};
        for (var i = 0; i < linhas.length; i++) {
            var ti = instantaneo ? 0 : t0 + passo * i;
            var par = linhaChat(c, linhas[i][0], linhas[i][1], x, yBase + i * lh, tam);
            for (var j = 0; j < 2; j++) {
                par[j].parent = rolo;
                par[j].inPoint = ti;
                chaves(tr(par[j], "ADBE Opacity"), [[ti, 0], [ti + 0.12, 100]], 50);
            }
            if (!instantaneo) {
                pos.setValueAtTime(ti, [0, -i * lh]);
                if (i > 0) { pos.setValueAtTime(ti - 0.14, [0, -(i - 1) * lh]); }
            }
            camadas[linhas[i][1]] = par;
        }
        if (instantaneo) { pos.setValue([0, -(linhas.length - 1) * lh]); } else { suavizar(pos, 70); }
        return {rolo: rolo, camadas: camadas, lh: lh, n: linhas.length, yBase: yBase};
    }

    function preChatRolando(dur) {
        var c = novaComp("PRE_Chat_rolando", dur);
        fundoEscuro(c);
        var tam = 64, x = 760, yBase = 1450;
        painel(c, x - 30, 520, 2380, 1060);
        chatRolando(c, E.chat.rolando, x, yBase, tam, 0.4, dur - 0.5);
        return c;
    }

    function preChatDestaque(dur) {
        var c = novaComp("PRE_Chat_destaque", dur);
        fundoEscuro(c);
        var tam = 64, x = 760, yBase = 1450;
        painel(c, x - 30, 520, 2380, 1060);
        var r = chatRolando(c, E.chat.rolando, x, yBase, tam, 0, 0, true);
        var td = 1.4, iDst = 0, topoY = 640;
        for (var q = 0; q < E.chat.rolando.length; q++) { if (E.chat.rolando[q][1] === E.chat.destaque) { iDst = q; } }
        var yTela = r.yBase + (iDst - (r.n - 1)) * r.lh, sobe = yTela - topoY;
        var dst = r.camadas[E.chat.destaque], calma = r.camadas[E.chat.calma];
        if (dst) {
            // a mensagem de raiva sobe pro topo, fica vermelha, brilha e é FIXADA
            for (var j = 0; j < 2; j++) {
                var l = dst[j];
                var p0 = tr(l, "ADBE Position").value;
                chaves(tr(l, "ADBE Position"), [[td, p0], [td + 1.2, [p0[0], p0[1] - sobe]]], 85);
                chaves(tr(l, "ADBE Scale"), [[td, [100, 100]], [td + 1.2, [118, 118]]], 85);
                var g = efeito(l, "ADBE Glo2", "Brilho da raiva");
                chaves(g.property(4), [[td, 0], [td + 1.5, 1.6], [dur, 2.2]], 60);
                setP(g, 2, 40); setP(g, 3, 40);
                var tint = efeito(l, "ADBE Fill", "Vermelho");
                setP(tint, 3, [1, 0.25, 0.2, 1]);
                chaves(tint.property(7) || tint.property("Opacity"), [[td, 0], [td + 0.8, 1]], 60);
            }
            var fix = texto(c, "[FIXADA]", {fonte: FONTE.mc, tam: 44, x: x, y: topoY - 95,
                esquerda: true, cor: cor(0xFFAA00), sombra: false});
            animarTexto(fix, td + 1.0, dur, {subida: 8, trackIni: 0, trackFim: 0});
            var re = texto(c, "+0 reações", {fonte: FONTE.mc, tam: 40, x: x + 1650, y: topoY - 95,
                esquerda: true, cor: cor(0xFF5555), sombra: false});
            re.property("ADBE Text Properties").property("ADBE Text Document").expression =
                "'+' + Math.floor(linear(time, " + (td + 1) + ", " + dur + ", 12, 48700)) + ' reações'";
            animarTexto(re, td + 1.2, dur, {subida: 0, trackIni: 0, trackFim: 0});
        }
        if (calma) {
            // 'alguém viu quem foi?' afunda e some
            for (var k = 0; k < 2; k++) {
                var lc = calma[k], pc = tr(lc, "ADBE Position").value;
                chaves(tr(lc, "ADBE Position"), [[td + 0.6, pc], [dur - 1, [pc[0], pc[1] + 900]]], 60);
                chaves(tr(lc, "ADBE Opacity"), [[td + 0.6, 100], [dur - 1.5, 0]], 60);
            }
        }
        return c;
    }

    function preChatSplit(dur) {
        var c = novaComp("PRE_Chat_split", dur);
        fundoEscuro(c);
        var div = solido(c, "Divisória", [0.7, 0.15, 0.1], 4, H - 2 * BARRA - 200);
        tr(div, "ADBE Position").setValue([W / 2, H / 2]);
        var lados = [["SUL", E.chat.sul, 180], ["NORTE", E.chat.norte, W / 2 + 120]];
        for (var i = 0; i < 2; i++) {
            var cab = texto(c, "chat que o " + lados[i][0].toLowerCase() + " vê", {fonte: FONTE.versalete, tam: 40,
                x: lados[i][2] + 760, y: 470, tracking: 400, cor: [0.85, 0.75, 0.68]});
            animarTexto(cab, 0.3, dur, {trackIni: 0, trackFim: 80, opacidade: 80});
            painel(c, lados[i][2] - 30, 540, 1580, 1040);
            chatRolando(c, lados[i][1], lados[i][2], 1440, 52, 0.6 + i * 0.35, dur - 0.6);
        }
        return c;
    }

    function preChatFaccoes(dur) {
        var c = novaComp("PRE_Chat_faccoes", dur);
        fundoEscuro(c);
        painel(c, 730, 560, 2380, 980);
        chatRolando(c, E.chat.faccoes, 760, 1400, 62, 0.4, dur - 0.6);
        return c;
    }

    var GERADORES = {
        gerando_mundo: preGerandoMundo, titulo: preTitulo, "final": preFinal, chat_rolando: preChatRolando,
        chat_destaque: preChatDestaque, chat_split: preChatSplit, chat_faccoes: preChatFaccoes
    };

    // ------------------------------------------------------------ shots
    function placeholder(comp, nome, t0, t1) {
        var l = solido(comp, "FALTA: " + nome, [0.08, 0.02, 0.02]);
        l.inPoint = t0; l.outPoint = t1;
        var tx = texto(comp, "FALTA: " + nome, {fonte: FONTE.mc, tam: 50, y: H / 2, cor: [1, 0.4, 0.4]});
        tx.inPoint = t0; tx.outPoint = t1;
        return l;
    }

    function colocarShot(comp, sh, base) {
        var t0 = sh.ini - base, t1 = sh.fim - base, l = null, it;
        var dur = t1 - t0;
        if (sh.tipo === "blender") {
            it = importar(sh.seq, PASTA.blender, true);
            if (!it) { return placeholder(comp, "render do Blender " + sh.cena, t0, t1); }
            l = comp.layers.add(it);
            l.startTime = t0 - (sh.src_in || 0);
            var esc = W / it.width * 100 * (sh.efeitos.join(",").indexOf("tremor") >= 0 ? 104 : 100) / 100;
            tr(l, "ADBE Scale").setValue([esc, esc]);
            l.motionBlur = false;
        } else if (sh.tipo === "gameplay") {
            var src = sh.clip || sh.video, ofs = sh.clip ? sh.clip_in : sh.src_in;
            it = importar(src, PASTA.gameplay, false);
            if (!it) { return placeholder(comp, "gameplay " + sh.tag, t0, t1); }
            l = comp.layers.add(it);
            var stretch = 100 / sh.vel;
            l.stretch = stretch;
            l.startTime = t0 - ofs * stretch / 100;
            try { l.audioEnabled = false; } catch (e) {}
            var eg = E.gameplay_escala * 1920 / it.width;
            chaves(tr(l, "ADBE Scale"), [[t0, [eg, eg]], [t1, [eg * 1.035, eg * 1.035]]], 30);
            if (sh.vel < 0.5) { l.frameBlendingType = FrameBlendingType.FRAME_MIX; }
            var us = efeito(l, "ADBE Unsharp Mask2", "Nitidez (upscale 1080->4K)");
            setP(us, 1, 60); setP(us, 2, 1.6);
        } else if (sh.tipo === "img") {
            it = importar(sh.arquivo, PASTA.imagens, false);
            if (!it) { return placeholder(comp, "imagem " + sh.img, t0, t1); }
            l = comp.layers.add(it);
            var alturaUtil = H - 2 * BARRA;
            var cobre = Math.max(W / it.width, alturaUtil / it.height) * 100 * 1.04;
            var kb = sh.kenburns, s0 = kb.zoom_in ? cobre : cobre * 1.12, s1 = kb.zoom_in ? cobre * 1.12 : cobre;
            chaves(tr(l, "ADBE Scale"), [[t0, [s0, s0]], [t1, [s1, s1]]], 35);
            var dx = kb.dx * W * 0.018, dy = kb.dy * H * 0.012;
            chaves(tr(l, "ADBE Position"), [[t0, [W / 2 - dx, H / 2 - dy]], [t1, [W / 2 + dx, H / 2 + dy]]], 35);
            l.name = sh.img + " — " + sh.obra;
        } else if (sh.tipo === "ae") {
            var pre = GERADORES[sh.gerador](dur);
            l = comp.layers.add(pre);
            l.startTime = t0;
        } else {
            return placeholder(comp, sh.id, t0, t1);
        }
        l.inPoint = t0;
        l.outPoint = t1;
        if (sh.dissolve_in > 0) {
            chaves(tr(l, "ADBE Opacity"), [[t0, 0], [t0 + sh.dissolve_in, 100]], 60);
        }
        if (sh.efeitos.join(",").indexOf("tremor") >= 0) {
            tr(l, "ADBE Position").expression = "wiggle(2.2, 7)";
            tr(l, "ADBE Rotate Z").expression = "wiggle(1.5, 0.18)";
        }
        if (l.name.indexOf(sh.id) < 0) { l.comment = sh.id + " · bloco " + sh.bloco; }
        return l;
    }

    // ------------------------------------------------------------ grade por ato
    function gradeAto(comp, ato) {
        var g = ato.grade;
        var aj = ajuste(comp, "GRADE — " + ato.grade_nome);
        var lu = efeito(aj, "ADBE Lumetri", "Lumetri (ajuste fino / troque por Magic Bullet Looks)");
        lu.enabled = false;
        var tt = efeito(aj, "ADBE Tritone", "Tritone — quase monocromático");
        setP(tt, 1, rgba(g.altas)); setP(tt, 2, rgba(g.meios)); setP(tt, 3, rgba(g.sombras)); setP(tt, 4, g.mistura);
        var bc = efeito(aj, "ADBE Brightness & Contrast 2", "Pretos esmagados");
        setP(bc, 1, g.brilho); setP(bc, 2, g.contraste);
        var gl = efeito(aj, "ADBE Glo2", "Glow suave");
        setP(gl, 2, 72); setP(gl, 3, 90); setP(gl, 4, 0.35);
        var nz = efeito(aj, "ADBE Noise", "Grão de filme");
        setP(nz, 1, ato.id === 4 ? 9 : (ato.id === 3 ? 7 : 5)); setP(nz, 2, 0);

        if (ato.id === 1 || ato.id === 5) {   // light leak sutil
            var ll = solido(comp, "Light leak", [1, 0.55, 0.2]);
            var rp = efeito(ll, "ADBE Ramp");
            setP(rp, 1, [W * 0.1, H * 0.2]); setP(rp, 2, [1, 0.55, 0.2, 1]); setP(rp, 3, [W * 0.7, H]);
            setP(rp, 4, [0, 0, 0, 1]); setP(rp, 5, 2);
            ll.blendingMode = BlendingMode.SCREEN;
            tr(ll, "ADBE Opacity").expression = "8 + 10*Math.sin(time*0.35)*Math.sin(time*0.13)";
            tr(ll, "ADBE Position").expression = "[" + W / 2 + " + 300*Math.sin(time*0.07), " + H / 2 + "]";
        }
        var vg = solido(comp, "Vinheta", [0, 0, 0]);
        var m = vg.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
        m.property("ADBE Mask Shape").setValue(elipse(W * 1.05, (H - 2 * BARRA) * 1.25, W / 2, H / 2));
        m.property("ADBE Mask Feather").setValue([1100, 900]);
        m.inverted = true;
        tr(vg, "ADBE Opacity").setValue(g.vinheta);
    }

    // ------------------------------------------------------------ cartão de capítulo e frases
    function cartao(comp, c, base) {
        var t0 = c.ini - base, t1 = c.fim - base;
        var esc = solido(comp, "Escurecer — cartão " + c.linha, [0, 0, 0]);
        esc.inPoint = t0; esc.outPoint = t1;
        chaves(tr(esc, "ADBE Opacity"), [[t0, 0], [t0 + 1.2, 68], [t1 - 1.2, 68], [t1, 0]], 70);
        var a = texto(comp, c.linha, {fonte: FONTE.versalete, tam: 40, y: H / 2 - 135, tracking: 650, cor: [0.85, 0.78, 0.70]});
        animarTexto(a, t0 + 0.3, t1, {opacidade: 80, trackIni: 0, trackFim: 160});
        var fio = solido(comp, "Fio", [0.85, 0.78, 0.70], 260, 2);
        tr(fio, "ADBE Position").setValue([W / 2, H / 2 - 95]);
        fio.inPoint = t0 + 0.6; fio.outPoint = t1;
        chaves(tr(fio, "ADBE Scale"), [[t0 + 0.6, [0, 100]], [t0 + 2.0, [100, 100]]], 85);
        chaves(tr(fio, "ADBE Opacity"), [[t1 - 0.9, 70], [t1, 0]], 70);
        var t = texto(comp, c.titulo, {tam: 118, y: H / 2 + 20, tracking: 60});
        animarTexto(t, t0 + 0.7, t1, {entrada: 1.4, trackIni: -20, trackFim: 40});
        var q = texto(comp, c.citacao, {fonte: FONTE.italico, tam: 54, y: H / 2 + 125, cor: [0.88, 0.86, 0.82]});
        animarTexto(q, t0 + 1.6, t1, {entrada: 1.4, opacidade: 88});
    }

    /* Estilo dos vídeos de referência: linha de referência e frase no MESMO tamanho, serifadas,
       brancas, pequenas, centralizadas um pouco acima do meio; entrada e saída suaves. */
    function frase(comp, e, base) {
        var t0 = e.ini - base, t1 = e.fim - base, n = e.linhas.length;
        var tam = 56, entre = tam * 1.45, y0 = H * 0.43 - (n - 1) * entre * 0.5;
        var r = texto(comp, e.ref, {fonte: FONTE.serifa, tam: tam, y: y0});
        animarTexto(r, t0, t1, {opacidade: 92, subida: 10, trackIni: 0, trackFim: 4});
        for (var i = 0; i < n; i++) {
            var ln = e.linhas[i];
            var l = texto(comp, ln.texto, {fonte: ln.italico ? FONTE.italico : FONTE.serifa, tam: tam, y: y0 + entre * (i + 1)});
            animarTexto(l, ln.t - base, t1, {subida: 10, trackIni: 0, trackFim: 4});
        }
    }

    // ------------------------------------------------------------ comps dos atos
    var compsAtos = [];
    for (var a = 0; a < E.atos.length; a++) {
        var ato = E.atos[a];
        var dur = ato.fim - ato.ini + DISS + 0.1;
        var comp = novaComp("ATO " + ato.id + " — " + ato.nome, dur, PASTA.atos);
        comp.frameBlending = true;
        comp.motionBlur = true;
        for (var s = 0; s < E.shots.length; s++) {
            if (E.shots[s].ato === ato.id) { colocarShot(comp, E.shots[s], ato.ini); }
        }
        gradeAto(comp, ato);
        for (var c = 0; c < E.cartoes.length; c++) {
            if (E.cartoes[c].ato === ato.id) { cartao(comp, E.cartoes[c], ato.ini); }
        }
        for (var t = 0; t < E.textos.length; t++) {
            if (E.textos[t].ato === ato.id) { frase(comp, E.textos[t], ato.ini); }
        }
        compsAtos.push(comp);
    }

    // ------------------------------------------------------------ master
    var M = novaComp("00_MASTER — O MUNDO É UM SERVIDOR", DUR, PASTA.master);
    for (a = 0; a < compsAtos.length; a++) {
        var la = M.layers.add(compsAtos[a]);
        la.startTime = E.atos[a].ini;
        la.outPoint = Math.min(DUR, E.atos[a].fim + DISS);
        if (a > 0) { chaves(tr(la, "ADBE Opacity"), [[E.atos[a].ini, 0], [E.atos[a].ini + DISS, 100]], 60); }
        try { la.collapseTransformation = false; } catch (e) {}
    }
    // marca d'água discreta no canto (como nos vídeos de referência)
    var marca = texto(M, "SUPERNOVA", {fonte: FONTE.versalete, tam: 30, x: W - 230, y: H - BARRA - 40, tracking: 300,
        cor: [0.9, 0.88, 0.84], sombra: false});
    tr(marca, "ADBE Opacity").setValue(40);
    var fadeFim = solido(M, "Fade final", [0, 0, 0]);
    chaves(tr(fadeFim, "ADBE Opacity"), [[0, 0], [DUR - 1.5, 0], [DUR, 100]], 60);
    var topo = solido(M, "Barra cinema — topo", [0, 0, 0], W, BARRA);
    tr(topo, "ADBE Position").setValue([W / 2, BARRA / 2]);
    var baixo = solido(M, "Barra cinema — base", [0, 0, 0], W, BARRA);
    tr(baixo, "ADBE Position").setValue([W / 2, H - BARRA / 2]);

    // áudio
    var i, au = E.audio, lay, item;
    for (i = 0; i < au.narracao.length; i++) {
        var n = au.narracao[i];
        item = importar(n.arquivo, PASTA.narr, false);
        if (!item) { continue; }
        lay = M.layers.add(item);
        lay.name = "VOZ " + (i + 1);
        lay.startTime = n.ini - n["in"];
        lay.inPoint = n.ini;
        lay.outPoint = n.ini + n.out - n["in"];
    }
    for (i = 0; i < au.musica.length; i++) {
        var mu = au.musica[i];
        item = importar(mu.arquivo, PASTA.musica, false);
        if (!item) { continue; }
        lay = M.layers.add(item);
        lay.name = "MÚSICA " + mu.musica + (mu.parte ? " (volta " + (mu.parte + 1) + ")" : "");
        lay.startTime = mu.ini;
        lay.outPoint = Math.min(mu.fim, mu.ini + item.duration);
        var lv = lay.property("ADBE Audio Group").property("ADBE Audio Levels");
        for (var k = 0; k < mu.niveis.length; k++) {
            lv.setValueAtTime(mu.ini + mu.niveis[k][0], [mu.niveis[k][1], mu.niveis[k][1]]);
        }
    }
    for (i = 0; i < au.sfx.length; i++) {
        var fx = au.sfx[i];
        item = importar(fx.arquivo, PASTA.sfx, false);
        if (!item) { continue; }
        lay = M.layers.add(item);
        lay.name = "SFX " + fx.som;
        lay.startTime = fx.ini;
        var fimFx = fx.dur ? Math.min(fx.ini + fx.dur, fx.ini + item.duration) : fx.ini + item.duration;
        lay.outPoint = Math.min(DUR, fimFx);
        var lvs = lay.property("ADBE Audio Group").property("ADBE Audio Levels");
        if (fx.dur) {
            chaves(lvs, [[fx.ini, [-40, -40]], [fx.ini + 1.5, [fx.db, fx.db]],
                [lay.outPoint - 2.5, [fx.db, fx.db]], [lay.outPoint, [-60, -60]]], 50);
        } else {
            lvs.setValue([fx.db, fx.db]);
        }
    }
    // marcadores por bloco (navegação)
    try {
        var vistos = {};
        for (i = 0; i < E.shots.length; i++) {
            var b = E.shots[i].bloco;
            if (!vistos[b]) { vistos[b] = 1; M.markerProperty.setValueAtTime(E.shots[i].ini, new MarkerValue("bloco " + b)); }
        }
    } catch (e) {}

    // ------------------------------------------------------------ salvar e fila de render
    var aep = new File(E.projeto_aep);
    if (!aep.parent.exists) { aep.parent.create(); }
    var saida = new File(E.render_saida);
    if (!saida.parent.exists) { saida.parent.create(); }
    try {
        var rq = P.renderQueue.items.add(M);
        var om = rq.outputModule(1);
        var modelos = ["Apple ProRes 422 HQ", "ProRes 422 HQ", "High Quality", "Lossless"];
        for (i = 0; i < modelos.length; i++) {
            try { om.applyTemplate(modelos[i]); break; } catch (e) {}
        }
        om.file = saida;
    } catch (e) {}
    P.save(aep);
    app.endUndoGroup();
    M.openInViewer();

    var msg = "Projeto montado e salvo em:\n" + aep.fsName + "\n\nRender na fila: " + saida.fsName +
        "\n(depois rode pipeline/p07_exportar.py para o MP4 final em -14 LUFS e o Reels)";
    if (faltando.length) {
        msg += "\n\nFALTANDO " + faltando.length + " arquivo(s) — ficaram como 'FALTA:' na timeline:\n" +
            faltando.slice(0, 12).join("\n") + (faltando.length > 12 ? "\n…" : "");
    }
    alert(msg);
})();
