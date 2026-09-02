// TypeScript interfaces for the IPsec VPN Analyzer

export interface VPNTunnel {
  id: string;
  tunnel_name: string;
  source_ip: string;
  destination_ip: string;
  ike_version: string;
  cipher: string;
  dh_group: number;
  pfs: boolean;
  status: string;
  sa_lifetime: number;
  last_rekey: string;
  created_at: string;
  risk_score: number;
  risk_level: string;
}

export interface SecurityAlert {
  id: string;
  tunnel_id: string;
  tunnel_name: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  title: string;
  description: string;
  recommendation: string;
  created_at: string;
}

export interface RiskHistory {
  id: string;
  tunnel_id: string;
  risk_score: number;
  confidence: number;
  recorded_at: string;
}

export interface TrafficLog {
  id: string;
  tunnel_id: string;
  timestamp: string;
  throughput_mbps: number;
  packets_in: number;
  packets_out: number;
}

export interface RiskBreakdown {
  overall_score: number;
  confidence: number;
  severity: string;
  crypto_score: number;
  config_score: number;
  behavior_score: number;
  traffic_score: number;
  explanation: string;
  recommendations: string[];
  findings: string[];
}

export interface DashboardData {
  total_tunnels: number;
  active_tunnels: number;
  critical_alerts: number;
  overall_risk_score: number;
  risk_trend: "improving" | "stable" | "degrading";
  tunnel_statuses: Record<string, number>;
  risk_distribution: Record<string, number>;
  recent_alerts: SecurityAlert[];
  ai_insights: string[];
  traffic_data: { time: string; throughput: number }[];
  risk_by_tunnel: { name: string; risk: number; level: string }[];
  security_trend: { date: string; avgRisk: number; alerts: number }[];
}

export interface TunnelsResponse {
  tunnels: VPNTunnel[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AlertsResponse {
  alerts: SecurityAlert[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  counts: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface TunnelDetail {
  tunnel: VPNTunnel;
  risk_history: RiskHistory[];
  alerts: SecurityAlert[];
  traffic: TrafficLog[];
}

export interface ReportData {
  generated_at: string;
  period_days: number;
  summary: {
    total_tunnels: number;
    avg_risk_score: number;
    critical_tunnels: number;
    high_risk_tunnels: number;
    total_alerts: number;
    critical_alerts: number;
  };
  risk_trends: { date: string; avgRisk: number }[];
  weak_crypto_tunnels: {
    tunnel_name: string;
    risk_score: number;
    issues: string[];
    cipher: string;
    dh_group: number;
    ike_version: string;
  }[];
  compliance_score: number;
  compliance_breakdown: Record<string, number>;
  tunnel_security_summary: {
    tunnel_name: string;
    status: string;
    risk_score: number;
    risk_level: string;
    cipher: string;
    dh_group: number;
    ike_version: string;
    pfs: boolean;
  }[];
  ai_explanations: string[];
}

export interface AnalyzeResponse {
  tunnel_id: string;
  tunnel_name: string;
  risk_breakdown: RiskBreakdown;
}
