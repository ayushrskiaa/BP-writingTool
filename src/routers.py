from flask import Blueprint, render_template, request, jsonify, current_app
from tinydb import Query
from src.letter.utils import get_all_letters, get_letter_by_id, create_letter, update_letter, delete_letter
from src.diary.utils import get_all_diary, get_diary_by_id, create_diary, update_diary, delete_diary
from src.db_handler import db

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

@bp.route('/api/transliterate', methods=['POST'])
def api_transliterate():
    data = request.get_json()
    word = data.get('word', '')
    suggestions = []
    if word:
        result = current_app.cached_transliterate(word)
        if isinstance(result, list):
            suggestions = result[:5]
        else:
            suggestions = [result]
    return jsonify({'suggestions': suggestions[:5]})

@bp.route('/api/transliterate_text', methods=['POST'])
def api_transliterate_text():
    data = request.get_json()
    text = data.get('text', '')
    if not text:
        return jsonify({'result': ''})

    result = current_app.cached_transliterate(text)
    if isinstance(result, list):
        result = result[0] if result else ''

    return jsonify({'result': result})


@bp.route('/api/get_documents', methods=['GET'])
def api_get_documents():
    letters = [dict(doc, _id=str(doc.doc_id), type='letter') for doc in db.table('letter').all()]
    diaries = [dict(doc, _id=str(doc.doc_id), type='diary') for doc in db.table('diary').all()]
    return jsonify({'documents': letters + diaries})


@bp.route('/api/letters', methods=['GET'])
def api_get_letters():
    docs = [dict(doc, _id=str(doc.doc_id), type='letter') for doc in db.table('letter').all()]
    return jsonify({'documents': docs})


@bp.route('/api/diaries', methods=['GET'])
def api_get_diaries():
    docs = [dict(doc, _id=str(doc.doc_id), type='diary') for doc in db.table('diary').all()]
    return jsonify({'documents': docs})


def _save_to_table(tbl_name, filename, content):
    Q = Query()
    tbl = db.table(tbl_name)
    existing = tbl.search(Q.filename == filename)
    if existing:
        doc_id = existing[0].doc_id
        if tbl_name == 'letter':
            update_letter(doc_id, {'filename': filename, 'content': content})
        else:
            update_diary(doc_id, {'filename': filename, 'content': content})
    else:
        payload = {'filename': filename, 'content': content}
        if tbl_name == 'letter':
            create_letter(payload)
        else:
            create_diary(payload)


@bp.route('/api/save_letter', methods=['POST'])
def api_save_letter():
    data = request.get_json()
    filename = data.get('filename', '').strip()
    content = data.get('content', '')
    if not filename or not content:
        return jsonify({'error': 'filename and content are required'}), 400
    _save_to_table('letter', filename, content)
    return jsonify({'success': True})


@bp.route('/api/save_diary', methods=['POST'])
def api_save_diary():
    data = request.get_json()
    filename = data.get('filename', '').strip()
    content = data.get('content', '')
    if not filename or not content:
        return jsonify({'error': 'filename and content are required'}), 400
    _save_to_table('diary', filename, content)
    return jsonify({'success': True})


@bp.route('/api/save_document', methods=['POST'])
def api_save_document():
    data = request.get_json()
    filename = data.get('filename', '').strip()
    content = data.get('content', '')
    doc_type = data.get('type', 'letter').strip().lower()
    if not filename or not content:
        return jsonify({'error': 'filename and content are required'}), 400
    _save_to_table(doc_type if doc_type in ('letter', 'diary') else 'letter', filename, content)
    return jsonify({'success': True})


def _delete_from_table(tbl_name, filename):
    Q = Query()
    tbl = db.table(tbl_name)
    matches = tbl.search(Q.filename == filename)
    if matches:
        tbl.remove(doc_ids=[matches[0].doc_id])
        return True
    return False


@bp.route('/api/delete_letter', methods=['POST'])
def api_delete_letter():
    filename = (request.get_json() or {}).get('filename', '').strip()
    if not filename:
        return jsonify({'error': 'filename is required'}), 400
    if _delete_from_table('letter', filename):
        return jsonify({'success': True})
    return jsonify({'error': 'Document not found'}), 404


@bp.route('/api/delete_diary', methods=['POST'])
def api_delete_diary():
    filename = (request.get_json() or {}).get('filename', '').strip()
    if not filename:
        return jsonify({'error': 'filename is required'}), 400
    if _delete_from_table('diary', filename):
        return jsonify({'success': True})
    return jsonify({'error': 'Document not found'}), 404


@bp.route('/api/delete_document', methods=['POST'])
def api_delete_document():
    filename = (request.get_json() or {}).get('filename', '').strip()
    if not filename:
        return jsonify({'error': 'filename is required'}), 400
    for tbl_name in ('letter', 'diary'):
        if _delete_from_table(tbl_name, filename):
            return jsonify({'success': True})
    return jsonify({'error': 'Document not found'}), 404