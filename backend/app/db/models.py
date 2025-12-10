from sqlalchemy import Column, Integer, String, JSON, DateTime, Text
from sqlalchemy.sql import func
from .session import Base

class AnalysisRun(Base):
    __tablename__ = "analysis_runs"
    #Related to Database
    id = Column(Integer, primary_key=True, index=True)
    target_role = Column(String, nullable=False)

    # store dictionaries/lists as JSON
    skills_json = Column(JSON, nullable=True)
    gap_report_json = Column(JSON, nullable=True)
    projects_json = Column(JSON, nullable=True)

    roadmap_md = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
