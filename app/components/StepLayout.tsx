import React, { useState } from "react";
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
  HelpCircle,
  X,
} from "lucide-react";

const glossaryTerms: { term: string; definition: string }[] = [
  { term: "Algorithm", definition: "A set of step-by-step instructions a computer follows to find patterns in patient data and make predictions — like a fast, data-driven decision checklist." },
  { term: "Training Data", definition: "Historical patient records the model learns from. Similar to a doctor reviewing past cases before seeing new patients." },
  { term: "Test Data", definition: "Patients the model has never seen, used to measure how well the AI performs. If a model only works on training data, it has memorised rather than learned." },
  { term: "Features", definition: "The input measurements (columns in your data) used to make predictions — for example, age, blood pressure, creatinine level, smoking status." },
  { term: "Target Variable", definition: "The outcome the model is trying to predict — for example, readmission, diagnosis, survival, or disease stage." },
  { term: "Overfitting", definition: "When a model memorises the training cases so precisely that it fails on new patients. Like a student who memorises exam answers but cannot apply the knowledge." },
  { term: "Underfitting", definition: "When a model is too simple to learn anything useful. Like a clinician who gives the same diagnosis regardless of symptoms." },
  { term: "Normalisation", definition: "Adjusting all measurements to the same scale so no single measurement dominates because of its units. Age (0–100) and a troponin level (0–50,000) must be rescaled before they can be compared fairly." },
  { term: "Class Imbalance", definition: "When one outcome is much rarer than the other in the training data. A model trained on 95% negative cases may simply predict negative for everyone and appear 95% accurate — but miss all real cases." },
  { term: "SMOTE", definition: "Synthetic Minority Over-sampling Technique. Creates artificial examples of the rare outcome to balance the training data. Applied to training data only — never to test patients." },
  { term: "Sensitivity", definition: "Of all patients who truly have the condition, what fraction did the model correctly identify? Low sensitivity means the model misses real cases. Critical in any screening application." },
  { term: "Specificity", definition: "Of all patients who truly do not have the condition, what fraction did the model correctly call healthy? Low specificity means too many false alarms." },
  { term: "Precision", definition: "Of all patients the model flagged as positive, what fraction actually were? Low precision means many unnecessary referrals or treatments." },
  { term: "F1 Score", definition: "A single number that balances Sensitivity and Precision. Useful when both false negatives and false positives have real clinical costs." },
  { term: "AUC-ROC", definition: "A score from 0.5 (random guessing) to 1.0 (perfect separation) summarising how well the model distinguishes between positive and negative patients. Above 0.8 is considered good." },
  { term: "Confusion Matrix", definition: "A 2×2 table showing: correctly identified sick patients, correctly identified healthy patients, healthy patients incorrectly flagged as sick, and sick patients incorrectly called safe." },
  { term: "Feature Importance", definition: "A ranking of which patient measurements the model relied on most. Helps confirm whether the AI is using clinically meaningful signals." },
  { term: "Hyperparameter", definition: "A setting chosen before training that controls model behaviour — for example, K in KNN or tree depth in Decision Tree. Not learned from data; set by the user via sliders." },
  { term: "Bias (AI)", definition: "When a model performs significantly worse for certain patient subgroups (for example, older patients, women, or ethnic minorities) because they were under-represented in the training data." },
  { term: "Cross-Validation", definition: "Splitting the data multiple times and averaging results to get a more reliable performance estimate than a single train/test split." },
];

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
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Glossary Modal */}
      {glossaryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setGlossaryOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-[16px] font-semibold text-slate-900">Glossary — Key Terms Explained</h2>
              <button onClick={() => setGlossaryOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-4 space-y-4">
              {glossaryTerms.map((g) => (
                <div key={g.term} className="border-b border-slate-100 pb-3 last:border-0">
                  <div className="text-[13px] font-bold text-slate-800 mb-1">{g.term}</div>
                  <div className="text-[12px] text-slate-600 leading-relaxed">{g.definition}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[15px] text-slate-900 leading-tight">ML Clinical Visualizer</h1>
            <p className="text-[11px] text-slate-400 leading-tight">For Healthcare Professionals</p>
          </div>
        </div>
        <button
          onClick={() => setGlossaryOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-[13px] cursor-pointer transition"
        >
          <HelpCircle className="w-4 h-4" />
          Help
        </button>
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
