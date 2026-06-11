from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.api import ac

# Create all tables (dev mode)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FiberCore EOMS API",
    description="Engineering Operations Management System API",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(ac.router, prefix="/api/v1/ac", tags=["AC Management"])

@app.get("/")
def read_root():
    return {"message": "Welcome to FiberCore EOMS API"}

@app.get("/api/health")
def health_check():
    return {"status": "ok"}
