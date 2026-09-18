import os
from flask import Flask
from flask_cors import CORS
from app.utils.logger import logger
from app.database.db import init_db

def create_app():
    app = Flask(__name__)
    CORS(app)
    
    # Initialize SQLite database
    init_db()
    
    # Register Blueprints
    from app.routes.health import health_bp
    from app.routes.api import api_bp
    
    app.register_blueprint(health_bp)
    app.register_blueprint(api_bp, url_prefix='/api')
    
    logger.info("Landslide Risk Backend Application initialized successfully.")
    return app
