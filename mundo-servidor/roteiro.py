# -*- coding: utf-8 -*-
"""
Roteiro estruturado de "O MUNDO É UM SERVIDOR".

É a fonte única de verdade do projeto: o planejador da edição (pipeline/06),
o sincronizador da narração (pipeline/03), o Blender (blender/build_all.py)
e o After Effects (via edl.json) leem tudo daqui.

Tipos de fonte visual ("t"):
  blender  -> cena 3D renderizada no Blender (BLENDER_CENAS)
  gameplay -> trecho bom da gravação, por etiqueta (GAMEPLAY_JANELAS)
  img      -> pintura/imagem histórica de domínio público (IMAGENS)
  ae       -> elemento gerado pelo After Effects (cartões, chat 2D etc.)
"s" = duração desejada na timeline, em segundos.
"""

FPS = 30

# ---------------------------------------------------------------------------
# ATOS
# ---------------------------------------------------------------------------
ATOS = [
    {
        "id": 1, "romano": "I", "nome": "O mundo novo",
        "citacao": "Toda vez que você cria um mundo novo, ele é perfeito.",
        "alvo_s": 90, "musica": "warmth", "grade": "dourado",
        "preenchimento": {"gameplay": ["arvore_amanhecer", "penhasco_mar_casa", "paisagem_mesa"],
                          "img": ["bruegel_cacadores", "cole_arcadia"]},
    },
    {
        "id": 2, "romano": "II", "nome": "Os primeiros griefers",
        "citacao": "Destruir o que o outro construiu, só pelo prazer de vê-lo perder.",
        "alvo_s": 120, "musica": "respite", "musica_alternativa": "warmth", "grade": "ambar_frio",
        "preenchimento": {"gameplay": ["casa_paredes", "paisagem_mesa", "arvore_sol_folhas"],
                          "img": ["muralha_medieval", "castelo_berry"]},
    },
    {
        "id": 3, "romano": "III", "nome": "O chat do servidor",
        "citacao": "Nada prende mais a nossa atenção do que o medo e a raiva.",
        "alvo_s": 120, "musica": "respite", "musica_alternativa": "drone", "grade": "vermelho",
        "preenchimento": {"gameplay": ["anoitecer_estrelas", "lava_caverna", "zumbis_noite"],
                          "img": ["kandinsky_composicao", "dore_inferno_1", "schiele_autorretrato", "gericault_medusa",
                                  "goya_desastres_1"]},
    },
    {
        "id": 4, "romano": "IV", "nome": "Facções e guerra",
        "citacao": "Se foi o meu lado, foi defesa. Se foi o outro, foi crime.",
        "alvo_s": 120, "musica": "drone", "grade": "vermelho_escuro",
        "preenchimento": {"gameplay": ["lava_caverna", "zumbis_noite", "anoitecer_estrelas"],
                          "img": ["marc_destino_animais", "kirchner_soldado", "goya_desastres_2", "goya_desastres_3",
                                  "cartago", "dore_inferno_3"]},
    },
    {
        "id": 5, "romano": "V", "nome": "O que sobra",
        "citacao": "O mundo real não tem botão de criar um mundo novo.",
        "alvo_s": 150, "musica": "serenity", "grade": "retorno_dourado",
        "preenchimento": {"gameplay": ["por_do_sol_planicie", "arvore_sol_folhas", "penhasco_mar_casa", "interior_tochas"],
                          "img": ["friedrich_manha", "millet_angelus", "kollwitz_nie_wieder"]},
    },
]

