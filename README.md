# CareerGENAI – AI-Powered Career Intelligence Platform

CareerGENAI is an end-to-end, AI-driven platform that analyzes a candidate’s CV/Resume, identifies skill strengths and gaps, generates personalized learning roadmaps and recommends industry-aligned portfolio projects.  
It is built as a modern full-stack system using:

- **Python (FastAPI)**
- **Next.js 15**
- **Gemini 2.5 Flash (LLM)**
- **PostgreSQL**
- **Docker & Docker Compose**
- **AWS (ECR, EC2, RDS, S3 – optional)**

This project demonstrates real production patterns including LLM orchestration, role-based skill intelligence, PostgreSQL persistence, containerized microservices and cloud deployment.

---

## 🛠 Tech Stack

### **Backend**
- Python 3.11
- FastAPI
- SQLAlchemy ORM + psycopg
- Pydantic v2 + pydantic-settings
- Gemini 2.5 Flash (LLM)
- Dockerized microservice

### **Frontend**
- Next.js 15 (App Router)
- Recharts (data visualization)
- Custom CSS (no Tailwind)
- File upload + REST integration

### **Database**
- PostgreSQL 17  
- Local dev via Docker  
- Prod via AWS RDS

### **Infrastructure**
- Docker / Docker Compose
- AWS EC2 (compute)
- AWS RDS (Postgres)
- AWS ECR (container images)
- Optional: S3 for CV storage

---

## ✨ Features

### **1. CV Intelligence Engine**
- Extracts text from PDF/DOCX files.
- Identifies relevant skills using deterministic matching + LLM refinement.
- Generates:
  - Strengths
  - Missing core skills
  - Nice-to-have gaps
  - Validated CV skill set

### **2. Personalized Roadmap Generator**
- Creates Markdown-based learning roadmaps.
- Structures roadmap by skill categories.
- Highlights recommended focus areas tailored to the user.

### **3. Portfolio Project Generator**
- Uses LLM to produce actionable, multi-step portfolio project suggestions.
- Each project includes:
  - Description  
  - Required skills  
  - Difficulty  
  - Time estimate  

### **4. Clean Frontend UI (Next.js)**
- Upload CV page
- Results page with:
  - Readiness bar
  - Skill match bar chart
  - Skill breakdown
  - Projects grid
- Roadmap page (Markdown → Rendered UI)
- Simple modern design without Tailwind (custom CSS)

### **5. PostgreSQL Persistence**
Every analysis run is saved to database:
- `skills_json`
- `gap_report_json`
- `projects_json`
- `roadmap_md`
- `target_role`

### **To run the project**

-Make sure that you have Docker Desktop installed and running and also Docker Compose available

-Go to the backend folder and create your .env file from the example
cp backend/.env.example backend/.env

-Then edit backend/.env and set required variables such as:

DATABASE_URL (PostgreSQL connection string)

LLM_PROVIDER

GEMINI_API_KEY

GEMINI_MODEL

-Do the same thing for the frontend environment

-Check Docker Compose configurations
docker-compose.yml already defines the required services. Ensure the database settings match your intended configuration.

-Verify the ports

-Finally:
docker compose build --no-cache
docker compose up
docker compose up -d (To run in the background)

docker compose down (To stop the application)

-Accessing to application:

Frontend (Upload Page):
http://localhost:3000/upload

Frontend (Results Page):
http://localhost:3000/results

Backend API Docs (Swagger):
http://localhost:8000/docs


### **6. Full Dockerization**
Local development uses:

```sh
docker compose up --build
