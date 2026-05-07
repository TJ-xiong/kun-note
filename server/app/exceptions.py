from flask import jsonify


class APIError(Exception):
    def __init__(self, message: str, code: int = 400):
        self.message = message
        self.code = code

    def to_dict(self):
        return {'code': self.code, 'message': self.message}


def register_error_handlers(app):
    @app.errorhandler(APIError)
    def handle_api_error(e):
        return jsonify(e.to_dict()), e.code

    @app.errorhandler(413)
    def handle_payload_too_large(e):
        return jsonify({'code': 413, 'message': 'Request body too large (max 1MB)'}), 413

    @app.errorhandler(404)
    def handle_not_found(e):
        return jsonify({'code': 404, 'message': 'Not found'}), 404

    @app.errorhandler(500)
    def handle_internal_error(e):
        return jsonify({'code': 500, 'message': 'Internal server error'}), 500
