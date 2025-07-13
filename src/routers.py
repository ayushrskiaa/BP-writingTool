from flask import Blueprint, render_template, request, jsonify
from src.letter.utils import get_all_letters, get_letter_by_id, create_letter, update_letter, delete_letter
from src.diary.utils import get_all_diary, get_diary_by_id, create_diary, update_diary, delete_diary

bp = Blueprint('routes', __name__)

@bp.route('/')
def index():
    return render_template('index.html')

@bp.route('/create_document/<template_type>', methods=['POST'])
def create_document(template_type):
    template_type = template_type.strip().lower()
    data = request.get_json()
    if template_type == 'letter':
        doc_id = create_letter(data)
    elif template_type == 'diary':
        doc_id = create_diary(data)
    else:
        return jsonify({'error': 'Invalid template type'}), 400
    return jsonify({'doc_id': doc_id})

@bp.route('/update_document/<template_type>/<doc_id>', methods=['PUT'])
def update_document(template_type, doc_id):
    template_type = template_type.strip().lower()
    data = request.get_json()
    if template_type == 'letter':
        updated = update_letter(doc_id, data)
    elif template_type == 'diary':
        updated = update_diary(doc_id, data)
    else:
        return jsonify({'error': 'Invalid template type'}), 400
    if not updated:
        return jsonify({'error': 'Document not found'}), 404
    return jsonify({'success': True})

@bp.route('/delete_document/<template_type>/<doc_id>', methods=['DELETE'])
def delete_document(template_type, doc_id):
    template_type = template_type.strip().lower()
    if template_type == 'letter':
        deleted = delete_letter(doc_id)
    elif template_type == 'diary':
        deleted = delete_diary(doc_id)
    else:
        return jsonify({'error': 'Invalid template type'}), 400
    if not deleted:
        return jsonify({'error': 'Document not found'}), 404
    return jsonify({'success': True})

@bp.route('/get_documents/<template_type>', methods=['GET'])
def get_documents(template_type):
    template_type = template_type.strip().lower()
    if template_type == 'letter':
        docs = get_all_letters()
    elif template_type == 'diary':
        docs = get_all_diary()
    else:
        return jsonify({'error': 'Invalid template type'}), 400
    return jsonify({'documents': docs})

@bp.route('/get_document/<template_type>/<doc_id>', methods=['GET'])
def get_document(template_type, doc_id):
    template_type = template_type.strip().lower()
    if template_type == 'letter':
        doc = get_letter_by_id(doc_id)
    elif template_type == 'diary':
        doc = get_diary_by_id(doc_id)
    else:
        return jsonify({'error': 'Invalid template type'}), 400
    if not doc:
        return jsonify({'error': 'Document not found'}), 404
    return jsonify({'document': doc}) 