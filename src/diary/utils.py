from datetime import datetime
from src.db_handler import db

table = db.table('diary')

def get_diary_by_id(id):
    return table.get(doc_id=id)

def get_all_diary():
    return table.all()

def create_diary(data):
    # add created_at and updated_at
    current_datetime = datetime.now().isoformat()
    data['created_at'] = current_datetime
    data['updated_at'] = current_datetime
    return table.insert(data)

def update_diary(id, data):
    current_datetime = datetime.now().isoformat()
    data['updated_at'] = current_datetime
    return table.update(data, doc_ids=[id])

def delete_diary(id):
    return table.remove(doc_ids=[id])
