REM Admin stuff
@echo off
NET SESSION
IF %ERRORLEVEL% NEQ 0 GOTO ELEVATE
GOTO ADMINTASKS

:ELEVATE
CD /d %~dp0
MSHTA "javascript: var shell = new ActiveXObject('shell.application'); shell.ShellExecute('%~nx0', '', '', 'runas', 1);close();"
EXIT

:ADMINTASKS

REM cmd.exe starts by default in C:/Windows/system32 and all commands you execute is based on this path
REM move to current update.cmd directory, this avoid creating symlinks and folders in system32
cd /D %~dp0
cls

REM Get kolbot
echo Get kolbot
if not exist d2bot/d2bot.exe git clone https://github.com/blizzhackers/kolbot d2bot

REM Needs admin acccess for these two, make link between dst and ryuk folder in d2bs
echo Make links between transpiled ryuk and d2bs
if not exist dst mkdir dst
if not exist d2bot\d2bs\kolbot\libs\ryuk mklink /D d2bot\d2bs\kolbot\libs\ryuk ..\..\..\..\dst

echo Copy in _CustomConfig.js and D2BotRyuk.dbj
REM Copy the files needed in d2bs for this to work
echo y | copy install\_CustomConfig.js d2bot\d2bs\kolbot\libs\config
echo y | copy install\D2BotRyuk.dbj d2bot\d2bs\kolbot
echo y | copy install\D2BS.dll d2bot\d2bs\D2BS.dll
echo y | copy install\patch.json d2bot\data\patch.json

echo Copy profile.json if empty
REM Copy profile.json if empty
for /f %%i in ("d2bot\data\profile.json") do set size=%%~zi
if not %size% gtr 0 echo y | copy install\profile.json d2bot\data\profile.json

echo install typescript
REM install typescript
cmd /c npm install

echo transpile
REM Transpile
cmd /c npx tsc

echo start d2bot
cd d2bot && start D2Bot.exe

cd ..