from flask import Blueprint, jsonify

api_bp = Blueprint('api', __name__, url_prefix='/api/v1')


@api_bp.route('/health')
def health():
    return jsonify({'status': 'ok'})


from . import sync, trash, history, images  # noqa: E402, F401
