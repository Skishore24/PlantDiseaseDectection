import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, BookOpen, ChevronRight } from "lucide-react";
import { MOCK_KNOWLEDGE_BASE } from "../data/mockData";

const CATEGORIES = [
  { id: "all",       label: "All" },
  { id: "fungal",    label: "Fungal" },
  { id: "bacterial", label: "Bacterial" },
  { id: "viral",     label: "Viral" },
  { id: "healthy",   label: "Healthy" },
];

function badgeClass(cat) {
  switch (cat) {
    case "healthy":   return "badge-success";
    case "fungal":    return "badge-warning";
    case "bacterial": return "badge-danger";
    case "viral":     return "badge-info";
    default:          return "badge-neutral";
  }
}

export default function Knowledge() {
  const [query,    setQuery]    = useState("");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState(null);

  const filtered = MOCK_KNOWLEDGE_BASE.filter((item) => {
    const matchCat = category === "all" || item.category === category;
    const q = query.toLowerCase();
    const matchQ =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.latin.toLowerCase().includes(q) ||
      item.crop.toLowerCase().includes(q) ||
      item.symptoms.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink">Disease Library</h2>
          <p className="text-sm text-ink-muted mt-0.5">
            {MOCK_KNOWLEDGE_BASE.length} verified crop pathogens &amp; conditions
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-ink-disabled absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search diseases or crops…"
            className="input input-lg w-full pl-9"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-disabled hover:text-ink"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              category === cat.id
                ? "bg-brand text-white border-brand shadow-sm"
                : "bg-surface text-ink-muted border-border hover:border-brand-border hover:text-ink"
            }`}
          >
            {cat.label}
          </button>
        ))}

        <span className="ml-auto text-xs text-ink-muted self-center">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="card py-16 text-center">
          <BookOpen className="w-8 h-8 text-ink-disabled mx-auto mb-2" />
          <p className="text-sm text-ink-muted">No diseases match your search.</p>
          <button onClick={() => { setQuery(""); setCategory("all"); }} className="btn btn-ghost btn-sm mt-3 text-brand">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.15 }}
              onClick={() => setSelected(item)}
              className="card-hover p-5 cursor-pointer"
            >
              <div className="flex gap-3 mb-3">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-16 h-16 rounded-lg object-cover border border-border shrink-0"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/images/early_blight_leaf.png";
                  }}
                />
                <div className="flex-1 min-w-0">
                  <span className={`badge ${badgeClass(item.category)} mb-1.5`}>{item.category}</span>
                  <h3 className="text-sm font-semibold text-ink leading-snug">{item.title}</h3>
                  <p className="text-2xs text-ink-muted italic mt-0.5">{item.latin}</p>
                </div>
              </div>

              <p className="text-xs text-ink-body line-clamp-2 leading-relaxed">{item.symptoms}</p>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <span className="text-2xs text-ink-muted truncate max-w-[180px]">
                  {item.crop}
                </span>
                <div className="flex items-center gap-0.5 text-brand text-xs font-medium shrink-0">
                  <span>Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              className="bg-surface rounded-2xl border border-border shadow-xl w-full max-w-xl max-h-[85vh] overflow-y-auto"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-surface">
                <div className="flex items-center gap-3">
                  <img
                    src={selected.image}
                    alt={selected.title}
                    className="w-10 h-10 rounded-lg object-cover border border-border"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/images/early_blight_leaf.png";
                    }}
                  />
                  <div>
                    <span className={`badge ${badgeClass(selected.category)}`}>{selected.category}</span>
                    <h3 className="text-sm font-semibold text-ink mt-0.5">{selected.title}</h3>
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-bg-subtle"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal body */}
              <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-bg-subtle">
                    <p className="text-2xs text-ink-muted font-semibold mb-0.5">Scientific Name</p>
                    <p className="text-xs font-semibold text-ink italic">{selected.latin}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-bg-subtle">
                    <p className="text-2xs text-ink-muted font-semibold mb-0.5">Host Crop</p>
                    <p className="text-xs font-semibold text-ink">{selected.crop}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-bg-subtle">
                    <p className="text-2xs text-ink-muted font-semibold mb-0.5">Severity</p>
                    <span className={`badge ${selected.severityType === "healthy" ? "badge-success" : selected.severityType === "warning" ? "badge-warning" : "badge-danger"}`}>
                      {selected.severity}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-bg-subtle">
                    <p className="text-2xs text-ink-muted font-semibold mb-0.5">Spread</p>
                    <p className="text-xs font-semibold text-ink">{selected.spread}</p>
                  </div>
                </div>

                {[
                  { label: "Symptoms",            content: selected.symptoms },
                  { label: "Organic Treatment",   content: selected.organicTreatment },
                  { label: "Chemical Treatment",  content: selected.chemicalTreatment },
                  { label: "Prevention",          content: selected.prevention },
                ].map((sec) => (
                  <div key={sec.label}>
                    <p className="text-xs font-bold text-ink mb-1.5">{sec.label}</p>
                    <p className="text-sm text-ink-body leading-relaxed">{sec.content}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
