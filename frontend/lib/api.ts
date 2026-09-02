import type {
  DashboardData,
  TunnelsResponse,
  AlertsResponse,
  TunnelDetail,
  ReportData,
  AnalyzeResponse,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  getDashboard: () => fetchAPI<DashboardData>("/api/dashboard"),

  getTunnels: (params?: {
    search?: string;
    status?: string;
    risk_level?: string;
    sort_by?: string;
    sort_order?: string;
    page?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set("search", params.search);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.risk_level) searchParams.set("risk_level", params.risk_level);
    if (params?.sort_by) searchParams.set("sort_by", params.sort_by);
    if (params?.sort_order) searchParams.set("sort_order", params.sort_order);
    if (params?.page) searchParams.set("page", String(params.page));
    const qs = searchParams.toString();
    return fetchAPI<TunnelsResponse>(`/api/tunnels${qs ? `?${qs}` : ""}`);
  },

  getTunnelDetail: (id: string) => fetchAPI<TunnelDetail>(`/api/tunnels/${id}`),

  getAlerts: (params?: {
    severity?: string;
    search?: string;
    page?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.severity) searchParams.set("severity", params.severity);
    if (params?.search) searchParams.set("search", params.search);
    if (params?.page) searchParams.set("page", String(params.page));
    const qs = searchParams.toString();
    return fetchAPI<AlertsResponse>(`/api/alerts${qs ? `?${qs}` : ""}`);
  },

  getReports: (periodDays?: number) => {
    const qs = periodDays ? `?period_days=${periodDays}` : "";
    return fetchAPI<ReportData>(`/api/reports${qs}`);
  },

  analyzeTunnel: (tunnelId: string) =>
    fetchAPI<AnalyzeResponse>("/api/analyze", {
      method: "POST",
      body: JSON.stringify({ tunnel_id: tunnelId }),
    }),

  getProtocolDistribution: () => fetchAPI<any[]>("/api/analysis/protocol-distribution"),
  getThreatGeography: () => fetchAPI<any[]>("/api/analysis/threat-geography"),

  getTopology: () => fetchAPI<{ nodes: any[]; links: any[] }>("/api/topology"),

  getRemediationState: () => fetchAPI<any>("/api/remediation/state"),
  remediationAction: (id: string, action: string) => 
    fetchAPI<any>("/api/remediation/rules/action", {
      method: "POST",
      body: JSON.stringify({ id, action }),
    }),
  updateStrictness: (level: number) =>
    fetchAPI<any>("/api/remediation/strictness", {
      method: "POST",
      body: JSON.stringify({ level }),
    }),

  executeCLICommand: (command: string) =>
    fetchAPI<any>("/api/cli/execute", {
      method: "POST",
      body: JSON.stringify({ command }),
    }),
};
