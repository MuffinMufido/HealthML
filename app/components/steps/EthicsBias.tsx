import React, { useEffect, useState } from "react";
import { useML } from "../MLContext";
import { AlertTriangle, CheckCircle2, FileText, Loader2 } from "lucide-react";

type SubgroupRow = {
  group: string;
  accuracy: string;
  sensitivity: string;
  specificity: string;
  fairness: string;
  status: "good" | "warn" | "bad";
};

type FairnessData = {
  subgroups: SubgroupRow[];
  biasDetected: boolean;
  biasMessage: string;
  representation: Record<string, number>;
  overallMetrics: Record<string, number>;
};

const checklistItems = [
  { id: 1, text: "Model is explainable (outputs have reasons)", sub: "Feature importance and per-patient ablation explanations computed in Step 6", checked: true },
  { id: 2, text: "Training data is documented", sub: "Dataset source, size, time period, and patient demographics are recorded", checked: true },
  { id: 3, text: "Subgroup bias audit completed", sub: "Performance gaps between demographic groups must be addressed before deployment", checked: false },
  { id: 4, text: "Human oversight plan defined", sub: "A qualified clinician must review all high-risk flags before any action is taken", checked: false },
  { id: 5, text: "Patient data privacy protected", sub: "GDPR compliant: no personally identifiable information used in model training", checked: false },
  { id: 6, text: "Drift monitoring plan established", sub: "Model accuracy must be re-checked every 3 months as patient population changes", checked: false },
  { id: 7, text: "Incident reporting pathway defined", sub: "If the model causes harm, there is a clear process for reporting and review", checked: false },
  { id: 8, text: "Clinical validation completed", sub: "Model tested in real clinical environment with supervision before full deployment", checked: false },
];

