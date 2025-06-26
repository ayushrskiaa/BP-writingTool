from PyInstaller.utils.hooks import collect_data_files, collect_submodules

# Correctly collect both data files and hidden imports for the package
datas = collect_data_files('hindi_xlit')
hiddenimports = collect_submodules('hindi_xlit') 