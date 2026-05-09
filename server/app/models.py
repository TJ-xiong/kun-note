from datetime import datetime, timezone
from .extensions import db


class Note(db.Model):
    __tablename__ = 'notes'

    id = db.Column(db.String(36), primary_key=True)
    user_id = db.Column(db.Integer, nullable=False, index=True)
    title = db.Column(db.Text, nullable=False, default='')
    content = db.Column(db.Text, nullable=False, default='')
    type = db.Column(db.String(10), nullable=False, default='note')
    parent_id = db.Column(db.String(36))
    is_pinned = db.Column(db.Boolean, nullable=False, default=False)
    version = db.Column(db.Integer, nullable=False, default=1)
    deleted = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        db.UniqueConstraint('user_id', 'id', name='uq_user_note'),
        db.Index('idx_notes_user_updated', 'user_id', 'updated_at'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'type': self.type,
            'parentId': self.parent_id,
            'isPinned': self.is_pinned,
            'version': self.version,
            'deleted': self.deleted,
            'createdAt': int(self.created_at.timestamp() * 1000) if self.created_at else 0,
            'updatedAt': int(self.updated_at.timestamp() * 1000) if self.updated_at else 0,
        }

    def to_list_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'type': self.type,
            'parentId': self.parent_id,
            'isPinned': self.is_pinned,
            'updatedAt': int(self.updated_at.timestamp() * 1000) if self.updated_at else 0,
        }


class NoteImage(db.Model):
    __tablename__ = 'note_images'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, nullable=False, index=True)
    filename = db.Column(db.String(255), nullable=False)
    size = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        db.UniqueConstraint('user_id', 'filename', name='uq_user_image'),
        db.Index('idx_note_images_user', 'user_id', 'filename'),
    )

    def to_dict(self):
        return {
            'filename': self.filename,
            'size': self.size,
            'createdAt': int(self.created_at.timestamp() * 1000) if self.created_at else 0,
        }


class SyncHistory(db.Model):
    __tablename__ = 'sync_history'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    note_id = db.Column(db.String(36), nullable=False, index=True)
    user_id = db.Column(db.Integer, nullable=False)
    version = db.Column(db.Integer, nullable=False)
    snapshot = db.Column(db.JSON, nullable=False)
    synced_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        db.Index('idx_sync_history_note', 'note_id', 'version'),
    )

    def to_dict(self):
        return {
            'version': self.version,
            'syncedAt': int(self.synced_at.timestamp() * 1000) if self.synced_at else 0,
            'snapshot': self.snapshot,
        }
