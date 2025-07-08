import os
import sys
import logging
import threading
import webbrowser
import tkinter as tk

from tkinter import messagebox, ttk
from datetime import datetime
from flask import Flask, render_template, request, jsonify
from werkzeug.serving import make_server
import queue
import socket

from tinydb import TinyDB, Query

# Get the application path - works both in dev and PyInstaller bundle
def get_app_path():
    if getattr(sys, 'frozen', False):
        # If the application is run as a bundle (PyInstaller)
        return sys._MEIPASS
    else:
        # If run from Python interpreter
        return os.path.dirname(os.path.abspath(__file__))

# Initialize hindi_xlit with proper model path
app_path = get_app_path()


# Configure logging to only use console
def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[logging.StreamHandler(sys.stdout)]
    )

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

# Log startup information
logger.info("=" * 50)
logger.info("Application Starting")
logger.info(f"Python executable: {sys.executable}")
logger.info(f"Working directory: {os.getcwd()}")
logger.info(f"Application path: {app_path}")

# Initialize Flask app with correct template and static folders
app = Flask(__name__, 
           template_folder=os.path.join(app_path, 'templates'),
           static_folder=os.path.join(app_path, 'static'))

# Initialize TinyDB
db = TinyDB('db.json')
Document = Query()

def check_port_available(port):
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(('localhost', port))
            return True
    except OSError:
        return False

def check_server_running(port):
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1)
            return s.connect_ex(('localhost', port)) == 0
    except:
        return False

