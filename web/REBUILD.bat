@echo off
echo ====================================
echo REBUILD HISTORIA Frontend
echo ====================================
echo.

cd /d %~dp0

echo [1/3] Nettoyage du cache Next.js...
if exist .next (
    rmdir /s /q .next
    echo Cache .next supprime
) else (
    echo Pas de cache .next trouve
)

if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
    echo Cache node_modules supprime
)

echo.
echo [2/3] Reinstallation des dependances...
call npm install

echo.
echo [3/3] Build du projet...
call npm run build

echo.
echo ====================================
echo REBUILD TERMINE
echo ====================================
echo.
echo Pour lancer en dev:  npm run dev
echo Pour lancer en prod: npm start
echo.
pause
