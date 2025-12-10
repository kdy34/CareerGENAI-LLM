from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import cm

from ..schemas.analysis import AnalysisRunOut


def _wrap_text(text: str, max_chars: int = 90) -> list[str]:
  lines = []
  for paragraph in text.split("\n"):
    current = ""
    for word in paragraph.split():
      if len(current) + len(word) + 1 > max_chars:
        lines.append(current)
        current = word
      else:
        current = f"{current} {word}".strip()
    if current:
      lines.append(current)
  if not lines:
    lines.append("")
  return lines


def build_pdf_report(run: AnalysisRunOut) -> BytesIO:
  """
  Build a simple but clean PDF report summarizing the analysis.
  Returns a BytesIO ready to stream via FastAPI.
  """
  buffer = BytesIO()
  c = canvas.Canvas(buffer, pagesize=A4)
  width, height = A4

  x_margin = 2 * cm
  y = height - 2 * cm
  line_height = 12

  def draw_line(text: str = "", bold: bool = False):
    nonlocal y
    if bold:
      c.setFont("Helvetica-Bold", 10)
    else:
      c.setFont("Helvetica", 9)
    c.drawString(x_margin, y, text)
    y -= line_height
    if y < 2 * cm:
      c.showPage()
      y = height - 2 * cm

  # Title
  c.setFont("Helvetica-Bold", 14)
  c.drawString(x_margin, y, "Career Mentor GENAI – Analysis Report")
  y -= 2 * line_height

  # Meta
  c.setFont("Helvetica", 9)
  draw_line(f"Analysis ID: {run.id}")
  draw_line(f"Target role: {run.target_role}")
  if run.created_at:
    draw_line(f"Created at: {run.created_at}")
  y -= line_height

  # Skill profile
  draw_line("1. Skill Profile", bold=True)
  if run.skills.validated_skills:
    draw_line("Validated skills:")
    for s in run.skills.validated_skills:
      draw_line(f"  • {s}")
  else:
    draw_line("No validated skills were detected in this run.")
  y -= line_height

  # Gap report
  draw_line("2. Gap Analysis", bold=True)
  if run.gap_report.strengths:
    draw_line("Strengths:")
    for s in run.gap_report.strengths:
      draw_line(f"  • {s}")
  if run.gap_report.missing_core:
    draw_line("Core gaps:")
    for g in run.gap_report.missing_core:
      draw_line(f"  • {g}")
  if run.gap_report.missing_nice_to_have:
    draw_line("Nice-to-have gaps:")
    for g in run.gap_report.missing_nice_to_have:
      draw_line(f"  • {g}")
  if run.gap_report.summary:
    draw_line("Summary:")
    for line in _wrap_text(run.gap_report.summary):
      draw_line(f"  {line}")
  y -= line_height

  # Roadmap
  draw_line("3. Learning Roadmap", bold=True)
  for line in _wrap_text(run.roadmap_md or ""):
    draw_line(line)
  y -= line_height

  # Projects
  draw_line("4. Project Recommendations", bold=True)
  if run.projects:
    for idx, p in enumerate(run.projects, start=1):
      title = p.title or f"Project {idx}"
      draw_line(f"{idx}. {title}")
      if p.description:
        for line in _wrap_text(p.description, max_chars=80):
          draw_line(f"   {line}")
      if p.skills:
        draw_line("   Skills:")
        for s in p.skills:
          draw_line(f"   • {s}")
      if p.difficulty:
        draw_line(f"   Difficulty: {p.difficulty}")
      if p.estimated_duration_weeks:
        draw_line(f"   Est. duration: {p.estimated_duration_weeks} weeks")
      y -= line_height
  else:
    draw_line("No project recommendations were included in this run.")

  c.showPage()
  c.save()
  buffer.seek(0)
  return buffer
