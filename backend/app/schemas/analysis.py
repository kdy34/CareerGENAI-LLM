from typing import List, Optional
from pydantic import BaseModel, Field

#Skil Profile schema

class SkillProfile(BaseModel):
  raw_skills: List[str] = Field(default_factory=list)
  validated_skills: List[str] = Field(default_factory=list)
  inferred_domains: List[str] = Field(default_factory=list)


#Gap Report schema  

class GapReport(BaseModel):
  strengths: List[str] = Field(default_factory=list)
  missing_core: List[str] = Field(default_factory=list)
  missing_nice_to_have: List[str] = Field(default_factory=list)
  summary: Optional[str] = None


#Project Recommendation schema

class ProjectRecommendation(BaseModel):
  id: Optional[str] = None
  title: str
  description: Optional[str] = None
  skills: List[str] = Field(default_factory=list)
  difficulty: Optional[str] = None
  estimated_duration_weeks: Optional[int] = None


class AnalysisRunOut(BaseModel):
  id: int
  target_role: str
  cv_text: str

  skills: SkillProfile
  gap_report: GapReport
  roadmap_md: str
  projects: List[ProjectRecommendation]

  created_at: Optional[str] = None

  class Config:
    from_attributes = True  #Allow objects to be used.
