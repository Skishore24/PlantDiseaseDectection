import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Scan, Trash2, Download, Search, Filter,
  CheckCircle2, AlertTriangle, Leaf, Calendar,
  ArrowUpDown, Eye, X, CheckSquare, Square,
  Clock, RefreshCw
} from "lucide-react";
import { fetchHistory, deleteHistoryItem, deleteHistoryBatch, clearAllHistory } from "../utils/api";
import { generatePDFReport } from "../utils/pdfExport";

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all"); // 'all' | 'healthy' | 'diseased'
  const [selectedIds, setSelectedIds] = useState([]);
  const [modalItem, setModalItem] = useState(null);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await fetchHistory(100);
      setHistory(data);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleDeleteOne = async (id, e) => {
    e?.stopPropagation();
    if (!confirm("Are you sure you want to delete this scan record?")) return;
    const ok = await deleteHistoryItem(id);
    if (ok) {
      setHistory((prev) => prev.filter((item) => (item.id || item._id) !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      if (modalItem?.id === id) setModalItem(null);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} selected records?`)) return;
    const ok = await deleteHistoryBatch(selectedIds);
    if (ok) {
      setHistory((prev) => prev.filter((item) => !selectedIds.includes(item.id || item._id)));
      setSelectedIds([]);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear your ENTIRE scan history? This action cannot be undone.")) return;
    const ok = await clearAllHistory();
    if (ok) {
      setHistory([]);
      setSelectedIds([]);
      setModalItem(null);
    }
  };

  const toggleSelect = (id, e) => {
    e?.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((item) => item.id || item._id));
    }
  };

  const filteredItems = history.filter((item) => {
    const p = (item.plant || "").toLowerCase();
    const d = (item.disease || "").toLowerCase();
    const s = search.toLowerCase();
    const matchesSearch = p.includes(s) || d.includes(s);

    const isHealthy = d.includes("healthy") || (item.severity || "").toLowerCase() === "optimal health";
    if (filterType === "healthy") return matchesSearch && isHealthy;
    if (filterType === "diseased") return matchesSearch && !isHealthy;
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink">Diagnosis History</h2>
          <p className="text-sm text-ink-muted mt-0.5">
            Cloud-synced archive of your historical plant leaf diagnoses and agronomic reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBatchDelete}
              className="btn btn-danger btn-sm gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selected ({selectedIds.length})
            </button>
          )}

          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              className="btn btn-ghost btn-sm text-danger hover:bg-danger-bg gap-1.5"
            >
              Clear All
            </button>
          )}

          <Link to="/predict" className="btn btn-primary btn-sm gap-1.5">
            <Scan className="w-3.5 h-3.5" />
            New Scan
          </Link>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="card p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <input
            type="text"
            placeholder="Search crop or disease name (e.g. Tomato, Blight, Apple)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {["all", "diseased", "healthy"].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all ${
                filterType === t
                  ? "bg-brand text-white border-brand shadow-xs"
                  : "bg-surface text-ink-muted border-border hover:text-ink"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table / List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <RefreshCw className="w-8 h-8 text-brand animate-spin mb-3" />
            <p className="text-sm font-semibold text-ink">Loading history records…</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 text-center">
            <Leaf className="w-12 h-12 text-ink-disabled mx-auto mb-3" />
            <h3 className="text-base font-bold text-ink mb-1">No Scan Records Found</h3>
            <p className="text-xs text-ink-muted max-w-sm mx-auto mb-5 leading-relaxed">
              {search || filterType !== "all"
                ? "No diagnostic records matched your filter criteria."
                : "You have not performed any leaf scans yet. Analyze your first plant leaf to get started."}
            </p>
            <Link to="/predict" className="btn btn-primary btn-sm">
              Start Diagnosis
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-bg-subtle border-b border-border text-ink-muted font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 w-10 text-center">
                    <button onClick={selectAll} className="text-ink hover:text-brand">
                      {selectedIds.length === filteredItems.length && filteredItems.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-brand" />
                      ) : (
                        <Square className="w-4 h-4 text-ink-muted" />
                      )}
                    </button>
                  </th>
                  <th className="p-3.5">Crop &amp; Disease</th>
                  <th className="p-3.5">Severity</th>
                  <th className="p-3.5">Confidence</th>
                  <th className="p-3.5">Date Scanned</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredItems.map((item) => {
                  const itemId = item.id || item._id;
                  const isSelected = selectedIds.includes(itemId);
                  const isHealthy = (item.disease || "").toLowerCase().includes("healthy");
                  const conf = Math.round(item.confidence || 0);

                  return (
                    <tr
                      key={itemId}
                      onClick={() => setModalItem(item)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-brand-light/30" : "hover:bg-bg-subtle"
                      }`}
                    >
                      <td className="p-3.5 text-center" onClick={(e) => toggleSelect(itemId, e)}>
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-brand" />
                        ) : (
                          <Square className="w-4 h-4 text-ink-muted" />
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isHealthy ? "bg-success-bg text-success" : "bg-danger-bg text-danger"
                          }`}>
                            <Leaf className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-ink">{item.plant || "Plant"} — {item.disease || "Condition"}</div>
                            <div className="text-2xs text-ink-muted font-mono">{item.class_name || "Leaf diagnosis"}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className={`badge ${
                          isHealthy ? "badge-success" : item.severity === "Critical" ? "badge-danger" : "badge-warning"
                        }`}>
                          {item.severity || (isHealthy ? "Optimal Health" : "Moderate")}
                        </span>
                      </td>

                      <td className="p-3.5 font-mono font-bold text-ink">
                        {conf}%
                      </td>

                      <td className="p-3.5 text-ink-muted">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : "Recent"}
                      </td>

                      <td className="p-3.5 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => generatePDFReport(item)}
                          className="p-1.5 rounded-lg text-ink-muted hover:text-brand hover:bg-surface"
                          title="Export PDF Report"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteOne(itemId, e)}
                          className="p-1.5 rounded-lg text-ink-muted hover:text-danger hover:bg-surface"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {modalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Leaf className="w-5 h-5 text-brand" />
                <h3 className="text-base font-bold text-ink">Diagnosis Summary</h3>
              </div>
              <button onClick={() => setModalItem(null)} className="p-1 text-ink-muted hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-bg-subtle border border-border space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-2xs font-bold text-ink-muted uppercase">Plant</span>
                <span className="text-xs font-bold text-ink">{modalItem.plant}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-2xs font-bold text-ink-muted uppercase">Identified Condition</span>
                <span className="text-xs font-bold text-ink">{modalItem.disease}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-2xs font-bold text-ink-muted uppercase">Confidence</span>
                <span className="text-xs font-mono font-bold text-brand">{modalItem.confidence}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-2xs font-bold text-ink-muted uppercase">Severity</span>
                <span className="text-xs font-bold text-ink">{modalItem.severity || "Moderate"}</span>
              </div>
            </div>

            {modalItem.disease_info?.description && (
              <div>
                <h4 className="text-xs font-bold text-ink uppercase mb-1">Description</h4>
                <p className="text-xs text-ink-body leading-relaxed">{modalItem.disease_info.description}</p>
              </div>
            )}

            {modalItem.disease_info?.treatment && modalItem.disease_info.treatment.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-ink uppercase mb-1">Treatment Steps</h4>
                <ul className="space-y-1">
                  {modalItem.disease_info.treatment.map((t, idx) => (
                    <li key={idx} className="text-xs text-ink flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand shrink-0 mt-0.5" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button onClick={() => setModalItem(null)} className="btn btn-secondary btn-sm">
                Close
              </button>
              <button onClick={() => generatePDFReport(modalItem)} className="btn btn-primary btn-sm gap-1.5">
                <Download className="w-3.5 h-3.5" />
                Export PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
