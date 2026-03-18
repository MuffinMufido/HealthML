import React, { useState } from "react";
import { useML, ModelType } from "../MLContext";
import {
  ArrowRight,
  Play,
  Loader2,
  TrendingUp,
  GitBranch,
  TreePine,
  Cpu,
  CircleDot,
  Network,
  Eye,
} from "lucide-react";

const models: {
  id: ModelType;
  name: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  description: string;
  analogy: string;
  params: { key: string; label: string; min: number; max: number; step: number; default: number }[];
}[] = [
    {
      id: "logistic",
      name: "Logistic Regression",
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50 border-blue-200",
      description:
        "A simple, interpretable model that draws a straight line to separate two groups. Great starting point for binary classification.",
      analogy:
        "Like a checklist that scores each factor and sets a threshold — above the threshold means positive.",
      params: [
        { key: "regularization", label: "Regularisation Strength", min: 0.01, max: 10, step: 0.01, default: 1 },
        { key: "iterations", label: "Max Iterations", min: 100, max: 2000, step: 100, default: 500 },
      ],
    },
    {
      id: "decisionTree",
      name: "Decision Tree",
      icon: GitBranch,
      color: "text-green-600",
      bg: "bg-green-50 border-green-200",
      description:
        "Makes decisions through a series of yes/no questions, like a flowchart. Easy to understand and visualise.",
      analogy:
        "Like a clinician's decision protocol — 'Is blood pressure above 140? If yes, check cholesterol...'",
      params: [
        { key: "depth", label: "Max Depth", min: 1, max: 20, step: 1, default: 5 },
        { key: "minSamples", label: "Min Samples per Leaf", min: 1, max: 20, step: 1, default: 5 },
      ],
    },
    {
      id: "randomForest",
      name: "Random Forest",
      icon: TreePine,
      color: "text-emerald-600",
      bg: "bg-emerald-50 border-emerald-200",
      description:
        "Combines many decision trees, each looking at different aspects of the data. The final prediction is a vote from all trees.",
      analogy:
        "Like getting a second opinion from 100 different specialists and going with the majority.",
      params: [
        { key: "trees", label: "Number of Trees", min: 10, max: 500, step: 10, default: 100 },
        { key: "depth", label: "Max Depth per Tree", min: 1, max: 20, step: 1, default: 5 },
      ],
    },
    {
      id: "svm",
      name: "Support Vector Machine",
      icon: Cpu,
      color: "text-purple-600",
      bg: "bg-purple-50 border-purple-200",
      description:
        "Finds the optimal boundary between two groups by maximising the margin — the gap between the closest patients on either side.",
      analogy:
        "Like finding the widest possible 'no-man's-land' between healthy and at-risk patients.",
      params: [
        { key: "C", label: "Penalty Parameter (C)", min: 0.1, max: 100, step: 0.1, default: 1 },
        { key: "gamma", label: "Kernel Width (γ)", min: 0.001, max: 1, step: 0.001, default: 0.1 },
      ],
    },
    {
      id: "knn",
      name: "K-Nearest Neighbours",
      icon: CircleDot,
      color: "text-orange-600",
      bg: "bg-orange-50 border-orange-200",
      description:
        "Classifies a patient by looking at the K most similar patients in the training data and using their outcomes to decide.",
      analogy:
        "Like asking 'What happened to the 5 patients most similar to this one?'",
      params: [
        { key: "k", label: "Number of Neighbours (K)", min: 1, max: 25, step: 2, default: 5 },
        { key: "weightDistance", label: "Distance Weighting", min: 0, max: 1, step: 1, default: 0 },
      ],
    },
    {
      id: "neuralNet",
      name: "Neural Network",
      icon: Network,
      color: "text-red-600",
      bg: "bg-red-50 border-red-200",
      description:
        "Inspired by the human brain, this model uses layers of interconnected 'neurons' to learn complex patterns in data.",
      analogy:
        "Like a brain learning from thousands of patient records, forming connections that become expertise.",
      params: [
        { key: "hiddenLayers", label: "Hidden Layers", min: 1, max: 5, step: 1, default: 2 },
        { key: "neurons", label: "Neurons per Layer", min: 4, max: 128, step: 4, default: 32 },
        { key: "learningRate", label: "Learning Rate", min: 0.001, max: 0.1, step: 0.001, default: 0.01 },
      ],
    },
  ];

