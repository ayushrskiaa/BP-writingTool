import os
import sys
from flask import Flask
from src.launcher import FlaskAppGUI
from src.utils import app_name
from src.routers import bp
from hindi_xlit import HindiTransliterator

def get_app_path():
    if getattr(sys, 'frozen', False):
        return sys._MEIPASS
    else:
        return os.path.dirname(os.path.abspath(__file__))

app_path = get_app_path()

app = Flask(app_name,
           template_folder=os.path.join(app_path, 'templates'),
           static_folder=os.path.join(app_path, 'static'))

# Initialize transliterator
transliterator = HindiTransliterator()
transliteration_cache = {}

def cached_transliterate(text):
    if text in transliteration_cache:
        return transliteration_cache[text]
    result = transliterator.transliterate(text)
    transliteration_cache[text] = result
    if len(transliteration_cache) > 1000:
        for k in list(transliteration_cache.keys())[:100]:
            transliteration_cache.pop(k)
    return result

app.cached_transliterate = cached_transliterate

# Register routes from Blueprint
app.register_blueprint(bp)

if __name__ == '__main__':
    gui = FlaskAppGUI(app)
    gui.root.mainloop()