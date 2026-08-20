"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, FileText, Clock, Zap, BookOpen } from "lucide-react";
import { startResearch, listReports, Report } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  pending: "#8a8fa8",
  researching: "#c9a84c",
  critiquing: "#e8a234",
  writing: "#5b9bd5",
  done: "#4caf7d",
  failed: "#e84234",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Queued",
  researching: "Researching",
  critiquing: "Critiquing",
  writing: "Writing",
  done: "Complete",
  failed: "Failed",
};

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [maxSources, setMaxSources] = useState(15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  useEffect(() => {
    loadReports();
    const interval = setInterval(loadReports, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadReports() {
    try {
      const data = await listReports();
      setReports(data);
    } catch { }
    setLoadingReports(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || query.length < 10) {
      setError("Query must be at least 10 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await startResearch({ query: query.trim(), max_sources: maxSources });
      router.push(`/reports/${res.report_id}`);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Failed to start research.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  }

  const activeReports = reports.filter((r) => r.status !== "done" && r.status !== "failed");
  const doneReports = reports.filter((r) => r.status === "done" || r.status === "failed");

  return (
    <div className="min-h-screen" style={{ background: "var(--ink)" }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: "var(--border)" }}>
        <div className="w-full px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded flex items-center justify-center"
              style={{ background: "var(--accent)" }}
            >
              <Zap size={16} className="text-white" />
            </div>
            <span
              className="text-lg font-bold tracking-tight"
            >
              Deep Research Agent
            </span>
          </div>
          <span
            className="text-xs font-mono"
            style={{ color: "var(--mist)" }}
          >
            v1.0
          </span>
        </div>
      </header>

      <main className="w-full px-8 py-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <p
            className="text-xs font-mono mb-4 tracking-widest uppercase"
            style={{ color: "var(--accent)" }}
          >
            Autonomous Intelligence · Multi-Source · Cite-Checked
          </p>
          <h1
            className="text-5xl font-black mb-4 leading-tight"
          >
            Ask anything.
            <br />
            <span style={{ color: "var(--gold)" }}>Get a 5,000-word report.</span>
          </h1>
          <p className="text-base max-w-3xl" style={{ color: "var(--mist)" }}>
            Planner → Researcher → Critic → Writer. Four autonomous nodes search
            the web and ArXiv, cross-reference claims, flag conflicts, and write
            a structured report with confidence scores.
          </p>
        </motion.div>

        {/* Search form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <form onSubmit={handleSubmit}>
            <div
              className="rounded-xl p-1"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-start gap-3 p-4">
                <Search
                  size={20}
                  className="mt-1 flex-shrink-0"
                  style={{ color: "var(--mist)" }}
                />
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="What are the latest advances in quantum error correction and their implications for practical quantum computing?"
                  className="flex-1 bg-transparent resize-none outline-none text-base leading-relaxed"
                  style={{ color: "var(--paper)", minHeight: "80px" }}
                  rows={3}
                />
              </div>
              <div
                className="flex items-center justify-between px-4 py-3 border-t"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="flex items-center gap-3">
                  <label
                    className="text-xs font-mono"
                    style={{ color: "var(--mist)" }}
                  >
                    Max sources
                  </label>
                  <select
                    value={maxSources}
                    onChange={(e) => setMaxSources(Number(e.target.value))}
                    className="text-xs font-mono rounded px-2 py-1 outline-none"
                    style={{
                      background: "var(--border)",
                      color: "var(--paper)",
                      border: "none",
                    }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={20}>20</option>
                    <option value={25}>25</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                  style={{
                    background: loading ? "var(--border)" : "var(--accent)",
                    color: "white",
                  }}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Starting…
                    </>
                  ) : (
                    <>
                      <Zap size={14} />
                      Run Research
                    </>
                  )}
                </button>
              </div>
            </div>
            {error && (
              <p className="mt-2 text-sm font-mono" style={{ color: "var(--accent)" }}>
                ⚠ {error}
              </p>
            )}
          </form>
        </motion.div>

        {/* Active reports */}
        {activeReports.length > 0 && (
          <section className="mb-10">
            <h2
              className="text-xs font-mono tracking-widest uppercase mb-4"
              style={{ color: "var(--mist)" }}
            >
              Active
            </h2>
            <div className="space-y-2">
              {activeReports.map((r) => (
                <ReportRow key={r.id} report={r} onClick={() => router.push(`/reports/${r.id}`)} />
              ))}
            </div>
          </section>
        )}

        {/* Past reports */}
        {doneReports.length > 0 && (
          <section>
            <h2
              className="text-xs font-mono tracking-widest uppercase mb-4"
              style={{ color: "var(--mist)" }}
            >
              Past Reports
            </h2>
            <div className="space-y-2">
              {doneReports.map((r) => (
                <ReportRow key={r.id} report={r} onClick={() => router.push(`/reports/${r.id}`)} />
              ))}
            </div>
          </section>
        )}

        {!loadingReports && reports.length === 0 && (
          <div
            className="text-center py-16 rounded-xl border"
            style={{ borderColor: "var(--border)", color: "var(--mist)" }}
          >
            <BookOpen size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No reports yet. Ask your first question above.</p>
          </div>
        )}
      </main>
    </div>
  );
}

function ReportRow({ report, onClick }: { report: Report; onClick: () => void }) {
  const color = STATUS_COLORS[report.status] || "#8a8fa8";
  const isActive = !["done", "failed"].includes(report.status);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.005]"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="relative flex-shrink-0">
        <FileText size={16} style={{ color }} />
        {isActive && (
          <div
            className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
            style={{ background: color, animation: "pulse-dot 1.5s infinite" }}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate" style={{ color: "var(--paper)" }}>
          {report.query}
        </p>
        <p className="text-xs font-mono mt-0.5" style={{ color: "var(--mist)" }}>
          {report.sources_searched > 0 && `${report.sources_searched} sources · `}
          {report.word_count > 0 && `${report.word_count.toLocaleString()} words · `}
          {new Date(report.created_at).toLocaleDateString()}
        </p>
      </div>
      <span
        className="text-xs font-mono px-2 py-1 rounded"
        style={{
          color,
          background: `${color}20`,
          border: `1px solid ${color}40`,
        }}
      >
        {STATUS_LABELS[report.status]}
      </span>
    </motion.div>
  );
}