export function EthicsBias() {
  const { trained, latestTrainResult, goToStep, specialty } = useML();
  const [checklist, setChecklist] = useState(checklistItems);
  const [fairnessData, setFairnessData] = useState<FairnessData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [certLoading, setCertLoading] = useState(false);

  const handleDownloadCertificate = async () => {
    const r = latestTrainResult;
    if (!r) return;
    setCertLoading(true);
    try {
      const body = {
        specialty,
        modelType: r.modelType,
        split: r.split,
        metrics: r.metrics,
        confusionMatrix: r.confusionMatrix,
        featureColumns: r.featureColumns ?? [],
        trainingLatencyMs: r.trainingLatencyMs,
        thresholds: r.thresholds,
        subgroups: fairnessData?.subgroups ?? [],
        biasDetected: fairnessData?.biasDetected ?? false,
        biasMessage: fairnessData?.biasMessage ?? "",
        checklist: checklist.map(({ id, text, sub, checked }) => ({ id, text, sub, checked })),
      };
      const res = await fetch("/api/ml/generate-certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Certificate generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `HealthML_Certificate_${new Date().toISOString().split("T")[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert("Certificate error: " + (e.message ?? "unknown"));
    } finally {
      setCertLoading(false);
    }
  };

  useEffect(() => {
    const modelId = latestTrainResult?.modelId;
    if (!trained || !modelId) return;

    setLoading(true);
    setError("");
    fetch(`/api/ml/fairness?modelId=${encodeURIComponent(modelId)}`)
      .then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e.error || "Fairness fetch failed"));
        return r.json();
      })
      .then((data: FairnessData) => setFairnessData(data))
      .catch((e) => setError(typeof e === "string" ? e : "Failed to load fairness data"))
      .finally(() => setLoading(false));
  }, [trained, latestTrainResult?.modelId]);

  if (!trained) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-400" />
        <h3 className="text-slate-700">Train a model first</h3>
        <p className="text-[14px] text-slate-500 max-w-md">
          The ethics &amp; bias analysis requires a trained model. Go back to Step 4 to train one.
        </p>
        <button
          onClick={() => goToStep(3)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer text-[14px]"
        >
          Go to Model &amp; Parameters
        </button>
      </div>
    );
  }

  const toggleCheck = (id: number) => {
    setChecklist(checklist.map((item) => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  // Representation bars — use real data if available, else show placeholders
  const repEntries = fairnessData?.representation
    ? Object.entries(fairnessData.representation).map(([k, v]) => ({ label: k, pct: Math.round(v * 100) }))
    : [];

  // Reference population (approximate): Male ~48%, Female ~52%
  const REF_POP: Record<string, number> = { male: 48, female: 52 };
  const maxRepGap = repEntries.reduce((max, e) => {
    const ref = REF_POP[e.label.toLowerCase()] ?? 50;
    return Math.max(max, Math.abs(e.pct - ref));
  }, 0);
  const showRepWarning = repEntries.length > 0 && maxRepGap > 15;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-slate-900 mb-1">Step 7: Ethics &amp; Bias — Is This Model Fair for All Patients?</h2>
          <p className="text-[14px] text-slate-500 max-w-3xl">
            Before any AI tool is used in a hospital, it must be checked for fairness across different patient groups. A model that works well on average but poorly for elderly or female patients is not safe to deploy.
          </p>
        </div>
        <button onClick={handleDownloadCertificate} disabled={certLoading} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed transition cursor-pointer text-[14px]">
          {certLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          {certLoading ? "Generating PDF..." : "Download Summary Certificate"}
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <span className="text-[13px] text-blue-800">Computing subgroup fairness metrics from trained model...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-800">
          <AlertTriangle className="w-4 h-4 inline mr-2" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* Left Column */}
        <div className="space-y-6">

          {/* Subgroup Performance */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-slate-900 font-medium">Subgroup Performance — Is the Model Fair?</h3>

            {fairnessData && fairnessData.subgroups.length > 0 ? (
              <>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-[13px] text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 font-medium text-slate-600">Patient Group</th>
                        <th className="px-4 py-3 font-medium text-slate-600">Accuracy</th>
                        <th className="px-4 py-3 font-medium text-slate-600">Sensitivity</th>
                        <th className="px-4 py-3 font-medium text-slate-600">Specificity</th>
                        <th className="px-4 py-3 font-medium text-slate-600">Fairness</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {fairnessData.subgroups.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-700">{row.group}</td>
                          <td className="px-4 py-3 text-slate-600">{row.accuracy}</td>
                          <td className={`px-4 py-3 font-medium ${row.status === "good" ? "text-green-600" : row.status === "warn" ? "text-amber-600" : "text-red-600"}`}>
                            {row.sensitivity}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{row.specificity}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${row.status === "good" ? "bg-green-100 text-green-700" : row.status === "warn" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                              {row.status === "good" ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                              {row.fairness}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {fairnessData.biasDetected && (
                  <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl mt-2">
                    <span className="text-red-500 mt-0.5 shrink-0 text-lg">🚨</span>
                    <div className="text-[13px] text-red-900">
                      <span className="font-bold">Bias Detected: </span>
                      {fairnessData.biasMessage}
                    </div>
                  </div>
                )}

                {!fairnessData.biasDetected && (
                  <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-xl mt-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                    <div className="text-[13px] text-green-900">
                      <span className="font-bold">No significant bias detected</span> across measured subgroups. Continue to monitor after deployment.
                    </div>
                  </div>
                )}
              </>
            ) : (
              !loading && (
                <div className="text-[13px] text-slate-400 py-4 text-center">
                  {error
                    ? "Fairness metrics unavailable."
                    : "No gender or age columns detected in dataset — subgroup analysis not available."}
                </div>
              )
            )}
          </div>

          {/* EU AI Act Checklist */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="pb-2 border-b border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-slate-900 font-medium">EU AI Act Compliance Checklist</h3>
                <span className="text-[12px] font-semibold text-slate-600">
                  {checklist.filter(i => i.checked).length} of {checklist.length} completed
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${(checklist.filter(i => i.checked).length / checklist.length) * 100}%` }}
                />
              </div>
            </div>
            <div className="space-y-2">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${item.checked ? "bg-slate-50 border-slate-200" : "bg-white border-slate-200 hover:border-slate-300"}`}
                >
                  <div className={`mt-0.5 shrink-0 rounded w-5 h-5 flex items-center justify-center border ${item.checked ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 bg-white"}`}>
                    {item.checked && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className={`text-[13px] font-medium ${item.checked ? "text-slate-800 line-through decoration-slate-300" : "text-slate-800"}`}>
                      {item.text}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-6 items-start">

          {/* Representation */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-slate-900 font-medium pb-2 border-b border-slate-100">Training Data Representation vs. Real Population</h3>

            <div className="space-y-3">
              <div className="text-[11px] font-bold text-slate-500 tracking-wider">TRAINING DATA (ACTUAL)</div>
              {repEntries.length > 0 ? (
                repEntries.map((entry, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-[110px] text-right text-[12px] text-slate-600 shrink-0 font-medium capitalize">{entry.label} patients</div>
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${i === 0 ? "bg-blue-500" : "bg-amber-500"}`} style={{ width: `${entry.pct}%` }}></div>
                    </div>
                    <div className="w-[30px] text-[12px] text-slate-500 font-mono text-right">{entry.pct}%</div>
                  </div>
                ))
              ) : (
                <div className="text-[12px] text-slate-400">No gender column detected in dataset.</div>
              )}

              <div className="text-[11px] font-bold text-slate-500 tracking-wider pt-2 mt-2 border-t border-slate-100">REAL HOSPITAL POPULATION (ESTIMATED)</div>
              <div className="flex items-center gap-3">
                <div className="w-[110px] text-right text-[12px] text-slate-600 shrink-0 font-medium">Male patients</div>
                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: "48%" }}></div>
                </div>
                <div className="w-[30px] text-[12px] text-slate-500 font-mono text-right">48%</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-[110px] text-right text-[12px] text-slate-600 shrink-0 font-medium">Female patients</div>
                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: "52%" }}></div>
                </div>
                <div className="w-[30px] text-[12px] text-slate-500 font-mono text-right">52%</div>
              </div>
            </div>

            {showRepWarning && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl mt-4">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-[13px] text-amber-900">
                  <span className="font-bold">Under-representation detected ({maxRepGap} pp gap):</span> Training data demographics differ significantly from the real population. The model may underperform for under-represented groups. Retrain with more representative data.
                </div>
              </div>
            )}
          </div>

          {/* Real-World AI Failures */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-slate-900 font-medium pb-2 border-b border-slate-100">Real-World AI Failures in Healthcare — What Goes Wrong</h3>
            <div className="space-y-2">
              <div className="p-3 rounded-xl border border-red-200 bg-red-50">
                <div className="text-[12px] font-bold text-red-700 mb-1 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Case 1: Sepsis Algorithm Bias</div>
                <div className="text-[12px] text-red-900 leading-relaxed">
                  An ICU sepsis prediction algorithm was found to perform significantly worse for Black patients because it was trained mostly on data from white patients. Hospitals had to suspend the tool and retrain it with representative data.
                </div>
              </div>
              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50">
                <div className="text-[12px] font-bold text-amber-700 mb-1 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Case 2: Accuracy ≠ Safety</div>
                <div className="text-[12px] text-amber-900 leading-relaxed">
                  A readmission model with 85% overall accuracy was deployed but had only 30% sensitivity for elderly patients — the highest-risk group. The hospital reported more missed readmissions after deploying the AI than before.
                </div>
              </div>
              <div className="p-3 rounded-xl border border-green-200 bg-green-50">
                <div className="text-[12px] font-bold text-green-700 mb-1 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> How to Prevent This</div>
                <div className="text-[12px] text-green-900 leading-relaxed">
                  Always check subgroup performance. Always require human review. Always retrain periodically. Never deploy based on overall accuracy alone.
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl mt-6">
        <span className="text-green-600 text-xl shrink-0 mt-0.5">🎓</span>
        <div className="text-[13.5px] text-green-900">
          <span className="font-bold block mb-1">Congratulations — you have completed all 7 steps.</span>
          You have defined a clinical problem, explored patient data, prepared it correctly, trained and compared real ML models (scikit-learn), evaluated results with clinical metrics, understood why the model makes predictions using ablation analysis, and checked it for fairness. Download your Summary Certificate to document what you built.
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-6">
        <button
          onClick={() => goToStep(5)}
          className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition cursor-pointer text-[14px]"
        >
          ← Previous
        </button>
        <button onClick={handleDownloadCertificate} disabled={certLoading} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed transition cursor-pointer text-[14px]">
          {certLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          {certLoading ? "Generating PDF..." : "Download Summary Certificate"}
        </button>
      </div>
    </div>
  );
}
