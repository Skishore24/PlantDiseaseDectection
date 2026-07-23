import React, { useState, useEffect } from "react";
import { Search, Trash2, Download, Calendar, Leaf, Clock, X, RefreshCw } from "lucide-react";
import { fetchHistory } from "../utils/api";
import { generatePDFReport } from "../utils/pdfExport";

const FILTERS = [
  { id: "all",    label: "All Scans" },
  { id: "high",   label: "High Confidence (≥90%)" },
  { id: "medium", label: "Medium (70–89%)" },
  { id: "low",    label: "Low (<70%)" },
];

export default function History() {
  const [history,   setHistory]   = useState([]);
  const [query,     setQuery]     = useState("");
  const [filter,    setFilter]    = useState("all");
  const [sortBy,    setSortBy]    = useState("date");
  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const mongoRecords = await fetchHistory(50);
      setHistory(mongoRecords);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filtered = history
    .filter((item) => {
      const dName  = item.disease || "";
      const matchQ = !query || dName.toLowerCase().includes(query.toLowerCase());
      const conf   = item.confidence || 0;
      const matchF =
        filter === "all"    ? true :
        filter === "high"   ? conf >= 90 :
        filter === "medium" ? conf >= 70 && conf < 90 :
        filter === "low"    ? conf < 70 : true;
      return matchQ && matchF;
    })
    .sort((a, b) => {
      if (sortBy === "confidence") return (b.confidence || 0) - (a.confidence || 0);
      if (sortBy === "name")       return (a.disease || "").localeCompare(b.disease || "");
      return 0;
    });

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-ink">Scan History</h2>
          <p className="text-sm text-ink-muted mt-0.5">
            {history.length} diagnostic record{history.length !== 1 ? "s" : ""} in MongoDB Atlas database
          </p>
        </div>

        <button
          onClick={loadHistory}
          className="btn btn-secondary btn-sm gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Database
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-ink-disabled absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by disease name…"
            className="input input-lg w-full pl-9"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-disabled hover:text-ink">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-2 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
                filter === f.id
                  ? "bg-brand text-white border-brand shadow-sm"
                  : "bg-surface text-ink-muted border-border hover:border-brand-border"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="input shrink-0 w-auto font-medium"
        >
          <option value="date">Sort by Date</option>
          <option value="confidence">Sort by Confidence</option>
          <option value="name">Sort by Name</option>
        </select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="card py-16 text-center">
          <RefreshCw className="w-8 h-8 text-brand animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-ink">Loading MongoDB Scan Records…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card py-16 text-center">
          <Clock className="w-10 h-10 text-ink-disabled mx-auto mb-3" />
          <p className="text-sm font-semibold text-ink">
            {history.length === 0 ? "No scan history recorded in database yet." : "No results match your filter."}
          </p>
          <p className="text-xs text-ink-muted mt-1">Upload a leaf photo on the Diagnose page to run AI diagnosis.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item, idx) => {
            const diseaseStr = item.disease || "Unknown Disease";
            const healthy = diseaseStr.toLowerCase().includes("healthy");
            const conf    = Math.round(item.confidence || 0);
            const timestampStr = item.scanned_at || item.timestamp || "";
            const imgUrl = item.img_url || (item.img_path ? `/uploads/${item.img_path}` : null);
            const confBadge =
              conf >= 90 ? "badge-success" :
              conf >= 70 ? "badge-warning" :
              "badge-danger";

            return (
              <div key={idx} className="card-hover p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{timestampStr ? new Date(timestampStr).toLocaleString() : "Recent"}</span>
                  </div>
                  <span className={`badge ${confBadge}`}>{conf}% match</span>
                </div>

                <div className="flex items-center gap-3">
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={diseaseStr}
                      className="w-12 h-12 rounded-lg object-cover border border-border shrink-0"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      healthy ? "bg-success-bg" : "bg-danger-bg"
                    }`}>
                      <Leaf className={`w-5 h-5 ${healthy ? "text-success" : "text-danger"}`} strokeWidth={2} />
                    </div>
                  )}
                  <h4 className="text-sm font-bold text-ink leading-snug">
                    {diseaseStr.replace(/__/g, " ").replace(/_/g, " ")}
                  </h4>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
                  <button
                    onClick={() => generatePDFReport(item)}
                    className="flex items-center gap-1.5 text-xs font-bold text-brand hover:underline"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export PDF Report
                  </button>
                  <span className="text-2xs font-mono text-ink-muted">PyTorch CUDA Sync</span>
                </div>
              </div>
            );
          })}

        </div>
      )}

    </div>
  );
}
