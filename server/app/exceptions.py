from flask import jsonify, request


class APIError(Exception):
    def __init__(self, message: str, code: int = 400):
        self.message = message
        self.code = code

    def to_dict(self):
        return {'code': self.code, 'message': self.message}


def register_error_handlers(app):
    @app.errorhandler(APIError)
    def handle_api_error(e):
        app.logger.warning('[API] %s %s -> %d %s', request.method, request.path, e.code, e.message)
        return jsonify(e.to_dict()), e.code

    @app.errorhandler(413)
    def handle_payload_too_large(e):
        app.logger.warning('[API] %s %s -> 413 Request body too large', request.method, request.path)
        return jsonify({'code': 413, 'message': 'Request body too large (max 1MB)'}), 413

    @app.errorhandler(404)
    def handle_not_found(e):
        app.logger.warning('[API] %s %s -> 404 Not found', request.method, request.path)
        return jsonify({'code': 404, 'message': 'Not found'}), 404

    @app.errorhandler(500)
    def handle_internal_error(e):
        app.logger.error('[API] %s %s -> 500 Internal server error', request.method, request.path, exc_info=True)
        return jsonify({'code': 500, 'message': 'Internal server error'}), 500
