import React from "react";
import { useML, Specialty } from "../MLContext";
import {
  Heart,
  Brain as BrainIcon,
  Scan,
  Siren,
  Microscope,
  Activity,
  ArrowRight,
  Info,
} from "lucide-react";

const specialties: {
  id: Specialty;
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  problem: string;
  description: string;
  outcome: string;
}[] = [
    {
      id: "cardiology_heart_failure",
      name: "Cardiology",
      icon: Heart,
      color: "text-red-600",
      bgColor: "bg-red-50 border-red-200",
      problem: "30-Day Readmission Risk",
      description: "This model utilizes Heart Failure Clinical Records to predict the 30-day readmission risk after a heart failure discharge. Predicting these outcomes helps target post-discharge interventions and prevents adverse events.",
      outcome: "DEATH_EVENT (binary)",
    },
    {
      id: "radiology_pneumonia",
      name: "Radiology",
      icon: Scan,
      color: "text-blue-600",
      bgColor: "bg-blue-50 border-blue-200",
      problem: "Pneumonia Classification",
      description: "Designed to assist in imaging interpretation, this model uses NIH Chest X-Ray metadata to predict normal versus pneumonia states based on extracted clinical features.",
      outcome: "Finding Label (binary/multi)",
    },
    {
      id: "nephrology_ckd",
      name: "Nephrology",
      icon: Activity,
      color: "text-teal-600",
      bgColor: "bg-teal-50 border-teal-200",
      problem: "Chronic Kidney Disease Stage",
      description: "Predicts chronic kidney disease stage from routine lab values. Early detection helps slow disease progression. Data Source: UCI CKD Dataset (400 patients).",
      outcome: "classification (CKD / not CKD)",
    },
    {
      id: "oncology_breast",
      name: "Oncology — Breast",
      icon: Microscope,
      color: "text-purple-600",
      bgColor: "bg-purple-50 border-purple-200",
      problem: "Breast Biopsy Malignancy",
      description: "Using the Wisconsin Breast Cancer Dataset, this AI model analyzes cell measurements from breast biopsies to predict malignancy. Distinguishing between benign and malignant samples is highly critical for treatment planning.",
      outcome: "diagnosis (M/B)",
    },
    {
      id: "neurology_parkinson",
      name: "Neurology — Parkinson's",
      icon: BrainIcon,
      color: "text-amber-600",
      bgColor: "bg-amber-50 border-amber-200",
      problem: "Parkinson's Disease Detection",
      description: "Trained on the UCI Parkinson's Dataset, this model predicts the presence of Parkinson's disease from voice biomarkers. Such non-invasive screening methods help neurologists flag early signs of neurodegeneration.",
      outcome: "status (0/1)",
    },
    {
      id: "endocrinology_diabetes",
      name: "Endocrinology — Diabetes",
      icon: Activity,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 border-emerald-200",
      problem: "Diabetes Onset Prediction",
      description: "Predicts diabetes onset within 5 years from metabolic markers. Enables proactive lifestyle and medical interventions. Data Source: Pima Indians Diabetes Dataset.",
      outcome: "Outcome (0/1)",
    },
    {
      id: "hepatology_liver",
      name: "Hepatology — Liver",
      icon: Activity,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 border-yellow-200",
      problem: "Liver Disease Detection",
      description: "Predicts liver disease from blood test results, aiding hepatologists in early diagnosis. Data Source: Indian Liver Patient Dataset.",
      outcome: "liver disease (yes/no)",
    },
    {
      id: "cardiology_stroke",
      name: "Cardiology — Stroke",
      icon: Heart,
      color: "text-rose-600",
      bgColor: "bg-rose-50 border-rose-200",
      problem: "Stroke Risk Prediction",
      description: "Predicts stroke risk from demographics and comorbidities, allowing preventative care for high-risk patients. Data Source: Kaggle Stroke Prediction Dataset.",
      outcome: "stroke (0/1)",
    },
    {
      id: "mental_health_depression",
      name: "Mental Health",
      icon: BrainIcon,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 border-indigo-200",
      problem: "Depression Severity",
      description: "Predicts depression severity from PHQ-9 survey responses to help triage mental health support. Data Source: Kaggle Depression/Anxiety Dataset.",
      outcome: "severity class",
    },
    {
      id: "pulmonology_copd",
      name: "Pulmonology — COPD",
      icon: Activity,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50 border-cyan-200",
      problem: "COPD Exacerbation Risk",
      description: "Predicts COPD exacerbation risk from spirometry data, enabling timely interventions. Data Source: Kaggle / PhysioNet COPD Dataset.",
      outcome: "exacerbation (yes/no)",
    },
    {
      id: "haematology_anaemia",
      name: "Haematology — Anaemia",
      icon: Activity,
      color: "text-red-500",
      bgColor: "bg-red-50 border-red-100",
      problem: "Anaemia Type Classification",
      description: "Predicts type of anaemia from full blood count results to streamline haematology workflows. Data Source: Kaggle Anaemia Classification Dataset.",
      outcome: "anemia_type (multi-class)",
    },
    {
      id: "dermatology_lesion",
      name: "Dermatology",
      icon: Scan,
      color: "text-amber-700",
      bgColor: "bg-amber-50 border-amber-200",
      problem: "Skin Lesion Classification",
      description: "Predicts benign vs. malignant skin lesion from dermoscopy features, supporting dermatologists in decision-making. Data Source: HAM10000 metadata (Kaggle).",
      outcome: "dx_type (benign / malignant)",
    },
    {
      id: "ophthalmology_retinopathy",
      name: "Ophthalmology",
      icon: Scan,
      color: "text-blue-500",
      bgColor: "bg-blue-50 border-blue-100",
      problem: "Diabetic Retinopathy Severity",
      description: "Predicts diabetic retinopathy severity from clinical findings to prevent vision loss. Data Source: UCI / Kaggle Retinopathy Dataset.",
      outcome: "severity grade",
    },
    {
      id: "orthopaedics_spine",
      name: "Orthopaedics — Spine",
      icon: Activity,
      color: "text-slate-600",
      bgColor: "bg-slate-50 border-slate-200",
      problem: "Disc Herniation Detection",
      description: "Predicts normal vs. disc herniation from biomechanical measures to assist orthopaedic assessments. Data Source: UCI Vertebral Column Dataset.",
      outcome: "class (Normal / Abnormal)",
    },
    {
      id: "icu_sepsis",
      name: "ICU / Sepsis",
      icon: Siren,
      color: "text-orange-600",
      bgColor: "bg-orange-50 border-orange-200",
      problem: "Sepsis Onset Prediction",
      description: "Leveraging the PhysioNet / Kaggle Sepsis Dataset, this model predicts sepsis onset from vital signs and lab results. Rapidly identifying sepsis is crucial in emergency settings to initiate life-saving treatments promptly.",
      outcome: "SepsisLabel (0/1)",
    },
    {
      id: "obstetrics_fetal",
      name: "Obstetrics — Fetal Health",
      icon: Activity,
      color: "text-pink-600",
      bgColor: "bg-pink-50 border-pink-200",
      problem: "Fetal Health Classification",
      description: "Predicts fetal cardiotocography classification (normal / suspect / pathological) to ensure maternal and fetal safety. Data Source: UCI Fetal Health Dataset.",
      outcome: "fetal_health (1/2/3)",
    },
    {
      id: "cardiology_arrhythmia",
      name: "Cardiology — Arrhythmia",
      icon: Heart,
      color: "text-red-700",
      bgColor: "bg-red-100 border-red-300",
      problem: "Cardiac Arrhythmia Detection",
      description: "Predicts cardiac arrhythmia presence from ECG features, supporting rapid cardiac triage. Data Source: UCI Arrhythmia Dataset.",
      outcome: "arrhythmia (0/1)",
    },
    {
      id: "oncology_cervical",
      name: "Oncology — Cervical",
      icon: Microscope,
      color: "text-fuchsia-600",
      bgColor: "bg-fuchsia-50 border-fuchsia-200",
      problem: "Cervical Cancer Risk",
      description: "Predicts cervical cancer risk from demographic and behavioural data for early oncological screening. Data Source: UCI Cervical Cancer Dataset.",
      outcome: "Biopsy (0/1)",
    },
    {
      id: "endocrinology_thyroid",
      name: "Thyroid / Endocrinology",
      icon: Activity,
      color: "text-emerald-700",
      bgColor: "bg-emerald-100 border-emerald-300",
      problem: "Thyroid Function Classification",
      description: "Predicts thyroid function classification (hypo / hyper / normal) based on patient data. Data Source: UCI Thyroid Disease Dataset.",
      outcome: "class (3 types)",
    },
    {
      id: "pharmacy_readmission",
      name: "Pharmacy — Readmission",
      icon: Activity,
      color: "text-blue-700",
      bgColor: "bg-blue-100 border-blue-300",
      problem: "Hospital Readmission Risk",
      description: "Predicts hospital readmission risk for diabetic patients on medication to optimize discharge planning. Data Source: UCI Diabetes 130-US Hospitals Dataset.",
      outcome: "readmitted (<30 / >30 / NO)",
    }
  ];

