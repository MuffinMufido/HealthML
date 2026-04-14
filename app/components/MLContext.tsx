import React, { createContext, useContext, useState, ReactNode } from "react";

export type Specialty =
  | "cardiology_heart_failure"
  | "radiology_pneumonia"
  | "nephrology_ckd"
  | "oncology_breast"
  | "neurology_parkinson"
  | "endocrinology_diabetes"
  | "hepatology_liver"
  | "cardiology_stroke"
  | "mental_health_depression"
  | "pulmonology_copd"
  | "haematology_anaemia"
  | "dermatology_lesion"
  | "ophthalmology_retinopathy"
  | "orthopaedics_spine"
  | "icu_sepsis"
  | "obstetrics_fetal"
  | "cardiology_arrhythmia"
  | "oncology_cervical"
  | "endocrinology_thyroid"
  | "pharmacy_readmission"
  | "";
export type PatientRecord = Record<string, any>;

export interface PrepConfig {
  missingValues: "mean" | "median" | "mode" | "drop";
  normalize: "zscore" | "minmax" | "none";
  trainSplit: number;
  imbalance: "smote" | "weights" | "none";
}

export type ModelType = "logistic" | "decisionTree" | "randomForest" | "svm" | "knn" | "naiveBayes";

export interface ModelConfig {
  type: ModelType;
  params: Record<string, number>;
}

export interface TrainResult {
  modelType: ModelType;
  modelId?: string;
  split: { trainPct: number; trainCount: number; testCount: number };
  confusionMatrix: { tn: number; fp: number; fn: number; tp: number };
  metrics: {
    accuracy: number;
    sensitivity: number;
    specificity: number;
    precision: number;
    f1: number;
    auc: number;
  };
  roc: Array<{ threshold: number; tpr: number; fpr: number }>;
  thresholds: Record<string, { green: number; amber: number }>;
  flags: { lowSensitivityDanger: boolean };
  trainingLatencyMs: number;
}

export interface MLState {
  specialty: Specialty;
  setSpecialty: (s: Specialty) => void;
  changeSpecialty: (s: Specialty) => void;
  resetPipeline: () => void;
  pendingSpecialty: Specialty | null;
  resetConfirmOpen: boolean;
  confirmResetAndSwitch: () => void;
  cancelResetAndSwitch: () => void;
  dataset: PatientRecord[];
  setDataset: (d: PatientRecord[]) => void;
  datasetId: string | null;
  setDatasetId: (id: string | null) => void;
  targetColumn: string;
  setTargetColumn: (col: string) => void;
  schemaOK: boolean;
  setSchemaOK: (b: boolean) => void;
  columns: string[];
  setColumns: (c: string[]) => void;
  isPrepared: boolean;
  setIsPrepared: (b: boolean) => void;
  goToStep: (targetStep: number) => void;
  accessWarning: { msg: string } | null;
  clearAccessWarning: () => void;
  dataLoaded: boolean;
  setDataLoaded: (b: boolean) => void;
  prepConfig: PrepConfig;
  setPrepConfig: (c: PrepConfig) => void;
  modelConfig: ModelConfig;
  setModelConfig: (c: ModelConfig) => void;
  latestTrainResult: TrainResult | null;
  setLatestTrainResult: (r: TrainResult | null) => void;
  comparedResults: Partial<Record<ModelType, TrainResult>>;
  upsertComparedResult: (r: TrainResult) => void;
  clearModelResults: () => void;
  trained: boolean;
  setTrained: (b: boolean) => void;
  currentStep: number;
  setCurrentStep: (n: number) => void;
}

const MLContext = createContext<MLState | null>(null);

export function useML() {
  const ctx = useContext(MLContext);
  if (!ctx) throw new Error("useML must be used within MLProvider");
  return ctx;
}

const defaultDataset: PatientRecord[] = Array.from({ length: 120 }, (_, i) => ({
  id: i + 1,
  age: Math.floor(Math.random() * 50) + 25,
  gender: Math.random() > 0.48 ? "Male" : "Female",
  bloodPressure: Math.floor(Math.random() * 60) + 100,
  heartRate: Math.floor(Math.random() * 40) + 60,
  cholesterol: Math.floor(Math.random() * 150) + 120,
  glucose: Math.floor(Math.random() * 80) + 70,
  bmi: parseFloat((Math.random() * 20 + 18).toFixed(1)),
  smoking: Math.random() > 0.65 ? "Yes" : "No",
  outcome: Math.random() > 0.62 ? 1 : 0,
}));

