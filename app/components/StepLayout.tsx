import React from "react";
import { useML } from "./MLContext";
import {
  Stethoscope,
  Database,
  Settings2,
  Brain,
  BarChart3,
  Lightbulb,
  Scale,
  Check,
  Activity,
  AlertCircle,
} from "lucide-react";

const steps = [
  { label: "Clinical Context", icon: Stethoscope },
  { label: "Data Exploration", icon: Database },
  { label: "Data Preparation", icon: Settings2 },
  { label: "Model & Parameters", icon: Brain },
  { label: "Results", icon: BarChart3 },
  { label: "Explainability", icon: Lightbulb },
  { label: "Ethics & Bias", icon: Scale },
];

interface StepLayoutProps {
  children: React.ReactNode;
}

export function StepLayout({ children }: StepLayoutProps) {
  const { currentStep, goToStep, accessWarning, clearAccessWarning } = useML();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[15px] text-slate-900 leading-tight">ML Clinical Visualizer</h1>
            <p className="text-[11px] text-slate-400 leading-tight">For Healthcare Professionals</p>
          </div>
        </div>
      </header>
      
      {accessWarning && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 shrink-0 flex items-center justify-center gap-2 text-red-700 text-[13px] font-medium transition-all">
          <AlertCircle className="w-4 h-4" />
          {accessWarning.msg}
          <button onClick={clearAccessWarning} className="ml-4 text-red-500 hover:text-red-800 cursor-pointer">✕</button>
        </div>
      )}

      {/* Step Navigation */}
      <nav className="bg-white border-b border-slate-200 px-2 py-2 shrink-0 overflow-x-auto">
        <div className="flex items-center gap-1 max-w-6xl mx-auto min-w-max">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isActive = currentStep === i;
            const isCompleted = currentStep > i;

            return (
              <React.Fragment key={i}>
                {i > 0 && (
                  <div
                    className={`hidden sm:block h-px w-4 lg:w-8 shrink-0 ${
                      isCompleted ? "bg-teal-400" : "bg-slate-200"
                    }`}
                  />
                )}
                <button
                  onClick={() => goToStep(i)}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                      : isCompleted
                      ? "text-teal-700 hover:bg-teal-50"
                      : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : isCompleted
                        ? "bg-teal-500 text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <span className="text-[11px]">{i + 1}</span>
                    )}
                  </div>
                  <span className="text-[13px] hidden md:inline whitespace-nowrap">
                    {step.label}
                  </span>
                  <Icon className="w-4 h-4 md:hidden" />
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-4 py-6">{children}</div>
      </main>

      {/* Footer Nav */}
      <footer className="bg-white border-t border-slate-200 px-4 py-3 flex items-center justify-between shrink-0">
        <button
          onClick={() => goToStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="px-4 py-2 text-[13px] rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
        >
          ← Previous
        </button>
        <span className="text-[12px] text-slate-400">
          Step {currentStep + 1} of 7
        </span>
        <button
          onClick={() => goToStep(Math.min(6, currentStep + 1))}
          disabled={currentStep === 6}
          className="px-4 py-2 text-[13px] rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
        >
          Next →
        </button>
      </footer>
    </div>
  );
}
