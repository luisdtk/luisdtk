# O MUNDO É UM SERVIDOR — kit de produção

**SUPERNOVA STUDIO · @ssupernova.studio** · vídeo de 10:00 em 4K com Blender + After Effects.

Este kit faz o trabalho pesado no seu PC: escolhe as melhores partes da gameplay, deixa a voz
com som de estúdio, organiza a narração por capítulo, sincroniza tudo com o roteiro (Whisper),
gera as 20 cenas 3D no Blender, baixa as pinturas de domínio público e monta o projeto
inteiro do After Effects (uma comp por ato + master).

## 1. Instalar (uma vez)

| Programa | Para quê |
|---|---|
| Python 3.11 (marque "Add to PATH") | roda o pipeline |
| ffmpeg (`winget install ffmpeg`) | áudio/vídeo |
| `pip install faster-whisper` | transcrição da narração |
| Blender 4.2 LTS (+ addon MCprep, opcional) | cenas 3D |
| After Effects 2023 ou mais novo | montagem final |
| Fontes: EB Garamond, Cormorant Garamond, Monocraft (gratuitas) | textos |

Confira os caminhos em `config.json` (já vêm com as pastas do seu PC).

## 2. Rodar

1. **`rodar_tudo.bat`**. Roda os passos 0 a 6:
   - **p00**: extrai as texturas e os sons originais do seu Minecraft.
   - **p01**: analisa a gameplay e corta travadas, menus, inventário, crafting e telas escuras.
     Veja `analise/contato_*.png` e `gameplay_relatorio.md`.
   - **p02**: deixa a voz com som de estúdio: redução de ruído, EQ, de-esser e compressão, em -16 LUFS.
     *Melhor ainda:* passe os .m4a antes no Adobe Podcast Enhance e salve em `Medal\narracao_enhanced\`.
   - **p03**: Whisper. Descobre qual frase do roteiro está em cada áudio (`relatorio_narracao.md`).
   - **p03b**: **reorganiza a narração por capítulo** (`narracao_organizada\Capitulo_1_...\1a.wav` …).
     Corta sempre no silêncio, emenda frases divididas entre arquivos e remove tropeços e repetições.
     Confira em `relatorio_cortes.md`.
   - **p04**: baixa as pinturas e as obras de arte moderna, todas em domínio público, e grava os créditos.
   - **p05**: trata as músicas e gera os efeitos sonoros simples.
   - **p06**: planeja a edição de 10:00 exatos e grava `edl.json` + `DECUPAGEM.md`.
2. **`renderizar_blender.bat`**. Gera as 20 cenas (`blender\cenas\*.blend`) e renderiza em 4K
   (Eevee: ~10–30 h; para conferir rápido use `--preview`).
3. **After Effects** → *File › Scripts › Run Script File…* → `after_effects/montar_projeto.jsx`,
   e escolha o `edl.json`. O projeto é montado, salvo e colocado na fila de render.
   O grade (Tritone + contraste + glow + grão) já vem aplicado. Cada ato também tem um Lumetri
   desligado para o seu ajuste fino ou para trocar por Magic Bullet Looks.
4. `python pipeline\p07_exportar.py`: gera o MP4 4K final (-14 LUFS, true peak -1 dB, AAC 320k)
   e o **Reels 9:16**.
5. `python pipeline\p08_checagem_final.py`: checa duração, telas pretas, travadas, volume e créditos.

Tudo vai para `C:\Users\luiss\Videos\Medal\` (e a pasta de trabalho `O_Mundo_e_um_Servidor_PROJETO`).

## 3. Estilo

- Referência: canal "O Logos Oficial". Grade vermelho quase monocromático, pretos esmagados,
  pinturas com zoom lento e dissolves longos.
- Texto: linha de referência e frase no mesmo tamanho, serifadas, brancas, pequenas, um pouco acima do centro.
- Arco de cor: Ato 1 dourado → Atos 2–4 cada vez mais vermelho e escuro → Ato 5 volta ao dourado.
- Barras de cinema 2.39:1, que também escondem a barra de vida e os itens. O crosshair é removido no p06.
- Arte moderna em domínio público (Kandinsky, Schiele, Klee, Kollwitz, Malevich, Kirchner, Marc, Nussbaum).
  Arte *contemporânea* (feita a partir dos anos 1960) tem direitos autorais e não foi usada.

## 4. Para editar

- Texto, cenas, frases na tela, imagens e sons: `roteiro.py` (fonte única; o texto é idêntico ao PDF do roteiro).
  Depois de mudar, rode de novo o p06 e o script do AE.
- Cenas 3D: `blender/cenas.py` (uma função por cena) e `blender/mc_lib.py` (blocos, personagens, efeitos).

## ⚠️ Direitos autorais das músicas

C418 – Warmth e as trilhas de Resident Evil têm direitos autorais. O Instagram ou o YouTube podem
silenciar o áudio ou bloquear o vídeo. Alternativas seguras: YouTube Audio Library, Pixabay Music,
Artlist ou Epidemic Sound.
