from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import AnalysisRun
from app.services.parser_service import extract_text_from_file
from app.services.skill_service import extract_skills_pipeline
from app.services.gap_service import compute_gap_report
from app.services.roadmap_service import generate_roadmap
from app.services.project_service import recommend_projects

router = APIRouter(prefix="/mentor", tags=["mentor"])


@router.post("/analyze")
async def analyze_cv(
    file: UploadFile = File(...),
    target_role: str = Form(...),
    db: Session = Depends(get_db),
):
    """
    Analyze a CV and persist the run in Postgres.
    """
    try:
        # 1) Parse CV
        text = await extract_text_from_file(file)

        # 2) Extract skills
        skills = extract_skills_pipeline(text)

        # 3) Compute gaps for target role
        gap = compute_gap_report(skills, target_role)

        # 4) Generate roadmap text
        roadmap_md = generate_roadmap(skills, gap, target_role)

        # 5) Recommend projects
        projects = recommend_projects(skills, gap, target_role)

        # 6) Persist in DB
        run = AnalysisRun(
            target_role=target_role,
            skills_json=skills,
            gap_report_json=gap,
            projects_json=projects,
            roadmap_md=roadmap_md,
        )
        db.add(run)
        db.commit()
        db.refresh(run)

        print(f"ANALYSIS_PERSISTED: run.id={run.id}, target_role={target_role}")

        # 7) Return run_id to frontend
        return {
            "run_id": run.id,
            "target_role": target_role,
            "skills": skills,
            "gap_report": gap,
            "roadmap_md": roadmap_md,
            "projects": projects,
        }

    except Exception as e:
        print("ANALYZE_ERROR:", repr(e))
        raise HTTPException(status_code=500, detail="Failed to analyze CV")