# ---------------------------------------------------------------------------
# BLOCOS — cada [VISUAL] do roteiro + a fala que vem depois dele
#   textos: frases na tela; cada linha aparece quando a "ancora" é falada.
#   silencio: a música some durante o bloco (só sons do jogo).
#   pausa_peso: quanto da folga de tempo (para chegar a 10:00) vai antes do bloco.
# ---------------------------------------------------------------------------
BLOCOS = [
    # ======================= ATO 1 =======================
    {"id": "1a", "ato": 1, "pausa_peso": 2,
     "visual": "Tela preta, chuva leve, 'Gerando mundo...'. Primeiro amanhecer: planície, rio, ovelhas. Sem HUD.",
     "fontes": [{"t": "ae", "gerador": "gerando_mundo", "s": 6},
                {"t": "gameplay", "tag": "arvore_amanhecer", "s": 9},
                {"t": "gameplay", "tag": "arvore_contemplacao", "s": 8}],
     "sfx": [{"som": "chuva", "em": "video_inicio", "dur": 16, "db": -14}],
     "narracao": "Toda vez que você cria um mundo novo no Minecraft, ele é perfeito. Ninguém derrubou uma árvore. "
                 "Ninguém cavou um buraco. Não existe dono de nada. Existe só o sol nascendo devagar e um jogador parado, "
                 "sem saber o que fazer primeiro.",
     "textos": [{"linhas": [{"texto": "Ninguém derrubou uma árvore.", "ancora": "ninguém derrubou uma árvore"}]},
                {"linhas": [{"texto": "Existe só o sol nascendo devagar.", "ancora": "existe só o sol nascendo"}]}]},

    {"id": "1b", "ato": 1,
     "visual": "O jogador soca uma árvore e constrói uma casinha de madeira simples, com uma janela e uma tocha.",
     "fontes": [{"t": "gameplay", "tag": "arvore_amanhecer", "s": 6},
                {"t": "gameplay", "tag": "casa_paredes", "s": 9},
                {"t": "gameplay", "tag": "penhasco_mar_casa", "s": 7}],
     "narracao": "A primeira coisa que quase todo mundo faz é a mesma: uma casa. Não uma fortaleza. Uma casa. "
                 "Quatro paredes pra sobreviver à primeira noite. Porque a primeira noite assusta. Os monstros aparecem "
                 "no escuro, e a gente aprende rápido uma regra: o perigo está lá fora.",
     "textos": [{"linhas": [{"texto": "Uma casa. Não uma fortaleza.", "ancora": "não uma fortaleza"}]},
                {"linhas": [{"texto": "O perigo está lá fora.", "ancora": "o perigo está lá fora"}]}]},

    {"id": "1c", "ato": 1,
     "visual": "Noite. Zumbis ao redor da casa. O jogador olha pela janela, seguro.",
     "fontes": [{"t": "gameplay", "tag": "interior_tochas", "s": 7},
                {"t": "gameplay", "tag": "zumbis_noite", "s": 6},
                {"t": "img", "id": "bruegel_cacadores", "s": 6}],
     "narracao": "Durante muito tempo, essa foi a história da humanidade também. O perigo estava lá fora: a fome, o frio, "
                 "a doença, o desconhecido. E nós construímos casas, vilas, cidades, para nos proteger juntos.",
     "textos": [{"linhas": [{"texto": "Casas, vilas, cidades.", "ancora": "nós construímos casas"},
                            {"texto": "Para nos proteger juntos.", "ancora": "para nos proteger juntos"}]}]},

    {"id": "1d", "ato": 1,
     "visual": "Imagens da história antiga: primeiras vilas, muralhas, cidades. Amanhecer: um segundo jogador aparece no horizonte. Um acena.",
     "fontes": [{"t": "img", "id": "cole_selvagem", "s": 5},
                {"t": "img", "id": "cole_arcadia", "s": 5},
                {"t": "gameplay", "tag": "por_do_sol_planicie", "s": 8}],
     "narracao": "Mas esse é um vídeo sobre o que acontece quando o servidor enche. Sobre o dia em que a gente descobre "
                 "que o monstro mais perigoso do mundo não aparece no escuro. Ele aparece no chat.",
     "textos": [{"linhas": [{"texto": "O monstro mais perigoso não aparece no escuro.", "ancora": "não aparece no escuro"},
                            {"texto": "Ele aparece no chat.", "ancora": "ele aparece no chat"}],
                 "destaque": True}]},

    {"id": "1t", "ato": 1,
     "visual": "Título: O MUNDO É UM SERVIDOR.",
     "fontes": [{"t": "ae", "gerador": "titulo", "s": 9}],
     "sfx": [{"som": "boom", "em": "bloco_inicio", "db": -12}],
     "narracao": None},

    # ======================= ATO 2 =======================
    {"id": "2a", "ato": 2,
     "visual": "Timelapse do servidor crescendo: vilas, pontes, fazenda coletiva, placa 'bem-vindo', dezenas de jogadores.",
     "fontes": [{"t": "img", "id": "cole_consumacao", "s": 9},
                {"t": "gameplay", "tag": "casa_paredes", "s": 7},
                {"t": "gameplay", "tag": "paisagem_mesa", "s": 6}],
     "narracao": "No começo, um servidor cheio é lindo. Um constrói a ponte, outro planta o trigo, outro ilumina a caverna "
                 "para quem vem depois. Ninguém manda ninguém fazer isso. As pessoas cooperam porque é melhor assim.",
     "textos": [{"linhas": [{"texto": "Ninguém manda ninguém fazer isso.", "ancora": "ninguém manda ninguém"}]},
                {"linhas": [{"texto": "As pessoas cooperam porque é melhor assim.", "ancora": "as pessoas cooperam"}]}]},

    {"id": "2b", "ato": 2, "pausa_peso": 3, "silencio": True,
     "sfx": [{"som": "pavio", "em": "bloco_inicio", "offset": 0.3, "db": -16},
             {"som": "explosao", "em": "bloco_inicio", "offset": 3.0, "db": -9}],
     "visual": "Um jogador coloca TNT embaixo de uma casa e explode. Silêncio. Os outros param e olham a cratera.",
     "fontes": [{"t": "img", "id": "turner_incendio", "s": 9}, {"t": "gameplay", "tag": "lava_caverna", "s": 6}],
     "narracao": "Até que um dia alguém explode uma casa. Sem motivo. Só pra ver o que acontece. No Minecraft tem nome "
                 "pra isso: griefing. Destruir o que o outro construiu não pra ganhar algo, mas pelo prazer de ver o outro perder.",
     "textos": [{"ref": "griefing  (s.)",
                 "linhas": [{"texto": "Griefing.", "ancora": "griefing"},
                            {"texto": "Destruir o que o outro construiu pelo prazer de vê-lo perder.",
                             "ancora": "pelo prazer de ver"}]}]},

    {"id": "2c", "ato": 2,
     "visual": "O dono volta e encontra o buraco. A câmera fica nele por alguns segundos.",
     "fontes": [{"t": "img", "id": "friedrich_abadia", "s": 8},
                {"t": "gameplay", "tag": "arvore_sol_folhas", "s": 6}],
     "narracao": "E aqui está a primeira coisa que ninguém te conta: o estrago de verdade não é a cratera. Cratera se tapa "
                 "em cinco minutos. O estrago de verdade é o que muda dentro de quem perdeu a casa.",
     "textos": [{"linhas": [{"texto": "O estrago de verdade não é a cratera.", "ancora": "o estrago de verdade não é a cratera"}]},
                {"linhas": [{"texto": "É o que muda dentro de quem perdeu a casa.", "ancora": "é o que muda dentro"}]}]},

    {"id": "2d", "ato": 2,
     "visual": "Ele reconstrói, agora com paredes de pedra, sem janela. Depois coloca lava na entrada.",
     "fontes": [{"t": "gameplay", "tag": "casa_paredes", "s": 8},
                {"t": "img", "id": "muralha_medieval", "s": 6}],
     "narracao": "Na reconstrução, ele não faz mais janela. Faz muro. E coloca lava na porta. Ele não virou uma pessoa má. "
                 "Ele virou uma pessoa com medo. E uma pessoa com medo começa a enxergar todo mundo que se aproxima como o próximo griefer.",
     "textos": [{"linhas": [{"texto": "Ele não virou uma pessoa má.", "ancora": "ele não virou uma pessoa má"},
                            {"texto": "Virou uma pessoa com medo.", "ancora": "ele virou uma pessoa com medo"}],
                 "destaque": True}]},

    {"id": "2e", "ato": 2,
     "visual": "Um por um, os jogadores cercam suas casas. A vila aberta vira um conjunto de bunkers isolados. + muralhas medievais.",
     "fontes": [{"t": "gameplay", "tag": "paisagem_mesa", "s": 7},
                {"t": "img", "id": "castelo_berry", "s": 6},
                {"t": "img", "id": "muralhas_constantinopla", "s": 6}],
     "narracao": "Multiplique isso por milhões de pessoas e você tem uma parte grande do mundo real hoje. Gente que já foi "
                 "enganada, humilhada ou atacada, e que aprendeu a desconfiar primeiro e perguntar depois. O problema é que um "
                 "mundo construído pelo medo parece seguro pra quem está dentro do muro. E parece uma ameaça pra quem está do lado de fora.",
     "textos": [{"linhas": [{"texto": "Desconfiar primeiro. Perguntar depois.", "ancora": "desconfiar primeiro"}]},
                {"linhas": [{"texto": "Um mundo construído pelo medo parece seguro pra quem está dentro do muro.",
                             "ancora": "um mundo construído pelo medo"},
                            {"texto": "E parece uma ameaça pra quem está do lado de fora.", "ancora": "e parece uma ameaça"}]}]},

    # ======================= ATO 3 =======================
    {"id": "3a", "ato": 3,
     "visual": "Close no chat do jogo, mensagens subindo rápido. Uma diz: 'foi o pessoal do norte que explodiu a casa'.",
     "fontes": [{"t": "img", "id": "dore_inferno_1", "s": 7},
                {"t": "ae", "gerador": "chat_rolando", "s": 7},
                {"t": "img", "id": "kandinsky_composicao", "s": 7}],
     "narracao": "Agora imagine que esse servidor tem um chat. E que esse chat tem uma regra escondida: as mensagens que geram "
                 "mais reação ficam no topo. Por mais tempo. Pra mais gente. Ninguém programou o chat pra ser cruel. Ele foi "
                 "programado pra prender a atenção. Mas acontece que nada prende mais a nossa atenção do que medo e raiva.",
     "textos": [{"linhas": [{"texto": "Ninguém programou o chat pra ser cruel.", "ancora": "ninguém programou o chat"},
                            {"texto": "Ele foi programado pra prender a atenção.", "ancora": "ele foi programado"}]}]},

    {"id": "3b", "ato": 3,
     "visual": "'foi o pessoal do norte' ganha destaque, brilha e fica fixada. 'alguém viu quem foi?' some lá embaixo.",
     "fontes": [{"t": "ae", "gerador": "chat_destaque", "s": 9},
                {"t": "img", "id": "goya_desastres_1", "s": 6}],
     "narracao": "A mensagem 'alguém sabe quem foi?' ninguém lê. A mensagem 'foi o pessoal do norte' todo mundo lê, responde, "
                 "compartilha. Não importa se é verdade. Importa que ela dá raiva.",
     "textos": [{"linhas": [{"texto": "Não importa se é verdade.", "ancora": "não importa se é verdade"},
                            {"texto": "Importa que ela dá raiva.", "ancora": "importa que ela dá raiva"}],
                 "destaque": True}]},

    {"id": "3c", "ato": 3,
     "visual": "Split screen: o chat do sul x o chat do norte, conversas opostas sobre o mesmo fato. + Torre de Babel de Bruegel.",
     "fontes": [{"t": "ae", "gerador": "chat_split", "s": 10},
                {"t": "img", "id": "bruegel_babel", "s": 9}],
     "narracao": "E aí vem a parte mais estranha. Cada jogador começa a ver um chat diferente. O do sul vê só as provas de que "
                 "o norte é perigoso. O do norte vê só as provas de que o sul é perigoso. Os dois estão no mesmo mundo. Olham pra "
                 "mesma cratera. E saem com histórias opostas, cada um com certeza absoluta de que o outro está mentindo.",
     "textos": [{"linhas": [{"texto": "Cada jogador começa a ver um chat diferente.", "ancora": "cada jogador começa"}]},
                {"linhas": [{"texto": "Os dois estão no mesmo mundo.", "ancora": "os dois estão no mesmo mundo"},
                            {"texto": "E saem com histórias opostas.", "ancora": "e saem com histórias opostas"}]}]},

    {"id": "3d", "ato": 3,
     "visual": "Jogador sozinho no quarto da casa-bunker, à noite, chat aberto, tocha piscando. + Munch, Goya.",
     "fontes": [{"t": "gameplay", "tag": "interior_tochas", "s": 8},
                {"t": "img", "id": "munch_grito", "s": 7},
                {"t": "img", "id": "schiele_autorretrato", "s": 6},
                {"t": "img", "id": "goya_saturno", "s": 7},
                {"t": "gameplay", "tag": "anoitecer_estrelas", "s": 6},
                {"t": "img", "id": "gericault_medusa", "s": 7}],
     "narracao": "Isso cansa. Ficar o tempo todo em alerta, o tempo todo com raiva, o tempo todo comparando a sua casa com a "
                 "casa dos outros. Passar a madrugada lendo coisa que te faz mal e não conseguir parar. Quando eu digo que as "
                 "pessoas estão doentes, é isso. Não é que todo mundo enlouqueceu de repente. É que a gente passou anos dentro de "
                 "um chat feito pra nos manter assustados, e o corpo e a cabeça cobram essa conta. O mais perigoso dessa doença é "
                 "que ela não parece doença. Por dentro, ela parece lucidez. Parece que finalmente você entendeu quem é o inimigo.",
     "textos": [{"linhas": [{"texto": "Isso cansa.", "ancora": "isso cansa"}]},
                {"linhas": [{"texto": "Quando eu digo que as pessoas estão doentes, é isso.", "ancora": "quando eu digo"}]},
                {"linhas": [{"texto": "Ela não parece doença.", "ancora": "ela não parece doença"},
                            {"texto": "Por dentro, ela parece lucidez.", "ancora": "por dentro ela parece lucidez"}],
                 "destaque": True}]},

    # ======================= ATO 4 =======================
    {"id": "4a", "ato": 4,
     "visual": "Facção azul e facção vermelha (armaduras de couro tingidas). Bandeiras sobem dos dois lados do rio.",
     "fontes": [{"t": "img", "id": "uccello_batalha", "s": 9},
                {"t": "img", "id": "goya_desastres_2", "s": 6}],
     "narracao": "Quando as pessoas estão com medo e com raiva, sempre aparece alguém oferecendo uma resposta simples. No "
                 "servidor, ele aparece com uma bandeira e uma frase: 'juntos, a gente se protege deles'. E de repente você não é "
                 "mais só um jogador. Você é azul. Ou vermelho. E ser do time vira mais importante do que estar certo.",
     "textos": [{"linhas": [{"texto": "“Juntos, a gente se protege deles.”", "ancora": "juntos a gente se protege", "italico": True}]},
                {"linhas": [{"texto": "Ser do time vira mais importante do que estar certo.", "ancora": "e ser do time"}]}]},

    {"id": "4b", "ato": 4,
     "visual": "Um jogador azul derruba uma árvore no meio do mapa. No chat: vermelhos dizem ataque, azuis dizem legítimo.",
     "fontes": [{"t": "gameplay", "tag": "por_do_sol_planicie", "s": 8},
                {"t": "ae", "gerador": "chat_faccoes", "s": 9}],
     "narracao": "Repare no que acontece com a verdade. Antes, a pergunta era 'o que aconteceu?'. Agora a pergunta é 'de que "
                 "lado é quem fez?'. Se foi o meu lado, foi defesa. Se foi o outro lado, foi crime. O mesmo bloco quebrado, "
                 "duas morais diferentes.",
     "textos": [{"linhas": [{"texto": "“O que aconteceu?”", "ancora": "antes a pergunta era", "italico": True},
                            {"texto": "“De que lado é quem fez?”", "ancora": "agora a pergunta é", "italico": True}]},
                {"linhas": [{"texto": "O mesmo bloco quebrado,", "ancora": "o mesmo bloco quebrado"},
                            {"texto": "duas morais diferentes.", "ancora": "duas morais diferentes"}],
                 "destaque": True}]},

    {"id": "4c", "ato": 4, "pausa_peso": 3, "silencio_inicio_s": 6,
     "visual": "Silêncio. A ponte entre os dois lados do rio é destruída bloco por bloco, pelos dois lados. + Goya: Duelo a garrotazos. + história.",
     "fontes": [{"t": "img", "id": "goya_desastres_3", "s": 7},
                {"t": "img", "id": "goya_duelo", "s": 8},
                {"t": "img", "id": "kirchner_soldado", "s": 6},
                {"t": "img", "id": "saque_roma", "s": 6},
                {"t": "img", "id": "troia", "s": 6},
                {"t": "img", "id": "goya_3maio", "s": 7},
                {"t": "img", "id": "bruegel_triunfo", "s": 8}],
     "narracao": "E aí vem o passo que transforma um conflito em atrocidade. O outro lado deixa de ser formado por pessoas. "
                 "Vira mob. Vira algo que spawna, que ataca, que precisa ser eliminado antes que te elimine. Toda grande violência "
                 "da história começou assim. Não com armas. Com palavras que transformam gente em ameaça, em praga, em monstro. "
                 "Quando você consegue olhar pro outro e não ver uma pessoa, você consegue fazer qualquer coisa com ele e ainda dormir em paz.",
     "textos": [{"linhas": [{"texto": "O outro lado deixa de ser formado por pessoas.", "ancora": "o outro lado deixa"},
                            {"texto": "Vira mob.", "ancora": "vira mob"}]},
                {"linhas": [{"texto": "Não com armas.", "ancora": "não com armas"},
                            {"texto": "Com palavras.", "ancora": "com palavras que transformam"}]},
                {"linhas": [{"texto": "…e ainda dormir em paz.", "ancora": "e ainda dormir em paz"}]}]},

    {"id": "4d", "ato": 4, "silencio": True,
     "sfx": [{"som": "arco", "em": "bloco_inicio", "offset": 1.0, "db": -16},
             {"som": "flecha_acerta", "em": "bloco_inicio", "offset": 2.2, "db": -18},
             {"som": "explosao", "em": "bloco_inicio", "offset": 7.0, "db": -10},
             {"som": "fogo", "em": "bloco_inicio", "offset": 10.0, "dur": 9, "db": -16}],
     "visual": "Batalha no rio em câmera lenta (flechas, fogo, TNT), sem música, só sons do jogo. Corte para a casinha do Ato 1 em chamas.",
     "fontes": [{"t": "img", "id": "altdorfer_issus", "s": 10}, {"t": "img", "id": "marc_destino_animais", "s": 7},
                {"t": "img", "id": "turner_incendio", "s": 7}, {"t": "gameplay", "tag": "lava_caverna", "s": 5}],
     "narracao": None},

    {"id": "4e", "ato": 4,
     "visual": "Thomas Cole — Destruição. Goya — Desastres da Guerra.",
     "fontes": [{"t": "img", "id": "cole_destruicao", "s": 9},
                {"t": "img", "id": "nussbaum_triunfo", "s": 7}],
     "narracao": "O mais triste é que, se você perguntar pra qualquer um dos lados, eles vão dizer a mesma coisa: 'a gente só "
                 "está se defendendo'. E os dois estão sendo sinceros.",
     "textos": [{"linhas": [{"texto": "“A gente só está se defendendo.”", "ancora": "a gente só está se defendendo", "italico": True},
                            {"texto": "E os dois estão sendo sinceros.", "ancora": "e os dois estão sendo sinceros"}],
                 "destaque": True}]},

    # ======================= ATO 5 =======================
    {"id": "5a", "ato": 5,
     "visual": "Dia seguinte. Drone lento: crateras, fumaça, lava, bandeiras rasgadas, nenhum jogador. + Cole — Desolação, Pompeia, Fórum.",
     "fontes": [{"t": "img", "id": "hubert_robert_ruinas", "s": 8},
                {"t": "img", "id": "cole_desolacao", "s": 8},
                {"t": "img", "id": "klee_angelus", "s": 7},
                {"t": "img", "id": "pompeia", "s": 6},
                {"t": "img", "id": "forum_romano", "s": 6}],
     "narracao": "No Minecraft, quando um servidor chega nesse ponto, quase sempre acontece a mesma coisa. As pessoas vão embora. "
                 "O mundo fica vazio, cheio de buracos, e ninguém lembra direito por que a guerra começou. A diferença é que o "
                 "mundo real não tem botão de criar um mundo novo. A gente só tem esse.",
     "textos": [{"linhas": [{"texto": "Ninguém lembra direito por que a guerra começou.", "ancora": "ninguém lembra direito"}]},
                {"linhas": [{"texto": "A gente só tem esse.", "ancora": "a gente só tem esse"}], "destaque": True}]},

    {"id": "5b", "ato": 5,
     "visual": "Um jogador sem armadura e sem cor de time tapa uma cratera, um bloco de terra de cada vez.",
     "fontes": [{"t": "gameplay", "tag": "casa_paredes", "s": 9},
                {"t": "img", "id": "pompeia", "s": 6}],
     "narracao": "Então eu não vou terminar esse vídeo com uma solução. Não existe comando que conserte isso. Mas existem algumas "
                 "coisas pequenas que eu aprendi olhando esse servidor.",
     "textos": [{"linhas": [{"texto": "Não existe comando que conserte isso.", "ancora": "não existe comando"}]}]},

    {"id": "5c", "ato": 5,
     "visual": "Texto minimalista a cada lição, sobre paisagens calmas.",
     "fontes": [{"t": "gameplay", "tag": "arvore_sol_folhas", "s": 9},
                {"t": "gameplay", "tag": "penhasco_mar_casa", "s": 9},
                {"t": "img", "id": "kollwitz_nie_wieder", "s": 7},
                {"t": "img", "id": "malevich_quadrado", "s": 6},
                {"t": "img", "id": "friedrich_manha", "s": 8},
                {"t": "gameplay", "tag": "por_do_sol_planicie", "s": 9},
                {"t": "gameplay", "tag": "anoitecer_estrelas", "s": 8}],
     "narracao": "A primeira: desconfie do chat que te deixa com raiva o tempo todo. Se uma mensagem foi feita pra te fazer "
                 "odiar alguém, pergunte quem ganha com esse ódio. A segunda: antes de escolher um lado, faça a pergunta que todo "
                 "mundo esqueceu. 'O que aconteceu de verdade?' E aceite a resposta mesmo quando ela não favorece o seu time. "
                 "A terceira: lembre que do outro lado do rio tem uma pessoa. Alguém que também perdeu a casa uma vez. Que também "
                 "está com medo. Que também acha que está só se defendendo. E a última: desligue a tela de vez em quando. Saia do "
                 "chat. Vá ver o sol nascer no mundo de verdade. Ninguém consegue reconstruir nada se estiver doente por dentro.",
     "textos": [{"ref": "I", "linhas": [{"texto": "Desconfie do chat que te deixa com raiva.", "ancora": "desconfie do chat"}]},
                {"ref": "II", "linhas": [{"texto": "Pergunte o que aconteceu de verdade.", "ancora": "antes de escolher um lado"}]},
                {"ref": "III", "linhas": [{"texto": "Do outro lado do rio tem uma pessoa.", "ancora": "lembre que do outro lado do rio"}]},
                {"ref": "IV", "linhas": [{"texto": "Desligue a tela de vez em quando.", "ancora": "desligue a tela"}]},
                {"linhas": [{"texto": "Ninguém consegue reconstruir nada se estiver doente por dentro.",
                             "ancora": "ninguém consegue reconstruir"}]}]},

    {"id": "5d", "ato": 5,
     "visual": "Um jogador vermelho se aproxima, tira a armadura e ajuda. Depois um azul. Os três trabalham em silêncio. + Bruegel — Os Ceifeiros.",
     "fontes": [{"t": "gameplay", "tag": "casa_paredes", "s": 8},
                {"t": "img", "id": "bruegel_ceifeiros", "s": 8}],
     "narracao": "O mundo não vai ser consertado por um herói. Vai ser consertado do mesmo jeito que foi construído no começo: "
                 "por gente comum, colocando um bloco de cada vez, sem que ninguém mande.",
     "textos": [{"linhas": [{"texto": "Por gente comum.", "ancora": "por gente comum"},
                            {"texto": "Um bloco de cada vez, sem que ninguém mande.", "ancora": "colocando um bloco"}]}]},

    {"id": "5e", "ato": 5,
     "visual": "Os três reconstroem a casinha do Ato 1, agora com janela grande. Anoitece. Uma tocha acende.",
     "fontes": [{"t": "gameplay", "tag": "anoitecer_estrelas", "s": 8},
                {"t": "gameplay", "tag": "interior_tochas", "s": 10},
                {"t": "gameplay", "tag": "arvore_contemplacao", "s": 7}],
     "narracao": "A noite ainda vai chegar. Os monstros ainda vão aparecer. Mas talvez a gente consiga lembrar de novo que eles "
                 "estão lá fora. E não aqui dentro.",
     "textos": [{"linhas": [{"texto": "Eles estão lá fora.", "ancora": "estão lá fora"},
                            {"texto": "E não aqui dentro.", "ancora": "e não aqui dentro"}],
                 "destaque": True}]},

    {"id": "5f", "ato": 5,
     "visual": "Fade para preto. Chuva do início. O MUNDO É UM SERVIDOR. CUIDE DELE.",
     "fontes": [{"t": "ae", "gerador": "final", "s": 16}],
     "sfx": [{"som": "chuva", "em": "bloco_inicio", "dur": 16, "db": -14}],
     "narracao": None},
]

