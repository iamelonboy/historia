@echo off
echo ====================================
echo Deploy HISTORIA Whitepaper to Gno.land
echo ====================================
echo.

cd /d %~dp0

echo Deploying whitepaper realm...
echo.

gnokey maketx addpkg melonboy314 ^
    -pkgdir ".\r\whitepaper" ^
    -pkgpath "gno.land/r/melonboy314/v1_whitepaper_historia" ^
    -gas-fee 1000000ugnot ^
    -gas-wanted 10000000 ^
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
echo White Paper deployed at:
echo https://gno.land/r/melonboy314/v1_whitepaper_historia
echo.
pause
