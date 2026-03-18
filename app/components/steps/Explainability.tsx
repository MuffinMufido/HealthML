import React, { useState } from "react";
import { useML } from "../MLContext";
import { ArrowRight, AlertTriangle, Lightbulb } from "lucide-react";

const globalFeatures = [
  { label: "Ejection Fraction", value: 0.28, pct: "82%" },
  { label: "Serum Creatinine", value: 0.22, pct: "66%" },
  { label: "Age", value: 0.17, pct: "54%" },
  { label: "Time in Hospital", value: 0.13, pct: "40%" },
  { label: "Serum Sodium", value: 0.09, pct: "28%" },
  { label: "Smoking Status", value: 0.05, pct: "16%" },
];

const patientExplanations = {
  "47": {
    id: 47,
    summary: "Patient #47 · Age 71 · Ejection Fraction 20% · Prediction: HIGH RISK (78%)",
    risk: "HIGH RISK",
    prob: "78%",
    bars: [
      { label: "↑ EF very low (20%)", val: "+0.24", pct: "80%", type: "bad" },
      { label: "↑ Age 71", val: "+0.16", pct: "58%", type: "bad" },
      { label: "↑ Creatinine 2.1", val: "+0.12", pct: "46%", type: "bad" },
      { label: "↓ Non-smoker", val: "-0.05", pct: "20%", type: "good" },
      { label: "↓ Sodium normal", val: "-0.03", pct: "14%", type: "good" },
    ],
    info: "What if this patient's creatinine were 1.2 instead of 2.1? The predicted risk would drop to approximately 61%. This kind of thinking helps assess which interventions might help."
  },
  "12": {
    id: 12,
    summary: "Patient #12 · Age 45 · Ejection Fraction 55% · Prediction: LOW RISK (21%)",
    risk: "LOW RISK",
    prob: "21%",
    bars: [
      { label: "↓ EF normal (55%)", val: "-0.28", pct: "85%", type: "good" },
      { label: "↓ Age 45", val: "-0.18", pct: "60%", type: "good" },
      { label: "↓ Creatinine 0.9", val: "-0.10", pct: "40%", type: "good" },
      { label: "↑ Smoker", val: "+0.06", pct: "25%", type: "bad" },
      { label: "↓ Sodium normal", val: "-0.02", pct: "10%", type: "good" },
    ],
    info: "This patient is generally healthy with a normal Ejection Fraction, which strongly drives the low risk prediction."
  },
  "93": {
    id: 93,
    summary: "Patient #93 · Age 62 · Ejection Fraction 38% · Prediction: MODERATE (51%)",
    risk: "MODERATE",
    prob: "51%",
    bars: [
      { label: "↑ EF reduced (38%)", val: "+0.14", pct: "50%", type: "bad" },
      { label: "↑ Age 62", val: "+0.08", pct: "30%", type: "bad" },
      { label: "↓ Creatinine 1.1", val: "-0.04", pct: "15%", type: "good" },
      { label: "↓ Non-smoker", val: "-0.05", pct: "20%", type: "good" },
      { label: "↑ Sodium low", val: "+0.07", pct: "25%", type: "bad" },
    ],
    info: "A borderline case driven by moderately reduced Ejection Fraction and slightly low sodium levels. Closer monitoring might be recommended."
  }
};

