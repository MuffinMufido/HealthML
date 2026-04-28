import React, { useEffect, useMemo, useState } from "react";
import { useML, ModelType } from "../MLContext";
import { ArrowRight, Info, Play } from "lucide-react";

const modelNames: Record<ModelType, string> = {
  knn: "KNN",
  svm: "SVM",
  decisionTree: "Decision Tree",
  randomForest: "Random Forest",
  logistic: "Logistic Reg.",
  naiveBayes: "Naive Bayes",
};

export function Results() {
  const {
    modelConfig,
    setModelConfig,
    setTrained,
    goToStep,
    dataset,
    datasetId,
    targetColumn,
    prepConfig,
    latestTrainResult,
    setLatestTrainResult,
    comparedResults,
    upsertComparedResult,
  } = useML();
  const [activeTab, setActiveTab] = useState<ModelType>(modelConfig.type);
  const [autoRetrain, setAutoRetrain] = useState(true);
  const [isTraining, setIsTraining] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Local param state for the active tab (simplified for UI demonstration)
  const [knnK, setKnnK] = useState(5);
  const [svmC, setSvmC] = useState(1);
  const [rfTrees, setRfTrees] = useState(100);
  const [dtDepth, setDtDepth] = useState(5);
  const [logRegIterations, setLogRegIterations] = useState(500);
  const [nbVarSmoothing, setNbVarSmoothing] = useState(1);
  const [debouncePending, setDebouncePending] = useState(false);
  const [debounceMeasuredMs, setDebounceMeasuredMs] = useState<number | null>(null);

  const activeParams = useMemo(() => {
    if (activeTab === "knn") return { k: knnK };
    if (activeTab === "svm") return { C: svmC };
    if (activeTab === "randomForest") return { trees: rfTrees };
    if (activeTab === "decisionTree") return { depth: dtDepth };
    if (activeTab === "logistic") return { iterations: logRegIterations };
    if (activeTab === "naiveBayes") return { varSmoothing: nbVarSmoothing };
    return modelConfig.params || {};
  }, [activeTab, knnK, svmC, rfTrees, dtDepth, logRegIterations, nbVarSmoothing, modelConfig.params]);

  const handleTrain = async () => {
    setIsTraining(true);
    setErrorMsg("");
    try {
      const response = await fetch(`/api/dataset/${datasetId || "live"}/train`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataset,
          targetColumn,
          modelType: activeTab,
          params: { ...modelConfig.params, ...activeParams },
          trainSplit: prepConfig.trainSplit,
          imbalance: prepConfig.imbalance,
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || payload?.message || "Training failed.");
      }
      const result = await response.json();
      setModelConfig({ ...modelConfig, type: activeTab });
      setLatestTrainResult(result);
      upsertComparedResult(result);
      setTrained(true);
    } catch (e: any) {
      setErrorMsg(e?.message || "Unexpected training error.");
    } finally {
      setIsTraining(false);
    }
  };

  useEffect(() => {
    if (!autoRetrain) return;
    if (!dataset || dataset.length < 20) return;
    setDebouncePending(true);
    const scheduledAt = performance.now();
    const timer = setTimeout(() => {
      setModelConfig({
        ...modelConfig,
        type: activeTab,
        params: { ...modelConfig.params, ...activeParams },
      });
      setDebounceMeasuredMs(Math.round(performance.now() - scheduledAt));
      handleTrain();
      setDebouncePending(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [activeTab, knnK, svmC, rfTrees, dtDepth, logRegIterations, nbVarSmoothing, autoRetrain]);

  const metricClass = (key: keyof NonNullable<typeof latestTrainResult>["metrics"], value: number) => {
    const t = latestTrainResult?.thresholds?.[key];
    if (!t) return "text-slate-700";
    if (value >= t.green) return "text-green-700";
    if (value >= t.amber) return "text-amber-700";
    return "text-red-700";
  };

  const getModelDescription = (type: ModelType) => {
    switch (type) {
      case "knn": return <span><b>K-Nearest Neighbors (KNN)</b> — Finds the <b>K most similar past patients</b> and predicts based on their outcomes. Like asking: "What happened to the 5 patients most similar to this one?" Simple and easy to understand.</span>;
      case "svm": return <span><b>Support Vector Machine (SVM)</b> — Finds the best boundary (line or curve) that separates readmitted from non-readmitted patients in high-dimensional space.</span>;
      case "decisionTree": return <span><b>Decision Tree</b> — Learns a series of yes/no questions to split patients into groups. Easy to interpret but prone to over-memorising the training data.</span>;
      case "randomForest": return <span><b>Random Forest</b> — A team of many decision trees. Each tree gets a random subset of data and votes. Highly accurate and robust to noise.</span>;
      case "logistic": return <span><b>Logistic Regression</b> — Calculates a baseline risk and adds/subtracts weight for every measurement. The gold standard for clinical risk scores.</span>;
      case "naiveBayes": return <span><b>Naive Bayes</b> — Uses probability theory to estimate how likely each outcome is, given a patient's measurements. Very fast and transparent. Good for seeing quick, interpretable results.</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-slate-900 mb-1">Step 5: Results — How Well Did the Model Perform?</h2>
          <p className="text-[14px] text-slate-500 max-w-2xl">
            Choose a machine learning algorithm, adjust its settings, and train it on your patient data. Try different models and compare their accuracy side by side.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <label className="flex items-center gap-2 text-[12px] font-medium text-slate-500 cursor-pointer">
            Auto-retrain on change:
            <input
              type="checkbox"
              checked={autoRetrain}
              onChange={(e) => setAutoRetrain(e.target.checked)}
              className="accent-blue-600"
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Model Setup */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
            <h3 className="text-slate-900 font-medium">Choose Algorithm</h3>

            <div className="flex flex-wrap gap-2">
              {(Object.keys(modelNames) as ModelType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveTab(type)}
                  className={`px-3 py-1.5 text-[13px] font-medium rounded-lg border transition ${activeTab === type
                    ? "bg-slate-800 text-white border-slate-800"
                    : comparedResults[type]
                      ? "bg-slate-50 border-slate-300 text-slate-700"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                >
                  {modelNames[type]}
                  {comparedResults[type] && activeTab !== type && <span className="ml-1.5 text-[10px] text-teal-600">✓</span>}
                </button>
              ))}
            </div>

            <div className="bg-slate-50 p-4 rounded-lg text-[13px] text-slate-700 border border-slate-100">
              {getModelDescription(activeTab)}
            </div>

            <h3 className="text-slate-900 font-medium pt-2 border-t border-slate-100">Parameters</h3>

            {/* Dynamic Parameter Panels based on activeTab */}
            {activeTab === "knn" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                    K — Number of Similar Patients to Compare
                  </label>
                  <div className="flex items-center gap-4 mb-2">
                    <input type="range" min="1" max="25" step="1" value={knnK} onChange={(e) => setKnnK(Number(e.target.value))} className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    <div className="w-8 text-right font-medium text-slate-700">{knnK}</div>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 font-medium"><span>1 (very specific)</span><span>25 (very general)</span></div>
                  <div className="text-[11px] text-slate-500 mt-2">Low K = focuses on very similar cases (can be noisy). High K = considers many patients (may miss details). K=5–7 is a good starting point.</div>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-2">Distance Measure</label>
                  <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-700 outline-none focus:border-blue-500">
                    <option>Euclidean (straight-line distance) — recommended</option>
                    <option>Manhattan (grid-step distance)</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === "svm" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-2">Kernel</label>
                  <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-700 outline-none focus:border-blue-500">
                    <option>RBF — Radial (best for most clinical data)</option>
                    <option>Linear — Straight-line boundary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-3">C — How Strictly to Fit Training Patients</label>
                  <div className="flex items-center gap-4 mb-2">
                    <input type="range" min="1" max="100" step="1" value={svmC} onChange={(e) => setSvmC(Number(e.target.value))} className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    <div className="w-8 text-right font-medium text-slate-700">{svmC}</div>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 font-medium"><span>0.01 (loose fit)</span><span>100 (strict fit)</span></div>
                  <div className="text-[11px] text-slate-500 mt-2">High C: model tries harder to classify every training patient correctly — risks memorising instead of learning.</div>
                </div>
              </div>
            )}

            {activeTab === "randomForest" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-3">Number of Trees</label>
                  <div className="flex items-center gap-4 mb-2">
                    <input type="range" min="10" max="300" step="10" value={rfTrees} onChange={(e) => setRfTrees(Number(e.target.value))} className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    <div className="w-8 text-right font-medium text-slate-700">{rfTrees}</div>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 font-medium"><span>10 (fast)</span><span>300 (stable)</span></div>
                  <div className="text-[11px] text-slate-500 mt-2">More trees = more stable predictions, but slower to train. Each tree votes — the majority vote wins.</div>
                </div>
              </div>
            )}

            {["decisionTree", "logistic", "naiveBayes"].includes(activeTab) && (
              <>
                {activeTab === "decisionTree" && (
                  <div>
                    <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-3">Max Depth</label>
                    <div className="flex items-center gap-4 mb-2">
                      <input type="range" min="1" max="20" step="1" value={dtDepth} onChange={(e) => setDtDepth(Number(e.target.value))} className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                      <div className="w-8 text-right font-medium text-slate-700">{dtDepth}</div>
                    </div>
                  </div>
                )}
                {activeTab === "logistic" && (
                  <div>
                    <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-3">Max Iterations</label>
                    <div className="flex items-center gap-4 mb-2">
                      <input type="range" min="100" max="2000" step="100" value={logRegIterations} onChange={(e) => setLogRegIterations(Number(e.target.value))} className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                      <div className="w-14 text-right font-medium text-slate-700">{logRegIterations}</div>
                    </div>
                  </div>
                )}
                {activeTab === "naiveBayes" && (
                  <div>
                    <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-3">Variance Smoothing (×10⁻⁹)</label>
                    <div className="flex items-center gap-4 mb-2">
                      <input type="range" min="1" max="100" step="1" value={nbVarSmoothing} onChange={(e) => setNbVarSmoothing(Number(e.target.value))} className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                      <div className="w-14 text-right font-medium text-slate-700">{nbVarSmoothing}</div>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">Controls numerical stability. Rarely needs changing — leave at 1 unless you see errors.</div>
                  </div>
                )}
                <div className="bg-blue-50 p-4 rounded-lg flex gap-3 text-blue-800 text-[13px] border border-blue-200">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                  <p>These controls are active and included in training requests for all 6 models.</p>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={handleTrain}
                disabled={isTraining}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium text-[14px] disabled:opacity-50 cursor-pointer"
              >
                {isTraining ? "⏳ Training..." : "⚡ Train Model"}
              </button>
              <button
                onClick={handleTrain}
                disabled={isTraining}
                className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium text-[14px] cursor-pointer"
              >
                + Compare
              </button>
            </div>

            {errorMsg && (
              <div className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {errorMsg}
              </div>
            )}
            {debouncePending && autoRetrain && (
              <div className="text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Auto-retrain queued (300ms debounce)...
              </div>
            )}
            {!debouncePending && debounceMeasuredMs !== null && autoRetrain && (
              <div className="text-[12px] text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                Last debounce delay: <b>{debounceMeasuredMs} ms</b> (target 300 ms ± 50 ms)
              </div>
            )}
            {isTraining && (
              <div className="flex gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg items-center mt-3">
                <span className="text-xl">⏳</span>
                <span className="text-[13px] text-blue-800 font-medium">Training {modelNames[activeTab]}...</span>
              </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <h3 className="text-slate-900 font-medium">Model Comparison</h3>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="p-3 font-medium">Model</th>
                      <th className="p-3 font-medium">Accuracy</th>
                      <th className="p-3 font-medium text-orange-600">Sensitivity ★</th>
                      <th className="p-3 font-medium">Specificity</th>
                      <th className="p-3 font-medium">AUC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {(Object.keys(comparedResults) as ModelType[]).map((modelId) => {
                      const r = comparedResults[modelId];
                      if (!r) return null; // Safe check
                      return (
                        <tr key={modelId} className={activeTab === modelId ? "bg-blue-50/50" : ""}>
                          <td className="p-3 font-medium">{modelNames[modelId]}</td>
                          <td className="p-3">{Math.round(r.metrics.accuracy * 100)}%</td>
                          <td className={`p-3 font-bold ${r.metrics.sensitivity < 0.5 ? "text-red-600" : "text-orange-600"}`}>
                            {Math.round(r.metrics.sensitivity * 100)}%
                          </td>
                          <td className="p-3">{Math.round(r.metrics.specificity * 100)}%</td>
                          <td className="p-3">{r.metrics.auc.toFixed(2)}</td>
                        </tr>
                      )
                    })}
                    {Object.keys(comparedResults).length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400">Train a model to see comparative results.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="text-[11px] text-slate-500 mt-2">
                <span className="text-orange-600 font-bold pr-1">★ Sensitivity</span>
                = how many of the truly positive patients did the model catch? This is the most important metric in screening.
              </div>
            </div>


          </div>
        </div>

        {/* Right Column: Visualisations & Results */}
        <div className="space-y-6">
          {latestTrainResult && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <h3 className="text-slate-900 font-medium">Performance Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="text-[11px] text-slate-500 uppercase">Accuracy</div>
                  <div className={`text-[20px] font-semibold ${metricClass("accuracy", latestTrainResult.metrics.accuracy)}`}>
                    {Math.round(latestTrainResult.metrics.accuracy * 100)}%
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="text-[11px] text-slate-500 uppercase">Sensitivity</div>
                  <div className={`text-[20px] font-semibold ${metricClass("sensitivity", latestTrainResult.metrics.sensitivity)}`}>
                    {Math.round(latestTrainResult.metrics.sensitivity * 100)}%
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="text-[11px] text-slate-500 uppercase">Specificity</div>
                  <div className={`text-[20px] font-semibold ${metricClass("specificity", latestTrainResult.metrics.specificity)}`}>
                    {Math.round(latestTrainResult.metrics.specificity * 100)}%
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="text-[11px] text-slate-500 uppercase">Precision</div>
                  <div className={`text-[20px] font-semibold ${metricClass("precision", latestTrainResult.metrics.precision)}`}>
                    {Math.round(latestTrainResult.metrics.precision * 100)}%
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="text-[11px] text-slate-500 uppercase">F1 Score</div>
                  <div className={`text-[20px] font-semibold ${metricClass("f1", latestTrainResult.metrics.f1)}`}>
                    {Math.round(latestTrainResult.metrics.f1 * 100)}%
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="text-[11px] text-slate-500 uppercase">AUC</div>
                  <div className={`text-[20px] font-semibold ${metricClass("auc", latestTrainResult.metrics.auc)}`}>
                    {latestTrainResult.metrics.auc.toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-green-600"></span>Green: meets target</div>
                <div className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500"></span>Amber: caution zone</div>
                <div className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-red-600"></span>Red: below acceptable threshold</div>
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-[12px]">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 font-medium">Metric</th>
                      <th className="p-2.5 font-medium">Green Threshold</th>
                      <th className="p-2.5 font-medium">Amber Threshold</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {Object.entries(latestTrainResult.thresholds).map(([k, t]) => (
                      <tr key={k}>
                        <td className="p-2.5 uppercase">{k}</td>
                        <td className="p-2.5 text-green-700 font-medium">{Math.round(t.green * 100)}%</td>
                        <td className="p-2.5 text-amber-700 font-medium">{Math.round(t.amber * 100)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-[11px] text-slate-500">
                Training latency: <b>{latestTrainResult.trainingLatencyMs} ms</b> (target &lt; 3000 ms)
              </div>
            </div>
          )}

          {/* ROC Curve Visualization */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-slate-900 font-medium">ROC Curve — How Well Does the Model Separate the Two Groups?</h3>
            <svg className="roc-svg w-full" viewBox="0 0 300 160" preserveAspectRatio="xMidYMid meet" style={{ border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f7f9fb' }}>
              <text x="10" y="14" fill="#64748b" fontSize="9" fontFamily="monospace">1.0</text>
              <text x="10" y="152" fill="#64748b" fontSize="9" fontFamily="monospace">0</text>
              <text x="270" y="152" fill="#64748b" fontSize="9" fontFamily="monospace">1.0</text>
              <line x1="30" y1="10" x2="30" y2="150" stroke="#cbd5e1" strokeWidth="1" />
              <line x1="30" y1="150" x2="290" y2="150" stroke="#cbd5e1" strokeWidth="1" />
              {/* Diagonal (random) */}
              <line x1="30" y1="150" x2="290" y2="10" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4,3" />
              {/* ROC curve */}
              <polyline
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="2.5"
                points={
                  (latestTrainResult?.roc?.length
                    ? latestTrainResult.roc
                    : [{ fpr: 0, tpr: 0 }, { fpr: 1, tpr: 1 }]
                  )
                    .map((p) => `${30 + p.fpr * 260},${150 - p.tpr * 140}`)
                    .join(" ")
                }
              />
              <text x="100" y="90" fill="#0ea5e9" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                AUC = {latestTrainResult?.metrics?.auc?.toFixed(2) || "N/A"}
              </text>
            </svg>
            <div className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              A perfect model would go straight to the top-left corner. The blue curve comes from live backend training output. Current AUC: {latestTrainResult?.metrics?.auc?.toFixed(2) || "N/A"}.
            </div>
          </div>

          {latestTrainResult && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <h3 className="text-slate-900 font-medium">Confusion Matrix (TN / FP / FN / TP)</h3>
              <div className="grid grid-cols-2 gap-3 text-[13px]">
                <div className="rounded-lg border border-slate-200 p-3">TN: <b>{latestTrainResult.confusionMatrix.tn}</b></div>
                <div className="rounded-lg border border-slate-200 p-3">FP: <b>{latestTrainResult.confusionMatrix.fp}</b></div>
                <div className="rounded-lg border border-slate-200 p-3">FN: <b>{latestTrainResult.confusionMatrix.fn}</b></div>
                <div className="rounded-lg border border-slate-200 p-3">TP: <b>{latestTrainResult.confusionMatrix.tp}</b></div>
              </div>
              {latestTrainResult.confusionMatrix.fn > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-[13px]">
                  ⚠ FN Warning: {latestTrainResult.confusionMatrix.fn} positive patient(s) were missed. In screening use-cases this is clinically risky.
                </div>
              )}
              {latestTrainResult.confusionMatrix.fp > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-[13px]">
                  ℹ FP Info: {latestTrainResult.confusionMatrix.fp} false alarm(s) may increase follow-up workload, but are often safer than missed positives.
                </div>
              )}
              {latestTrainResult.flags.lowSensitivityDanger && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-[13px]">
                  ⚠ Low Sensitivity Danger: sensitivity is below 50%. The model may miss true positive patients.
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-slate-100">
        <button
          onClick={() => goToStep(3)}
          className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition cursor-pointer text-[14px]"
        >
          ← Previous
        </button>
        <button
          onClick={() => goToStep(5)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer text-[14px]"
        >
          Next Step
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
