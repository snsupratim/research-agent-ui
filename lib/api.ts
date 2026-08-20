import axios from "axios";

// Always use the relative path in the browser to route through the Next.js proxy (avoids CORS).
// The actual backend URL from your .env file is used by next.config.js for the proxy destination.
const BASE = "/api/v1";

export const api = axios.create({
  baseURL: BASE,
  timeout: 15000,
});

export function getWsUrl(id: string) {
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    
    // If an absolute URL is explicitly provided, replace http with ws
    if (BASE.startsWith("http")) {
      return `${BASE.replace(/^http/, "ws")}/reports/${id}/stream`;
    }
    
    // Otherwise, route through the Next.js proxy
    return `${protocol}//${window.location.host}${BASE}/reports/${id}/stream`;
  }
  
  return `ws://localhost:8000/api/v1/reports/${id}/stream`;
}

export interface ResearchRequest {
  query: string;
  max_sources?: number;
}

export interface Citation {
  id: string;
  title: string;
  url: string;
  source_type: "web" | "arxiv" | "pdf";
  confidence_score: number;
}

export interface ConflictFlag {
  claim: string;
  source_a: string;
  source_b: string;
  description: string;
}

export interface ReportSection {
  heading: string;
  content: string;
  citations: string[];
}

export interface Report {
  id: string;
  query: string;
  status: "pending" | "researching" | "critiquing" | "writing" | "done" | "failed";
  summary: string;
  sections: ReportSection[];
  citations: Citation[];
  conflict_flags: ConflictFlag[];
  sources_searched: number;
  word_count: number;
  created_at: string;
  completed_at?: string;
  error?: string;
}

export async function startResearch(req: ResearchRequest) {
  const { data } = await api.post("/reports", req);
  return data as { report_id: string; status: string; message: string };
}

export async function fetchReport(id: string) {
  const { data } = await api.get(`/reports/${id}`);
  return data as Report;
}

export async function listReports() {
  const { data } = await api.get("/reports?limit=10");
  return data.reports as Report[];
}

export async function deleteReport(id: string) {
  await api.delete(`/reports/${id}`);
}

export async function exportReport(id: string, format: "pdf" | "docx") {
  const response = await api.get(`/reports/${id}/export?format=${format}`, {
    responseType: "blob",
  });
  
  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `report-${id}.${format}`);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
}
