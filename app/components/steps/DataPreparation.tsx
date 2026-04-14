import React, { useState } from "react";
import { useML } from "../MLContext";
import { ArrowRight, Settings2 } from "lucide-react";

export function DataPreparation() {
  const { prepConfig, setPrepConfig, dataset, setDataset, goToStep, datasetId, targetColumn, isPrepared, setIsPrepared } = useML();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [prepStats, setPrepStats] = useState<any>(null);

  const trainSplit = prepConfig.trainSplit;
  const trainCount = Math.round(dataset.length * (trainSplit / 100));
  const testCount = dataset.length - trainCount;

  // Initial stats
  const totalPatients = dataset.length;
  // If we don't have stats yet, we just grab some heuristic info
  // If we DO have stats, we use the updated ones
  const displayedTotal = prepStats ? prepStats.imbalance.after.total : totalPatients;
  const positiveOutcomes = prepStats ? prepStats.imbalance.after.positive : 0;
  const negativeOutcomes = prepStats ? prepStats.imbalance.after.negative : 0;
  
  const handlePreparation = async () => {
      const effectiveId = datasetId || "live";
      const startedAt = Date.now();
      setIsProcessing(true);
      setErrorMsg("");
      try {
          const response = await fetch(`/api/dataset/${effectiveId}/prepare`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  missingValues: prepConfig.missingValues,
                  normalize: prepConfig.normalize,
                  imbalance: prepConfig.imbalance,
                  trainSplit: prepConfig.trainSplit,
                  targetColumn,
                  dataset: dataset
              })
          });

          if (!response.ok) {
              const text = await response.text();
              let errorPayload;
              try {
                  errorPayload = JSON.parse(text);
              } catch (e) {
                  throw new Error(`Server returned error ${response.status}: ${text.substring(0, 80)}`);
              }
              throw new Error(errorPayload.error || errorPayload.message || 'Failed to prepare dataset.');
          }

          const resData = await response.json();
          setDataset(resData.data);
          setPrepStats(resData.stats);
          setIsPrepared(true);
      } catch (e: any) {
          setErrorMsg(e.message);
      } finally {
          // Ensure the user can see a processing state (useful for demos/screenshots).
          const minMs = 800;
          const elapsed = Date.now() - startedAt;
          if (elapsed < minMs) {
            await new Promise((r) => setTimeout(r, minMs - elapsed));
          }
          setIsProcessing(false);
      }
  };

  return (
    <div className="space-y-6">
      {/* Header same as step 2 */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-slate-900 mb-1">Step 3: Data Preparation</h2>
          <p className="text-[14px] text-slate-500 max-w-2xl">
            Before a model can learn, the data must be clean, consistent, and split into two groups: one for training (learning) and one for testing (checking accuracy on patients the model has never seen).
          </p>
        </div>
        <button
          onClick={() => goToStep(3)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer text-[14px]"
        >
          Next Step
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Preparation Settings */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
            <h3 className="text-slate-900 font-medium">Preparation Settings</h3>

            {/* Train / Test Split */}
            <div>
              <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                Train / Test Split
              </label>
              <div className="px-2">
                <div className="flex items-center gap-4 mb-2">
                  <input
                    type="range"
                    min="60"
                    max="90"
                    step="5"
                    value={trainSplit}
                    onChange={(e) =>
                      setPrepConfig({ ...prepConfig, trainSplit: parseInt(e.target.value) })
                    }
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="w-12 text-right font-medium text-slate-700">{trainSplit}%</div>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                  <span>60% train</span>
                  <span>90% train</span>
                </div>
              </div>
              <div className="bg-slate-50 text-slate-600 text-[13px] px-3 py-2 rounded-lg mt-3 text-center border border-slate-100 font-medium">
                Training: {trainCount} patients · Testing: {testCount} patients
              </div>
              <div className="text-[11px] text-slate-500 mt-2">
                The model learns from the training group and is tested on the testing group — patients it has never seen before.
              </div>
            </div>

            {/* Handling Missing Values */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Handling Missing Values
              </label>
              <select
                value={prepConfig.missingValues}
                onChange={(e) => setPrepConfig({ ...prepConfig, missingValues: e.target.value as any })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="median">Fill with the middle value (median) — recommended</option>
                <option value="mean">Fill with the average value (mean)</option>
                <option value="mode">Fill with the most common value (mode)</option>
                <option value="drop">Remove patients with missing values (loses data)</option>
              </select>
              <div className="text-[11px] text-slate-500 mt-1.5">
                Cholesterol has 6.8% missing. Filling with the median preserves all {totalPatients} patients.
              </div>
            </div>

            {/* Normalisation */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Normalisation (Putting All Values on the Same Scale)
              </label>
              <select
                value={prepConfig.normalize}
                onChange={(e) => setPrepConfig({ ...prepConfig, normalize: e.target.value as any })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="zscore">Z-score (recommended for most models)</option>
                <option value="minmax">Min-Max (0 to 1 scale)</option>
                <option value="none">None</option>
              </select>
              <div className="text-[11px] text-slate-500 mt-1.5">
                Age (25–75) and Cholesterol (120–270) are on different scales. Without normalisation, some models get confused by the size difference.
              </div>
            </div>

            {/* Class Imbalance */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Handling Class Imbalance
              </label>
              <select
                value={prepConfig.imbalance}
                onChange={(e) => setPrepConfig({ ...prepConfig, imbalance: e.target.value as any })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="smote">SMOTE — Create synthetic similar cases for the minority group</option>
                <option value="weights">Class weights — Give higher importance to positive patients</option>
                <option value="none">None</option>
              </select>
              <div className="text-[11px] text-slate-500 mt-1.5">
                Because only {Math.round((positiveOutcomes / totalPatients) * 100)}% are positive, SMOTE creates extra examples so the model learns both groups equally well.
              </div>
            </div>

            {errorMsg && (
              <div className="text-red-600 text-[13px] bg-red-50 p-3 rounded-lg border border-red-200">
                {errorMsg}
              </div>
            )}

            <button 
              onClick={handlePreparation}
              disabled={isProcessing}
              className="w-full py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-teal-400 disabled:cursor-not-allowed transition font-medium text-[14px] mt-4 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing ? 'Processing...' : '✓ Apply Preparation Settings'}
            </button>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            
            {!isPrepared ? (
               <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-slate-400">
                  <Settings2 className="w-12 h-12 mb-3 text-slate-300" />
                  <p className="text-[14px]">Click "Apply Preparation Settings" to view results.</p>
               </div>
            ) : (
                <>
                  {/* Normalisation Viz */}
                  {prepStats?.normalize?.vizCol && (
                  <div className="mb-8">
                    <h3 className="text-slate-900 font-medium mb-4">Before & After Normalisation — {prepStats.normalize.vizCol}</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="text-[11px] font-bold text-slate-500 text-center mb-3">BEFORE (raw values)</div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 text-[12px]">
                            <div className="w-16 text-slate-600">Minimum</div>
                            <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-slate-400" style={{ width: '10%' }}></div>
                            </div>
                            <div className="w-12 text-right font-medium text-slate-700">{prepStats.normalize.before.min.toFixed(1)}</div>
                          </div>
                          <div className="flex items-center gap-3 text-[12px]">
                            <div className="w-16 text-slate-600">Average</div>
                            <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-400" style={{ width: '50%' }}></div>
                            </div>
                            <div className="w-12 text-right font-medium text-slate-700">{prepStats.normalize.before.avg.toFixed(1)}</div>
                          </div>
                          <div className="flex items-center gap-3 text-[12px]">
                            <div className="w-16 text-slate-600">Maximum</div>
                            <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-teal-500" style={{ width: '90%' }}></div>
                            </div>
                            <div className="w-12 text-right font-medium text-slate-700">{prepStats.normalize.before.max.toFixed(1)}</div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-500 text-center mb-3">AFTER ({prepConfig.normalize})</div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 text-[12px]">
                            <div className="w-16 text-slate-600">Minimum</div>
                            <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-slate-400" style={{ width: prepConfig.normalize === 'minmax' ? '0%' : '10%' }}></div>
                            </div>
                            <div className="w-12 text-right font-medium text-slate-700">{prepStats.normalize.after.min.toFixed(2)}</div>
                          </div>
                          <div className="flex items-center gap-3 text-[12px]">
                            <div className="w-16 text-slate-600">Average</div>
                            <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-400" style={{ width: '50%' }}></div>
                            </div>
                            <div className="w-12 text-right font-medium text-slate-700">{prepStats.normalize.after.avg.toFixed(2)}</div>
                          </div>
                          <div className="flex items-center gap-3 text-[12px]">
                            <div className="w-16 text-slate-600">Maximum</div>
                            <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-teal-500" style={{ width: '100%' }}></div>
                            </div>
                            <div className="w-12 text-right font-medium text-slate-700">{prepStats.normalize.after.max.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  )}

                  {/* Imbalance Viz */}
                  {prepStats?.imbalance && (
                  <div className="pt-6 border-t border-slate-100">
                    <h3 className="text-slate-900 font-medium mb-4">Class Balance — Before & After SMOTE</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="text-[11px] font-bold text-slate-500 text-center mb-3">BEFORE</div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-[12px]">
                            <div className="w-16 text-slate-600 leading-tight">Negative</div>
                            <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-slate-400" style={{ width: `${Math.round((prepStats.imbalance.before.negative / prepStats.imbalance.before.total) * 100)}%` }}></div>
                            </div>
                            <div className="w-10 text-right font-medium text-slate-700">{Math.round((prepStats.imbalance.before.negative / prepStats.imbalance.before.total) * 100)}%</div>
                          </div>
                          <div className="flex items-center gap-2 text-[12px]">
                            <div className="w-16 text-slate-600 leading-tight">Positive</div>
                            <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-orange-400" style={{ width: `${Math.round((prepStats.imbalance.before.positive / prepStats.imbalance.before.total) * 100)}%` }}></div>
                            </div>
                            <div className="w-10 text-right font-medium text-slate-700">{Math.round((prepStats.imbalance.before.positive / prepStats.imbalance.before.total) * 100)}%</div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-500 text-center mb-3">AFTER SMOTE</div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-[12px]">
                            <div className="w-16 text-slate-600 leading-tight">Negative</div>
                            <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500" style={{ width: `${Math.round((prepStats.imbalance.after.negative / prepStats.imbalance.after.total) * 100)}%` }}></div>
                            </div>
                            <div className="w-10 text-right font-medium text-slate-700">{Math.round((prepStats.imbalance.after.negative / prepStats.imbalance.after.total) * 100)}%</div>
                          </div>
                          <div className="flex items-center gap-2 text-[12px]">
                            <div className="w-16 text-slate-600 leading-tight">Positive</div>
                            <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-teal-500" style={{ width: `${Math.round((prepStats.imbalance.after.positive / prepStats.imbalance.after.total) * 100)}%` }}></div>
                            </div>
                            <div className="w-10 text-right font-medium text-slate-700">{Math.round((prepStats.imbalance.after.positive / prepStats.imbalance.after.total) * 100)}%</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  )}

                  <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-xl mt-4">
                    <span className="text-green-600 mt-0.5 shrink-0">✅</span>
                    <div className="text-[13px] text-green-900">
                      <span className="font-bold">Ready:</span> Data is clean, split, and balanced. Proceed to Step 4 to choose a model.
                    </div>
                  </div>
                </>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-slate-100">
        <button
          onClick={() => goToStep(1)}
          className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition cursor-pointer text-[14px]"
        >
          ← Previous
        </button>
        <button
          onClick={() => goToStep(3)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer text-[14px]"
        >
          Next Step
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