export function MLProvider({ children }: { children: ReactNode }) {
  const [specialty, setSpecialty] = useState<Specialty>("");
  const [pendingSpecialty, setPendingSpecialty] = useState<Specialty | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [targetColumn, setTargetColumn] = useState<string>("outcome");
  const [dataset, setDataset] = useState<PatientRecord[]>(defaultDataset);
  const [columns, setColumns] = useState<string[]>(Object.keys(defaultDataset[0] || {}));
  const [schemaOK, setSchemaOK] = useState(false);
  const [isPrepared, setIsPrepared] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [prepConfig, setPrepConfig] = useState<PrepConfig>({
    missingValues: "median",
    normalize: "zscore",
    trainSplit: 80,
    imbalance: "smote",
  });
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    type: "randomForest",
    params: { trees: 100, depth: 5, learningRate: 0.1 },
  });
  const [latestTrainResult, setLatestTrainResult] = useState<TrainResult | null>(null);
  const [comparedResults, setComparedResults] = useState<Partial<Record<ModelType, TrainResult>>>({});
  const [trained, setTrained] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [accessWarning, setAccessWarning] = useState<{ msg: string } | null>(null);

  const clearAccessWarning = () => setAccessWarning(null);

  const resetPipeline = () => {
    setDatasetId(null);
    setTargetColumn("outcome");
    setDataset(defaultDataset);
    setColumns(Object.keys(defaultDataset[0] || {}));
    setSchemaOK(false);
    setIsPrepared(false);
    setDataLoaded(false);
    setTrained(false);
    setCurrentStep(0);
    setAccessWarning(null);
    setLatestTrainResult(null);
    setComparedResults({});
    setPendingSpecialty(null);
    setResetConfirmOpen(false);
    setPrepConfig({
      missingValues: "median",
      normalize: "zscore",
      trainSplit: 80,
      imbalance: "smote",
    });
    setModelConfig({
      type: "randomForest",
      params: { trees: 100, depth: 5, learningRate: 0.1 },
    });
  };

  const upsertComparedResult = (result: TrainResult) => {
    setComparedResults((prev) => ({
      ...prev,
      [result.modelType]: result,
    }));
  };

  const clearModelResults = () => {
    setLatestTrainResult(null);
    setComparedResults({});
    setTrained(false);
  };

  const changeSpecialty = (next: Specialty) => {
    if (!next || next === specialty) return;
    const hasProgress =
      currentStep > 0 ||
      dataLoaded ||
      Boolean(datasetId) ||
      schemaOK ||
      isPrepared ||
      trained;
    if (hasProgress) {
      setPendingSpecialty(next);
      setResetConfirmOpen(true);
      return;
    }
    setSpecialty(next);
  };

  const confirmResetAndSwitch = () => {
    if (!pendingSpecialty) {
      setResetConfirmOpen(false);
      return;
    }
    const next = pendingSpecialty;
    resetPipeline();
    setSpecialty(next);
  };

  const cancelResetAndSwitch = () => {
    setPendingSpecialty(null);
    setResetConfirmOpen(false);
  };

  const goToStep = (targetStep: number) => {
    if (targetStep >= 2 && !schemaOK) {
      setAccessWarning({
        msg: "Access Denied: You must map and validate your data columns in Step 2 before proceeding.",
      });
      return;
    }
    if (targetStep >= 3 && !isPrepared) {
      setAccessWarning({
        msg: "Access Denied: You must apply Preparation Settings in Step 3 before proceeding.",
      });
      return;
    }
    setAccessWarning(null);
    setCurrentStep(targetStep);
  };

  return (
    <MLContext.Provider
      value={{
        specialty, setSpecialty,
        changeSpecialty,
        resetPipeline,
        pendingSpecialty,
        resetConfirmOpen,
        confirmResetAndSwitch,
        cancelResetAndSwitch,
        datasetId, setDatasetId,
        targetColumn, setTargetColumn,
        schemaOK, setSchemaOK,
        dataset, setDataset,
        columns, setColumns,
        isPrepared, setIsPrepared,
        goToStep,
        accessWarning,
        clearAccessWarning,
        dataLoaded, setDataLoaded,
        prepConfig, setPrepConfig,
        modelConfig, setModelConfig,
        latestTrainResult, setLatestTrainResult,
        comparedResults,
        upsertComparedResult,
        clearModelResults,
        trained, setTrained,
        currentStep, setCurrentStep,
      }}
    >
      {children}
    </MLContext.Provider>
  );
}
