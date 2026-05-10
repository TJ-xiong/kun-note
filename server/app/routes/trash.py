from datetime import datetime, timezone
from flask import jsonify, g, current_app
from . import api_bp
from ..auth import require_token
from ..extensions import db
from ..models import Note
from ..exceptions import APIError


@api_bp.route('/trash', methods=['GET'])
@require_token
def get_trash():
    user_id = g.user['id']
    notes = Note.query.filter_by(user_id=user_id, deleted=True).order_by(
        Note.updated_at.desc()
    ).all()
    return jsonify({
        'notes': [n.to_list_dict() for n in notes],
        'total': len(notes)
    })


@api_bp.route('/trash/<note_id>/restore', methods=['POST'])
@require_token
def restore_note(note_id: str):
    user_id = g.user['id']
    note = Note.query.filter_by(id=note_id, user_id=user_id).first()
    if not note or not note.deleted:
        raise APIError('Note not found in trash', 404)

    note.deleted = False
    note.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    current_app.logger.info('[Trash] 用户 %s 恢复笔记: %s', user_id, note_id)
    return jsonify({'note': note.to_dict()})


@api_bp.route('/trash/<note_id>', methods=['DELETE'])
@require_token
def permanent_delete(note_id: str):
    user_id = g.user['id']
    note = Note.query.filter_by(id=note_id, user_id=user_id).first()
    if not note:
        raise APIError('Note not found', 404)

    db.session.delete(note)
    db.session.commit()
    current_app.logger.info('[Trash] 用户 %s 永久删除笔记: %s', user_id, note_id)
    return jsonify({'success': True})
