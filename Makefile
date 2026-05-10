# Makefile for MyApp

# Define the Python interpreter from the virtual environment
PYTHON := venv/bin/python
PIP := venv/bin/pip

# Phony targets are not real files
.PHONY: all install build clean run help

# Default target
all: help

# Install dependencies from requirements.txt
install: _venv
	@$(PIP) install -r requirements.txt
	@$(PIP) install nuitka
	@echo "✅ Dependencies installed successfully."
	@echo "💡 To activate the virtual environment, run: source venv/bin/activate"

# Create the virtual environment if it doesn't exist
_venv: requirements.txt
	test -d venv || python3 -m venv venv
	@echo "Virtual environment is set up."

# Build the application using Nuitka
build: clean
	@echo "📦 Building application with Nuitka..."
	@$(PYTHON) build_nuitka.py
	@echo "🚀 Build complete. Check the 'dist' folder."

# Create DMG installer from built app
dmg:
	@echo "📦 Creating DMG installer..."
	@chmod +x create_dmg.sh
	@./create_dmg.sh
	@echo "✅ DMG creation complete. Check the 'dist' folder."

# Run the application from source
run: install
	@echo "🏃 Running application from source..."
	@$(PYTHON) app.py

# Clean up build artifacts
clean:
	@echo "🧹 Cleaning up build artifacts..."
	@rm -rf build/
	@rm -rf dist/
	@rm -rf *.pyc
	@rm -rf __pycache__/
	@rm -rf *.bin
	@rm -rf *.app
	@rm -rf *.dSYM
	@rm -rf nuitka-crash-report.xml
	@rm -rf *.build
	@rm -rf *.dist
	@rm -rf *.onefile-build
	@rm -rf Info.plist
	@echo "✅ Clean up complete."

# Help command to display available targets
help:
	@echo "Available commands:"
	@echo "  make install    - Install Python dependencies"
	@echo "  make build      - Build the standalone application"
	@echo "  make dmg        - Create DMG installer from built app"
	@echo "  make run        - Run the application from source"
	@echo "  make clean      - Remove all build artifacts"
	@echo "  make help       - Show this help message"
