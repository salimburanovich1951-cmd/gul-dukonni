@echo off
title GitHub'ga yuklash - Gulzor
echo ================================================
echo    Gul do'koni loyihasini GitHub'ga yuklash
echo ================================================
echo.
git add .
git commit -m "Yangilanishlar yuklandi"
echo GitHub'ga yuborilmoqda (git push)...
git push -u origin main
echo.
echo ================================================
if %ERRORLEVEL% equ 0 (
    echo [MUVAFFAQIYATLI] Loyiha GitHub'ga yuklandi!
    echo Havola: https://github.com/salimburanovich1951-cmd/gul-dokoni
) else (
    echo [DIQQAT] Xatolik yuz berdi.
    echo Avval https://github.com/new manzilida 'gul-dokoni' nomli ombor ochilganiga ishonch hosil qiling.
)
echo ================================================
pause
