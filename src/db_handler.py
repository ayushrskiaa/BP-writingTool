import os
from src.utils import get_app_data_directory, ensure_app_data_directory
from tinydb import TinyDB
from src.logger import logger

def get_database_path():
    """
    Get the full path to the database file.
    
    Returns:
        str: Full path to the database file
    """
    app_data_dir = get_app_data_directory()
    return os.path.join(app_data_dir, 'db.json')


# Initialize TinyDB with proper data directory
def initialize_database():
    """Initialize the database with proper error handling"""
    try:
        # Ensure the app data directory exists and is writable
        if not ensure_app_data_directory():
            logger.warning("Could not create app data directory. Using current directory.")
            db_path = 'db.json'
        else:
            db_path = get_database_path()
        
        logger.info(f"Database location: {db_path}")
        return TinyDB(db_path)
    except Exception as e:
        logger.error(f"Error initializing database: {e}")