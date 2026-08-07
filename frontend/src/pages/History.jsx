import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, Trash2, Download, Calendar, Leaf, Clock, X, RefreshCw, AlertTriangle, CheckSquare, Square } from "lucide-react";
import { fetchHistory, deleteHistoryItem, deleteHistoryBatch, clearAllHistory } from "../utils/api";
import { generatePDFReport } from "../utils/pdfExport";

const FILTERS = [
  { id: "all",    label: "All Scans" },
  { id: "high",   label: "High Confidence (≥90%)" },
  { id: "medium", label: "Medium (70–89%)" },
  { id: "low",    label: "Low (<70%)" },
];

export default function History() {
  const [history,      setHistory]      = useState([]);
  const [query,        setQuery]        = useState("");
  const [filter,       setFilter]       = useState("all");
  const [sortBy,       setSortBy]       = useState("date");
  const [isLoading,    setIsLoading]    = useState(true);
  const [selectedIds,  setSelectedIds]  = useState(new Set());
  const [confirmModal, setConfirmModal] = useState(null); // null | { type: "single"|"selected"|"all", id?: string }

  const getItemId = (item, idx) => item._id || item.id || `${item.disease}-${item.scanned_at || item.timestamp || idx}`;

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

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      const newSet = new Set();
      filtered.forEach((item, idx) => newSet.add(getItemId(item, idx)));
      setSelectedIds(newSet);
    }
  };

  const toggleSelectItem = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal) return;

    if (confirmModal.type === "all") {
      setHistory([]);
      setSelectedIds(new Set());
      localStorage.removeItem("plant_scans");
      await clearAllHistory();
    } else if (confirmModal.type === "selected") {
      const idsToDelete = Array.from(selectedIds);
      setHistory((prev) => prev.filter((item, idx) => !selectedIds.has(getItemId(item, idx))));
      setSelectedIds(new Set());
      await deleteHistoryBatch(idsToDelete);
    } else if (confirmModal.type === "single") {
      const targetId = confirmModal.id;
      setHistory((prev) => prev.filter((item, idx) => getItemId(item, idx) !== targetId));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
      await deleteHistoryItem(targetId);
    }

    setConfirmModal(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-ink">Scan History</h2>
          <p className="text-sm text-ink-muted mt-0.5">
            {history.length} diagnostic record{history.length !== 1 ? "s" : ""} in database
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadHistory}
            className="btn btn-secondary btn-sm gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Database
          </button>
          {history.length > 0 && (
            <button
              onClick={() => setConfirmModal({ type: "all" })}
              className="btn btn-danger btn-sm gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear History
            </button>
          )}
        </div>
      </div>

      {/* Selection Action Bar (when items are selected) */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-brand-light border border-brand-border animate-fade-in">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-xs font-bold text-success-text"
            >
              {selectedIds.size === filtered.length && filtered.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-brand" />
              ) : (
                <Square className="w-4 h-4 text-ink-muted" />
              )}
              <span>{selectedIds.size} of {filtered.length} selected</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="btn btn-ghost btn-sm text-ink-muted hover:text-ink"
            >
              Deselect All
            </button>
            <button
              onClick={() => setConfirmModal({ type: "selected" })}
              className="btn btn-danger btn-sm gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selected ({selectedIds.size})
            </button>
          </div>
        </div>
      )}

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
          <p className="text-sm font-semibold text-ink">Loading Scan Records…</p>
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
            const id = getItemId(item, idx);
            const isSelected = selectedIds.has(id);
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
              <div
                key={id}
                className={`card-hover p-5 flex flex-col gap-3 transition-all relative ${
                  isSelected ? "border-brand ring-1 ring-brand bg-brand-light/30" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectItem(id)}
                      className="w-4 h-4 accent-brand rounded cursor-pointer"
                    />
                    <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{timestampStr ? new Date(timestampStr).toLocaleString() : "Recent"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`badge ${confBadge}`}>{conf}% match</span>
                    <button
                      type="button"
                      onClick={() => setConfirmModal({ type: "single", id })}
                      className="p-1 rounded text-ink-muted hover:text-danger hover:bg-danger-bg transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
                  <span className="text-2xs font-mono text-ink-muted">Auto Sync</span>
                </div>
              </div>
            );
          })}

        </div>
      )}

      {/* Confirmation Modal Popup Portal */}
      {confirmModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl relative space-y-4 animate-slide-up">
            <button
              type="button"
              onClick={() => setConfirmModal(null)}
              className="absolute top-4 right-4 p-1.5 text-ink-muted hover:text-ink hover:bg-bg-subtle rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-danger-bg text-danger border border-danger-border flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink">
                  {confirmModal.type === "all"
                    ? "Clear Entire Scan History?"
                    : confirmModal.type === "selected"
                    ? `Delete ${selectedIds.size} Selected Record${selectedIds.size > 1 ? "s" : ""}?`
                    : "Delete Scan Record?"}
                </h3>
                <p className="text-xs text-ink-muted mt-0.5">This action requires confirmation</p>
              </div>
            </div>

            <p className="text-xs text-ink-body leading-relaxed">
              {confirmModal.type === "all"
                ? `Are you sure you want to permanently delete ALL ${history.length} diagnostic records? This action cannot be undone.`
                : confirmModal.type === "selected"
                ? `Are you sure you want to delete ${selectedIds.size} selected scan record(s)? This action cannot be undone.`
                : "Are you sure you want to delete this scan record? This action cannot be undone."}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="btn btn-danger btn-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {confirmModal.type === "all"
                  ? "Yes, Clear All History"
                  : confirmModal.type === "selected"
                  ? `Yes, Delete Selected (${selectedIds.size})`
                  : "Yes, Delete Record"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

