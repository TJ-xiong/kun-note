import os
import re
from flask import request, jsonify, g, send_file, current_app
from . import api_bp
from ..auth import require_token
from ..extensions import db
from ..models import NoteImage

ALLOWED_EXTENSIONS = {'png', 'jpeg', 'jpg', 'gif', 'webp'}
FILENAME_PATTERN = re.compile(r'^[\w.-]+$')


def _get_images_dir(user_id: int) -> str:
    upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    images_dir = os.path.join(upload_folder, 'images', str(user_id))
    os.makedirs(images_dir, exist_ok=True)
    return images_dir


def _is_allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@api_bp.route('/images', methods=['GET'])
@require_token
def list_images():
    user_id = g.user['id']
    images = NoteImage.query.filter_by(user_id=user_id).all()
    return jsonify({
        'images': [img.to_dict() for img in images]
    })


@api_bp.route('/images', methods=['POST'])
@require_token
def upload_image():
    user_id = g.user['id']

    if 'file' not in request.files:
        return jsonify({'code': 400, 'message': 'No file provided'}), 400

    file = request.files['file']
    if not file.filename:
        return jsonify({'code': 400, 'message': 'No file selected'}), 400

    filename = request.form.get('filename') or file.filename
    if not FILENAME_PATTERN.match(filename):
        return jsonify({'code': 400, 'message': 'Invalid filename'}), 400

    if not _is_allowed_file(filename):
        return jsonify({'code': 400, 'message': 'File type not allowed'}), 400

    # 检查是否已存在
    existing = NoteImage.query.filter_by(user_id=user_id, filename=filename).first()
    if existing:
        return jsonify({'filename': filename, 'message': 'Already exists'})

    images_dir = _get_images_dir(user_id)
    file_path = os.path.join(images_dir, filename)
    file.save(file_path)
    file_size = os.path.getsize(file_path)

    image = NoteImage(
        user_id=user_id,
        filename=filename,
        size=file_size,
    )
    db.session.add(image)
    db.session.commit()

    current_app.logger.info('[Images] 用户 %s 上传图片: %s (%d bytes)', user_id, filename, file_size)
    return jsonify({'filename': filename}), 201


@api_bp.route('/images/<filename>', methods=['GET'])
@require_token
def download_image(filename: str):
    user_id = g.user['id']

    if not FILENAME_PATTERN.match(filename):
        return jsonify({'code': 400, 'message': 'Invalid filename'}), 400

    images_dir = _get_images_dir(user_id)
    file_path = os.path.join(images_dir, filename)

    if not os.path.exists(file_path):
        current_app.logger.warning('[Images] 用户 %s 请求的图片不存在: %s', user_id, filename)
        return jsonify({'code': 404, 'message': 'Image not found'}), 404

    current_app.logger.debug('[Images] 用户 %s 下载图片: %s', user_id, filename)
    return send_file(file_path)
