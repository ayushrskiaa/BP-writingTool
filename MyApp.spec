# -*- mode: python ; coding: utf-8 -*-

import os
import sys
from src import __version__

a = Analysis(
    ['app.py'],
    pathex=['src'],  # Add src directory to Python path
    binaries=[],
    datas=[
        ('templates', 'templates'),  # Include Flask templates
        ('static', 'static'),       # Include static files
    ],
    hiddenimports=['flask', 'werkzeug', 'tkinter'],
    optimize=2,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='Bihar-Police-Notebook-Windows',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='static/images/logo.png'
)

# Add macOS app bundle
if sys.platform == 'darwin':
    app = BUNDLE(
        exe,
        name='Bihar-Police-Notebook.app',
        bundle_identifier=None,
        info_plist={
            'CFBundleName': 'Bihar Police Notebook',
            'CFBundleDisplayName': 'Bihar Police Notebook',
            'CFBundleVersion': __version__,
            'CFBundleShortVersionString': __version__,
            'NSHighResolutionCapable': True,
            'LSBackgroundOnly': False,
            'LSUIElement': False,
        },
        icon='static/images/logo.png'
    )
