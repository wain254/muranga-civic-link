import database, models, auth

# Initialize database connection
db = database.SessionLocal()

def create_admin():
    admin_email = "admin@muranga.go.ke"
    admin_password = "admin123"
    
    # Check if admin already exists
    existing_admin = db.query(models.User).filter(models.User.email == admin_email).first()
    if existing_admin:
        print(f"Admin already exists with email: {admin_email}")
        return

    # Create the admin user
    hashed_pw = auth.get_password_hash(admin_password)
    new_admin = models.User(
        full_name="System Admin",
        email=admin_email,
        hashed_password=hashed_pw,
        role="admin"  # <--- This is the magic part
    )
    
    db.add(new_admin)
    db.commit()
    print("✅ Admin account created successfully!")
    print(f"📧 Email: {admin_email}")
    print(f"🔑 Password: {admin_password}")

if __name__ == "__main__":
    create_admin()