import socket
import os
import sys
import subprocess
import platform
from pathlib import Path

app_name = "BiharPoliceWritingTool"

def kill_process_on_port(port):
    """
    Kill any process running on the specified port.
    
    Args:
        port (int): The port number to check and kill processes on
        
    Returns:
        bool: True if process was killed or no process was found, False if failed
    """
    try:
        if platform.system() == "Windows":
            # Windows: Use netstat to find process and taskkill to kill it
            cmd = f'netstat -ano | findstr :{port}'
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            
            if result.returncode == 0 and result.stdout.strip():
                # Extract PID from netstat output
                lines = result.stdout.strip().split('\n')
                for line in lines:
                    if f':{port}' in line and 'LISTENING' in line:
                        parts = line.split()
                        if len(parts) >= 5:
                            pid = parts[-1]
                            # Kill the process
                            kill_cmd = f'taskkill /PID {pid} /F'
                            subprocess.run(kill_cmd, shell=True, capture_output=True)
                            return True
        else:
            # Unix-like systems (macOS, Linux): Use lsof and kill
            cmd = f'lsof -ti:{port}'
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            
            if result.returncode == 0 and result.stdout.strip():
                pids = result.stdout.strip().split('\n')
                for pid in pids:
                    if pid.strip():
                        # Kill the process
                        kill_cmd = f'kill -9 {pid.strip()}'
                        subprocess.run(kill_cmd, shell=True, capture_output=True)
                return True
        
        return True  # No process found or successfully killed
    except Exception as e:
        print(f"Error killing process on port {port}: {e}")
        return False

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