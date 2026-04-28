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

// Domain-specific sense-check messages for all 20 specialties
const SPECIALTY_SENSE: Record<string, { expected: string; context: string }> = {
  cardiology_heart_failure: {
    expected: "ejection fraction, serum creatinine, NT-proBNP, age, sodium",
    context: "Ejection fraction <40% is a primary discriminator of adverse outcomes. Serum creatinine and sodium reflect cardiorenal syndrome, which significantly worsens prognosis.",
  },
  radiology_pneumonia: {
    expected: "oxygen saturation, respiratory rate, CRP, age, urea",
    context: "CURB-65 score uses confusion, urea, respiratory rate, blood pressure, and age ≥65. Models trained on similar variables should rank these highly for severity prediction.",
  },
  nephrology_ckd: {
    expected: "serum creatinine, eGFR, albumin/creatinine ratio, urea, haemoglobin",
    context: "eGFR and serum creatinine are primary markers of kidney function. Progressive CKD is characterised by declining GFR; values <60 mL/min/1.73 m² indicate Stage 3+ disease.",
  },
  oncology_breast: {
    expected: "tumour size, lymph node status, hormone receptor status, grade, HER2",
    context: "Tumour size, lymph node involvement, and receptor status (ER/PR/HER2) are established prognostic factors in breast cancer. These should dominate an outcome prediction model.",
  },
  neurology_parkinson: {
    expected: "UPDRS score, tremor, rigidity, bradykinesia, age",
    context: "UPDRS (Unified Parkinson's Disease Rating Scale) components directly quantify motor and non-motor symptoms. Higher scores correlate with disease severity and faster progression.",
  },
  endocrinology_diabetes: {
    expected: "HbA1c, fasting glucose, BMI, age, blood pressure",
    context: "HbA1c reflects 3-month average blood glucose and is the gold standard for diabetes management. Fasting glucose, BMI, and family history are the strongest predictors of onset.",
  },
  hepatology_liver: {
    expected: "ALT, AST, bilirubin, INR, albumin, platelet count",
    context: "Child-Pugh and MELD scores use bilirubin, INR, creatinine, and albumin to grade liver disease severity. Elevated transaminases (ALT/AST) indicate active hepatocellular injury.",
  },
  cardiology_stroke: {
    expected: "blood pressure, age, atrial fibrillation, cholesterol, smoking",
    context: "The CHADS₂ and CHA₂DS₂-VASc scores use hypertension, age, diabetes, prior stroke, and heart failure. Blood pressure and atrial fibrillation are primary modifiable stroke risk factors.",
  },
  mental_health_depression: {
    expected: "PHQ-9 score, sleep, social function, age, prior episodes",
    context: "PHQ-9 severity score, functional impairment, and prior episode history are the strongest predictors of recurrence. Sleep disturbance is an early marker of relapse risk.",
  },
  pulmonology_copd: {
    expected: "FEV1, FVC, FEV1/FVC ratio, smoking pack-years, oxygen saturation",
    context: "GOLD staging relies on FEV1 % predicted and symptom burden. FEV1/FVC <0.7 post-bronchodilator confirms airflow obstruction; smoking pack-years quantify exposure.",
  },
  haematology_anaemia: {
    expected: "haemoglobin, MCV, ferritin, transferrin saturation, reticulocyte count",
    context: "Haemoglobin level determines anaemia severity. MCV differentiates microcytic (iron deficiency, thalassaemia) from normocytic (chronic disease) from macrocytic (B12/folate) anaemia.",
  },
  dermatology_lesion: {
    expected: "lesion diameter, asymmetry, border irregularity, colour variation, age",
    context: "ABCDE criteria (Asymmetry, Border, Colour, Diameter, Evolution) underpin melanoma screening. Diameter >6 mm and irregular borders are established high-risk features.",
  },
  ophthalmology_retinopathy: {
    expected: "HbA1c, diabetes duration, blood pressure, microaneurysms, exudates",
    context: "Diabetic retinopathy severity correlates strongly with HbA1c and diabetes duration. Microaneurysms are the earliest fundoscopic sign; hard exudates indicate macular involvement.",
  },
  orthopaedics_spine: {
    expected: "pain score, BMI, age, disc degeneration grade, functional impairment",
    context: "Pain severity, functional limitation, and disc degeneration grade (Pfirrmann scale) are primary predictors of surgical outcome. BMI and smoking impair healing post-procedure.",
  },
  icu_sepsis: {
    expected: "lactate, SOFA score, heart rate, respiratory rate, white cell count",
    context: "Sepsis-3 criteria use SOFA score (Sequential Organ Failure Assessment) and lactate ≥2 mmol/L. Early lactate clearance within 6 hours is the strongest predictor of survival.",
  },
  obstetrics_fetal: {
    expected: "fetal heart rate variability, decelerations, gestational age, maternal BP",
    context: "CTG interpretation (cardiotocography) uses baseline heart rate, variability, accelerations, and decelerations. Prolonged late decelerations indicate uteroplacental insufficiency.",
  },
  cardiology_arrhythmia: {
    expected: "heart rate, QRS width, P-wave morphology, PR interval, age",
    context: "ECG-derived features (QRS morphology, PR interval, QTc) are primary classifiers of arrhythmia type. Prolonged QTc (>450 ms men, >470 ms women) indicates torsades risk.",
  },
  oncology_cervical: {
    expected: "HPV status, cytology grade, colposcopy findings, age, CIN grade",
    context: "HPV high-risk genotypes (16, 18) are present in >99% of cervical cancers. CIN grade from biopsy and abnormal cytology (HSIL) are the primary features in progression models.",
  },
  endocrinology_thyroid: {
    expected: "TSH, free T4, T3, thyroid antibodies, nodule size",
    context: "TSH is the most sensitive screening test for thyroid dysfunction. Suppressed TSH with elevated free T4 indicates hyperthyroidism; elevated TSH with low T4 indicates hypothyroidism.",
  },
  pharmacy_readmission: {
    expected: "number of medications, prior admissions, length of stay, age, comorbidities",
    context: "Polypharmacy (≥5 medications), prior 30-day admissions, and comorbidity burden (Charlson index) are the strongest predictors of unplanned readmission. Medication reconciliation errors are a common modifiable cause.",
  },
};