export function Explainability() {
  const { trained, goToStep } = useML();
  const [selectedPatientId, setSelectedPatientId] = useState<"47" | "12" | "93">("47");

  if (!trained) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-400" />
        <h3 className="text-slate-700">No model trained yet</h3>
        <p className="text-[14px] text-slate-500 max-w-md">
          Go back to Step 4 and train a model first so we have predictions to explain.
        </p>
        <button
          onClick={() => goToStep(4)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer text-[14px]"
        >
          Go to Model & Parameters
        </button>
      </div>
    );
  }

  const pInfo = patientExplanations[selectedPatientId];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-slate-900 mb-1">Step 6: Explainability — Why Did the Model Make This Prediction?</h2>
          <p className="text-[14px] text-slate-500 max-w-3xl">
            A model that cannot explain itself should not be trusted in clinical settings. Here we look at which patient measurements were most important, and why a specific patient was flagged as high risk.
          </p>
        </div>
        <button
          onClick={() => goToStep(6)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer text-[14px]"
        >
          Next Step
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left Column: Global & Select */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-slate-900 font-medium pb-2 border-b border-slate-100">Most Important Patient Measurements (Overall)</h3>

            <div className="space-y-3">
              {globalFeatures.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-[120px] text-right text-[12px] text-slate-600 shrink-0 font-medium">{f.label}</div>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: f.pct }}></div>
                  </div>
                  <div className="w-[30px] text-[12px] text-slate-500 font-mono text-right">{f.value.toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl mt-6">
              <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-[13px] text-blue-900">
                <span className="font-bold">Clinical sense check:</span> Ejection fraction (how well the heart pumps) and creatinine (kidney function) are the top predictors. This makes strong clinical sense — both are established readmission risk factors in heart failure.
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-slate-900 font-medium">Single Patient Explanation</h3>

            <div className="space-y-2">
              <label className="text-[13px] font-medium text-slate-700 block">Select a Test Patient</label>
              <select
                className="w-full text-[14px] border border-slate-300 rounded-lg p-2.5 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value as "47" | "12" | "93")}
              >
                <option value="47">Patient #47 · Age 71 · Ejection Fraction 20% · Prediction: HIGH RISK (78%)</option>
                <option value="12">Patient #12 · Age 45 · Ejection Fraction 55% · Prediction: LOW RISK (21%)</option>
                <option value="93">Patient #93 · Age 62 · Ejection Fraction 38% · Prediction: MODERATE (51%)</option>
              </select>
            </div>

            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition cursor-pointer text-[14px]">
              Explain This Patient <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: SHAP / Waterfall approximation */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-slate-900 font-medium pb-2 border-b border-slate-100">
              Why Was Patient #{pInfo.id} Flagged as {pInfo.risk}? ({pInfo.prob} probability)
            </h3>
            <p className="text-[12px] text-slate-500">
              Each bar shows how much a measurement pushed the prediction toward or away from readmission. The longer the bar, the stronger the effect.
            </p>

            <div className="space-y-4 pt-2">
              {pInfo.bars.map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-[140px] text-right text-[12px] shrink-0 font-medium ${b.type === 'bad' ? 'text-red-600' : 'text-green-600'}`}>
                    {b.label}
                  </div>
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                    {/* Aligning left/right visually based on type, mimicking the HTML */}
                    {b.type === 'bad' ? (
                      <>
                        <div className="w-1/2 bg-transparent"></div>
                        <div className="bg-red-500 rounded-r-full" style={{ width: `calc(${b.pct} / 2)` }}></div>
                      </>
                    ) : (
                      <>
                        <div className="flex-1"></div>
                        <div className="bg-teal-500 rounded-l-full" style={{ width: `calc(${b.pct} / 2)` }}></div>
                        <div className="w-1/2 bg-transparent"></div>
                      </>
                    )}
                  </div>
                  <div className={`w-[45px] text-[12px] font-mono text-right ${b.type === 'bad' ? 'text-red-600' : 'text-green-600'}`}>
                    {b.val}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl mt-6">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              <div className="text-[13px] text-red-900">
                <span className="font-bold">Important:</span> These are associations, not causes. The model says ejection fraction is important for this prediction — a cardiologist must decide whether and how to act.
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl mt-3">
              <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-[13px] text-blue-900">
                <span className="font-bold">What-if:</span> {pInfo.info}
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-slate-100">
        <button
          onClick={() => goToStep(4)}
          className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition cursor-pointer text-[14px]"
        >
          ← Previous
        </button>
        <button
          onClick={() => goToStep(6)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer text-[14px]"
        >
          Next Step
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
