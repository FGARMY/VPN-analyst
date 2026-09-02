"""
VPN Tunnels API — List, search, filter, and detail endpoints.
"""
from fastapi import APIRouter, Query
from typing import Optional
from app.services.seed_data import get_data

router = APIRouter(prefix="/api", tags=["tunnels"])


@router.get("/tunnels")
async def get_tunnels(
    search: Optional[str] = Query(None, description="Search by tunnel name, IP, or cipher"),
    status: Optional[str] = Query(None, description="Filter by status"),
    risk_level: Optional[str] = Query(None, description="Filter by risk level"),
    sort_by: str = Query("risk_score", description="Sort field"),
    sort_order: str = Query("desc", description="asc or desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
):
    data = get_data()
    tunnels = list(data["tunnels"])
    
    # Search
    if search:
        q = search.lower()
        tunnels = [
            t for t in tunnels
            if q in t["tunnel_name"].lower()
            or q in t["source_ip"].lower()
            or q in t["destination_ip"].lower()
            or q in t["cipher"].lower()
            or q in t["ike_version"].lower()
        ]
    
    # Filter by status
    if status:
        tunnels = [t for t in tunnels if t["status"].lower() == status.lower()]
    
    # Filter by risk level
    if risk_level:
        tunnels = [t for t in tunnels if t["risk_level"].lower() == risk_level.lower()]
    
    # Sort
    reverse = sort_order.lower() == "desc"
    if sort_by in tunnels[0] if tunnels else []:
        tunnels.sort(key=lambda t: t.get(sort_by, ""), reverse=reverse)
    
    # Paginate
    total = len(tunnels)
    start = (page - 1) * page_size
    end = start + page_size
    
    return {
        "tunnels": tunnels[start:end],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get("/tunnels/{tunnel_id}")
async def get_tunnel_detail(tunnel_id: str):
    data = get_data()
    
    tunnel = next((t for t in data["tunnels"] if t["id"] == tunnel_id), None)
    if not tunnel:
        return {"error": "Tunnel not found"}, 404
    
    # Get risk history for this tunnel
    history = [r for r in data["risk_history"] if r["tunnel_id"] == tunnel_id]
    history.sort(key=lambda r: r["recorded_at"])
    
    # Get alerts for this tunnel
    tunnel_alerts = [a for a in data["alerts"] if a["tunnel_id"] == tunnel_id]
    
    # Get recent traffic
    traffic = [l for l in data["traffic_logs"] if l["tunnel_id"] == tunnel_id]
    traffic.sort(key=lambda l: l["timestamp"])
    
    return {
        "tunnel": tunnel,
        "risk_history": history,
        "alerts": tunnel_alerts,
        "traffic": traffic[-24:],  # Last 24 entries
    }


@router.get("/topology")
async def get_topology():
    data = get_data()
    tunnels = data.get("tunnels", [])
    
    nodes = [{"id": "HQ-GATEWAY", "name": "HQ-GATEWAY", "type": "gateway", "risk": 0}]
    links = []
    
    for t in tunnels:
        # Add remote node
        nodes.append({
            "id": t["destination_ip"],
            "name": t["tunnel_name"],
            "type": "remote",
            "risk": t["risk_score"]
        })
        # Add link
        links.append({
            "source": "HQ-GATEWAY",
            "target": t["destination_ip"],
            "status": t["status"]
        })
        
    return {"nodes": nodes, "links": links}
