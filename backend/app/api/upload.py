from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.storage_service import storage_service

router = APIRouter()

@router.post("/")
async def upload_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    try:
        content = await file.read()
        url = storage_service.upload_file(content, file.filename, file.content_type)
        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
