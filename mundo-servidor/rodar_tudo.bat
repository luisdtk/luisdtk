@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo === O MUNDO E UM SERVIDOR - pipeline ===
python pipeline\p00_preparar_assets_minecraft.py || goto erro
python pipeline\p01_analisar_gameplay.py || goto erro
python pipeline\p02_tratar_narracao.py || goto erro
python pipeline\p03_transcrever_e_sincronizar.py || goto erro
python pipeline\p03b_organizar_narracao.py || goto erro
python pipeline\p04_baixar_imagens.py || goto erro
python pipeline\p05_tratar_musicas_e_sfx.py || goto erro
python pipeline\p06_planejar_edicao.py || goto erro
echo.
echo Pronto. Agora:
echo  1) Blender: renderizar_blender.bat
echo  2) After Effects: File ^> Scripts ^> Run Script File ^> after_effects\montar_projeto.jsx
echo  3) Depois do render do AE: python pipeline\p07_exportar.py  e  python pipeline\p08_checagem_final.py
pause
exit /b 0
:erro
echo.
echo ERRO no passo acima. Leia a mensagem e rode de novo.
pause
exit /b 1