export function Explainability() {
  const { trained, latestTrainResult, goToStep, specialty } = useML();
  const [explainData, setExplainData] = useState<ExplainData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    const modelId = latestTrainResult?.modelId;
    if (!trained || !modelId) {
      setExplainData(null);
      return;
    }

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

            {explainData && explainData.globalFeatures.length > 0 && (() => {
              const topLabel = explainData.globalFeatures[0]?.label ?? "";
              const domainInfo = SPECIALTY_SENSE[specialty as keyof typeof SPECIALTY_SENSE];
              const senseText = domainInfo
                ? `Expected key predictors for this domain include: ${domainInfo.expected}. ${domainInfo.context}`
                : (() => {
                    const t = topLabel.toLowerCase();
                    if (t.includes("age")) return "Age is a well-established risk factor across most clinical domains — this ranking is consistent with medical literature.";
                    if (t.includes("ejection") || t.includes("ef")) return "Ejection fraction is a key indicator of cardiac function — clinically expected to rank highly for heart failure outcomes.";
                    if (t.includes("creatinine") || t.includes("serum")) return "Serum creatinine reflects kidney function and is a recognised predictor of adverse outcomes across many specialties.";
                    if (t.includes("glucose") || t.includes("hba1c")) return "Blood glucose and HbA1c are primary drivers of diabetic and metabolic outcomes.";
                    if (t.includes("bmi") || t.includes("weight")) return "BMI is an established risk factor across many chronic disease pathways.";
                    if (t.includes("bp") || t.includes("blood pressure") || t.includes("hypertension")) return "Blood pressure is a core cardiovascular risk factor — expected to rank highly in cardiac and stroke models.";
                    if (t.includes("smoking") || t.includes("tobacco")) return "Smoking status is a well-documented predictor across respiratory, cardiac, and oncology domains.";
                    if (t.includes("lactate") || t.includes("sofa")) return "Lactate and SOFA score are primary sepsis severity markers per Sepsis-3 criteria.";
                    return "Cross-check this feature against established clinical guidelines for your specialty to confirm it represents a known risk factor.";
                  })();
              return (
                <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <Lightbulb className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-[13px] text-amber-900">
                    <span className="font-bold">Clinical sense-check:</span>{" "}
                    {specialty && domainInfo
                      ? senseText
                      : <>Top feature: <span className="font-semibold">{topLabel}</span>. {senseText}</>}
                  </div>
                </div>
              );
            })()}
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

              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl mt-6">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-[13px] text-amber-900">
                  <span className="font-bold">Important:</span> These are associations, not causes. A qualified clinician must decide whether and how to act on model predictions.
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
