from datetime import datetime, timezone
from flask import request, jsonify, g, current_app
from . import api_bp
from ..auth import require_token
from ..extensions import db
from ..models import Note, SyncHistory
from ..exceptions import APIError


@api_bp.route('/notes/<note_id>/history', methods=['GET'])
@require_token
def get_note_history(note_id: str):
    user_id = g.user['id']
    note = Note.query.filter_by(id=note_id, user_id=user_id).first()
    if not note:
        raise APIError('Note not found', 404)

    histories = SyncHistory.query.filter_by(
        note_id=note_id, user_id=user_id
    ).order_by(SyncHistory.version.desc()).all()
    return jsonify({
        'versions': [h.to_dict() for h in histories]
    })


@api_bp.route('/notes/<note_id>/rollback', methods=['POST'])
@require_token
def rollback_note(note_id: str):
    user_id = g.user['id']
    data = request.get_json()
    target_version = data.get('version') if data else None
    if not target_version:
        raise APIError('Missing version parameter', 400)

    note = Note.query.filter_by(id=note_id, user_id=user_id).first()
    if not note:
        raise APIError('Note not found', 404)

    history = SyncHistory.query.filter_by(
        note_id=note_id, user_id=user_id, version=target_version
    ).first()
    if not history:
        raise APIError(f'Version {target_version} not found', 404)

    snapshot = history.snapshot or {}
    now = datetime.now(timezone.utc)
    new_version = note.version + 1

    note.title = snapshot.get('title') or note.title or ''
    note.content = snapshot.get('content') or note.content or ''
    note.type = snapshot.get('type') or note.type or 'note'
    note.parent_id = snapshot.get('parentId') or note.parent_id
    note.is_pinned = snapshot.get('isPinned') or note.is_pinned or False
    note.version = new_version
    note.updated_at = now

    new_history = SyncHistory(
        note_id=note_id,
        user_id=user_id,
        version=new_version,
        snapshot=snapshot,
    )
    db.session.add(new_history)
    db.session.commit()

    current_app.logger.info('[History] 用户 %s 回滚笔记 %s 到版本 %d', user_id, note_id, target_version)
    return jsonify({'note': note.to_dict()})
