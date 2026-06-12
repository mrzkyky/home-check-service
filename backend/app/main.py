from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.api import ac, server_room, apar, kwh, dashboard, upload, ticket, ups, cctv, network, maintenance, inspection, server

# Import new models so they are registered with Base.metadata
from app.models import maintenance as _maint_model, inspection as _insp_model, server as _srv_model  # noqa: F401

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
app.include_router(upload.router, prefix="/api/v1/upload", tags=["Media Upload"])
app.include_router(ticket.router, prefix="/api/v1/tickets", tags=["Ticketing"])
app.include_router(ups.router, prefix="/api/v1/ups", tags=["UPS"])
app.include_router(cctv.router, prefix="/api/v1/cctv", tags=["CCTV"])
app.include_router(network.router, prefix="/api/v1/network", tags=["Network"])
app.include_router(maintenance.router, prefix="/api/v1/maintenance", tags=["Maintenance"])
app.include_router(inspection.router, prefix="/api/v1/inspections", tags=["Inspections"])
app.include_router(server.router, prefix="/api/v1/servers_master", tags=["Servers Master"])

@app.get("/")
def read_root():
    return {"message": "Welcome to FiberCore EOMS API"}

@app.get("/api/health")
def health_check():
    return {"status": "ok"}
