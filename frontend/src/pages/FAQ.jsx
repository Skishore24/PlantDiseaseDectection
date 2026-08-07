import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle, Search } from "lucide-react";
import { MOCK_FAQS } from "../data/mockData";

export default function FAQ() {
  const [openId, setOpenId]   = useState("faq-1");
  const [query,  setQuery]    = useState("");

  const filtered = MOCK_FAQS.filter((f) =>
    !query ||
    f.question.toLowerCase().includes(query.toLowerCase()) ||
    f.answer.toLowerCase().includes(query.toLowerCase()) ||
    f.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="text-center pb-2">
        <div className="inline-flex items-center gap-1.5 badge badge-brand mb-3">
          <HelpCircle className="w-3 h-3" />
          Help Center
        </div>
        <h2 className="text-3xl font-bold text-ink tracking-tight">Frequently Asked Questions</h2>
        <p className="text-sm text-ink-muted mt-2 leading-relaxed">
          Answers about AI diagnosis, image capture, treatment protocols, and PDF reports.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-ink-disabled absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search questions…"
          className="input input-lg w-full pl-9"
        />
      </div>

      {/* Accordion */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="card py-12 text-center">
            <HelpCircle className="w-8 h-8 text-ink-disabled mx-auto mb-2" />
            <p className="text-sm text-ink-muted">No questions match your search.</p>
          </div>
        ) : (
          filtered.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className={`card overflow-hidden transition-all duration-150 ${
                  isOpen ? "border-brand-border shadow-sm" : ""
                }`}
              >
                <button
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="badge badge-brand shrink-0">{faq.category}</span>
                    <span className="text-sm font-semibold text-ink">{faq.question}</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-ink-muted shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-brand" : ""
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18, ease: "easeInOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className="px-5 pb-5 pt-1 border-t border-border">
                        <p className="text-sm text-ink-body leading-relaxed">{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      {/* Still need help */}
      <div className="card p-6 text-center bg-brand-light border-brand-border">
        <h4 className="text-sm font-semibold text-success-text mb-1">Still have questions?</h4>
        <p className="text-xs text-success-text/80 mb-3">
          Contact our agronomic support team for tailored guidance.
        </p>
        <a
          href="mailto:kishoresenthil2405@gmail.com"
          className="btn btn-sm inline-flex"
          style={{ backgroundColor: "#16A34A", color: "#FFF" }}
        >
          Contact Support
        </a>
      </div>

    </div>
  );
}
