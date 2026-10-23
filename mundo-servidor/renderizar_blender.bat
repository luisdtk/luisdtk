@echo off
chcp 65001 >nul
cd /d "%~dp0"
set BLENDER="C:\Program Files\Blender Foundation\Blender 4.2\blender.exe"
echo Gerando as 20 cenas e renderizando em 4K (pode levar muitas horas).
echo Para so conferir rapido, edite este arquivo e troque --render por --render --preview
%BLENDER% -b -P blender\build_all.py -- --render
pause
