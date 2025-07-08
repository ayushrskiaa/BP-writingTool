import os
import sys

from datetime import datetime
from flask import Flask, render_template, request, jsonify
from src.launcher import FlaskAppGUI
from src.logger import logger
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

# Log startup information
logger.info("=" * 50)
logger.info("Application Starting")

# Initialize Flask app with correct template and static folders
app = Flask(__name__, 
           template_folder=os.path.join(app_path, 'templates'),
           static_folder=os.path.join(app_path, 'static'))

# Initialize TinyDB
db = TinyDB('db.json')
Document = Query()

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
    gui = FlaskAppGUI(app)
    gui.root.mainloop()