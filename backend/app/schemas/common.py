from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class Message(BaseModel):
    message: str


class IdResponse(BaseModel):
    id: UUID


class HealthResponse(BaseModel):
    status: str = "ok"
    env: str
