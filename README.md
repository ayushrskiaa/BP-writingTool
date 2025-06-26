# 🚀 Flask Application Controller

A cross-platform desktop application built with Python, Flask, and Tkinter that provides a simple GUI to control a local web server. This application is packaged into a standalone executable for both macOS and Windows using PyInstaller.

## ✨ Features

- **Cross-Platform**: Single codebase for both macOS and Windows.
- **GUI Controller**: An intuitive Tkinter interface to start, stop, and monitor the Flask server.
- **Standalone Executable**: Packaged into a single file (`.app` for macOS, `.exe` for Windows) with no external dependencies required for the user.
- **Real-time Status**: The GUI provides immediate feedback on the server's status (Running, Stopped, Starting, etc.).
- **Activity Log**: An in-app console shows real-time activity and logs.
- **Automated Build Process**: Includes a `Makefile` to simplify dependency installation and application bundling.

## 🛠️ Setup and Installation (For Developers)

To get started with the development environment, you'll need Python 3.8+ and `pip`.

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd simple_app
```

### 2. Create and Activate a Virtual Environment

It's highly recommended to use a virtual environment to manage dependencies.

**On macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**On Windows:**
```bash
python -m venv venv
.\venv\Scripts\activate
```

### 3. Install Dependencies

All required Python packages are listed in `requirements.txt`. You can install them using pip or the provided Makefile.

**Using pip:**
```bash
pip install -r requirements.txt
```

**Using the Makefile (on macOS/Linux):**
```bash
make install
```

## 📦 Building the Application

The application is bundled into a distributable executable using PyInstaller. A `Makefile` is provided to simplify this process.

### On macOS

To create the `MyApp.app` bundle:
```bash
make build
```
The final application will be located at `dist/MyApp.app`.

### On Windows

To create the `MyApp.exe` executable:
```bash
# Ensure you have make installed or run the command directly
pyinstaller MyApp.spec
```
The final application will be located at `dist/MyApp.exe`.

## 🏃 Running the Application

- **From Source**: `python app.py`
- **Packaged App (macOS)**: Double-click `dist/MyApp.app`.
- **Packaged App (Windows)**: Double-click `dist/MyApp.exe`.

## 🧹 Cleaning the Build Artifacts

To remove all generated files and folders from the build process (like `dist`, `build`, and `__pycache__`), you can use the Makefile.

```bash
make clean
```

## 📂 Project Structure
```
.
├── app.py
├── hook-hindi_xlit.py
├── Makefile
├── MyApp.spec
├── README.md
└── requirements.txt
```