import React, { useState } from "react";
import { Search, BookOpen, ChevronRight, Info, Music, Play } from "lucide-react";
import { KNOWLEDGE_BASE_DATA } from "../data/knowledgeBase";

export default function KnowledgeBase({ onSelectDisease }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredItems = KNOWLEDGE_BASE_DATA.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.latin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.crop.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <section id="library" className="mb-12 scroll-mt-24">
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">
            <BookOpen className="w-4 h-4" />
            <span>Statify Pathomics Library</span>
          </div>
          <h2 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white tracking-tight">
            Disease Knowledge Base
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xl mt-1">
            Search and explore verified crop disease tracks, symptoms, and agronomic treatment protocols
          </p>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search diseases or pathogens…"
              className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1 p-1 rounded-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
            {["all", "fungal", "bacterial", "viral", "healthy"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all capitalize ${
                  selectedCategory === cat
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Track Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => {
          const isCritical = item.severityType === "critical";
          const isWarning = item.severityType === "warning";

          return (
            <div
              key={item.id}
              onClick={() => onSelectDisease(item)}
              className="p-6 rounded-3xl glass-card glass-card-hover border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between cursor-pointer transition-all hover:-translate-y-1 group"
            >
              <div>
                {/* Header Category Tag */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full border ${
                      isCritical
                        ? "bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-600/50 text-rose-700 dark:text-rose-300"
                        : isWarning
                        ? "bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-600/50 text-amber-700 dark:text-amber-300"
                        : "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-600/50 text-emerald-700 dark:text-emerald-300"
                    }`}
                  >
                    {item.category}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono italic">{item.crop}</span>
                </div>

                {/* Disease Title & Latin Name */}
                <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center justify-between">
                  <span>{item.title}</span>
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 shadow-md">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-serif italic mb-3">{item.latin}</p>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed mb-4">
                  {item.description}
                </p>
              </div>

              {/* Card Footer Treatment Tag */}
              <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/60 flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/30 truncate max-w-[200px]">
                  {item.treatment}
                </span>

                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all shrink-0" />
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">No plant disease tracks found matching your search.</p>
        </div>
      )}
    </section>
  );
}
