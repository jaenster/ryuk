@echo off

set regPath="HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders"
set regPath2="HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Explorer\Shell Folders"
set regKey={4C5C32FF-BB9D-43B0-B5B4-2D72E54EAAA4}

FOR /F "usebackq skip=2 tokens=1-2*" %%A IN (`REG QUERY %regPath% /v %regKey% 2^>nul`) DO (
    set savedPath=%%C
)

if not defined savedPath (
	FOR /F "usebackq skip=2 tokens=1-2*" %%A IN (`REG QUERY %regPath2% /v %regKey% 2^>nul`) DO (
		set savedPath=%%C
	)
)

if defined savedPath (
    @echo Value Value = %savedPath%
    cd /D %~dp0
    echo y | copy RyukSC.d2s "%savedPath%\Diablo II\Ryuk.d2s"
    echo y | copy RyukData.Ryuk.lvl.csv ..\..\..\data\RyukData.Ryuk.lvl.csv

    del ..\..\..\data\RyukData.Ryuk.json
    del ..\..\..\data\BOT.json
) else (
    @echo %regPath%\%regKey% not found.
    pause
)