export function ClinicalContext() {
  const { specialty, changeSpecialty, goToStep, resetConfirmOpen, pendingSpecialty, confirmResetAndSwitch, cancelResetAndSwitch } = useML();
  const selected = specialties.find((s) => s.id === specialty);
  const pendingName = specialties.find((s) => s.id === pendingSpecialty)?.name || "new specialty";

  return (
    <div className="space-y-6">
      {resetConfirmOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center px-4"
          data-testid="reset-confirm-overlay"
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200">
              <h3 className="text-[16px] font-semibold text-slate-900">Switch specialty?</h3>
              <p className="text-[13px] text-slate-600 mt-1">
                Switching to <span className="font-semibold">{pendingName}</span> will reset your pipeline progress (uploaded data, mapping, and preparation).
              </p>
            </div>
            <div className="p-5 space-y-2 text-[13px] text-slate-700">
              <div className="flex items-start gap-2">
                <span className="mt-0.5">⚠️</span>
                <div>
                  You will return to <b>Step 1</b> and all current progress will be cleared.
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={cancelResetAndSwitch}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-[14px] font-medium"
                data-testid="reset-confirm-cancel"
              >
                Cancel
              </button>
              <button
                onClick={confirmResetAndSwitch}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-[14px] font-medium"
                data-testid="reset-confirm-continue"
              >
                Continue & Reset
              </button>
            </div>
          </div>
        </div>
      )}
      <div>
        <h2 className="text-slate-900 mb-1">Step 1: Clinical Context</h2>
        <p className="text-[14px] text-slate-500">
          Choose a medical specialty to explore how AI can assist in that
          clinical area. Each specialty has a real-world problem where machine
          learning can support clinical decision-making.
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-[13px] text-blue-800">
          <span className="font-medium">No technical background needed.</span>{" "}
          This tool uses plain language to explain every concept. Hover over
          highlighted terms for definitions, and follow each step at your own
          pace.
        </div>
      </div>

      {/* Specialty cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {specialties.map((s) => {
          const Icon = s.icon;
          const isSelected = specialty === s.id;
          return (
            <button
              key={s.id}
              onClick={() => changeSpecialty(s.id)}
              data-testid={`specialty-${s.id}`}
              className={`text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${isSelected
                ? `${s.bgColor} ring-2 ring-offset-2 ring-blue-300`
                : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? s.bgColor : "bg-slate-100"
                    }`}
                >
                  <Icon
                    className={`w-5 h-5 ${isSelected ? s.color : "text-slate-500"
                      }`}
                  />
                </div>
                <h3
                  className={`text-[15px] ${isSelected ? "text-slate-900" : "text-slate-700"
                    }`}
                >
                  {s.name}
                </h3>
              </div>
              <p className="text-[13px] text-slate-500 line-clamp-2">
                {s.problem}
              </p>
            </button>
          );
        })}
      </div>

      {/* Selected detail */}
      {selected && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Activity className={`w-5 h-5 ${selected.color}`} />
              <h3 className="text-slate-900 font-semibold">Question: {selected.problem}</h3>
            </div>
            
            <div className="space-y-1 mt-2">
              <h4 className="text-[13px] font-bold text-slate-500 uppercase tracking-widest">Clinical Context</h4>
              <p className="text-[14px] text-slate-600 leading-relaxed">
                {selected.description}
              </p>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
              <span className="text-[12px] text-slate-400 uppercase tracking-wide font-bold">
                Target Variable:
              </span>
              <span className="text-[13px] text-slate-700 font-medium">
                {selected.outcome}
              </span>
            </div>

            {/* Clinical Warnings */}
            <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <span className="text-orange-600 mt-0.5 shrink-0">⚠️</span>
              <div className="text-[13px] text-orange-900">
                <span className="font-bold">What ML cannot do:</span> It cannot
                replace your clinical judgment. It can flag high-risk patients, but
                you make the final decision.
              </div>
            </div>

            <button
              onClick={() => goToStep(1)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer text-[14px] mt-4"
            >
              Continue to Data Exploration
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-slate-900">What Will Be Produced in Each Step</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-3 font-medium">Step</th>
                    <th className="p-3 font-medium">What You Will Create</th>
                    <th className="p-3 font-medium">Plain English Meaning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-3"><span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-blue-100 text-blue-700 font-medium text-[12px]">1</span></td>
                    <td className="p-3 font-medium">Clinical Brief</td>
                    <td className="p-3">The problem we are solving, and the safety rules</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-3"><span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-blue-100 text-blue-700 font-medium text-[12px]">2</span></td>
                    <td className="p-3 font-medium">Data Profile</td>
                    <td className="p-3">Understanding your patient dataset — who is in it and what is missing</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-3"><span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-blue-100 text-blue-700 font-medium text-[12px]">3</span></td>
                    <td className="p-3 font-medium">Preprocessing Recipe</td>
                    <td className="p-3">Cleaning and preparing data so the model can learn correctly</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-3"><span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-blue-100 text-blue-700 font-medium text-[12px]">4</span></td>
                    <td className="p-3 font-medium">Trained Model</td>
                    <td className="p-3">A computer programme that has learned patterns from past patients</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-3"><span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-blue-100 text-blue-700 font-medium text-[12px]">5</span></td>
                    <td className="p-3 font-medium">Evaluation Report</td>
                    <td className="p-3">How accurately does the model perform predictions?</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-3"><span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-blue-100 text-blue-700 font-medium text-[12px]">6</span></td>
                    <td className="p-3 font-medium">Explanation</td>
                    <td className="p-3">Why did the model flag a specific patient as high risk?</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-3"><span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-blue-100 text-blue-700 font-medium text-[12px]">7</span></td>
                    <td className="p-3 font-medium">Ethics Checklist</td>
                    <td className="p-3">Is the model fair for all patient groups? Who oversees it?</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl mt-4">
              <span className="text-emerald-600 mt-0.5 shrink-0">✅</span>
              <div className="text-[13px] text-emerald-900">
                <span className="font-bold">Remember:</span> A human doctor or nurse
                must always review the model's suggestions. This tool helps you
                learn — it does not make clinical decisions.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
