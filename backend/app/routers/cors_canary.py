from fastapi import APIRouter
router = APIRouter(tags=["canary"])

@router.get("/cors-canary")
def cors_canary():
    return {"ok": True}
