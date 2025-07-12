import os
import sys

from flask import Flask, render_template, request, jsonify
from src.launcher import FlaskAppGUI
from src.letter.utils import get_all_letters, create_letter, update_letter, delete_letter
from src.diary.utils import get_all_diary, create_diary, update_diary, delete_diary
from src.utils import app_name

# Get the application path - works both in dev and PyInstaller bundle
def get_app_path():
    if getattr(sys, 'frozen', False):
        # If the application is run as a bundle (PyInstaller)
        return sys._MEIPASS
    else:
        # If run from Python interpreter
        return os.path.dirname(os.path.abspath(__file__))

app_path = get_app_path()

# Initialize Flask app with correct template and static folders
app = Flask(app_name, 
           template_folder=os.path.join(app_path, 'templates'),
           static_folder=os.path.join(app_path, 'static'))

# --- Flask Routes ---
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/create_document/<template_type>', methods=['POST'])
def create_document(template_type):
    # remove whitespace and convert to lowercase
    template_type = template_type.strip().lower()
    data = request.get_json()
    if template_type == 'letter':
        doc_id = create_letter(data)
    elif template_type == 'diary':
        doc_id = create_diary(data)
    return jsonify({'doc_id': doc_id})
    
@app.route('/api/update_document/<template_type>/<doc_id>', methods=['PUT'])
def update_document(template_type, doc_id):
    # remove whitespace and convert to lowercase
    template_type = template_type.strip().lower()
    data = request.get_json()
    if template_type == 'letter':
        update_letter(doc_id, data)
    elif template_type == 'diary':
        update_diary(doc_id, data)
    return jsonify({'success': True})


@app.route('/api/delete_document/<template_type>/<doc_id>', methods=['DELETE'])
def delete_document(template_type, doc_id):
    # remove whitespace and convert to lowercase
    template_type = template_type.strip().lower()
    if template_type == 'letter':
        delete_letter(doc_id)
    elif template_type == 'diary':
        delete_diary(doc_id)
    return jsonify({'success': True})

@app.route('/api/get_documents/<template_type>', methods=['GET'])
def get_documents(template_type):
    # remove whitespace and convert to lowercase
    template_type = template_type.strip().lower()
    if template_type == 'letter':
        docs = get_all_letters()
    elif template_type == 'diary':
        docs = get_all_diary()
    else:
        docs = []
    return jsonify({'documents': docs})


if __name__ == '__main__':
    gui = FlaskAppGUI(app)
    gui.root.mainloop()