# -*- mode: python ; coding: utf-8 -*-

import os
import sys
from src import __version__

a = Analysis(
    ['app.py'],
    pathex=['src'],
    binaries=[],
    datas=[
        ('templates', 'templates'),
        ('static', 'static'),
    ],
    hiddenimports=['flask', 'werkzeug', 'tkinter'],
    optimize=2,
)
pyz = PYZ(a.pure)

# Build only for Windows or macOS
if sys.platform == 'win32':
    # Windows build
    exe = EXE(
        pyz,
        a.scripts,
        a.binaries,
        a.datas,
        [],
        name='Bihar-Police-Notebook-Windows',
        console=False,
        icon='static/images/logo.png',
        strip=True,
        upx=True,
        upx_exclude=[],
        runtime_tmpdir=None,
        debug=False,
        bootloader_ignore_signals=False,
        disable_windowed_traceback=False,
        argv_emulation=False,
        target_arch=None,
        codesign_identity=None,
        entitlements_file=None
    )
elif sys.platform == 'darwin':
    # macOS build
    exe = EXE(
        pyz,
        a.scripts,
        a.binaries,
        a.datas,
        [],
        name='Bihar-Police-Notebook',
        console=False,
        icon='static/images/logo.png',
        strip=True,
        upx=True,
        upx_exclude=[],
        runtime_tmpdir=None,
        debug=False,
        bootloader_ignore_signals=False,
        disable_windowed_traceback=False,
        argv_emulation=False,
        target_arch=None,
        codesign_identity=None,
        entitlements_file=None
    )
    
    app = BUNDLE(
        exe,
        name='Bihar-Police-Notebook.app',
        info_plist={
            'CFBundleName': 'Bihar Police Notebook',
            'CFBundleDisplayName': 'Bihar Police Notebook',
            'CFBundleVersion': __version__,
            'CFBundleShortVersionString': __version__,
            'NSHighResolutionCapable': True,
        },
        icon='static/images/logo.png'
    )
else:
    print(f"Unsupported platform: {sys.platform}. Only Windows and macOS are supported.")
    sys.exit(1)
