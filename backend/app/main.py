"""
FastAPI Application — AI-Powered IPsec VPN Protocol Analyzer.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.services.seed_data import get_data
from app.routers import dashboard, tunnels, alerts, reports, analysis, live_logs, packets, remediation, cli, dataset


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize in-memory data on startup."""
    get_data()
    print("[OK] Seed data initialized")
    yield
    print("[OK] Application shutting down")


app = FastAPI(
    title="IPsec VPN Analyzer API",
    description="AI-Powered IPsec VPN Protocol Analyzer & Security Assessment Framework",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(dashboard.router)
app.include_router(tunnels.router)
app.include_router(alerts.router)
app.include_router(reports.router)
app.include_router(analysis.router)
app.include_router(live_logs.router)
app.include_router(packets.router)
app.include_router(remediation.router)
app.include_router(cli.router)
app.include_router(dataset.router)


@app.get("/")
async def root():
    return {
        "name": "IPsec VPN Analyzer API",
        "version": "1.0.0",
        "status": "operational",
    }


@app.get("/api/health")
async def health():
    data = get_data()
    return {
        "status": "healthy",
        "tunnels_loaded": len(data["tunnels"]),
        "alerts_loaded": len(data["alerts"]),
    }
