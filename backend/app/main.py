from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import Base, engine
from app.routers.health import router as health_router
from app.routers.mentor import router as mentor_router
from app.routers.analysis import router as analysis_router

# Create tables on startup (simple, non-migration setup)
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(mentor_router)
app.include_router(analysis_router)
