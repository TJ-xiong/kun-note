import os
from pathlib import Path
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from .extensions import db, migrate
from .exceptions import register_error_handlers
from .logger import setup_logger

# 加载 server/.env
load_dotenv(Path(__file__).resolve().parent.parent / '.env')


def create_app():
    app = Flask(__name__)

    env = os.environ.get('FLASK_ENV', 'development')
    if env == 'production':
        from .config import ProductionConfig
        app.config.from_object(ProductionConfig)
    else:
        from .config import DevelopmentConfig
        app.config.from_object(DevelopmentConfig)

    # 初始化日志
    setup_logger(app)

    CORS(app)

    db.init_app(app)
    migrate.init_app(app, db)

    from .routes import api_bp
    app.register_blueprint(api_bp)

    register_error_handlers(app)

    with app.app_context():
        db.create_all()

    return app
