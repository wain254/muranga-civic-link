from dotenv import load_dotenv
load_dotenv()  # Load environment variables from .env file

from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Any
import shutil, os, csv, io
from datetime import timedelta, datetime, timezone
from fastapi.responses import StreamingResponse

# --- NEW IMPORTS FOR REAL EMAIL ---
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

import models, schemas, database, auth

models.Base.metadata.create_all(bind=database.engine)
app = FastAPI(title="Muranga County Civic Link API")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ================= REAL EMAIL HELPER =================
# ⚠️ REPLACE THESE WITH YOUR REAL GMAIL AND 16-CHARACTER APP PASSWORD
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "your_email@gmail.com")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD", "your_16_char_app_password")

def send_mock_email(to_email: str, subject: str, body: str):
    msg = MIMEMultipart()
    msg['From'] = SENDER_EMAIL
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    try:
        # Connect to Gmail's SMTP server
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()  # Secure the connection
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.sendmail(SENDER_EMAIL, to_email, msg.as_string())
        server.quit()
        print(f"\n✅ REAL Email sent successfully to {to_email}\n")
    except Exception as e:
        # If email fails (e.g., wrong password), we print the error but don't crash the app
        print(f"\n❌ Failed to send email: {e}\n")
        print(f"--- MOCK EMAIL FALLBACK ---\nTo: {to_email}\nSubject: {subject}\nBody: {body}\n---------------------------\n")

