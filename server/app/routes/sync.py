from datetime import datetime, timezone
from flask import request, jsonify, g
from . import api_bp
from ..auth import require_token
from ..extensions import db
from ..models import Note, SyncHistory


@api_bp.route('/sync', methods=['POST'])
@require_token
def sync_notes():
    data = request.get_json()
    if not data:
        return jsonify({'code': 400, 'message': 'Invalid request body'}), 400

    last_sync_time = data.get('lastSyncTime', 0)
    changes = data.get('changes', [])
    user_id = g.user['id']

    # 将毫秒时间戳转为 datetime
    if last_sync_time:
        last_sync_dt = datetime.fromtimestamp(last_sync_time / 1000, tz=timezone.utc)
    else:
        last_sync_dt = datetime.fromtimestamp(0, tz=timezone.utc)

    synced = []
    conflicts = []

    for change in changes:
        note_id = change.get('id')
        if not note_id:
            continue

        client_version = change.get('version', 1)
        server_note = Note.query.filter_by(id=note_id, user_id=user_id).first()

        if server_note is None:
            _apply_change(note_id, user_id, change)
            synced.append(note_id)
            _save_history(note_id, user_id, change)
        elif server_note.version == client_version:
            _apply_change(note_id, user_id, change)
            synced.append(note_id)
            _save_history(note_id, user_id, change)
        elif server_note.version > client_version and server_note.updated_at > last_sync_dt:
            conflicts.append({
                'id': note_id,
                'serverVersion': server_note.to_dict(),
                'clientVersion': _change_to_note_dict(change)
            })
        else:
            _apply_change(note_id, user_id, change)
            synced.append(note_id)
            _save_history(note_id, user_id, change)

    # 查询服务端在 lastSyncTime 之后有变更的笔记
    server_notes = Note.query.filter(
        Note.user_id == user_id,
        Note.updated_at > last_sync_dt
    ).all()
    synced_set = set(synced)
    server_changes = [
        note.to_dict() for note in server_notes
        if note.id not in synced_set
    ]

    sync_time = int(datetime.now(timezone.utc).timestamp() * 1000)

    return jsonify({
        'synced': synced,
        'conflicts': conflicts,
        'serverChanges': server_changes,
        'syncTime': sync_time
    })


def _apply_change(note_id: str, user_id: int, change: dict):
    now = datetime.now(timezone.utc)
    existing = Note.query.filter_by(id=note_id, user_id=user_id).first()

    if existing is None:
        note = Note(
            id=note_id,
            user_id=user_id,
            title=change.get('title') or '',
            content=change.get('content') or '',
            type=change.get('type') or 'note',
            parent_id=change.get('parentId'),
            is_pinned=change.get('isPinned') or False,
            version=change.get('version') or 1,
            deleted=change.get('deleted') or False,
            created_at=now,
            updated_at=now,
        )
        db.session.add(note)
    else:
        existing.title = change.get('title') or ''
        existing.content = change.get('content') or ''
        existing.type = change.get('type') or 'note'
        existing.parent_id = change.get('parentId')
        existing.is_pinned = change.get('isPinned') or False
        existing.version = change.get('version') or 1
        existing.deleted = change.get('deleted') or False
        existing.updated_at = now

    db.session.commit()


def _save_history(note_id: str, user_id: int, change: dict):
    history = SyncHistory(
        note_id=note_id,
        user_id=user_id,
        version=change.get('version', 1),
        snapshot=change,
    )
    db.session.add(history)
    db.session.commit()


def _change_to_note_dict(change: dict) -> dict:
    return {
        'id': change.get('id'),
        'title': change.get('title', ''),
        'content': change.get('content', ''),
        'type': change.get('type', 'note'),
        'parentId': change.get('parentId'),
        'isPinned': change.get('isPinned', False),
        'version': change.get('version', 1),
        'deleted': change.get('deleted', False),
        'createdAt': change.get('createdAt', 0),
        'updatedAt': change.get('updatedAt', 0),
    }
