"""
Pydantic schemas for API request/response models.
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class VPNTunnel(BaseModel):
    id: str
    tunnel_name: str
    source_ip: str
    destination_ip: str
    ike_version: str
    cipher: str
    dh_group: int
    pfs: bool
    status: str
    sa_lifetime: int  # seconds
    last_rekey: datetime
    created_at: datetime
    risk_score: int = 0
    risk_level: str = "Low"


class SecurityAlert(BaseModel):
    id: str
    tunnel_id: str
    tunnel_name: str
    severity: str  # Critical, High, Medium, Low
    title: str
    description: str
    recommendation: str
    created_at: datetime


class RiskHistory(BaseModel):
    id: str
    tunnel_id: str
    risk_score: int
    confidence: float
    recorded_at: datetime


class TrafficLog(BaseModel):
    id: str
    tunnel_id: str
    timestamp: datetime
    throughput_mbps: float
    packets_in: int
    packets_out: int


class RiskBreakdown(BaseModel):
    overall_score: int
    confidence: float
    severity: str
    crypto_score: int
    config_score: int
    behavior_score: int
    traffic_score: int
    explanation: str
    recommendations: list[str]


class DashboardData(BaseModel):
    total_tunnels: int
    active_tunnels: int
    critical_alerts: int
    overall_risk_score: int
    risk_trend: str  # "improving", "stable", "degrading"
    tunnel_statuses: dict[str, int]
    risk_distribution: dict[str, int]
    recent_alerts: list[SecurityAlert]
    ai_insights: list[str]
    traffic_data: list[dict]
    risk_by_tunnel: list[dict]
    security_trend: list[dict]


class ReportData(BaseModel):
    generated_at: datetime
    period_days: int
    summary: dict
    risk_trends: list[dict]
    weak_crypto_tunnels: list[dict]
    compliance_score: float
    compliance_breakdown: dict
    tunnel_security_summary: list[dict]
    ai_explanations: list[str]


class AnalyzeRequest(BaseModel):
    tunnel_id: str


class AnalyzeResponse(BaseModel):
    tunnel_id: str
    tunnel_name: str
    risk_breakdown: RiskBreakdown
    alerts_generated: list[SecurityAlert]