# ================= AUTH =================
@app.post("/api/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = models.User(full_name=user.full_name, email=user.email, hashed_password=auth.get_password_hash(user.password), role="citizen")
    db.add(new_user); db.commit(); db.refresh(new_user)
    return new_user

@app.post("/api/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)) -> Any:
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password): # type: ignore
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    token = auth.create_access_token(data={"sub": user.email, "role": user.role}, expires_delta=timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": token, "token_type": "bearer", "user": {"id": user.id, "full_name": user.full_name, "role": user.role, "department_id": user.department_id, "profile_pic": user.profile_pic}} # type: ignore

# ================= PUBLIC / CITIZEN =================
@app.get("/api/departments", response_model=List[schemas.DepartmentResponse])
def get_departments(db: Session = Depends(database.get_db)):
    return db.query(models.Department).all()

@app.get("/api/notifications", response_model=List[schemas.NotificationResponse])
def get_active_notifications(db: Session = Depends(database.get_db)):
    now = datetime.now(timezone.utc)
    return db.query(models.Notification).filter((models.Notification.expires_at == None) | (models.Notification.expires_at > now)).order_by(models.Notification.created_at.desc()).all()

@app.post("/api/support", response_model=schemas.SupportMessageResponse)
def create_support_msg(msg: schemas.SupportMessageCreate, db: Session = Depends(database.get_db)):
    new_msg = models.SupportMessage(**msg.model_dump())
    db.add(new_msg); db.commit(); db.refresh(new_msg)
    return new_msg

@app.get("/api/support/my-messages", response_model=List[schemas.SupportMessageResponse])
def get_my_support_msgs(email: str, db: Session = Depends(database.get_db)):
    return db.query(models.SupportMessage).filter(models.SupportMessage.email == email).order_by(models.SupportMessage.created_at.desc()).all()

@app.post("/api/requests", response_model=schemas.RequestResponse)
def create_request(category: str = Form(...), location: str = Form(...), description: str = Form(...), priority: str = Form("Medium"), image: UploadFile = File(None), db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    image_url = None
    if image:
        file_location = f"uploads/{image.filename}"
        with open(file_location, "wb") as buffer: shutil.copyfileobj(image.file, buffer)
        image_url = f"http://localhost:8000/uploads/{image.filename}"
    
    assigned_dept = category if category != "Other" else "Unassigned"

    new_request = models.ServiceRequest(
        citizen_id=current_user.id, 
        category=category, 
        department=assigned_dept, 
        location=location, 
        description=description, 
        priority=priority, 
        image_url=image_url
    )
    db.add(new_request); db.commit(); db.refresh(new_request)
    return new_request

@app.get("/api/requests/me", response_model=List[schemas.RequestResponse])
def get_my_requests(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.ServiceRequest).filter(models.ServiceRequest.citizen_id == current_user.id).order_by(models.ServiceRequest.created_at.desc()).all()

# ================= ADMIN =================
@app.get("/api/admin/users", response_model=List[schemas.UserResponse])
def get_all_users(db: Session = Depends(database.get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    return db.query(models.User).all()

@app.post("/api/admin/users/officer", response_model=schemas.UserResponse)
def create_officer(officer: schemas.OfficerCreate, db: Session = Depends(database.get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    if db.query(models.User).filter(models.User.email == officer.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = models.User(
        full_name=officer.full_name, email=officer.email, hashed_password=auth.get_password_hash(officer.password), 
        role="officer", department_id=officer.department_id, id_number=officer.id_number, phone_number=officer.phone_number
    )
    db.add(new_user); db.commit(); db.refresh(new_user)
    return new_user

@app.put("/api/admin/users/{user_id}", response_model=schemas.UserResponse)
def update_user(user_id: int, user_data: schemas.UserUpdate, db: Session = Depends(database.get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    if user_data.full_name: user.full_name = user_data.full_name # type: ignore
    if user_data.email: user.email = user_data.email # type: ignore
    if user_data.department_id is not None: user.department_id = user_data.department_id # type: ignore
    if user_data.password: user.hashed_password = auth.get_password_hash(user_data.password) # type: ignore
    if user_data.id_number: user.id_number = user_data.id_number # type: ignore
    if user_data.phone_number: user.phone_number = user_data.phone_number # type: ignore
    db.commit(); db.refresh(user)
    return user

@app.delete("/api/admin/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(database.get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    db.delete(user); db.commit()
    return {"message": "User deleted"}

@app.post("/api/admin/departments", response_model=schemas.DepartmentResponse)
def create_department(dept: schemas.DepartmentCreate, db: Session = Depends(database.get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    new_dept = models.Department(name=dept.name, description=dept.description)
    db.add(new_dept); db.commit(); db.refresh(new_dept)
    return new_dept

@app.delete("/api/admin/departments/{dept_id}")
def delete_department(dept_id: int, db: Session = Depends(database.get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    dept = db.query(models.Department).filter(models.Department.id == dept_id).first()
    if not dept: raise HTTPException(status_code=404, detail="Department not found")
    db.delete(dept); db.commit()
    return {"message": "Department deleted"}

@app.get("/api/admin/notifications", response_model=List[schemas.NotificationResponse])
def get_all_notifications(db: Session = Depends(database.get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    return db.query(models.Notification).order_by(models.Notification.created_at.desc()).all()

@app.post("/api/admin/notifications", response_model=schemas.NotificationResponse)
def create_notification(notif: schemas.NotificationCreate, db: Session = Depends(database.get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    expires = None
    if notif.expiry_days and notif.expiry_days > 0:
        expires = datetime.now(timezone.utc) + timedelta(days=notif.expiry_days)
    new_notif = models.Notification(title=notif.title, message=notif.message, expires_at=expires)
    db.add(new_notif); db.commit(); db.refresh(new_notif)
    return new_notif

@app.delete("/api/admin/notifications/{notif_id}")
def delete_notification(notif_id: int, db: Session = Depends(database.get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    notif = db.query(models.Notification).filter(models.Notification.id == notif_id).first()
    if not notif: raise HTTPException(status_code=404, detail="Not found")
    db.delete(notif); db.commit()
    return {"message": "Deleted"}

@app.get("/api/admin/support/export")
def export_support_csv(db: Session = Depends(database.get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    msgs = db.query(models.SupportMessage).order_by(models.SupportMessage.created_at.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Date", "Citizen Name", "Citizen Email", "Phone", "Dept", "Question", "Status", "Reply", "Replied By"])
    for m in msgs:
        writer.writerow([m.id, m.created_at, m.name, m.email, m.phone, m.department, m.question, m.status, m.reply_text, m.replied_by])
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=support_history.csv"})

@app.get("/api/admin/support", response_model=List[schemas.SupportMessageResponse])
def get_all_support(db: Session = Depends(database.get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    return db.query(models.SupportMessage).order_by(models.SupportMessage.created_at.desc()).all()

@app.put("/api/admin/support/{msg_id}")
def reply_support(msg_id: int, reply_text: str = Form(...), db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    msg = db.query(models.SupportMessage).filter(models.SupportMessage.id == msg_id).first()
    if not msg: raise HTTPException(status_code=404, detail="Message not found")
    msg.reply_text = reply_text # type: ignore
    msg.status = "Resolved" # type: ignore
    msg.replied_by = current_user.full_name # type: ignore
    db.commit()
    
    # Send REAL email to citizen
    send_mock_email(
        str(msg.email), 
        "Reply to your Civic Link Support Request", 
        f"Hello {msg.name},\n\n{reply_text}\n\nRegards,\n{current_user.full_name}"
    )
    
    return {"message": "Replied successfully"}

@app.get("/api/admin/requests", response_model=List[schemas.RequestResponse])
def get_all_requests(db: Session = Depends(database.get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    requests = db.query(models.ServiceRequest).order_by(models.ServiceRequest.created_at.desc()).all()
    for req in requests: req.citizen_name = req.citizen.full_name if req.citizen else "Unknown"
    return requests

@app.put("/api/admin/requests/{request_id}")
def update_request(request_id: int, status: str = Form(...), department: str = Form(...), evidence: UploadFile = File(None), db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role not in ["admin", "officer"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    req = db.query(models.ServiceRequest).filter(models.ServiceRequest.id == request_id).first()
    if not req: raise HTTPException(status_code=404, detail="Request not found")
    req.status = status # type: ignore
    req.department = department # type: ignore
    if evidence:
        file_location = f"uploads/evidence_{evidence.filename}"
        with open(file_location, "wb") as buffer: shutil.copyfileobj(evidence.file, buffer)
        req.evidence_url = f"http://localhost:8000/uploads/evidence_{evidence.filename}" # type: ignore
    db.commit()
    return {"message": "Request updated"}

@app.put("/api/admin/requests/{request_id}/approve")
def approve_request(request_id: int, db: Session = Depends(database.get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    req = db.query(models.ServiceRequest).filter(models.ServiceRequest.id == request_id).first()
    if not req: raise HTTPException(status_code=404, detail="Request not found")
    req.status = "Resolved" # type: ignore
    db.commit()
    
    # Send REAL email to citizen
    send_mock_email(
        str(req.citizen.email), 
        "Issue Resolved", 
        f"Your issue {req.tracking_number} has been resolved and approved."
    )
    
    return {"message": "Approved"}

@app.get("/api/admin/analytics")
def get_analytics(db: Session = Depends(database.get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    return {
        "total": db.query(models.ServiceRequest).count(),
        "pending": db.query(models.ServiceRequest).filter(models.ServiceRequest.status == "Pending").count(),
        "in_progress": db.query(models.ServiceRequest).filter(models.ServiceRequest.status.in_(["In Progress", "Work Done"])).count(),
        "resolved": db.query(models.ServiceRequest).filter(models.ServiceRequest.status == "Resolved").count()
    }

# ================= OFFICER SPECIFIC =================
@app.get("/api/officer/profile", response_model=schemas.UserResponse)
def get_officer_profile(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.post("/api/officer/profile-pic")
def upload_profile_pic(file: UploadFile = File(...), db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)) -> Any:
    file_location = f"uploads/profile_{current_user.id}_{file.filename}"
    with open(file_location, "wb") as buffer: shutil.copyfileobj(file.file, buffer)
    current_user.profile_pic = f"http://localhost:8000/uploads/profile_{current_user.id}_{file.filename}" # type: ignore
    db.commit()
    return {"message": "Profile updated", "url": current_user.profile_pic}

@app.get("/api/officer/requests", response_model=List[schemas.RequestResponse])
def get_officer_requests(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)) -> Any:
    if current_user.role != "officer" or not current_user.department: # type: ignore
        return []
    dept_name = current_user.department.name # type: ignore
    reqs = db.query(models.ServiceRequest).filter(models.ServiceRequest.department == dept_name).all()
    for req in reqs: req.citizen_name = req.citizen.full_name if req.citizen else "Unknown"
    return reqs

@app.put("/api/officer/requests/{request_id}/complete")
def complete_work(request_id: int, notes: str = Form(...), evidence: UploadFile = File(None), db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    req = db.query(models.ServiceRequest).filter(models.ServiceRequest.id == request_id).first()
    if not req: raise HTTPException(status_code=404, detail="Request not found")
    req.status = "Work Done" # type: ignore
    req.officer_notes = notes # type: ignore
    if evidence:
        file_location = f"uploads/evidence_{evidence.filename}"
        with open(file_location, "wb") as buffer: shutil.copyfileobj(evidence.file, buffer)
        req.evidence_url = f"http://localhost:8000/uploads/evidence_{evidence.filename}" # type: ignore
    db.commit()
    return {"message": "Work marked as done, awaiting admin approval"}

@app.get("/api/officer/support", response_model=List[schemas.SupportMessageResponse])
def get_officer_support(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)) -> Any:
    if current_user.role != "officer" or not current_user.department: # type: ignore
        return []
    dept_name = current_user.department.name # type: ignore
    return db.query(models.SupportMessage).filter(models.SupportMessage.department == dept_name).order_by(models.SupportMessage.created_at.desc()).all()