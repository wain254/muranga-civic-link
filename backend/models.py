from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base
import uuid

def generate_tracking_number():
    return f"MC-{str(uuid.uuid4())[:6].upper()}"

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String, nullable=True)
    users = relationship("User", back_populates="department")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="citizen")
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    
    # Profile fields
    id_number = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    profile_pic = Column(String, nullable=True)

    department = relationship("Department", back_populates="users")
    
    # CASCADE DELETE: If a user is deleted, their requests are deleted automatically
    requests = relationship("ServiceRequest", back_populates="citizen", cascade="all, delete-orphan")

class ServiceRequest(Base):
    __tablename__ = "requests"
    id = Column(Integer, primary_key=True, index=True)
    tracking_number = Column(String, unique=True, index=True, default=generate_tracking_number)
    citizen_id = Column(Integer, ForeignKey("users.id"))
    category = Column(String, index=True) 
    department = Column(String, default="Unassigned") 
    location = Column(String)
    description = Column(String) 
    priority = Column(String, default="Medium") 
    image_url = Column(String, nullable=True) 
    evidence_url = Column(String, nullable=True) 
    officer_notes = Column(String, nullable=True)
    status = Column(String, default="Pending") 
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    citizen = relationship("User", back_populates="requests")

class SupportMessage(Base):
    __tablename__ = "support_messages"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String)
    phone = Column(String)
    department = Column(String, nullable=True) 
    question = Column(Text)
    status = Column(String, default="Pending") 
    reply_text = Column(Text, nullable=True)
    replied_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    message = Column(Text)
    expires_at = Column(DateTime, nullable=True) 
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))