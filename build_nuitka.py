#!/usr/bin/env python3
"""
Nuitka build script for the Bihar Police Notebook application
Uses configuration files for platform-specific build settings
"""
import os
import sys
import json
import subprocess

def load_config():
    """Load Nuitka configuration from JSON file and inject dynamic values"""
    config_path = "nuitka-config.json"
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
        print("✓ Configuration loaded from nuitka-config.json")
                
        return config
    except FileNotFoundError:
        print(f"✗ Configuration file not found: {config_path}")
        return None
    except json.JSONDecodeError as e:
        print(f"✗ Invalid JSON in configuration file: {e}")
        return None

def get_platform_config(config):
    """Get platform-specific configuration"""
    platform_map = {
        "darwin": "macos",
        "win32": "windows"
    }
    
    platform = platform_map.get(sys.platform, "windows")
    platform_config = config.get(platform, {})
    
    return platform, platform_config

def build_app(config):
    """Build the application using Nuitka with configuration"""
    print("Building application with Nuitka...")
    
    # Get platform-specific configuration
    platform, platform_config = get_platform_config(config)
    
    # Build command with common flags
    cmd = [sys.executable, "-m", "nuitka"]
    cmd.extend(config["common"]["flags"])
    
    # Add platform-specific flags
    if platform_config.get("flags"):
        cmd.extend(platform_config["flags"])
        print(f"📱 Building for {platform_config['description']}")
    
    # Add main script
    cmd.append(config["common"]["main_script"])
    
    print(f"🌍 Platform: {platform}")
    print(f"🔧 Command: {' '.join(cmd)}")
    
    try:
        subprocess.check_call(cmd)
        print("✓ Build completed successfully!")
        print("✓ Executable created in dist/ directory")
        
        # List output files
        if os.path.exists("dist"):
            print("\nOutput files:")
            for item in os.listdir("dist"):
                print(f"  - {item}")
                
    except subprocess.CalledProcessError as e:
        print(f"✗ Build failed with error: {e}")
        return False
    
    return True

def main():
    print("=== Nuitka Build Script for Bihar Police Notebook ===\n")
    
    # Show platform info
    platform_name = {
        "darwin": "macOS",
        "win32": "Windows"
    }.get(sys.platform, "Windows")
    print(f"🌍 Building for: {platform_name}")
    
    # Load configuration
    config = load_config()
    if not config:
        print("✗ Cannot proceed without configuration")
        return
    
    # Build the application
    if build_app(config):
        print("\n🎉 Build completed! You can now test the executable.")
        print(f"   Look for the output in the dist/ directory")
    else:
        print("\n❌ Build failed. Check the error messages above.")

if __name__ == "__main__":
    main()
