import sys
import os
import threading
import webbrowser
import tkinter as tk
from PIL import Image, ImageTk

from tkinter import messagebox, ttk
from datetime import datetime
from werkzeug.serving import make_server
import queue

from src.utils import check_port_available, kill_process_on_port
from src.logger import logger
from src import __version__


class FlaskAppGUI:
    def __init__(self, app):
        self.app = app
        self.root = tk.Tk()
        self.root.title(f"Bihar Police Notebook Launcher v{__version__}")
        self.root.geometry("450x550")
        self.root.minsize(450, 550)
        self.root.protocol("WM_DELETE_WINDOW", self.quit_app)

        self.setup_styles()
        
        self.server_running = False
        self.flask_server = None
        self.status_queue = queue.Queue()
        
        self.create_widgets()
        self.check_status_queue()
        
        # Auto-start the server when app launches
        self.root.after(1000, self.auto_start_server)  # Start after 1 second

    def setup_styles(self):
        self.colors = {
            'bg': '#e0d3b3',
            'frame': '#ede9de',
            'text': '#333333',
            'subtext': '#666666',
            'success': '#28a745',
            'danger': '#dc3545',
            'warning': '#ffc107',
            'info': '#052361',
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
        style.configure('SubHeader.TLabel', foreground=self.colors['subtext'], font=(font_family, 15), background=self.colors['bg'])
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
        
        # --- Logo ---
        logo_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', 'images', 'logo.png')
        if os.path.exists(logo_path):
            logo_img = Image.open(logo_path)
            logo_img = logo_img.resize((80, 90), Image.LANCZOS)  # Increased size for square image
            self.logo_photo = ImageTk.PhotoImage(logo_img)
            logo_label = tk.Label(main_frame, image=self.logo_photo, bg=self.colors['bg'])
            logo_label.pack(pady=(0, 10))
        
        # --- Header ---
        header = ttk.Label(main_frame, text="Bihar Police Notebook", style='Header.TLabel')
        header.pack(pady=(0, 5))
        
        # --- Subheader ---
        subheader1 = ttk.Label(main_frame, text="By courtesy of Vaishali Police", style='SubHeader.TLabel')
        subheader1.pack(pady=(0, 10))

        # --- Status Card ---
        status_card = ttk.Frame(main_frame, style='Card.TFrame', padding=(20, 15))
        status_card.pack(fill='x', pady=10)
        
        ttk.Label(status_card, text="Application Status", font=("Helvetica", 12, 'bold')).pack()
        self.status_label = ttk.Label(status_card, text="● Starting...", foreground=self.colors['warning'], style='Status.TLabel')
        self.status_label.pack(pady=5)

        # --- Browser Button ---
        browser_card = ttk.Frame(main_frame, style='Card.TFrame', padding=(20, 15))
        browser_card.pack(fill='x', pady=10)        
        self.browser_button = ttk.Button(browser_card, text="🌐 Open Browser", style='Info.TButton', command=self.open_browser, state='disabled')
        self.browser_button.pack(fill='x', pady=4)
        
        # Bind cursor events to button
        cursor_name = "pointinghand" if sys.platform == "darwin" else "hand2"
        self.browser_button.bind("<Enter>", lambda e: self.root.config(cursor=cursor_name))
        self.browser_button.bind("<Leave>", lambda e: self.root.config(cursor=""))

        # --- Activity Log ---
        log_card = ttk.Frame(main_frame, style='Card.TFrame', padding=(20, 15))
        log_card.pack(fill='both', expand=True, pady=10)

        log_text_frame = ttk.Frame(log_card, style='TFrame')
        log_text_frame.pack(fill='both', expand=True)

        self.log_text = tk.Text(log_text_frame, height=5, font=("Courier", 9), relief='solid', borderwidth=1,
                                bg=self.colors['frame'], fg=self.colors['text'], wrap=tk.WORD,
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
        
    def auto_start_server(self):
        """Automatically start the server when the app launches"""
        self.log_message("Starting server automatically...")
        self.update_status('starting', 'warning')
        
        # Check if port is in use and kill any existing process
        if not check_port_available(8080):
            self.log_message("⚠️ Port 8080 is in use. Attempting to kill existing process...")
            if kill_process_on_port(8080):
                self.log_message("✅ Successfully killed process on port 8080.")
                # Wait a moment for the port to be released
                self.root.after(1000, self._start_server_after_kill)
                return
            else:
                self.log_message("❌ Failed to kill process on port 8080.")
                self.update_status('stopped', 'danger')
                messagebox.showerror("Port Error", "Port 8080 is already in use and could not be freed. Please close any other applications using this port.")
                return

        self._start_server_after_kill()

    def _start_server_after_kill(self):
        """Start the server after ensuring port is available"""
        try:
            # Start the server in the background
            threading.Thread(target=self.run_flask_server, daemon=True).start()
        except Exception as e:
            self.log_message(f"❌ Failed to start server: {e}")
            self.update_status('stopped', 'danger')
            messagebox.showerror("Error", f"Failed to start server:\n{e}")

    def run_flask_server(self):
        try:
            self.flask_server = make_server('0.0.0.0', 8080, self.app, threaded=True)
            self.status_queue.put("running")
            self.flask_server.serve_forever()
        except Exception as e:
            logger.error(f"Flask server error: {e}")
            self.status_queue.put(("error", e))

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
                self.browser_button.state(['!disabled'])
                
                # Auto-open browser after a short delay
                self.root.after(2000, self.open_browser)
                
            elif message == "stopped":
                self.server_running = False
                self.flask_server = None
                self.log_message("✅ Server stopped.")
                self.update_status('stopped', 'danger')
                self.browser_button.state(['disabled'])
            elif isinstance(message, tuple) and message[0] == "error":
                self.log_message(f"❌ Server error: {message[1]}")
                self.update_status('stopped', 'danger')
                messagebox.showerror("Server Error", f"The server failed to start:\n{message[1]}")
        except queue.Empty:
            pass
        finally:
            self.root.after(100, self.check_status_queue)
            
    def quit_app(self):
        if self.server_running and self.flask_server:
            self.log_message("Stopping server before quitting...")
            self.update_status('stopping', 'warning')
            threading.Thread(target=self.flask_server.shutdown, daemon=True).start()
            # Wait a bit for server to shutdown gracefully
            self.root.after(1000, self.root.destroy)
        else:
            self.root.destroy()