# ---------------------------------------------------------------------------
# CENAS DO BLENDER (duração do render em segundos + sons do Minecraft)
#   sons: (segundo dentro da cena, id do som, volume dB)
# ---------------------------------------------------------------------------
BLENDER_CENAS = {
    # Efeitos sonoros SIMPLES: poucos, baixos, só o que a cena pede.
    "A1_amanhecer":            {"dur": 12, "sons": [(0.0, "vento", -24)]},
    "A1_casinha":              {"dur": 11, "sons": [(0.6, "madeira", -20), (9.0, "tocha", -20)]},
    "A1_noite_zumbis":         {"dur": 10, "sons": [(2.0, "zumbi", -20)]},
    "A1_segundo_jogador":      {"dur": 10, "sons": []},
    "A2_servidor_cresce":      {"dur": 14, "sons": []},
    "A2_tnt":                  {"dur": 13, "sons": [(3.0, "pavio", -14), (7.0, "explosao", -8)]},
    "A2_dono_volta":           {"dur": 9,  "sons": []},
    "A2_bunker":               {"dur": 11, "sons": [(1.0, "colocar_pedra", -20), (8.0, "lava", -18)]},
    "A2_vila_bunkers":         {"dur": 12, "sons": []},
    "A3_chat3d":               {"dur": 10, "sons": []},
    "A3_quarto_bunker":        {"dur": 11, "sons": [(0.0, "fogo", -26)]},
    "A4_faccoes":              {"dur": 11, "sons": []},
    "A4_arvore":               {"dur": 9,  "sons": [(1.0, "madeira", -18)]},
    "A4_ponte":                {"dur": 13, "sons": [(1.0, "quebrar_madeira", -18), (5.6, "quebrar_madeira", -18),
                                                    (10.3, "quebrar_madeira", -18)]},
    "A4_batalha":              {"dur": 15, "sons": [(1.5, "arco", -16), (6.0, "pavio", -16), (8.0, "explosao", -9)]},
    "A4_casinha_chamas":       {"dur": 7,  "sons": [(0.0, "fogo", -14)]},
    "A5_drone_ruinas":         {"dur": 15, "sons": [(0.0, "vento", -20)]},
    "A5_tapando_cratera":      {"dur": 11, "sons": [(1.0, "colocar_terra", -20)]},
    "A5_tres_trabalham":       {"dur": 13, "sons": []},
    "A5_casinha_janela_grande": {"dur": 13, "sons": [(10.0, "tocha", -18)]},
}

