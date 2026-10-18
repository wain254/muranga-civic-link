# Murang'a County Civic Link System 🇰🇪

A modern, full-stack civic technology platform designed to connect Murang'a County residents with county departments. Citizens can report infrastructure issues, track progress, and get AI-assisted support, while admins and department officers manage requests, broadcast announcements, and analyze county data.

## 🚀 Technology Stack
* **Frontend:** React (Vite), Tailwind CSS v4, React Router, Axios, Recharts (Analytics), React-Leaflet (Maps)
* **Backend:** Python, FastAPI, SQLAlchemy, Pydantic, SMTP (Email notifications)
* **Database:** SQLite
* **Authentication:** JWT (JSON Web Tokens) with Passlib (bcrypt)

## ✨ Key Features

### 👤 Citizen Portal
* **Authentication:** Secure registration and login.
* **Report Issues:** Submit requests with categories, GPS location, images, and priority levels (Normal/Urgent).
* **Tracking:** Real-time tracking numbers (e.g., `MC-8F4A2B`) and status updates (Pending → In Progress → Work Done → Resolved).
* **Evidence:** View "After" photos uploaded by county workers once an issue is resolved.
* **Live Support AI:** A floating chat bubble to answer FAQs and allow users to leave messages for human agents.
* **Announcements:** A notification bell showing county news, job openings, and events with automatic expiry.

### 🛡️ Admin Portal
* **Analytics Dashboard:** Visual pie charts and counters showing total, pending, in-progress, and resolved issues.
* **Heatmap:** Interactive map of Murang'a County that highlights critical areas (Red) vs. moderate areas (Yellow).
* **Manage Users & Depts:** Create departments and generate login credentials for Department Officers.
* **Support Inbox:** Receive, review, and reply to citizen messages. Download chat history as CSV.
* **Broadcast:** Send notifications with an expiry date.

### 🚓 Department Officer Portal
* **Assigned Work:** View tasks assigned to their specific department by the Admin.
* **Work Completion:** Mark tasks as finished, add resolution notes, and upload evidence photos for Admin approval.
* **Department Messages:** Reply to citizen inquiries specific to their department.
* **Profile Management:** Upload and update profile pictures.

## 🛠️ Local Setup Instructions

### Prerequisites
* Node.js & npm installed
* Python 3.10+ installed
* A Gmail account with an **App Password** (for email notifications)

### 1. Backend Setup (FastAPI)
Open a terminal and run:
```bash
cd backend
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt