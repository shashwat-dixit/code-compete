from sqlmodel import SQLModel
from uuid import UUID
from datetime import datetime

class User(SQLModel, table=True):
    id: UUID
    name: str
    email: str
    created_at: datetime
    slug: str

class Questions(SQLModel, table=true):
    id: UUID
    title: str
    description: str
    