import React, { useState } from "react";
import { useML, ModelType } from "../MLContext";
import { ArrowRight, Info, Play } from "lucide-react";

// Mock results for comparison table
const mockResults: Record<
  ModelType,
  {
    name: string;
    accuracy: number;
    sensitivity: number;
    specificity: number;
    auc: number;
  }
> = {
  knn: { name: "KNN", accuracy: 0.78, sensitivity: 0.62, specificity: 0.85, auc: 0.74 },
  svm: { name: "SVM", accuracy: 0.82, sensitivity: 0.75, specificity: 0.85, auc: 0.87 },
  decisionTree: { name: "Decision Tree", accuracy: 0.75, sensitivity: 0.68, specificity: 0.78, auc: 0.78 },
  randomForest: { name: "Random Forest", accuracy: 0.85, sensitivity: 0.80, specificity: 0.88, auc: 0.91 },
  logistic: { name: "Logistic Reg.", accuracy: 0.79, sensitivity: 0.72, specificity: 0.82, auc: 0.83 },
  neuralNet: { name: "Neural Network", accuracy: 0.87, sensitivity: 0.83, specificity: 0.89, auc: 0.93 },
};

export function Results() {
  const { modelConfig, setModelConfig, setTrained, goToStep } = useML();
  const [activeTab, setActiveTab] = useState<ModelType>(modelConfig.type);
  const [autoRetrain, setAutoRetrain] = useState(true);
  const [isTraining, setIsTraining] = useState(false);
  const [comparedModels, setComparedModels] = useState<ModelType[]>([modelConfig.type]);

  // Local param state for the active tab (simplified for UI demonstration)
  const [knnK, setKnnK] = useState(5);
  const [svmC, setSvmC] = useState(1);
  const [rfTrees, setRfTrees] = useState(100);

  const handleTrain = () => {
    setIsTraining(true);
    setTimeout(() => {
      setModelConfig({ ...modelConfig, type: activeTab });
      setTrained(true);
      setIsTraining(false);
      if (!comparedModels.includes(activeTab)) {
        setComparedModels([...comparedModels, activeTab]);
      }
    }, 800);
  };

  const getModelDescription = (type: ModelType) => {
    switch (type) {
      case "knn": return <span><b>K-Nearest Neighbors (KNN)</b> — Finds the <b>K most similar past patients</b> and predicts based on their outcomes. Like asking: "What happened to the 5 patients most similar to this one?" Simple and easy to understand.</span>;
      case "svm": return <span><b>Support Vector Machine (SVM)</b> — Finds the best boundary (line or curve) that separates readmitted from non-readmitted patients in high-dimensional space.</span>;
      case "decisionTree": return <span><b>Decision Tree</b> — Learns a series of yes/no questions to split patients into groups. Easy to interpret but prone to over-memorising the training data.</span>;
      case "randomForest": return <span><b>Random Forest</b> — A team of many decision trees. Each tree gets a random subset of data and votes. Highly accurate and robust to noise.</span>;
      case "logistic": return <span><b>Logistic Regression</b> — Calculates a baseline risk and adds/subtracts weight for every measurement. The gold standard for clinical risk scores.</span>;
      case "neuralNet": return <span><b>Neural Network</b> — A complex web of mathematical functions loosely inspired by the brain. Powerful for complex patterns but hard to interpret ("black box").</span>;
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
              {(Object.keys(mockResults) as ModelType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveTab(type)}
                  className={`px-3 py-1.5 text-[13px] font-medium rounded-lg border transition ${activeTab === type
                    ? "bg-slate-800 text-white border-slate-800"
                    : comparedModels.includes(type)
                      ? "bg-slate-50 border-slate-300 text-slate-700"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                >
                  {mockResults[type].name}
                  {comparedModels.includes(type) && activeTab !== type && <span className="ml-1.5 text-[10px] text-teal-600">✓</span>}
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

            {["decisionTree", "logistic", "neuralNet"].includes(activeTab) && (
              <div className="bg-blue-50 p-4 rounded-lg flex gap-3 text-blue-800 text-[13px] border border-blue-200">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                <p>Default parameters loaded. For simplicity in the demo, we only show extensive parameter panels for KNN, SVM, and Random Forest.</p>
              </div>
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

            {isTraining && (
              <div className="flex gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg items-center mt-3">
                <span className="text-xl">⏳</span>
                <span className="text-[13px] text-blue-800 font-medium">Training {mockResults[activeTab].name}...</span>
              </div>
            )}

          </div>
        </div>

        {/* Right Column: Visualisations & Results */}
        <div className="space-y-6">

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
              <path d="M30,150 C60,120 80,60 120,40 C160,22 200,15 290,10" fill="none" stroke="#0ea5e9" strokeWidth="2.5" />
              <text x="100" y="90" fill="#0ea5e9" fontSize="10" fontWeight="bold" fontFamily="sans-serif">AUC = {mockResults[activeTab]?.auc?.toFixed(2) || "0.81"}</text>
            </svg>
            <div className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              A perfect model would go straight to the top-left corner. Our curve (blue) is well above the diagonal line (random guessing), which is good. AUC of {mockResults[activeTab]?.auc?.toFixed(2) || "0.81"} = good discriminative ability.
            </div>
          </div>

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
                  {comparedModels.map((modelId) => {
                    const r = mockResults[modelId];
                    if (!r) return null; // Safe check
                    return (
                      <tr key={modelId} className={activeTab === modelId ? "bg-blue-50/50" : ""}>
                        <td className="p-3 font-medium">{r.name}</td>
                        <td className="p-3">{Math.round(r.accuracy * 100)}%</td>
                        <td className="p-3 text-orange-600 font-bold">{Math.round(r.sensitivity * 100)}%</td>
                        <td className="p-3">{Math.round(r.specificity * 100)}%</td>
                        <td className="p-3">{r.auc.toFixed(2)}</td>
                      </tr>
                    )
                  })}
                  {comparedModels.length === 0 && (
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
