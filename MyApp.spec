# -*- mode: python ; coding: utf-8 -*-

from PyInstaller.utils.hooks import get_package_paths
import os
import sys

# Get the path to the hindi_xlit package
# pkg_path = get_package_paths('hindi_xlit')[0]
# model_data = (os.path.join(pkg_path, 'hindi_xlit'), 'models')

a = Analysis(
    ['app.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('templates', 'templates'),  # Include Flask templates
        ('static', 'static'),       # Include static files
        # (model_data),              # Include hindi_xlit model data
    ],
    hiddenimports=['flask', 'werkzeug', 'tkinter'],
    hookspath=['.'],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='BP-writing tool',
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
    icon='static/images/bihar-police-logo.ico'
)

# Add macOS app bundle
if sys.platform == 'darwin':
    app = BUNDLE(
        exe,
        name='MyApp.app',
        bundle_identifier=None,
        info_plist={
            'CFBundleName': 'MyApp',
            'CFBundleDisplayName': 'MyApp',
            'CFBundleVersion': '1.0.0',
            'CFBundleShortVersionString': '1.0.0',
            'NSHighResolutionCapable': True,
            'LSBackgroundOnly': False,
            'LSUIElement': False,
        },
    )
