import React, { useState } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";
import { FAQS_DATA } from "../data/faqs";

export default function FAQ() {
  const [openId, setOpenId] = useState(null);

  const toggleFaq = (id) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="faq" className="mb-12 scroll-mt-24">
      {/* Section Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">
          <HelpCircle className="w-4 h-4" />
          <span>Diagnostic &amp; Operations Guide</span>
        </div>
        <h2 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white tracking-tight">
          Frequently Asked Questions
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xl mt-1">
          Agronomic diagnostic guidance for farmers, agronomists, and home growers
        </p>
      </div>

      {/* Accordion Stack */}
      <div className="space-y-4 max-w-3xl">
        {FAQS_DATA.map((faq) => {
          const isOpen = openId === faq.id;

          return (
            <div
              key={faq.id}
              className={`rounded-2xl glass-card border transition-all overflow-hidden ${
                isOpen
                  ? "border-emerald-500/50 bg-emerald-50/40 dark:bg-slate-900/80 shadow-md"
                  : "border-slate-200 dark:border-slate-800/80 hover:border-emerald-500/30"
              }`}
            >
              <button
                onClick={() => toggleFaq(faq.id)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 font-display font-bold text-slate-900 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${
                    isOpen ? "rotate-180 text-emerald-500" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed border-t border-slate-200/80 dark:border-slate-800/60 pt-4">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
