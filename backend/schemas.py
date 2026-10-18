from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class DepartmentCreate(BaseModel):
    name: str
    description: Optional[str] = None

class DepartmentResponse(DepartmentCreate):
    id: int
    class Config: from_attributes = True

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    department_id: Optional[int] = None
    id_number: Optional[str] = None
    phone_number: Optional[str] = None
    profile_pic: Optional[str] = None
    class Config: from_attributes = True

class OfficerCreate(UserCreate):
    department_id: int
    id_number: Optional[str] = None
    phone_number: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[str] = None
    department_id: Optional[int] = None
    id_number: Optional[str] = None
    phone_number: Optional[str] = None

class RequestCreate(BaseModel):
    category: str
    location: str
    description: str
    priority: str = "Medium"

class RequestResponse(BaseModel):
    id: int
    tracking_number: str
    category: str
    department: str
    location: str
    description: str
    priority: str
    image_url: Optional[str] = None
    evidence_url: Optional[str] = None
    officer_notes: Optional[str] = None
    status: str
    created_at: datetime
    citizen_id: Optional[int] = None # <--- FIXED: Now optional so deleted users don't crash the system
    citizen_name: Optional[str] = "Unknown"
    class Config: from_attributes = True

class SupportMessageCreate(BaseModel):
    name: str
    email: str
    phone: str
    department: Optional[str] = None
    question: str

class SupportMessageResponse(SupportMessageCreate):
    id: int
    status: str
    reply_text: Optional[str] = None
    replied_by: Optional[str] = None
    created_at: datetime
    class Config: from_attributes = True

class NotificationCreate(BaseModel):
    title: str
    message: str
    expiry_days: Optional[int] = 7 

class NotificationResponse(NotificationCreate):
    id: int
    created_at: datetime
    expires_at: Optional[datetime] = None
    class Config: from_attributes = True