export function ModelParameters() {
  const { modelConfig, setModelConfig, setTrained, goToStep } = useML();
  const [training, setTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isVizModalOpen, setIsVizModalOpen] = useState(false);

  const selectedModel = models.find((m) => m.id === modelConfig.type)!;

  const handleTrain = () => {
    setTraining(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setTraining(false);
          setTrained(true);
          goToStep(4);
          return 100;
        }
        return p + Math.random() * 15 + 5;
      });
    }, 300);
  };

  const renderVisualization = () => {
    switch (modelConfig.type) {
      case "knn": {
        const k = modelConfig.params.k || 5;
        // Synthetic data mapping (simplified for demo react svg)
        const pts = [
          [20, 30, 0], [25, 55, 0], [15, 65, 1], [30, 75, 1], [40, 40, 0],
          [50, 25, 0], [45, 60, 1], [55, 70, 1], [65, 45, 0], [70, 60, 1],
          [75, 30, 0], [80, 65, 1], [35, 20, 0], [60, 80, 1], [85, 40, 0],
          [10, 45, 1], [90, 70, 1], [60, 15, 0], [28, 42, 0], [52, 48, 1],
        ];
        const newPt = [48, 52];
        const dists = pts.map(([px, py, c], i) => ({ i, dist: Math.hypot(px - newPt[0], py - newPt[1]), px, py, c }));
        dists.sort((a, b) => a.dist - b.dist);
        const neighbors = new Set(dists.slice(0, k).map(d => d.i));
        const kRadius = dists[k > 0 ? k - 1 : 0].dist;

        return (
          <div className="space-y-4">
            <p className="text-[13px] text-slate-500 mb-2">Each dot is a past patient (Ejection Fraction vs. Age). The ★ is a new patient. The <span className="text-teal-600 font-semibold">green circle</span> shows the {k} nearest neighbors.</p>
            <div className="w-full aspect-video bg-slate-50 rounded-xl border border-slate-200 relative overflow-hidden flex items-center justify-center p-4">
              <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                {/* Radius */}
                <circle cx={newPt[0]} cy={newPt[1]} r={kRadius} fill="rgba(22,163,74,0.05)" stroke="rgba(22,163,74,0.5)" strokeWidth="0.5" strokeDasharray="2,1" />
                {/* Connections */}
                {pts.map((pt, i) => neighbors.has(i) && (
                  <line key={`l-${i}`} x1={pt[0]} y1={pt[1]} x2={newPt[0]} y2={newPt[1]} stroke="rgba(22,163,74,0.25)" strokeWidth="0.5" />
                ))}
                {/* Points */}
                {pts.map(([px, py, c], i) => (
                  <circle key={i} cx={px} cy={py} r={neighbors.has(i) ? 2 : 1.5} fill={c === 1 ? (neighbors.has(i) ? '#dc2626' : 'rgba(220,38,38,0.4)') : (neighbors.has(i) ? '#16a34a' : 'rgba(22,163,74,0.4)')} stroke={neighbors.has(i) ? (c === 1 ? '#991b1b' : '#166534') : 'none'} strokeWidth="0.5" />
                ))}
                {/* New Point */}
                <polygon points={`${newPt[0]},${newPt[1] - 3} ${newPt[0] + 1},${newPt[1] - 1} ${newPt[0] + 3},${newPt[1] - 1} ${newPt[0] + 1.5},${newPt[1] + 0.5} ${newPt[0] + 2},${newPt[1] + 2.5} ${newPt[0]},${newPt[1] + 1.5} ${newPt[0] - 2},${newPt[1] + 2.5} ${newPt[0] - 1.5},${newPt[1] + 0.5} ${newPt[0] - 3},${newPt[1] - 1} ${newPt[0] - 1},${newPt[1] - 1}`} fill="#0D2340" />

                {/* Axes */}
                <text x="5" y="95" fill="#6B9A7A" fontSize="4" fontFamily="sans-serif">Low EF%</text>
                <text x="80" y="95" fill="#6B9A7A" fontSize="4" fontFamily="sans-serif">High EF%</text>
                <text x="2" y="10" fill="#6B9A7A" fontSize="4" fontFamily="sans-serif">Young</text>
                <text x="2" y="90" fill="#6B9A7A" fontSize="4" fontFamily="sans-serif">Old</text>
              </svg>
            </div>

            <div className="flex flex-wrap gap-4 text-[11px] text-slate-600 justify-center font-medium mt-3">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-600"></div> Readmitted</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-green-600"></div> Not Readmitted</div>
              <div className="flex items-center gap-1.5"><div className="text-[14px] text-slate-800 leading-none">★</div> New Patient</div>
              <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 bg-teal-600 rounded-full"></div> K-radius</div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-xl mt-3">
              <span className="text-green-600 mt-0.5 shrink-0 text-lg">✅</span>
              <div className="text-[13px] text-green-900">
                <span className="font-bold">Clinical meaning:</span> Of the {k} most similar patients (by age and heart function), the majority fell into the specific group. The radius adjusts exactly to enclose {k} neighbors.
              </div>
            </div>
          </div>
        );
      }
      case "svm": {
        const C = modelConfig.params.C || 1;
        const isLinear = C < 1.5; // Simplify interaction mapping for demo

        return (
          <div className="space-y-4">
            <p className="text-[13px] text-slate-500 mb-2">SVM draws the widest possible boundary between readmitted (red) and safe (green) patients. The <b>support vectors</b> (outlined circles) are the most critical cases that define the boundary.</p>
            <div className="w-full aspect-video bg-slate-50 rounded-xl border border-slate-200 relative overflow-hidden p-4 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                {/* Margin Area */}
                {isLinear ? (
                  <rect x="35" y="0" width="25" height="100" fill="rgba(163,201,179,0.12)" />
                ) : (
                  <ellipse cx="50" cy="50" rx="35" ry="28" fill="rgba(163,201,179,0.12)" transform="rotate(45 50 50)" />
                )}

                {/* Margins */}
                {isLinear ? (
                  <g stroke="#6B9A7A" strokeWidth="0.5" strokeDasharray="2,2">
                    <line x1="38" y1="0" x2="38" y2="100" />
                    <line x1="58" y1="0" x2="58" y2="100" />
                  </g>
                ) : null}

                {/* Boundary */}
                <g stroke="#0D2340" strokeWidth="1" fill="none">
                  {isLinear ? (
                    <line x1="48" y1="0" x2="48" y2="100" />
                  ) : (
                    <ellipse cx="50" cy="50" rx="28" ry="22" transform="rotate(45 50 50)" />
                  )}
                </g>

                {/* Points */}
                {[[20, 70, 1], [25, 75, 1], [30, 80, 1, 1], [15, 65, 1], [35, 85, 1], [28, 72, 1],
                [70, 30, 0], [75, 25, 0, 1], [80, 35, 0], [65, 20, 0], [85, 40, 0], [72, 28, 0]
                ].map(([x, y, c, sv], i) => (
                  <g key={i}>
                    <circle cx={x} cy={y} r={sv ? 2.5 : 2} fill={c ? '#dc2626' : '#16a34a'} />
                    {sv && <circle cx={x} cy={y} r={2.5} fill="none" stroke="#0D2340" strokeWidth="0.8" />}
                  </g>
                ))}
              </svg>
            </div>
            <div className="flex flex-wrap gap-4 text-[11px] text-slate-600 justify-center font-medium mt-3">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-600"></div> Readmitted</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-green-600"></div> Not Readmitted</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full border-2 border-slate-800"></div> Support Vector</div>
              <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 bg-slate-800 rounded-full"></div> Boundary</div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-xl mt-3">
              <span className="text-green-600 mt-0.5 shrink-0 text-lg">✅</span>
              <div className="text-[13px] text-green-900">
                <span className="font-bold">Clinical meaning:</span> The boundary is the "line of uncertainty." Patients near the line (support vectors) are the difficult cases that required the most attention during training.
              </div>
            </div>
          </div>
        );
      }
      case "decisionTree": {
        const depth = modelConfig.params.depth || 3;
        return (
          <div className="space-y-4">
            <p className="text-[13px] text-slate-500 mb-2">The tree asks yes/no questions about patient measurements. Follow the path from top to bottom to reach a final decision.</p>
            <div className="w-full h-80 bg-slate-50 rounded-xl border border-slate-200 relative overflow-hidden flex items-center justify-center p-2">
              <svg viewBox="0 0 400 300" className="w-full h-full">
                <g stroke="#94a3b8" strokeWidth="1.5" fill="none">
                  <path d="M200,40 L100,100" />
                  <path d="M200,40 L300,100" />
                  {depth >= 2 && (
                    <>
                      <path d="M100,110 L50,180" />
                      <path d="M100,110 L150,180" />
                      <path d="M300,110 L250,180" />
                      <path d="M300,110 L350,180" />
                    </>
                  )}
                  {depth >= 3 && (
                    <>
                      <path d="M50,190 L25,260" />
                      <path d="M50,190 L75,260" />
                    </>
                  )}
                </g>

                <g>
                  <rect x="150" y="25" width="100" height="30" rx="8" fill="white" stroke="#0f172a" />
                  <text x="200" y="45" textAnchor="middle" fontSize="11" fill="#0f172a" fontWeight="500">EF &lt; 38%?</text>

                  <rect x="50" y="90" width="100" height="30" rx="8" fill="white" stroke="#0f172a" />
                  <text x="100" y="110" textAnchor="middle" fontSize="11" fill="#0f172a" fontWeight="500">Age &gt; 65?</text>

                  <rect x="250" y="90" width="100" height="30" rx="8" fill="white" stroke="#0f172a" />
                  <text x="300" y="110" textAnchor="middle" fontSize="11" fill="#0f172a" fontWeight="500">Creatinine &gt; 1.5?</text>

                  {depth >= 2 ? (
                    <>
                      <rect x="10" y="170" width="80" height="30" rx="8" fill={depth >= 3 ? "white" : "#dc2626"} stroke={depth >= 3 ? "#0f172a" : "none"} />
                      <text x="50" y="190" textAnchor="middle" fontSize="11" fill={depth >= 3 ? "#0f172a" : "white"} fontWeight="500">{depth >= 3 ? "Smoker?" : "READMIT"}</text>

                      <rect x="110" y="170" width="80" height="30" rx="8" fill="#16a34a" />
                      <text x="150" y="190" textAnchor="middle" fontSize="11" fill="white" fontWeight="500">SAFE</text>

                      <rect x="210" y="170" width="80" height="30" rx="8" fill="#dc2626" />
                      <text x="250" y="190" textAnchor="middle" fontSize="11" fill="white" fontWeight="500">READMIT</text>

                      <rect x="310" y="170" width="80" height="30" rx="8" fill="#16a34a" />
                      <text x="350" y="190" textAnchor="middle" fontSize="11" fill="white" fontWeight="500">SAFE</text>
                    </>
                  ) : (
                    <>
                      {/* Overlay to fade out hidden depth */}
                      <rect x="0" y="140" width="400" height="160" fill="rgba(248, 250, 252, 0.8)" />
                    </>
                  )}

                  {depth >= 3 ? (
                    <>
                      <rect x="0" y="250" width="50" height="25" rx="6" fill="#dc2626" />
                      <text x="25" y="266" textAnchor="middle" fontSize="10" fill="white" fontWeight="500">READMIT</text>
                      <rect x="50" y="250" width="50" height="25" rx="6" fill="#16a34a" />
                      <text x="75" y="266" textAnchor="middle" fontSize="10" fill="white" fontWeight="500">SAFE</text>
                    </>
                  ) : null}
                </g>
              </svg>
            </div>
            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-xl mt-3">
              <span className="text-green-600 mt-0.5 shrink-0 text-lg">✅</span>
              <div className="text-[13px] text-green-900">
                <span className="font-bold">Clinical meaning:</span> This looks like a clinical guideline flowchart. The first question (Ejection Fraction &lt; 38%) is the most important split — the model identified this as the strongest predictor.
              </div>
            </div>
          </div>
        );
      }
      case "randomForest": {
        const trees = modelConfig.params.trees || 100;
        const showTrees = Math.min(trees, 12);
        const readmitPct = 68;
        const safePct = 32;

        return (
          <div className="space-y-4">
            <p className="text-[13px] text-slate-500 mb-2">Each mini-tree represents one decision tree trained on a random sample of patients. All <span className="font-bold">{trees}</span> trees vote, and the majority wins.</p>

            <div className="flex gap-2 overflow-x-auto pb-3">
              {Array.from({ length: showTrees }).map((_, i) => {
                const isReadmit = i < Math.round(showTrees * (readmitPct / 100));
                return (
                  <div key={i} className="min-w-[70px] h-[80px] rounded-xl border border-slate-200 bg-white flex flex-col items-center justify-center gap-1.5 shrink-0">
                    <span className="text-2xl">{isReadmit ? '🔴' : '🟢'}</span>
                    <span className="text-[10px] font-semibold text-slate-500">Tree {i + 1}</span>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-24 text-[13px] font-semibold text-slate-600">🔴 Readmit</div>
                <div className="flex-1 h-7 bg-slate-200 rounded-full overflow-hidden relative">
                  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-800 to-red-500 flex items-center px-3 text-white text-[12px] font-bold" style={{ width: `${readmitPct}%` }}>
                    {Math.round(trees * (readmitPct / 100))} trees
                  </div>
                </div>
                <div className="w-12 text-right text-[13px] font-bold text-slate-600">{readmitPct}%</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 text-[13px] font-semibold text-slate-600">🟢 Safe</div>
                <div className="flex-1 h-7 bg-slate-200 rounded-full overflow-hidden relative">
                  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-800 to-green-500 flex items-center px-3 text-white text-[12px] font-bold" style={{ width: `${safePct}%` }}>
                    {Math.round(trees * (safePct / 100))} trees
                  </div>
                </div>
                <div className="w-12 text-right text-[13px] font-bold text-slate-600">{safePct}%</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-xl mt-3">
              <span className="text-green-600 mt-0.5 shrink-0 text-lg">✅</span>
              <div className="text-[13px] text-green-900">
                <span className="font-bold">Clinical meaning:</span> 68% of trees predict readmission. Final prediction: READMIT. This is like getting {trees} second opinions — more stable than a single tree.
              </div>
            </div>
          </div>
        );
      }
      case "logistic": {
        const C = modelConfig.params.regularization || 1;
        const isSteep = C > 5;
        return (
          <div className="space-y-4">
            <p className="text-[13px] text-slate-500 mb-2">This curve shows how readmission probability changes as Ejection Fraction drops. The red dot shows your patient's position on the curve.</p>
            <div className="w-full aspect-video bg-slate-50 rounded-xl border border-slate-200 relative overflow-hidden p-4 pb-6 flex items-center justify-center">
              <svg viewBox="0 0 200 100" className="w-full h-full overflow-visible">
                {/* Axes */}
                <g stroke="#94a3b8" strokeWidth="1" fill="none">
                  <line x1="15" y1="5" x2="15" y2="85" />
                  <line x1="15" y1="85" x2="185" y2="85" />
                  {/* 50% line */}
                  <line x1="15" y1="45" x2="185" y2="45" strokeDasharray="3,3" stroke="rgba(148,163,184,0.5)" />
                </g>

                {/* Labels */}
                <g fill="#64748b" fontSize="5" fontFamily="sans-serif">
                  <text x="13" y="8" textAnchor="end">100%</text>
                  <text x="13" y="47" textAnchor="end">50%</text>
                  <text x="13" y="85" textAnchor="end">0%</text>

                  <text x="15" y="94" textAnchor="middle">14%</text>
                  <text x="100" y="94" textAnchor="middle">38%</text>
                  <text x="185" y="94" textAnchor="middle">80%</text>

                  <text x="100" y="102" textAnchor="middle" fontSize="6" fontWeight="bold">Ejection Fraction (%)</text>
                </g>

                {/* Curve (Approximated sigmoid) */}
                <path d={`M15,${isSteep ? '5' : '15'} C50,${isSteep ? '5' : '15'} 80,${isSteep ? '5' : '15'} 100,45 C120,${isSteep ? '85' : '75'} 150,${isSteep ? '85' : '75'} 185,${isSteep ? '85' : '75'}`} fill="none" stroke="#0D2340" strokeWidth="2.5" />

                {/* Patient Point */}
                <circle cx="100" cy="45" r="3" fill="#dc2626" stroke="#991b1b" strokeWidth="0.5" />
                <text x="106" y="42" fill="#0D2340" fontSize="5" fontWeight="bold">EF=38% → 50% risk</text>
              </svg>
            </div>
            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-xl mt-3">
              <span className="text-green-600 mt-0.5 shrink-0 text-lg">✅</span>
              <div className="text-[13px] text-green-900">
                <span className="font-bold">Clinical meaning:</span> Patient with EF=38% sits at the steep part of the curve — small changes in heart function cause large swings in risk. This is the "tipping point" where intervention matters most.
              </div>
            </div>
          </div>
        );
      }
      case "neuralNet": {
        return (
          <div className="space-y-4">
            <p className="text-[13px] text-slate-500 mb-2">Neural networks create complex, non-linear boundaries by passing data through layers of neurons.</p>
            <div className="w-full aspect-video bg-slate-900 rounded-xl border border-slate-700 relative overflow-hidden flex items-center justify-center">
              <div className="animate-pulse flex items-center gap-4">
                <div className="flex flex-col gap-4">
                  <div className="w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>
                  <div className="w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>
                </div>
                <div className="w-8 h-0.5 bg-slate-700"></div>
                <div className="flex flex-col gap-2">
                  <div className="w-4 h-4 rounded-full bg-purple-500 shadow-[0_0_10px_#a855f7]"></div>
                  <div className="w-4 h-4 rounded-full bg-purple-500 shadow-[0_0_10px_#a855f7]"></div>
                  <div className="w-4 h-4 rounded-full bg-purple-500 shadow-[0_0_10px_#a855f7]"></div>
                </div>
                <div className="w-8 h-0.5 bg-slate-700"></div>
                <div className="flex flex-col gap-4">
                  <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]"></div>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl mt-3">
              <span className="text-blue-600 mt-0.5 shrink-0 text-lg">ℹ️</span>
              <div className="text-[13px] text-blue-900">
                Neural networks act as a "black box". They are highly accurate but reconstructing a visual decision boundary in 2D space often obscures the actual math happening across dozens of dimensions.
              </div>
            </div>
          </div>
        )
      }
      default:
        return <div className="p-8 text-center text-slate-500">Visualization not available for this model yet.</div>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-slate-900 mb-1">Step 4: Model & Parameters</h2>
        <p className="text-[14px] text-slate-500">
          Select an AI model type and adjust its settings. Each model learns
          differently — the descriptions use plain language to explain how.
        </p>
      </div>

      {/* Model selection grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {models.map((m) => {
          const Icon = m.icon;
          const isSelected = modelConfig.type === m.id;
          return (
            <button
              key={m.id}
              onClick={() => {
                const params: Record<string, number> = {};
                m.params.forEach((p) => (params[p.key] = p.default));
                setModelConfig({ type: m.id, params });
                setTrained(false);
              }}
              className={`text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${isSelected
                ? `${m.bg} ring-2 ring-offset-1 ring-blue-300`
                : "bg-white border-slate-200 hover:border-slate-300"
                }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon
                  className={`w-5 h-5 ${isSelected ? m.color : "text-slate-400"
                    }`}
                />
                <span className="text-[14px] text-slate-800">{m.name}</span>
              </div>
              <p className="text-[12px] text-slate-500 line-clamp-2">
                {m.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Model detail + params */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h3 className="text-slate-900">{selectedModel.name}</h3>
          <p className="text-[14px] text-slate-600 leading-relaxed">
            {selectedModel.description}
          </p>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-[12px] text-amber-800">
              <span className="font-medium">Clinical analogy:</span>{" "}
              {selectedModel.analogy}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h4 className="text-[14px] text-slate-700">Model Parameters</h4>
          <p className="text-[12px] text-slate-400">
            Adjust the sliders to tune how the model learns. Hover over each
            parameter name to learn more.
          </p>
          {selectedModel.params.map((p) => (
            <div key={p.key} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-slate-600">{p.label}</span>
                <span className="text-[13px] text-blue-600 tabular-nums">
                  {modelConfig.params[p.key] !== undefined
                    ? Number(modelConfig.params[p.key]).toFixed(
                      p.step < 1 ? (p.step < 0.01 ? 3 : 2) : 0
                    )
                    : p.default}
                </span>
              </div>
              <input
                type="range"
                min={p.min}
                max={p.max}
                step={p.step}
                value={modelConfig.params[p.key] ?? p.default}
                onChange={(e) =>
                  setModelConfig({
                    ...modelConfig,
                    params: {
                      ...modelConfig.params,
                      [p.key]: parseFloat(e.target.value),
                    },
                  })
                }
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{p.min}</span>
                <span>{p.max}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Train button */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        {training ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="text-[14px] text-slate-700">
                Training model...
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-teal-400 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <p className="text-[12px] text-slate-400">
              Processing {Math.round(Math.min(progress, 100))}% — fitting{" "}
              {selectedModel.name} to training data...
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setIsVizModalOpen(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition cursor-pointer text-[14px] font-medium flex-1 bg-white"
            >
              <Eye className="w-4 h-4 text-slate-500" />
              Visualise Model
            </button>
            <button
              onClick={handleTrain}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-lg hover:from-blue-700 hover:to-teal-600 transition cursor-pointer text-[14px] font-medium flex-1"
            >
              <Play className="w-4 h-4" />
              Train Model
            </button>
          </div>
        )}
      </div>

      {/* VISUALIZATION MODAL */}
      {isVizModalOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center px-4 py-8"
          onClick={(e) => { if (e.target === e.currentTarget) setIsVizModalOpen(false); }}
        >
          <div className="bg-slate-50 rounded-2xl shadow-xl w-full max-w-3xl max-h-full flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedModel.bg}`}>
                  <selectedModel.icon className={`w-4 h-4 ${selectedModel.color}`} />
                </div>
                <div>
                  <h3 className="text-[16px] text-slate-900 font-semibold">{selectedModel.name} Visualisation</h3>
                </div>
              </div>
              <button onClick={() => setIsVizModalOpen(false)} className="text-[14px] text-slate-500 hover:text-slate-800 font-medium px-3 py-1.5 border border-slate-200 rounded-lg transition-colors cursor-pointer bg-white hover:bg-slate-50">
                ✕ Close
              </button>
            </div>
            <div className="p-6 overflow-y-auto bg-white">
              {renderVisualization()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
