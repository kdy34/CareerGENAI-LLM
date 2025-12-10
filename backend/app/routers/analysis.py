from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json

from app.db.session import get_db
from app.db.models import AnalysisRun

from fastapi.responses import StreamingResponse
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
import textwrap


router = APIRouter(prefix="/analysis", tags=["analysis"])


def _maybe_json(value, default):
  """
  Safely convert JSONB/text field to Python object.
  """
  if value is None:
      return default
  if isinstance(value, (dict, list)):
      return value
  try:
      return json.loads(value)
  except Exception:
      return default


@router.get("/{run_id}")
def get_analysis(run_id: int, db: Session = Depends(get_db)):
    """
    Fetch a persisted AnalysisRun by its primary key ID.
    """
    run = db.query(AnalysisRun).filter(AnalysisRun.id == run_id).first()

    if not run:
        raise HTTPException(status_code=404, detail="Analysis run not found")

    skills = _maybe_json(getattr(run, "skills_json", None), {})
    gap_report = _maybe_json(getattr(run, "gap_report_json", None), {})
    projects = _maybe_json(getattr(run, "projects_json", None), [])

    return {
        "id": run.id,
        "target_role": run.target_role,
        "skills": skills,
        "gap_report": gap_report,
        "roadmap_md": run.roadmap_md or "",
        "projects": projects,
    }

#Generate a simple PDF report for the given analysis run_id.
@router.get("/{run_id}/report")
def get_analysis_report(run_id: int, db: Session = Depends(get_db)):
    run = db.query(AnalysisRun).filter(AnalysisRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Analysis run not found")

    skills = _maybe_json(getattr(run, "skills_json", None), {})
    gap_report = _maybe_json(getattr(run, "gap_report_json", None), {})
    projects = _maybe_json(getattr(run, "projects_json", None), [])

    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    y = height - 40

    def write_line(text: str, step: int = 14, bold: bool = False):
        nonlocal y
        if bold:
            pdf.setFont("Helvetica-Bold", 11)
        else:
            pdf.setFont("Helvetica", 10)

        # wrap long lines
        for line in textwrap.wrap(text, 100):
            pdf.drawString(40, y, line)
            y -= step
            if y < 60:
                pdf.showPage()
                y = height - 40

    # Header
    pdf.setTitle(f"CareerGENAI Report #{run.id}")
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(40, y, "CareerGENAI Analysis Report")
    y -= 24

    pdf.setFont("Helvetica", 10)
    pdf.drawString(40, y, f"Run ID: {run.id}")
    y -= 14
    pdf.drawString(40, y, f"Target Role: {run.target_role}")
    y -= 20

    # Summary / Gap overview
    write_line("1. Summary", bold=True)
    summary = gap_report.get("summary") if isinstance(gap_report, dict) else None
    if summary:
        write_line(summary)
    else:
        write_line(
            "No detailed summary available for this run. The engine compared your skills "
            "against a reference profile for the target role."
        )
    y -= 10

    # Strengths
    strengths = gap_report.get("strengths", []) if isinstance(gap_report, dict) else []
    write_line("2. Strengths", bold=True)
    if strengths:
        write_line(f"Matched skills ({len(strengths)}): " + ", ".join(strengths[:40]))
    else:
        write_line("No clear strengths could be detected from the CV text.")
    y -= 10

    # Gaps
    missing_core = (
        gap_report.get("missing_core", []) if isinstance(gap_report, dict) else []
    )
    missing_nice = (
        gap_report.get("missing_nice_to_have", [])
        if isinstance(gap_report, dict)
        else []
    )

    write_line("3. Gaps", bold=True)
    if missing_core:
        write_line(
            f"Core gaps ({len(missing_core)}): " + ", ".join(missing_core[:40])
        )
    else:
        write_line("No core gaps identified for this role profile.")
    if missing_nice:
        write_line(
            f"Nice-to-have gaps ({len(missing_nice)}): "
            + ", ".join(missing_nice[:40])
        )
    else:
        write_line("No nice-to-have gaps identified.")
    y -= 10

    # Projects
    write_line("4. Suggested Projects", bold=True)
    if projects:
        for idx, p in enumerate(projects[:8], start=1):
            title = p.get("title") or p.get("name") or f"Project {idx}"
            desc = p.get("description") or ""
            difficulty = p.get("difficulty") or ""
            skills_list = p.get("skills") or []

            write_line(f"{idx}. {title}", bold=True)
            if desc:
                write_line(f"   Description: {desc}")
            if skills_list:
                write_line("   Skills: " + ", ".join(skills_list[:12]))
            if difficulty:
                write_line(f"   Difficulty: {difficulty}")
            y -= 6
    else:
        write_line("No project recommendations available for this run.")
    y -= 10

    #Roadmap note
    write_line("5. Roadmap", bold=True)
    write_line(
        "A detailed learning roadmap for this run is available inside the web app "
        "on the Roadmap page. Use it as a weekly learning plan."
    )

    pdf.showPage()
    pdf.save()

    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="career_report_{run.id}.pdf"'
        },
    )