# ---------------------------------------------------------------------------
# GAMEPLAY — janelas candidatas (segundos na gravação), conferidas pela análise
# automática (pipeline/01) que ainda corta travadas, menus, escuro e solavancos.
# ---------------------------------------------------------------------------
GAMEPLAY_JANELAS = {
    "arvore_amanhecer":     {"arquivo": "principal", "janelas": [(0, 27)], "escuro_ok": False},
    "paisagem_mesa":        {"arquivo": "principal", "janelas": [(144, 172)], "escuro_ok": False},
    "penhasco_mar_casa":    {"arquivo": "principal", "janelas": [(174, 250)], "escuro_ok": False},
    "arvore_sol_folhas":    {"arquivo": "principal", "janelas": [(252, 300)], "escuro_ok": False},
    "casa_paredes":         {"arquivo": "principal", "janelas": [(300, 444)], "escuro_ok": False},
    "por_do_sol_planicie":  {"arquivo": "principal", "janelas": [(456, 520)], "escuro_ok": False},
    "anoitecer_estrelas":   {"arquivo": "principal", "janelas": [(570, 590)], "escuro_ok": True},
    "lava_caverna":         {"arquivo": "principal", "janelas": [(644, 653)], "escuro_ok": True},
    "zumbis_noite":         {"arquivo": "principal", "janelas": [(684, 702)], "escuro_ok": True},
    "interior_tochas":      {"arquivo": "principal", "janelas": [(720, 753)], "escuro_ok": True},
    "arvore_contemplacao":  {"arquivo": "curto",     "janelas": [(0, 75)], "escuro_ok": False},
}
# Cortes manuais conhecidos (crafting, inventário, menus) — removidos sempre.
GAMEPLAY_CORTES = {
    "principal": [(28, 37), (128, 144), (334, 340), (364, 372), (382, 388), (446, 455),
                  (524, 536), (706, 716)],
    "curto": [(75, 10_000)],
}

