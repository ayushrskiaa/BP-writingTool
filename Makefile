# Makefile for MyApp

# Define the Python interpreter from the virtual environment
PYTHON := venv/bin/python
PIP := venv/bin/pip

# Phony targets are not real files
.PHONY: all install build clean run help

# Default target
all: help

# Install dependencies from requirements.txt
install: venv/bin/activate
	@$(PIP) install -r requirements.txt
	@echo "✅ Dependencies installed successfully."

# Create the virtual environment if it doesn't exist
venv/bin/activate: requirements.txt
	test -d venv || python3 -m venv venv
	@echo "Virtual environment is set up."

# Build the application using PyInstaller
build: install
	@echo "📦 Building application..."
	@$(PYTHON) -m PyInstaller MyApp.spec --noconfirm
	@echo "🚀 Build complete. Check the 'dist' folder."

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
	@rm -f MyApp.spec-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
	@echo "✅ Clean up complete."

# Help command to display available targets
help:
	@echo "Available commands:"
	@echo "  make install    - Install Python dependencies"
	@echo "  make build      - Build the standalone application"
	@echo "  make run        - Run the application from source"
	@echo "  make clean      - Remove all build artifacts"
	@echo "  make help       - Show this help message"
