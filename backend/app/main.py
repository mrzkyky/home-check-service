from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.api import ac, server_room, apar, kwh, dashboard

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
app.include_router(server_room.router, prefix="/api/v1/servers", tags=["Server Rooms"])
app.include_router(apar.router, prefix="/api/v1/apar", tags=["APAR"])
app.include_router(kwh.router, prefix="/api/v1/kwh", tags=["KWH Monitoring"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])

@app.get("/")
def read_root():
    return {"message": "Welcome to FiberCore EOMS API"}

@app.get("/api/health")
def health_check():
    return {"status": "ok"}
