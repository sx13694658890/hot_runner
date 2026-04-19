from datetime import datetime
from uuid import UUID

from app.schemas.common import ORMModel


class FileAssetRead(ORMModel):
    id: UUID
    original_name: str
    content_type: str | None
    size_bytes: int
    storage_path: str
    created_by_user_id: UUID | None
    created_at: datetime
