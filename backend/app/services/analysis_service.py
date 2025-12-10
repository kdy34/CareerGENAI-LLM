from sqlalchemy.orm import Session
from ..db.models import AnalysisRun
from ..schemas.analysis import AnalysisRunOut, SkillProfile, GapReport, ProjectRecommendation


def create_analysis_run(db: Session, data: dict) -> int:
  """
  Persist a new analysis run and return its ID.
  """
  run = AnalysisRun(
    target_role=data["target_role"],
    cv_text=data["cv_text"],
    skills=data["skills"],
    gap_report=data["gap_report"],
    roadmap_md=data["roadmap_md"],
    projects=data["projects"],
  )
  db.add(run)
  db.commit()
  db.refresh(run)
  return run.id


def _to_schema(run: AnalysisRun) -> AnalysisRunOut:
  """
  Convert AnalysisRun ORM instance to AnalysisRunOut schema.
  """
  skills = SkillProfile(**(run.skills or {}))
  gap_report = GapReport(**(run.gap_report or {}))
  projects = [ProjectRecommendation(**p) for p in (run.projects or [])]

  return AnalysisRunOut(
    id=run.id,
    target_role=run.target_role,
    cv_text=run.cv_text,
    skills=skills,
    gap_report=gap_report,
    roadmap_md=run.roadmap_md,
    projects=projects,
    created_at=run.created_at.isoformat() if run.created_at else None,
  )


def get_analysis_run(db: Session, run_id: int) -> AnalysisRunOut | None:
  run = db.query(AnalysisRun).filter(AnalysisRun.id == run_id).first()
  if not run:
    return None
  return _to_schema(run)