class FlaskAppGUI:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Flask Application Controller")
        self.root.geometry("450x550")
        self.root.minsize(450, 550)
        self.root.protocol("WM_DELETE_WINDOW", self.quit_app)

        self.setup_styles()
        
        self.server_running = False
        self.flask_server = None
        self.status_queue = queue.Queue()
        
        self.create_widgets()
        self.check_status_queue()

    def setup_styles(self):
        self.colors = {
            'bg': '#F0F0F0',
            'frame': '#FFFFFF',
            'text': '#333333',
            'subtext': '#666666',
            'success': '#28a745',
            'danger': '#dc3545',
            'warning': '#ffc107',
            'info': '#17a2b8',
            'light': '#F8F9FA',
            'dark': '#343A40',
            'border': '#DDDDDD'
        }
        self.root.configure(bg=self.colors['bg'])

        style = ttk.Style(self.root)
        style.theme_use('clam')

        font_family = "Segoe UI" if sys.platform == "win32" else "Helvetica"
        
        # Define styles for widgets to avoid direct configuration
        style.configure('TFrame', background=self.colors['frame'])
        style.configure('BG.TFrame', background=self.colors['bg'])
        style.configure('Card.TFrame', background=self.colors['frame'], borderwidth=1, relief='solid')
        style.configure('TLabel', background=self.colors['frame'], foreground=self.colors['text'], font=(font_family, 10))
        style.configure('Header.TLabel', font=(font_family, 18, 'bold'), background=self.colors['bg'])
        style.configure('SubHeader.TLabel', foreground=self.colors['subtext'], font=(font_family, 10), background=self.colors['bg'])
        style.configure('Status.TLabel', font=(font_family, 14, 'bold'), background=self.colors['frame'])

        for btn_style, color in [('Success', 'success'), ('Danger', 'danger'), ('Info', 'info'), ('Dark', 'dark')]:
            style.configure(f'{btn_style}.TButton', 
                            background=self.colors[color], 
                            foreground='white',
                            font=(font_family, 14, 'bold'),
                            borderwidth=0, relief='flat',
                            padding=(10, 8))
            style.map(f'{btn_style}.TButton',
                      background=[('active', self.colors[color]), ('disabled', self.colors['bg'])],
                      foreground=[('disabled', self.colors['subtext'])])
        
    def create_widgets(self):
        main_frame = ttk.Frame(self.root, style='BG.TFrame', padding=(20, 20))
        main_frame.pack(fill='both', expand=True)
        
        # --- Header ---
        header = ttk.Label(main_frame, text="🚀 Flask Application Controller", style='Header.TLabel')
        header.pack(pady=(0, 5))
        subheader = ttk.Label(main_frame, text="Manage your Flask web server with ease", style='SubHeader.TLabel')
        subheader.pack(pady=(0, 20))

        # --- Status Card ---
        status_card = ttk.Frame(main_frame, style='Card.TFrame', padding=(20, 15))
        status_card.pack(fill='x', pady=10)
        
        ttk.Label(status_card, text="Server Status", font=("Helvetica", 12, 'bold')).pack()
        self.status_label = ttk.Label(status_card, text="● Stopped", foreground=self.colors['danger'], style='Status.TLabel')
        self.status_label.pack(pady=5)
        ttk.Label(status_card, text="Port: 8080", style='SubHeader.TLabel').pack()

        # --- Controls Card ---
        controls_card = ttk.Frame(main_frame, style='Card.TFrame', padding=(20, 15))
        controls_card.pack(fill='x', pady=10)
        ttk.Label(controls_card, text="Server Controls", font=("Helvetica", 12, 'bold')).pack(pady=(0, 15))
        
        self.start_button = ttk.Button(controls_card, text="▶ Start Server", style='Success.TButton', command=self.start_server)
        self.start_button.pack(fill='x', pady=4)
        
        self.browser_button = ttk.Button(controls_card, text="🌐 Open Browser", style='Info.TButton', command=self.open_browser, state='disabled')
        self.browser_button.pack(fill='x', pady=4)

        self.stop_button = ttk.Button(controls_card, text="⏹ Stop Server", style='Danger.TButton', command=self.stop_server, state='disabled')
        self.stop_button.pack(fill='x', pady=4)
        
        # Bind cursor events to all buttons
        cursor_name = "pointinghand" if sys.platform == "darwin" else "hand2"
        for button in [self.start_button, self.browser_button, self.stop_button]:
            button.bind("<Enter>", lambda e, b=button: b.winfo_toplevel().config(cursor=cursor_name))
            button.bind("<Leave>", lambda e, b=button: b.winfo_toplevel().config(cursor=""))

        # --- Activity Log ---
        log_card = ttk.Frame(main_frame, style='Card.TFrame', padding=(20, 15))
        log_card.pack(fill='both', expand=True, pady=10)
        ttk.Label(log_card, text="Activity Log", font=("Helvetica", 12, 'bold')).pack(pady=(0, 10))

        log_text_frame = ttk.Frame(log_card, style='TFrame')
        log_text_frame.pack(fill='both', expand=True)

        self.log_text = tk.Text(log_text_frame, height=5, font=("Courier", 9), relief='solid', borderwidth=1,
                                bg=self.colors['light'], fg=self.colors['text'], wrap=tk.WORD,
                                state='disabled', highlightthickness=1, highlightbackground=self.colors['border'])
        
        log_scrollbar = ttk.Scrollbar(log_text_frame, orient="vertical", command=self.log_text.yview)
        self.log_text.configure(yscrollcommand=log_scrollbar.set)
        
        log_scrollbar.pack(side="right", fill="y")
        self.log_text.pack(side="left", fill="both", expand=True)

    def log_message(self, message):
        self.log_text.config(state='normal')
        self.log_text.insert('end', f"[{datetime.now():%H:%M:%S}] {message}\n")
        self.log_text.see('end')
        self.log_text.config(state='disabled')
        
    def update_status(self, status, color_key):
        icons = {'running': '●', 'stopped': '●', 'starting': '⟳', 'stopping': '⟳'}
        self.status_label.config(text=f"{icons.get(status, '●')} {status.title()}", foreground=self.colors[color_key])
        
    def start_server(self):
        if self.server_running: return
        if not check_port_available(8080):
            messagebox.showerror("Port Error", "Port 8080 is already in use.")
            return

        # Disable button immediately
        self.start_button.config(text="⟳ Starting...")
        self.start_button.state(['disabled'])
        self.log_message("Starting server...")
        self.update_status('starting', 'warning')

        try:
            # Start the server in the background
            threading.Thread(target=self.run_flask_server, daemon=True).start()
        except Exception as e:
            # If thread creation fails, immediately revert the UI
            self.log_message(f"❌ Failed to start thread: {e}")
            self.update_status('stopped', 'danger')
            self.start_button.config(text="▶ Start Server")
            self.start_button.state(['!disabled'])
            messagebox.showerror("Error", f"Failed to start server thread:\n{e}")

    def run_flask_server(self):
        try:
            self.flask_server = make_server('0.0.0.0', 8080, app, threaded=True)
            self.status_queue.put("running")
            self.flask_server.serve_forever()
        except Exception as e:
            logger.error(f"Flask server error: {e}")
            self.status_queue.put(("error", e))

    def stop_server(self):
        if not self.server_running or not self.flask_server: return

        # Disable button immediately
        self.stop_button.config(text="⟳ Stopping...")
        self.stop_button.state(['disabled'])
        self.browser_button.state(['disabled'])
        self.log_message("Stopping server...")
        self.update_status('stopping', 'warning')
        
        try:
            # Shutdown in the background
            threading.Thread(target=self.flask_server.shutdown, daemon=True).start()
        finally:
            # This will run immediately, handing off the rest to the queue checker
            self.status_queue.put("stopped")

    def open_browser(self):
        self.log_message("Opening browser...")
        webbrowser.open('http://localhost:8080')

    def check_status_queue(self):
        try:
            message = self.status_queue.get_nowait()
            if message == "running":
                self.server_running = True
                self.log_message("✅ Server is running.")
                self.update_status('running', 'success')
                self.start_button.config(text="▶ Server Running")
                self.start_button.state(['disabled'])
                self.browser_button.state(['!disabled'])
                self.stop_button.state(['!disabled'])
            elif message == "stopped":
                self.server_running = False
                self.flask_server = None
                self.log_message("✅ Server stopped.")
                self.update_status('stopped', 'danger')
                self.start_button.config(text="▶ Start Server")
                self.start_button.state(['!disabled'])
                self.browser_button.state(['disabled'])
                self.stop_button.config(text="⏹ Stop Server")
                self.stop_button.state(['disabled'])
            elif isinstance(message, tuple) and message[0] == "error":
                self.log_message(f"❌ Server error: {message[1]}")
                messagebox.showerror("Server Error", f"The server failed to start:\n{message[1]}")
        except queue.Empty:
            pass
        finally:
            self.root.after(100, self.check_status_queue)
            
    def quit_app(self):
        if messagebox.askokcancel("Quit Application", "Are you sure you want to quit?"):
            if self.server_running and self.flask_server:
                self.log_message("Stopping server before quitting...")
                threading.Thread(target=self.flask_server.shutdown, daemon=True).start()
            self.root.destroy()

# --- Flask Routes ---
@app.route('/')
def index():
    return render_template('index.html')



@app.route('/api/save_document', methods=['POST'])
def save_document():
    data = request.get_json()
    filename = data.get('filename')
    content = data.get('content')
    now = datetime.now().isoformat()
    # Check if document exists
    existing = db.get(Document.filename == filename)
    if existing:
        db.update({'content': content, 'updated_at': now}, Document.filename == filename)
    else:
        db.insert({'filename': filename, 'content': content, 'created_at': now, 'updated_at': now})
    return jsonify({'success': True})

@app.route('/api/delete_document', methods=['POST'])
def delete_document():
    data = request.get_json()
    filename = data.get('filename')
    db.remove(Document.filename == filename)
    return jsonify({'success': True})

@app.route('/api/get_documents', methods=['GET'])
def get_documents():
    docs = db.all()
    return jsonify({'documents': docs})

@app.route('/diary')
def diary():
    return render_template('diary.html')

if __name__ == '__main__':
    gui = FlaskAppGUI()
    gui.root.mainloop()