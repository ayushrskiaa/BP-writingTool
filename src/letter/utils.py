from datetime import datetime
from src.db_handler import db

table = db.table('letter')

def get_letter_by_id(id):
    try:
        return table.get(doc_id=int(id))
    except KeyError:
        return None

def get_all_letters():
    """
    Get all letters with content truncated to 50 characters from the database to avoid large payloads.
    This data is used in the home page to display the history list of letters.
    """
    result = []
    for doc in table.all():
        doc_dict = {**doc, '_id': str(doc.doc_id)}
        content = doc_dict.get('content')
        if content:
            doc_dict['content'] = content
            # doc_dict['content'] = content[:50]
        result.append(doc_dict)
    return result

def create_letter(data):
    # add created_at and updated_at
    current_datetime = datetime.now().isoformat()
    data['created_at'] = current_datetime
    data['updated_at'] = current_datetime
    return table.insert(data)

def update_letter(id, data):
    current_datetime = datetime.now().isoformat()
    data['updated_at'] = current_datetime
    try:
        return table.update(data, doc_ids=[int(id)])
    except KeyError:
        return None

def delete_letter(id):
    try:
        return table.remove(doc_ids=[int(id)])
    except KeyError:
        return None