# ---------------------------------------------------------------------------
# IMAGENS DE DOMÍNIO PÚBLICO (Wikimedia Commons). "arquivo" é tentado primeiro;
# se não existir ou não for domínio público, usa a "busca".
# ---------------------------------------------------------------------------
IMAGENS = {
    "cole_selvagem":   {"arquivo": "Cole Thomas The Course of Empire The Savage State 1836.jpg",
                        "busca": "Thomas Cole Course of Empire Savage State", "obra": "Thomas Cole — O Curso do Império: O Estado Selvagem (1836)"},
    "cole_arcadia":    {"arquivo": "Cole Thomas The Course of Empire The Arcadian or Pastoral State 1836.jpg",
                        "busca": "Thomas Cole Course of Empire Arcadian Pastoral State", "obra": "Thomas Cole — O Curso do Império: Arcádia (1834)"},
    "cole_consumacao": {"arquivo": "Cole Thomas The Consummation The Course of the Empire 1836.jpg",
                        "busca": "Thomas Cole Course of Empire Consummation", "obra": "Thomas Cole — O Curso do Império: Consumação (1836)"},
    "cole_destruicao": {"arquivo": "Cole Thomas The Course of Empire Destruction 1836.jpg",
                        "busca": "Thomas Cole Course of Empire Destruction", "obra": "Thomas Cole — O Curso do Império: Destruição (1836)"},
    "cole_desolacao":  {"arquivo": "Cole Thomas The Course of Empire Desolation 1836.jpg",
                        "busca": "Thomas Cole Course of Empire Desolation", "obra": "Thomas Cole — O Curso do Império: Desolação (1836)"},
    "bruegel_cacadores": {"arquivo": "Pieter Bruegel the Elder - Hunters in the Snow (Winter) - Google Art Project.jpg",
                          "busca": "Bruegel Hunters in the Snow", "obra": "Pieter Bruegel — Caçadores na Neve (1565)"},
    "bruegel_babel":   {"arquivo": "Pieter Bruegel the Elder - The Tower of Babel (Vienna) - Google Art Project - edited.jpg",
                        "busca": "Bruegel Tower of Babel Vienna", "obra": "Pieter Bruegel — A Torre de Babel (1563)"},
    "bruegel_triunfo": {"arquivo": "The Triumph of Death by Pieter Bruegel the Elder.jpg",
                        "busca": "Bruegel Triumph of Death Prado", "obra": "Pieter Bruegel — O Triunfo da Morte (c. 1562)"},
    "bruegel_ceifeiros": {"arquivo": "Pieter Bruegel the Elder- The Harvesters - Google Art Project.jpg",
                          "busca": "Bruegel The Harvesters Metropolitan", "obra": "Pieter Bruegel — Os Ceifeiros (1565)"},
    "munch_grito":     {"arquivo": "Edvard Munch, 1893, The Scream, oil, tempera and pastel on cardboard, 91 x 73 cm, National Gallery of Norway.jpg",
                        "busca": "Edvard Munch The Scream 1893", "obra": "Edvard Munch — O Grito (1893)"},
    "goya_saturno":    {"arquivo": "Francisco de Goya, Saturno devorando a su hijo (1819-1823).jpg",
                        "busca": "Goya Saturno devorando a su hijo", "obra": "Francisco de Goya — Saturno devorando um filho (1819–23)"},
    "goya_3maio":      {"arquivo": "El Tres de Mayo, by Francisco de Goya, from Prado thin black margin.jpg",
                        "busca": "Goya El tres de mayo de 1808 Prado", "obra": "Francisco de Goya — Os Fuzilamentos de 3 de Maio (1814)"},
    "goya_duelo":      {"arquivo": "Duelo a garrotazos.jpg",
                        "busca": "Goya Duelo a garrotazos pinturas negras", "obra": "Francisco de Goya — Duelo a Garrotazos (1820–23)"},
    "goya_desastres_1": {"arquivo": None, "busca": "Goya Desastres de la guerra Grande hazaña Con muertos",
                         "obra": "Francisco de Goya — Os Desastres da Guerra (1810–20)"},
    "goya_desastres_2": {"arquivo": None, "busca": "Goya Desastres de la guerra Y no hai remedio",
                         "obra": "Francisco de Goya — Os Desastres da Guerra (1810–20)"},
    "goya_desastres_3": {"arquivo": None, "busca": "Goya Desastres de la guerra Esto es peor",
                         "obra": "Francisco de Goya — Os Desastres da Guerra (1810–20)"},
    "gericault_medusa": {"arquivo": "JEAN LOUIS THÉODORE GÉRICAULT - La Balsa de la Medusa (Museo del Louvre, 1818-19).jpg",
                         "busca": "Géricault Raft of the Medusa Louvre", "obra": "Théodore Géricault — A Balsa da Medusa (1819)"},
    "dore_inferno_1":  {"arquivo": None, "busca": "Gustave Doré Inferno Canto 3 Charon", "obra": "Gustave Doré — Inferno de Dante (1857)"},
    "dore_inferno_2":  {"arquivo": None, "busca": "Gustave Doré Inferno Canto 5 Minos", "obra": "Gustave Doré — Inferno de Dante (1857)"},
    "dore_inferno_3":  {"arquivo": None, "busca": "Gustave Doré Inferno Canto 32 Cocytus", "obra": "Gustave Doré — Inferno de Dante (1857)"},
    "saque_roma":      {"arquivo": None, "busca": "Sylvestre Sack of Rome by the Visigoths 410",
                        "obra": "Joseph-Noël Sylvestre — O Saque de Roma pelos Visigodos (1890)"},
    "troia":           {"arquivo": None, "busca": "The Burning of Troy painting Kerstiaen de Keuninck",
                        "obra": "Kerstiaen de Keuninck — O Incêndio de Troia (séc. XVII)"},
    "cartago":         {"arquivo": None, "busca": "Destruction of Carthage painting", "obra": "A Destruição de Cartago"},
    "pompeia":         {"arquivo": None, "busca": "Karl Bryullov The Last Day of Pompeii",
                        "obra": "Karl Briullov — O Último Dia de Pompeia (1833)"},
    "forum_romano":    {"arquivo": None, "busca": "Piranesi Veduta di Campo Vaccino Roman Forum",
                        "obra": "Giovanni Battista Piranesi — Vista do Campo Vaccino / Fórum Romano (c. 1775)"},
    "hubert_robert_ruinas": {"arquivo": None, "busca": "Hubert Robert Grande Galerie du Louvre en ruines",
                             "obra": "Hubert Robert — A Grande Galeria do Louvre em Ruínas (1796)"},
    "muralha_medieval": {"arquivo": None, "busca": "Carcassonne walls 19th century photochrom",
                         "obra": "Muralhas de Carcassonne (fotocromo, c. 1890)"},
    "muralhas_constantinopla": {"arquivo": None, "busca": "Walls of Constantinople 19th century engraving",
                                "obra": "Muralhas de Constantinopla (gravura, séc. XIX)"},
    "castelo_berry":   {"arquivo": None, "busca": "Très Riches Heures du duc de Berry octobre Louvre",
                        "obra": "Irmãos Limbourg — Très Riches Heures du Duc de Berry (c. 1412)"},
    "friedrich_manha": {"arquivo": None, "busca": "Caspar David Friedrich Morning in the Riesengebirge",
                        "obra": "Caspar David Friedrich — Manhã nas Montanhas (1810)"},
    "turner_incendio": {"arquivo": None, "busca": "Turner Burning of the Houses of Lords and Commons 1834",
                        "obra": "J. M. W. Turner — O Incêndio das Casas do Parlamento (1834)"},
    "friedrich_abadia": {"arquivo": None, "busca": "Caspar David Friedrich Abbey in the Oakwood",
                         "obra": "Caspar David Friedrich — Abadia no Carvalhal (1810)"},
    "uccello_batalha": {"arquivo": None, "busca": "Paolo Uccello Battle of San Romano National Gallery",
                        "obra": "Paolo Uccello — A Batalha de San Romano (c. 1438)"},
    "altdorfer_issus": {"arquivo": None, "busca": "Albrecht Altdorfer Battle of Alexander at Issus",
                        "obra": "Albrecht Altdorfer — A Batalha de Alexandre em Isso (1529)"},
    "millet_angelus":  {"arquivo": None, "busca": "Jean-François Millet L'Angélus Orsay",
                        "obra": "Jean-François Millet — O Ângelus (1859)"},
    # --- arte moderna (séc. XX) já em domínio público: artistas falecidos há mais de 70 anos
    "kandinsky_composicao": {"arquivo": None, "busca": "Kandinsky Composition VII 1913 Tretyakov",
                             "obra": "Wassily Kandinsky — Composição VII (1913)"},
    "schiele_autorretrato": {"arquivo": None, "busca": "Egon Schiele self-portrait 1912 Leopold",
                             "obra": "Egon Schiele — Autorretrato (1912)"},
    "kirchner_soldado": {"arquivo": None, "busca": "Kirchner Self-Portrait as a Soldier 1915",
                         "obra": "Ernst Ludwig Kirchner — Autorretrato como Soldado (1915)"},
    "marc_destino_animais": {"arquivo": None, "busca": "Franz Marc Tierschicksale Fate of the Animals 1913",
                             "obra": "Franz Marc — O Destino dos Animais (1913)"},
    "nussbaum_triunfo": {"arquivo": None, "busca": "Felix Nussbaum Triumph des Todes 1944",
                         "obra": "Felix Nussbaum — O Triunfo da Morte (1944)"},
    "klee_angelus":    {"arquivo": None, "busca": "Paul Klee Angelus Novus 1920",
                        "obra": "Paul Klee — Angelus Novus, o 'Anjo da História' (1920)"},
    "kollwitz_nie_wieder": {"arquivo": None, "busca": "Käthe Kollwitz Nie wieder Krieg 1924",
                            "obra": "Käthe Kollwitz — Nunca Mais Guerra (1924)"},
    "malevich_quadrado": {"arquivo": None, "busca": "Malevich Black Square 1915 Tretyakov",
                          "obra": "Kazimir Malevich — Quadrado Negro (1915)"},
}

