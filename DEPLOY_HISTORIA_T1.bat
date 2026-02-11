@echo off
echo ====================================
echo Deploy HISTORIA t1 to Gno.land
echo ====================================
echo.

cd /d %~dp0

echo Deploying historia realm t1...
echo.

gnokey maketx addpkg melonboy314 ^
    -pkgdir ".\deploy\historia_t1" ^
    -pkgpath "gno.land/r/melonboy314/historia_t1" ^
    -gas-fee 1000000ugnot ^
    -gas-wanted 20000000 ^
    -broadcast ^
    -chainid staging ^
    -remote https://rpc.gno.land:443

if errorlevel 1 (
    echo.
    echo ERREUR lors du deploiement
    pause
    exit /b 1
)

echo.
echo ====================================
echo DEPLOIEMENT TERMINE
echo ====================================
echo.
echo HISTORIA t1 deployed at:
echo https://gno.land/r/melonboy314/historia_t1
echo.
echo Next step: Update web\.env.local
echo NEXT_PUBLIC_REALM_PATH=gno.land/r/melonboy314/historia_t1
echo.
pause
