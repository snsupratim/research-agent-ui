"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ExternalLink,
  BookOpen,
  Globe,
  GraduationCap,
  BarChart2,
  Copy,
  Check,
  Download,
} from "lucide-react";
import {
  fetchReport,
  deleteReport,
  exportReport,
  Report,
  Citation,
  ConflictFlag,
  ReportSection,
} from "@/lib/api";

const STATUS_STEPS = [
  "pending",
  "researching",
  "critiquing",
  "writing",
  "done",
];

const STEP_LABELS: Record<string, string> = {
  pending: "Queued",
  researching: "🔍 Searching web & ArXiv",
  critiquing: "🧪 Fact-checking & conflict detection",
  writing: "✍️ Writing structured report",
  done: "✅ Complete",
  failed: "❌ Failed",
};

export default function ReportPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchReport(params.id);
      setReport(data);
    } catch {
      router.push("/");
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    load();
  }, [load]);

  // Poll while not done
  useEffect(() => {
    if (!report) return;
    if (report.status === "done" || report.status === "failed") return;
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [report, load]);

  async function handleDelete() {
    if (!confirm("Delete this report?")) return;
    await deleteReport(params.id);
    router.push("/");
  }

  async function handleExport(format: "pdf" | "docx") {
    setExporting(true);
    try {
      await exportReport(params.id, format);
    } catch (err: any) {
      alert(
        `Failed to export ${format.toUpperCase()}: ${err?.message || "Unknown error"}`,
      );
    } finally {
      setExporting(false);
    }
  }

  function copyMarkdown() {
    if (!report) return;
    let md = `# ${report.query}\n\n${report.summary}\n\n`;
    for (const s of report.sections) {
      md += `## ${s.heading}\n\n${s.content}\n\n`;
    }
    md += `## References\n\n`;
    for (const c of report.citations) {
      md += `${c.id} ${c.title} — ${c.url}\n`;
    }
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <LoadingScreen />;
  if (!report) return null;

  const stepIdx = STATUS_STEPS.indexOf(report.status);
  const isDone = report.status === "done";
  const isFailed = report.status === "failed";

  return (
    <div className="min-h-screen" style={{ background: "var(--ink)" }}>
      {/* Top bar */}
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-md"
        style={{
          background: "rgba(10,10,15,0.92)",
          borderColor: "var(--border)",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
            style={{ color: "var(--mist)" }}
          >
            <ArrowLeft size={15} /> Back
          </button>
          <div className="flex items-center gap-2">
            {isDone && (
              <>
                <button
                  onClick={copyMarkdown}
                  className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    color: "var(--paper)",
                  }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? "Copied!" : "Copy MD"}
                </button>
                <button
                  onClick={() => handleExport("pdf")}
                  disabled={exporting}
                  className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    color: "var(--paper)",
                  }}
                  title="Export as PDF"
                >
                  {exporting ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Download size={12} />
                  )}
                  PDF
                </button>
                <button
                  onClick={() => handleExport("docx")}
                  disabled={exporting}
                  className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    color: "var(--paper)",
                  }}
                  title="Export as DOCX"
                >
                  {exporting ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Download size={12} />
                  )}
                  DOCX
                </button>
                <button
                  onClick={handleDelete}
                  className="text-xs font-mono px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    color: "var(--accent)",
                  }}
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Query title */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <p
            className="text-xs font-mono mb-3 tracking-widest uppercase"
            style={{ color: "var(--accent)" }}
          >
            Research Query
          </p>
          <h1
            className="text-3xl font-black leading-snug mb-4"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            {report.query}
          </h1>
          {/* Stats row */}
          {isDone && (
            <div className="flex flex-wrap gap-4">
              {[
                { label: "Sources", value: report.sources_searched },
                { label: "Words", value: report.word_count.toLocaleString() },
                { label: "Citations", value: report.citations.length },
                { label: "Conflicts", value: report.conflict_flags.length },
                { label: "Sections", value: report.sections.length },
              ].map((s) => (
                <div key={s.label} className="text-sm">
                  <span
                    className="font-mono font-semibold"
                    style={{ color: "var(--gold)" }}
                  >
                    {s.value}
                  </span>
                  <span
                    className="ml-1.5 text-xs"
                    style={{ color: "var(--mist)" }}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Progress tracker (while running) */}
        {!isDone && !isFailed && (
          <ProgressTracker status={report.status} stepIdx={stepIdx} />
        )}

        {/* Failed state */}
        {isFailed && (
          <div
            className="rounded-xl p-6 mb-8"
            style={{
              background: "rgba(232,66,52,0.1)",
              border: "1px solid rgba(232,66,52,0.3)",
            }}
          >
            <p className="font-mono text-sm" style={{ color: "var(--accent)" }}>
              ⚠ Agent failed: {report.error || "Unknown error"}
            </p>
          </div>
        )}

        {/* Main report */}
        {isDone && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: report body */}
            <div className="lg:col-span-2 space-y-8">
              {/* Executive summary */}
              {report.summary && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <SectionCard heading="Executive Summary" accent>
                    <p
                      className="text-base leading-relaxed"
                      style={{ color: "var(--paper)" }}
                    >
                      {report.summary}
                    </p>
                  </SectionCard>
                </motion.div>
              )}

              {/* Conflict flags */}
              {report.conflict_flags.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  <SectionCard
                    heading={`⚠ ${report.conflict_flags.length} Source Conflicts Detected`}
                    warning
                  >
                    <div className="space-y-4">
                      {report.conflict_flags.map((f, i) => (
                        <ConflictCard key={i} flag={f} />
                      ))}
                    </div>
                  </SectionCard>
                </motion.div>
              )}

              {/* Report sections */}
              {report.sections.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                >
                  <SectionCard heading={s.heading}>
                    <ReportContent
                      content={s.content}
                      citations={report.citations}
                      onCitationClick={setActiveCitation}
                    />
                    {s.citations.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1">
                        {s.citations.map((cid) => {
                          const c = report.citations.find((x) => x.id === cid);
                          return c ? (
                            <button
                              key={cid}
                              onClick={() => setActiveCitation(c)}
                              className="citation-tag"
                            >
                              {cid}
                            </button>
                          ) : null;
                        })}
                      </div>
                    )}
                  </SectionCard>
                </motion.div>
              ))}
            </div>

            {/* Right: citations sidebar */}
            <div className="space-y-6">
              <CitationsSidebar
                citations={report.citations}
                activeCitation={activeCitation}
                onSelect={setActiveCitation}
              />
            </div>
          </div>
        )}
      </main>

      {/* Citation detail drawer */}
      <AnimatePresence>
        {activeCitation && (
          <CitationDrawer
            citation={activeCitation}
            onClose={() => setActiveCitation(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Sub-components ── */

function LoadingScreen() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--ink)" }}
    >
      <Loader2
        size={24}
        className="animate-spin"
        style={{ color: "var(--mist)" }}
      />
    </div>
  );
}

function ProgressTracker({
  status,
  stepIdx,
}: {
  status: string;
  stepIdx: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-xl p-6 mb-10"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        <Loader2
          size={16}
          className="animate-spin"
          style={{ color: "var(--gold)" }}
        />
        <span className="text-sm font-mono" style={{ color: "var(--gold)" }}>
          {STEP_LABELS[status] || status}
        </span>
      </div>
      <div className="flex items-center gap-0">
        {STATUS_STEPS.filter((s) => s !== "pending").map((step, i) => {
          const done = stepIdx > STATUS_STEPS.indexOf(step);
          const active = STATUS_STEPS.indexOf(step) === stepIdx;
          return (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className="w-3 h-3 rounded-full transition-all"
                  style={{
                    background: done
                      ? "var(--gold)"
                      : active
                        ? "var(--accent)"
                        : "var(--border)",
                    boxShadow: active ? "0 0 10px var(--accent)" : "none",
                  }}
                />
                <span
                  className="text-xs font-mono mt-2 whitespace-nowrap"
                  style={{
                    color: done || active ? "var(--paper)" : "var(--mist)",
                    fontSize: "0.6rem",
                  }}
                >
                  {step === "researching"
                    ? "Research"
                    : step === "critiquing"
                      ? "Critic"
                      : step === "writing"
                        ? "Writer"
                        : "Done"}
                </span>
              </div>
              {i < STATUS_STEPS.filter((s) => s !== "pending").length - 1 && (
                <div
                  className="flex-1 h-px mx-1"
                  style={{ background: done ? "var(--gold)" : "var(--border)" }}
                />
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function SectionCard({
  heading,
  children,
  accent,
  warning,
}: {
  heading: string;
  children: React.ReactNode;
  accent?: boolean;
  warning?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-6"
      style={{
        background: warning ? "rgba(232,66,52,0.05)" : "var(--surface)",
        border: `1px solid ${warning ? "rgba(232,66,52,0.25)" : accent ? "rgba(201,168,76,0.3)" : "var(--border)"}`,
      }}
    >
      <h2
        className="text-lg font-bold mb-4 pb-3 border-b"
        style={{
          fontFamily: "Playfair Display, serif",
          color: warning
            ? "var(--accent)"
            : accent
              ? "var(--gold)"
              : "var(--paper)",
          borderColor: "var(--border)",
        }}
      >
        {heading}
      </h2>
      {children}
    </div>
  );
}

function ConflictCard({ flag }: { flag: ConflictFlag }) {
  return (
    <div
      className="rounded-lg p-4"
      style={{
        background: "rgba(232,66,52,0.08)",
        border: "1px solid rgba(232,66,52,0.2)",
      }}
    >
      <p className="text-sm font-medium mb-2" style={{ color: "var(--paper)" }}>
        {flag.claim}
      </p>
      <p className="text-xs mb-1" style={{ color: "var(--mist)" }}>
        <span style={{ color: "var(--accent)" }}>Source A:</span>{" "}
        {flag.source_a}
      </p>
      <p className="text-xs mb-2" style={{ color: "var(--mist)" }}>
        <span style={{ color: "var(--accent)" }}>Source B:</span>{" "}
        {flag.source_b}
      </p>
      <p className="text-xs" style={{ color: "var(--mist)" }}>
        {flag.description}
      </p>
    </div>
  );
}

function ReportContent({
  content,
  citations,
  onCitationClick,
}: {
  content: string;
  citations: Citation[];
  onCitationClick: (c: Citation) => void;
}) {
  // Replace [N] patterns with clickable tags
  const parts = content.split(/(\[\d+\])/g);
  return (
    <div
      className="text-sm leading-relaxed space-y-3"
      style={{ color: "rgba(245,243,238,0.85)" }}
    >
      <p>
        {parts.map((part, i) => {
          const match = part.match(/^\[(\d+)\]$/);
          if (match) {
            const citation = citations.find((c) => c.id === part);
            return citation ? (
              <button
                key={i}
                onClick={() => onCitationClick(citation)}
                className="citation-tag"
              >
                {part}
              </button>
            ) : (
              <span key={i} className="citation-tag">
                {part}
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </p>
    </div>
  );
}

function CitationsSidebar({
  citations,
  activeCitation,
  onSelect,
}: {
  citations: Citation[];
  activeCitation: Citation | null;
  onSelect: (c: Citation) => void;
}) {
  return (
    <div className="sticky top-20">
      <p
        className="text-xs font-mono tracking-widest uppercase mb-3"
        style={{ color: "var(--mist)" }}
      >
        {citations.length} Citations
      </p>
      <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-1">
        {citations.map((c) => (
          <motion.div
            key={c.id}
            onClick={() => onSelect(c)}
            className="rounded-lg p-3 cursor-pointer transition-all"
            style={{
              background:
                activeCitation?.id === c.id
                  ? "rgba(201,168,76,0.1)"
                  : "var(--surface)",
              border: `1px solid ${activeCitation?.id === c.id ? "rgba(201,168,76,0.4)" : "var(--border)"}`,
            }}
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex items-start gap-2">
              <span
                className="text-xs font-mono flex-shrink-0 mt-0.5"
                style={{ color: "var(--gold)" }}
              >
                {c.id}
              </span>
              <div className="min-w-0">
                <p
                  className="text-xs leading-snug mb-1.5 line-clamp-2"
                  style={{ color: "var(--paper)" }}
                >
                  {c.title}
                </p>
                <div className="flex items-center gap-2">
                  {c.source_type === "arxiv" ? (
                    <GraduationCap size={10} style={{ color: "var(--gold)" }} />
                  ) : (
                    <Globe size={10} style={{ color: "var(--mist)" }} />
                  )}
                  <span
                    className="text-xs font-mono"
                    style={{ color: "var(--mist)", fontSize: "0.6rem" }}
                  >
                    {c.source_type.toUpperCase()}
                  </span>
                  <div className="flex-1 ml-1" style={{ maxWidth: "60px" }}>
                    <div
                      className="confidence-bar"
                      style={{ width: `${c.confidence_score * 100}%` }}
                    />
                  </div>
                  <span
                    className="text-xs font-mono"
                    style={{ color: "var(--mist)", fontSize: "0.6rem" }}
                  >
                    {Math.round(c.confidence_score * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function CitationDrawer({
  citation,
  onClose,
}: {
  citation: Citation;
  onClose: () => void;
}) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50"
        style={{ background: "rgba(0,0,0,0.6)" }}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl p-6"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          maxHeight: "60vh",
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <span
              className="text-xs font-mono"
              style={{ color: "var(--gold)" }}
            >
              {citation.id}
            </span>
            <h3
              className="text-lg font-bold mt-1"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              {citation.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-sm px-3 py-1 rounded"
            style={{ color: "var(--mist)", background: "var(--border)" }}
          >
            Close
          </button>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5">
            {citation.source_type === "arxiv" ? (
              <GraduationCap size={14} style={{ color: "var(--gold)" }} />
            ) : (
              <Globe size={14} style={{ color: "var(--mist)" }} />
            )}
            <span
              className="text-xs font-mono"
              style={{ color: "var(--mist)" }}
            >
              {citation.source_type.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <BarChart2 size={14} style={{ color: "var(--mist)" }} />
            <span
              className="text-xs font-mono"
              style={{ color: "var(--mist)" }}
            >
              Confidence: {Math.round(citation.confidence_score * 100)}%
            </span>
            <div style={{ width: "80px" }}>
              <div
                className="confidence-bar"
                style={{ width: `${citation.confidence_score * 100}%` }}
              />
            </div>
          </div>
        </div>
        <a
          href={citation.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm hover:underline"
          style={{ color: "var(--accent)" }}
        >
          <ExternalLink size={13} />
          {citation.url}
        </a>
      </motion.div>
    </>
  );
}
