@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set /p VERSION=Version eingeben (z.B. 0.17.7): 
if "%VERSION%"=="" (
  echo Keine Version eingegeben.
  pause
  exit /b 1
)

for /f "tokens=* delims= " %%A in ("%VERSION%") do set "VERSION=%%A"

node -e "const v=(process.argv[1]||'').trim(); if(!/^\d+\.\d+\.\d+$/.test(v)) process.exit(1);" "%VERSION%"
if errorlevel 1 (
  echo Ungueltiges Versionsformat. Bitte x.y.z verwenden.
  pause
  exit /b 1
)

node -e "const fs=require('fs'); const p='package.json'; const j=JSON.parse(fs.readFileSync(p,'utf8')); j.version=process.argv[1]; fs.writeFileSync(p, JSON.stringify(j,null,2)+'\n');" "%VERSION%"
if errorlevel 1 (
  echo Fehler beim Schreiben von package.json.
  pause
  exit /b 1
)

echo Version gesetzt auf v%VERSION%

git add -A
git commit -m "v%VERSION%" --no-verify
if errorlevel 1 (
  echo Commit fehlgeschlagen.
  pause
  exit /b 1
)

git push origin HEAD
if errorlevel 1 (
  echo Push fehlgeschlagen.
  pause
  exit /b 1
)

echo Fertig: v%VERSION% wurde gepusht.
pause
endlocal
