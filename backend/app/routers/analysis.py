"""
Analysis API — Trigger AI analysis and get risk breakdowns.
"""
from fastapi import APIRouter
from datetime import datetime, timezone
from pydantic import BaseModel
from app.services.seed_data import get_data
from app.services.ai_engine import analyze_tunnel

router = APIRouter(prefix="/api", tags=["analysis"])


class AnalyzeRequest(BaseModel):
    tunnel_id: str


@router.post("/analyze")
async def analyze(request: AnalyzeRequest):
    data = get_data()
    tunnel = next((t for t in data["tunnels"] if t["id"] == request.tunnel_id), None)
    
    if not tunnel:
        return {"error": "Tunnel not found"}
    
    # Parse last_rekey back to datetime for analysis
    tunnel_for_analysis = {
        **tunnel,
        "last_rekey": datetime.fromisoformat(tunnel["last_rekey"]),
    }
    
    result = analyze_tunnel(tunnel_for_analysis)
    
    return {
        "tunnel_id": tunnel["id"],
        "tunnel_name": tunnel["tunnel_name"],
        "risk_breakdown": result,
    }


@router.get("/risk/{tunnel_id}")
async def get_risk(tunnel_id: str):
    data = get_data()
    tunnel = next((t for t in data["tunnels"] if t["id"] == tunnel_id), None)
    
    if not tunnel:
        return {"error": "Tunnel not found"}
    
    tunnel_for_analysis = {
        **tunnel,
        "last_rekey": datetime.fromisoformat(tunnel["last_rekey"]),
    }
    
    result = analyze_tunnel(tunnel_for_analysis)
    
    # Get historical risk for this tunnel
    history = [r for r in data["risk_history"] if r["tunnel_id"] == tunnel_id]
    history.sort(key=lambda r: r["recorded_at"])
    
    return {
        "tunnel_id": tunnel["id"],
        "tunnel_name": tunnel["tunnel_name"],
        "current_risk": result,
        "history": history,
    }


@router.get("/analysis/protocol-distribution")
async def get_protocol_distribution():
    return [
        {"name": "ESP", "value": 45},
        {"name": "IKEv2", "value": 25},
        {"name": "TCP", "value": 15},
        {"name": "UDP", "value": 10},
        {"name": "ICMP", "value": 5},
    ]


@router.get("/analysis/threat-geography")
async def get_threat_geography():
    return [
        {"location": "US-EAST-1", "risk": 85, "count": 120},
        {"location": "EU-CENTRAL-1", "risk": 40, "count": 80},
        {"location": "AP-SOUTH-1", "risk": 92, "count": 15},
        {"location": "US-WEST-2", "risk": 20, "count": 210},
        {"location": "SA-EAST-1", "risk": 65, "count": 45},
    ]
