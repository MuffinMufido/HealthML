import React, { useEffect, useState } from "react";
import { useML } from "../MLContext";
import { ArrowRight, AlertTriangle, Lightbulb, Loader2 } from "lucide-react";

type GlobalFeature = { label: string; value: number; pct: string };
type PatientBar = { label: string; val: string; pct: string; type: string };
type PatientExplanation = {
  index: number;
  risk: string;
  prob: string;
  summary: string;
  bars: PatientBar[];
  info: string;
};
type ExplainData = {
  globalFeatures: GlobalFeature[];
  patients: PatientExplanation[];
};

export function Explainability() {
  const { trained, latestTrainResult, goToStep } = useML();
  const [explainData, setExplainData] = useState<ExplainData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    const modelId = latestTrainResult?.modelId;
    if (!trained || !modelId) return;

    setLoading(true);
    setError("");
    fetch(`/api/ml/explain?modelId=${encodeURIComponent(modelId)}`)
      .then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e.error || "Explain failed"));
        return r.json();
      })
      .then((data: ExplainData) => {
        setExplainData(data);
        setSelectedIdx(0);
      })
      .catch((e) => setError(typeof e === "string" ? e : "Failed to load explanations"))
      .finally(() => setLoading(false));
  }, [trained, latestTrainResult?.modelId]);

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
          Go to Model &amp; Parameters
        </button>
      </div>
    );
  }

  const pInfo = explainData?.patients[selectedIdx] ?? null;

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

      {loading && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <span className="text-[13px] text-blue-800">Computing feature importance from trained model...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-800">
          <AlertTriangle className="w-4 h-4 inline mr-2" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left Column: Global & Select */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-slate-900 font-medium pb-2 border-b border-slate-100">Most Important Patient Measurements (Overall)</h3>

            {explainData ? (
              <div className="space-y-3">
                {explainData.globalFeatures.map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-[130px] text-right text-[12px] text-slate-600 shrink-0 font-medium capitalize">{f.label}</div>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: f.pct }}></div>
                    </div>
                    <div className="w-[35px] text-[12px] text-slate-500 font-mono text-right">{f.value.toFixed(3)}</div>
                  </div>
                ))}
              </div>
            ) : (
              !loading && (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-[130px] h-3 bg-slate-100 rounded shrink-0 animate-pulse" />
                      <div className="flex-1 h-2 bg-slate-100 rounded-full animate-pulse" />
                      <div className="w-[35px] h-3 bg-slate-100 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              )
            )}

            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl mt-4">
              <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-[13px] text-blue-900">
                <span className="font-bold">How it works:</span> Feature importance is computed from the actual trained model — tree-based models use built-in impurity reduction; linear models use coefficient magnitude; others use permutation importance on the test set.
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-slate-900 font-medium">Single Patient Explanation</h3>

            {explainData?.patients.length ? (
              <div className="space-y-2">
                <label className="text-[13px] font-medium text-slate-700 block">Select a Test Patient</label>
                <select
                  className="w-full text-[14px] border border-slate-300 rounded-lg p-2.5 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={selectedIdx}
                  onChange={(e) => setSelectedIdx(Number(e.target.value))}
                >
                  {explainData.patients.map((p, i) => (
                    <option key={i} value={i}>{p.summary}</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500">
                  Patients selected as representative samples: one high-risk, one low-risk, one borderline.
                </p>
              </div>
            ) : (
              !loading && (
                <p className="text-[13px] text-slate-400">
                  {error ? "Patient explanations unavailable." : "Train a model to see per-patient explanations."}
                </p>
              )
            )}
          </div>
        </div>

        {/* Right Column: Waterfall / SHAP bars */}
        <div className="space-y-6">
          {pInfo && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <h3 className="text-slate-900 font-medium pb-2 border-b border-slate-100">
                Why Was This Patient Flagged as {pInfo.risk}? ({pInfo.prob} probability)
              </h3>
              <p className="text-[12px] text-slate-500">
                Each bar shows how much a measurement pushed the prediction toward or away from the positive outcome.
                Computed using ablation: each feature is replaced with its training-set mean and the change in predicted probability is measured.
              </p>

              <div className="space-y-4 pt-2">
                {pInfo.bars.map((b, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-[150px] text-right text-[12px] shrink-0 font-medium ${b.type === "bad" ? "text-red-600" : "text-green-600"}`}>
                      {b.label}
                    </div>
                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                      {b.type === "bad" ? (
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
                    <div className={`w-[50px] text-[12px] font-mono text-right ${b.type === "bad" ? "text-red-600" : "text-green-600"}`}>
                      {b.val}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl mt-6">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div className="text-[13px] text-red-900">
                  <span className="font-bold">Important:</span> These are associations, not causes. A cardiologist must decide whether and how to act on model predictions.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl mt-3">
                <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-[13px] text-blue-900">
                  <span className="font-bold">What-if:</span> {pInfo.info}
                </div>
              </div>
            </div>
          )}

          {!pInfo && !loading && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-center text-slate-400 text-[13px]" style={{ minHeight: 200 }}>
              Train a model to see patient-level explanations.
            </div>
          )}
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
