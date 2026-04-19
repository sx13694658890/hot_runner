from uuid import UUID

from app.schemas.common import ORMModel


class RoleRead(ORMModel):
    id: UUID
    name: str
    code: str
    description: str | None


class PermissionRead(ORMModel):
    id: UUID
    code: str
    name: str
    module: str
