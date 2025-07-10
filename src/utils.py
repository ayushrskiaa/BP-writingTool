import socket
import os
import sys
from pathlib import Path

app_name = "BiharPoliceWritingTool"

def check_port_available(port):
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(('localhost', port))
            return True
    except OSError:
        return False

def get_app_data_directory():
    """
    Get the appropriate application data directory based on the operating system.
    """
    
    if sys.platform == "darwin":  # macOS
        base_path = Path.home() / "Library" / "Application Support"
        app_data_dir = base_path / app_name
    elif sys.platform == "win32":  # Windows
        # Use %LOCALAPPDATA% for local-only storage
        app_data_dir = Path(os.environ.get('LOCALAPPDATA', '')) / app_name
    else:
        raise NotImplementedError(f"Unsupported platform: {sys.platform}")
    
    app_data_dir.mkdir(parents=True, exist_ok=True)
    return str(app_data_dir)


def ensure_app_data_directory():
    """
    Ensure the application data directory exists and is writable.
    
    Returns:
        bool: True if directory is ready, False otherwise
    """
    try:
        app_data_dir = get_app_data_directory()
        # Test if we can write to the directory
        test_file = os.path.join(app_data_dir, '.test_write')
        with open(test_file, 'w') as f:
            f.write('test')
        os.remove(test_file)
        return True
    except Exception as e:
        print(f"Error ensuring app data directory: {e}")
        return False