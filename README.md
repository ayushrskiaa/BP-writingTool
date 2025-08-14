# 📝 BP Writing Tool

[![Build Status](https://github.com/ayushrskiaa/BP-writingTool/workflows/Build%20and%20Release%20Application/badge.svg)](https://github.com/ayushrskiaa/BP-writingTool/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS-lightgrey.svg)](https://github.com/ayushrskiaa/BP-writingTool/releases)

**BP Writing Tool** is a specialized desktop application developed specifically for the **Bihar Police** to facilitate Hindi document creation and management. This tool enables officers and staff to write in Hindi (Devanagari script) efficiently by typing in Hinglish (Romanized Hindi), with instant transliteration to Hindi script using advanced language models.

<table>
  <tr>
    <td><img src="image.png" alt="alt text" width="600"/></td>
    <td><img src="image-1.png" alt="alt text" width="600"/></td>
  </tr>
  <tr>
    <td><img src="image-2.png" alt="alt text" width="600"/></td>
    <td><img src="image-3.png" alt="alt text" width="600"/></td>
  </tr>
</table>

## ✨ Features

- 🚀 **Instant Transliteration** - Type in Hinglish, see Hindi output in real-time
- 📄 **Document Management** - Create, edit, save, and delete multiple documents
- 📚 **History Sidebar** - Browse and manage your document history, grouped by date
- 📤 **Export & Print** - Download or print your Hindi documents in styled format
- 💻 **Cross-Platform** - Available for Windows and macOS as standalone apps
- 🔒 **Local Data Storage** - All documents stored locally on device
- 🌐 **Extension Integration** - Enhanced input via Chrome extensions (requires internet)
- 🎯 **User-Friendly** - Clean interface with Tkinter-based GUI controller

## 🚀 Quick Start

### Download Latest Release

Visit our [Releases page](https://github.com/ayushrskiaa/BP-writingTool/releases) to download the latest version for your platform:
- **Windows**: Download `BP-writing tool.exe`
- **macOS**: Download `BP-writing-tool-macos.zip`, extract, and drag `MyApp.app` to Applications

### Prerequisites for Full Functionality

**Browser Requirement:** Use Google Chrome browser to access the required extensions.

To use the application at its full potential, install these Chrome browser extensions:

1. **[Google Input Tools](https://chromewebstore.google.com/detail/google-input-tools/mclkkofklkfljcocdinagocijmpgbhab?hl=en-US&utm_source=ext_sidebar)** - Provides virtual keyboards for over 90 languages, full IMEs for over 30 scripts, and handwriting input for over 40 languages. Enables enhanced Hindi input and transliteration.

2. **[Voice In - Speech-To-Text Dictation](https://chromewebstore.google.com/detail/voice-in-speech-to-text-d/pjnefijmagpdjfhhkpljicbbpicelgko?hl=en-US&utm_source=ext_sidebar)** - Enables voice typing in 50+ languages with real-time speech-to-text transcription. Works on 10k+ websites and supports 40+ languages.

**Note:** These extensions require internet connectivity to function, while your document data remains stored locally on your device for privacy and security.

## 🔧 Configuration

The application uses a local TinyDB database (`db.json`) that is automatically created on first run. All documents and settings are stored locally on your device, ensuring complete privacy and data security.

**Data Privacy:** Your documents are never transmitted over the internet and remain stored locally on your device. The Chrome extensions mentioned above require internet connectivity for their functionality, but they do not access your document data.

## 📖 API Documentation

See [doc/api_contracts.md](doc/api_contracts.md) for the full API contract and usage examples.

## 🐛 Issues and Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/ayushrskiaa/BP-writingTool/issues) page for existing solutions
2. Create a new issue with detailed information about your problem
3. Include your operating system, Python version, and any error messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 For Developers

### Prerequisites

- Python 3.11 or higher
- pip (Python package installer)

### Installation from Source

```bash
# Clone the repository
git clone https://github.com/ayushrskiaa/BP-writingTool.git
cd BP-writingTool

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the application
python app.py
```

The app will be available at [http://127.0.0.1:5000](http://127.0.0.1:5000).

### Project Structure

```
BP-writingTool/
├── app.py                  # Main Flask application
├── requirements.txt        # Python dependencies
├── Makefile               # Build and management commands
├── build_nuitka.py        # Nuitka build script for packaging
├── src/                   # Source code
│   ├── launcher.py        # Tkinter GUI launcher
│   ├── routers.py         # Flask routes
│   ├── utils.py           # Utility functions
│   ├── db_handler.py      # Database operations
│   └── diary/             # Diary-related modules
├── static/                # Static assets
│   ├── app.js             # Main JavaScript
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript modules
│   └── images/            # Images and icons
├── templates/             # HTML templates
│   └── index.html         # Main template
└── .github/workflows/     # GitHub Actions
    ├── main.yml           # Build and release workflow
    └── cleanup-keep-n.yml # Cleanup workflow
```

### Building Standalone Applications

```bash
# Install Nuitka
pip install nuitka

# Build for current platform
make build

# Or manually
python build_nuitka.py
```

The executables will be in the `dist/` folder.

### Available Make Commands

```bash
make install    # Install dependencies
make build      # Build standalone application
make run        # Run from source
make clean      # Clean build artifacts
make help       # Show all commands
```

### Technology Stack

- **Frontend**: HTML, CSS, JavaScript (served via Flask)
- **Backend**: Python (Flask)
- **Transliteration**: [hindi-xlit](https://pypi.org/project/hindi-xlit/)
- **Database**: TinyDB (local JSON storage)
- **Packaging**: Nuitka for standalone executables
- **CI/CD**: GitHub Actions for automated builds and releases

### Requirements

- **flask==3.1.1** - Web framework for the backend server
- **tinydb==4.8.2** - Lightweight, document-oriented database
- **pillow==11.3.0** - Python Imaging Library for image processing

## 🤝 Contributing

This project is developed specifically for the Bihar Police but is open source to encourage community contributions and improvements. While the primary audience is law enforcement personnel in Bihar, we welcome contributions from developers who can help enhance the tool's functionality and usability.

Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### How to Contribute

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow PEP 8 style guidelines
- Add tests for new features
- Update documentation as needed
- Ensure the application builds successfully

## 🙏 Acknowledgments

- [Flask](https://flask.palletsprojects.com/) - Web framework
- [hindi-xlit](https://pypi.org/project/hindi-xlit/) - Transliteration engine
- [TinyDB](https://tinydb.readthedocs.io/) - Lightweight database
- [Nuitka](https://nuitka.net/) - Application packaging

## 📊 Project Status

- ✅ **Active Development** - Regular updates and improvements
- ✅ **Cross-Platform** - Windows and macOS support
- ✅ **Automated Builds** - GitHub Actions for continuous integration
- ✅ **Version Management** - Automated releases with versioning
- ✅ **Bihar Police Specific** - Tailored for law enforcement documentation needs
- ✅ **Open Source** - Available for community contributions and improvements

---

**Made with ❤️ specifically for the Bihar Police to modernize Hindi documentation workflows**