# ---------------------------------------------------------------------------
# CHAT DO SERVIDOR (fonte do Minecraft) — usado no After Effects e no Blender
# ---------------------------------------------------------------------------
CHAT = {
    "rolando": [
        ("Lucas_BR", "alguém tem ferro sobrando?"), ("Mari_04", "boa noite galera"),
        ("Pedro_Sul", "a casa do Rafa explodiu??"), ("ana.mine", "eita"),
        ("Joao2010", "quem fez isso"), ("Kaique", "alguém viu quem foi?"),
        ("xX_Blaze_Xx", "foi o pessoal do norte que explodiu a casa"),
        ("Bia_", "sério??"), ("Lucas_BR", "sempre eles"), ("Theo", "tem print?"),
        ("Pedro_Sul", "óbvio que foi o norte"), ("Rafa_Constroi", "minha casa..."),
    ],
    "destaque": "foi o pessoal do norte que explodiu a casa",
    "calma": "alguém viu quem foi?",
    "sul": [
        ("Pedro_Sul", "o norte já tinha ameaçado antes"), ("Bia_", "vi alguém de lá perto da casa"),
        ("Lucas_BR", "eles querem tomar o rio"), ("Mari_04", "precisamos nos proteger"),
        ("Theo", "não dá pra confiar neles"),
    ],
    "norte": [
        ("Gui_Norte", "agora vão culpar a gente"), ("Lia", "o sul inventou isso"),
        ("Davi_N", "eles mesmos explodiram pra ter desculpa"), ("Nina", "querem tomar o rio"),
        ("Gui_Norte", "não dá pra confiar neles"),
    ],
    "faccoes": [
        ("§9Azul_Davi", "árvore no meio do mapa era nossa por direito"), ("§cVermelho_Bia", "ATAQUE. eles atacaram"),
        ("§9Azul_Lia", "foi legítimo, eles começaram"), ("§cVermelho_Theo", "isso é crime"),
        ("§9Azul_Gui", "defesa."), ("§cVermelho_Ana", "vão pagar"),
    ],
}


def todos_os_ids_de_imagem():
    usados = []
    for b in BLOCOS:
        for f in b["fontes"]:
            if f["t"] == "img" and f["id"] not in usados:
                usados.append(f["id"])
    for a in ATOS:
        for i in a["preenchimento"].get("img", []):
            if i not in usados:
                usados.append(i)
    return usados
