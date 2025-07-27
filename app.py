import os
import sys
from flask import Flask
from src.launcher import FlaskAppGUI
from src.utils import app_name
from src.routers import bp

def get_app_path():
    if getattr(sys, 'frozen', False):
        return sys._MEIPASS
    else:
        return os.path.dirname(os.path.abspath(__file__))

app_path = get_app_path()

app = Flask(app_name,
           template_folder=os.path.join(app_path, 'templates'),
           static_folder=os.path.join(app_path, 'static'))

# Register routes from Blueprint
app.register_blueprint(bp)

if __name__ == '__main__':
    gui = FlaskAppGUI(app)
    gui.root.mainloop()