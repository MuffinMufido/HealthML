import React, { useState, useRef, useEffect } from "react";
import { useML } from "../MLContext";
import Papa from "papaparse";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Upload,
  FileSpreadsheet,
  ArrowRight,
  Users,
  TrendingUp,
  AlertCircle,
  Table,
  BarChart3,
} from "lucide-react";

export function DataExploration() {
  const { datasetId, setDatasetId, dataset, setDataset, columns, setColumns, dataLoaded, setDataLoaded, goToStep, setSchemaOK, setTargetColumn } = useML();
  const [view, setView] = useState<"table" | "charts">("charts");
  const [tablePage, setTablePage] = useState(0);
  const pageSize = 10;

  const [isMapperOpen, setIsMapperOpen] = useState(false);
  const [schemaValid, setSchemaValid] = useState(false);
  const [validatedTargetColumn, setValidatedTargetColumn] = useState<string>("");
  
  // Mapped roles for columns
  const [mapperState, setMapperState] = useState<Record<string, string>>({});
  const [validationMsg, setValidationMsg] = useState<{text: string, type: 'error'|'success'|'info'} | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedTargetColumn, setSelectedTargetColumn] = useState<string>("");

  useEffect(() => {
    if (columns.length > 0 && !selectedTargetColumn) {
      // Auto-select a likely target column (e.g. outcome, target, class, etc)
      const likelyTarget = columns.find(c => ["outcome", "target", "class", "label", "diagnosis"].includes(c.toLowerCase()));
      if (likelyTarget) {
        setSelectedTargetColumn(likelyTarget);
      } else {
        setSelectedTargetColumn(columns[columns.length - 1] || "");
      }
    }
  }, [columns, selectedTargetColumn]);

  const handleLoadExample = () => {
    setDatasetId(`example-dataset-${Date.now()}`);
    setDataLoaded(true);
    setSchemaOK(false);

    const initMapping: Record<string, string> = {};
    columns.forEach((col: string) => {
      const val = dataset.length > 0 ? dataset[0][col] : null;
      if (col.toLowerCase().includes('id') || col.toLowerCase().includes('uuid')) {
        initMapping[col] = "Ignore";
      } else if (typeof val === 'number') {
        initMapping[col] = "Number";
      } else {
        initMapping[col] = "Category";
      }
    });
    setMapperState(initMapping);
    setSchemaValid(false);
    setValidatedTargetColumn("");
    setValidationMsg(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    setUploadError("");
    setUploadStatus("");

    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadError('Invalid file format. Please upload a .csv file.');
      return;
    }

    if (file.size > 52428800) {
      setUploadError('File too large. Maximum allowed file size is 50MB.');
      return;
    }
    
    setUploadStatus(`Uploading "${file.name}"...`);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/dataset/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to process file');
      }

      const data = await response.json();
      
      const { datasetId: newId, columns: parsedColumns, data: parsedData } = data;
      
      setDatasetId(newId);
      setColumns(parsedColumns);
      setDataset(parsedData);
      setUploadStatus(`✓ "${file.name}" loaded successfully (${parsedData.length} rows).`);
      setDataLoaded(true);
      setSchemaOK(false);
      
      // Auto-detect initial mapping for columns
      const initMapping: Record<string, string> = {};
      parsedColumns.forEach((col: string) => {
        const val = parsedData.length > 0 ? parsedData[0][col] : null;
        if (col.toLowerCase().includes('id') || col.toLowerCase().includes('uuid')) {
          initMapping[col] = "Ignore";
        } else if (typeof val === 'number') {
          initMapping[col] = "Number";
        } else {
          initMapping[col] = "Category";
        }
      });
      setMapperState(initMapping);
      setSchemaValid(false);
      setValidatedTargetColumn("");
      setValidationMsg(null);
    } catch (error: any) {
      setUploadError(error.message);
      setUploadStatus("");
    }
  };

  if (!dataLoaded) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-slate-900 mb-1">Step 2: Data Exploration</h2>
          <p className="text-[14px] text-slate-500">
            Upload a patient dataset in CSV format, or use the built-in example
            dataset to explore how AI learns from clinical data.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upload */}
          <div
            className={`bg-white rounded-xl border-2 border-dashed p-6 flex flex-col items-center text-center space-y-4 transition ${isDragging ? "border-blue-500 bg-blue-50" : uploadError ? "border-red-500 bg-red-50" : "border-slate-300 hover:border-blue-400"
              }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDragging ? "bg-blue-100" : uploadError ? "bg-red-100" : "bg-blue-50"}`}>
              <Upload className={`w-7 h-7 ${isDragging ? "text-blue-700" : uploadError ? "text-red-600" : "text-blue-600"}`} />
            </div>
            <div>
              <h3 className="text-slate-900 font-medium">Upload Your Dataset</h3>
              <p className="text-[13px] text-slate-500 mt-1 max-w-xs mx-auto">
                Drag and drop your CSV file here, or click to browse. Max size 50MB.
              </p>
            </div>

            <input
              type="file"
              accept=".csv"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition cursor-pointer text-[14px] font-medium"
            >
              Select CSV File
            </button>

            {uploadError && (
              <div className="text-[13px] text-red-600 font-medium mt-2">
                {uploadError}
              </div>
            )}
            {uploadStatus && (
              <div className="text-[13px] text-green-600 font-medium mt-2">
                {uploadStatus}
              </div>
            )}
          </div>

          {/* Example */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center">
              <FileSpreadsheet className="w-7 h-7 text-teal-600" />
            </div>
            <h3 className="text-slate-900">Use Example Dataset</h3>
            <p className="text-[13px] text-slate-500">
              Load a pre-built dataset of 120 synthetic patient records with
              realistic clinical measurements and outcomes.
            </p>
            <button
              onClick={handleLoadExample}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition cursor-pointer text-[14px]"
            >
              Load Example Data
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Stats
  const totalPatients = dataset.length;
  
  // Calculate missing data percentage across all cells
  const totalCells = totalPatients * columns.length;
  let missingCells = 0;
  dataset.forEach(row => {
    columns.forEach(col => {
      const val = row[col];
      if (val === null || val === undefined || val === '') {
        missingCells++;
      }
    });
  });
  const missingDataPct = totalCells > 0 ? ((missingCells / totalCells) * 100).toFixed(1) : "0.0";
  
  // Dynamic outcomes based on selected target column
  let positiveOutcomes = 0;
  let validOutcomeCount = totalPatients;
  
  if (selectedTargetColumn && dataset.length > 0) {
    // Determine the "positive" class if binary, or just use the most frequent class
    const values = dataset.map(d => d[selectedTargetColumn]).filter(v => v !== null && v !== undefined && v !== '');
    validOutcomeCount = values.length;
    
    // Simple heuristic: if numeric 0/1, 1 is positive. If text Yes/No, Yes is positive. 
    // Otherwise just pick the least frequent class as "Positive" (often the anomaly) to show balance
    const counts = values.reduce((acc, val) => {
      acc[String(val)] = (acc[String(val)] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const uniqueVals = Object.keys(counts);
    if (uniqueVals.length === 2) {
      // Binary
      const val1 = uniqueVals[0];
      const val2 = uniqueVals[1];
      // Try to guess which is positive
      const posKey = ["1", "yes", "true", "positive", "abnormal"].find(k => k === String(val1).toLowerCase() || k === String(val2).toLowerCase());
      if (posKey) {
        const actualKey = uniqueVals.find(v => String(v).toLowerCase() === posKey) || uniqueVals[0];
        positiveOutcomes = counts[actualKey];
      } else {
        // pick the minority class
        positiveOutcomes = Math.min(counts[val1], counts[val2]);
      }
    } else {
      // Not strictly binary, just take the first key for demonstration 
      positiveOutcomes = uniqueVals.length > 0 ? counts[uniqueVals[0]] : 0;
    }
  }

  // Chart data
  const outcomeData = [
    { name: "Positive", value: positiveOutcomes, color: "#ef4444" },
    { name: "Negative", value: validOutcomeCount - positiveOutcomes, color: "#22c55e" },
  ];

  const minorityPct =
    validOutcomeCount > 0
      ? Math.min(positiveOutcomes, validOutcomeCount - positiveOutcomes) / validOutcomeCount
      : 0;
  const showImbalanceWarning = validOutcomeCount > 0 && minorityPct > 0 && minorityPct < 0.15;

  const pagedData = dataset.slice(
    tablePage * pageSize,
    (tablePage + 1) * pageSize
  );
  const totalPages = Math.ceil(totalPatients / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-slate-900 mb-1">Step 2: Data Exploration</h2>
          <p className="text-[14px] text-slate-500 max-w-2xl">
            Before training any model, we examine what data is available. Use the default dataset or upload your own CSV file of patient records.
          </p>
        </div>
        <button
          onClick={() => goToStep(2)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer text-[14px]"
        >
          Next Step
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-slate-900 font-medium">Data Source</h3>
            <div className="flex gap-2 mb-2">
              <button className="flex-1 py-2 px-4 text-[13px] font-medium rounded-lg border-2 border-blue-600 text-blue-700 bg-blue-50">
                Use Default Dataset
              </button>

              <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-2 px-4 text-[13px] font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
                Upload Your CSV
              </button>

              <input
                type="file"
                accept=".csv"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileSelect}
              />
            </div>

            <div className="pt-2">
              <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Target Column (What We Want to Predict)
              </label>
              <select 
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] text-slate-700 outline-none focus:border-blue-500"
                value={selectedTargetColumn}
                onChange={(e) => setSelectedTargetColumn(e.target.value)}
              >
                {columns.length > 0 ? (
                  columns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))
                ) : (
                  <option>Outcome (Positive/Negative)</option>
                )}
              </select>
              <div className="text-[11px] text-slate-500 mt-1.5">
                This is the outcome the model will learn to predict.
              </div>
            </div>

            <button
              onClick={() => setIsMapperOpen(true)}
              className="w-full py-2.5 flex items-center justify-center gap-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition text-[14px] mt-4 font-medium"
            >
              🗂 Open Column Mapper & Validate
            </button>

            {!schemaValid ? (
              <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-xl mt-3">
                <span className="text-orange-600 mt-0.5 shrink-0 text-lg">⚠️</span>
                <div className="text-[13px] text-orange-900">
                  <span className="font-bold">Action needed:</span> Open the Column Mapper to confirm your data structure before continuing to Step 3.
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-xl mt-3">
                <span className="text-green-600 mt-0.5 shrink-0 text-lg">✅</span>
                <div className="text-[13px] text-green-900">
                  <span className="font-bold">Valid:</span> Target is binary, has no missing values, and identifier column is excluded.
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-slate-900 font-medium">Dataset Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100">
                <div className="text-2xl text-slate-800 font-semibold">{totalPatients}</div>
                <div className="text-[12px] text-slate-500 mt-1">Patients</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100">
                <div className="text-2xl text-slate-800 font-semibold">{columns.length}</div>
                <div className="text-[12px] text-slate-500 mt-1">Measurements</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 text-center border border-orange-200">
                <div className="text-2xl text-orange-700 font-semibold">{missingDataPct}%</div>
                <div className="text-[12px] text-orange-600 mt-1">Missing Data</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-slate-900 font-medium">Class Balance — Positive vs. Negative</h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-[13px]">
                <div className="w-32 text-slate-600">Negative (0)</div>
                <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-400" style={{ width: `${validOutcomeCount > 0 ? Math.round(((validOutcomeCount - positiveOutcomes) / validOutcomeCount) * 100) : 0}%` }}></div>
                </div>
                <div className="w-12 text-right font-medium text-slate-700">
                  {validOutcomeCount > 0 ? Math.round(((validOutcomeCount - positiveOutcomes) / validOutcomeCount) * 100) : 0}%
                </div>
              </div>

              <div className="flex items-center gap-3 text-[13px]">
                <div className="w-32 text-slate-600">Positive (1)</div>
                <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500" style={{ width: `${validOutcomeCount > 0 ? Math.round((positiveOutcomes / validOutcomeCount) * 100) : 0}%` }}></div>
                </div>
                <div className="w-12 text-right font-medium text-slate-700">
                  {validOutcomeCount > 0 ? Math.round((positiveOutcomes / validOutcomeCount) * 100) : 0}%
                </div>
              </div>
            </div>

            {showImbalanceWarning && (
              <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl mt-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div className="text-[13px] text-red-900">
                  <span className="font-bold">Class imbalance warning:</span>{" "}
                  One outcome is rare ({Math.round(minorityPct * 100)}%). This can make a model look accurate while missing real cases. Consider SMOTE in Step 3.
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl mt-3">
              <span className="text-blue-600 mt-0.5 shrink-0">ℹ️</span>
              <div className="text-[13px] text-blue-900">
                <span className="font-bold">Target Column Selected:</span> {selectedTargetColumn || 'None'}
              </div>
            </div>

            <h3 className="text-slate-900 font-medium pt-4 border-t border-slate-100">Patient Measurements (Features)</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-3 font-medium">Measurement</th>
                    <th className="p-3 font-medium">Type</th>
                    <th className="p-3 font-medium">Missing?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {columns.slice(0, 5).map(col => {
                    let missing = 0;
                    dataset.forEach(row => {
                      if (row[col] === null || row[col] === undefined || row[col] === '') missing++;
                    });
                    const missingPct = totalPatients > 0 ? ((missing / totalPatients) * 100).toFixed(1) : "0.0";
                    return (
                      <tr key={col}>
                        <td className="p-3">{col}</td>
                        <td className="p-3">{dataset.length > 0 ? typeof dataset[0][col] : "Unknown"}</td>
                        <td className="p-3">{missingPct}%</td>
                      </tr>
                    )
                  })}
                  {columns.length > 5 && (
                    <tr>
                      <td colSpan={3} className="p-3 text-slate-500 italic">... and {columns.length - 5} more</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-slate-100">
        <button
          onClick={() => goToStep(0)}
          className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition cursor-pointer text-[14px]"
        >
          ← Previous
        </button>
        <button
          onClick={() => goToStep(2)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer text-[14px]"
        >
          Next Step
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* COLUMN MAPPER MODAL */}
      {isMapperOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center px-4 py-8"
          onClick={(e) => { if (e.target === e.currentTarget) setIsMapperOpen(false); }}
        >
          <div className="bg-slate-50 rounded-2xl shadow-xl w-full max-w-5xl max-h-full flex flex-col overflow-hidden">

            {/* Modal Head */}
            <div className="p-6 border-b border-slate-200 bg-white flex justify-between items-start shrink-0">
              <div>
                <h3 className="text-xl text-slate-900 font-semibold mb-1">Column Mapper & Schema Validator</h3>
                <p className="text-[14px] text-slate-500 max-w-2xl">
                  Assign a role to each column in your dataset. This prevents the model from accidentally using patient IDs or other non-clinical information that would give misleading results.
                </p>
              </div>
              <button onClick={() => setIsMapperOpen(false)} className="text-[14px] text-slate-500 hover:text-slate-800 font-medium px-3 py-1.5 border border-slate-200 rounded-lg transition-colors cursor-pointer bg-white hover:bg-slate-50">
                ✕ Close
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

              {/* Settings & Preview */}
              <div className="space-y-6">
                  <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                  <h4 className="font-medium text-slate-900">Settings</h4>
                  
                  <div className="flex gap-2 flex-wrap mt-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] border transition-colors ${schemaValid ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                      <div className={`w-2 h-2 rounded-full ${schemaValid ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                      Schema: <span className="font-semibold">{schemaValid ? "Valid" : "Needs review"}</span>
                    </span>
                  </div>

                  {validationMsg && (
                    <div className={`flex items-start gap-3 p-3 border rounded-xl mt-2 text-[13px] transition-all ${
                      validationMsg.type === 'error' ? 'bg-red-50 border-red-200 text-red-900' : 
                      validationMsg.type === 'success' ? 'bg-green-50 border-green-200 text-green-900' : 
                      'bg-blue-50 border-blue-200 text-blue-900'
                    }`}>
                      <span className="mt-0.5 shrink-0 text-lg">
                        {validationMsg.type === 'error' ? '❌' : validationMsg.type === 'success' ? '✅' : 'ℹ️'}
                      </span>
                      <div><span className="font-bold">{validationMsg.type === 'error' ? 'Error: ' : ''}</span>{validationMsg.text}</div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={async () => {
                         const targetCols = Object.entries(mapperState).filter(([k,v]) => v === "Target");
                         if (targetCols.length !== 1) {
                            setValidationMsg({ type: 'error', text: 'You must select exactly ONE column as the Target.' });
                            setSchemaValid(false);
                            setValidatedTargetColumn("");
                            return;
                         }
                         const targetCol = targetCols[0][0];
                         
                         let missing = 0;
                         dataset.forEach(row => {
                           if (row[targetCol] === null || row[targetCol] === undefined || row[targetCol] === '') missing++;
                         });
                         const missingPct = dataset.length > 0 ? (missing / dataset.length) : 0;
                         
                         if (missingPct > 0.20) {
                            setValidationMsg({ type: 'error', text: `Target column ${targetCol} has >20% missing values (${(missingPct*100).toFixed(1)}%). Please select a different target or clean the data.`});
                            setSchemaValid(false);
                            setValidatedTargetColumn("");
                            return;
                         }

                         try {
                          // Local validation only. Save happens via "Save Mapping" in the footer.
                          setSchemaValid(true);
                          setValidatedTargetColumn(targetCol);
                          setValidationMsg({ type: 'success', text: 'Validated! Now click “Save Mapping” to unlock Step 3.' });
                         } catch(e: any) {
                           setValidationMsg({ type: 'error', text: e.message });
                           setSchemaValid(false);
                          setValidatedTargetColumn("");
                         }
                      }}
                      className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-[13px] font-medium transition flex-1 cursor-pointer bg-white"
                    >
                      Validate Mapping
                    </button>
                  </div>
                </div>
              </div>

              {/* Column Roles */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col h-full space-y-4">
                <h4 className="font-medium text-slate-900">Column Roles — Drag to Assign</h4>

                  <div className="overflow-x-auto rounded-lg border border-slate-200 flex-1 min-h-[300px]">
                  <table className="w-full text-left text-[13px] whitespace-nowrap min-w-[400px]">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2.5 font-medium">Column Name</th>
                        <th className="px-3 py-2.5 font-medium">Auto-Detected</th>
                        <th className="px-3 py-2.5 font-medium">Assign Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {columns.map((col) => {
                        const val = dataset.length > 0 ? dataset[0][col] : null;
                        let autoDetectStr = 'Category';
                        let pillClass = 'bg-blue-100 text-blue-700 border-blue-200';
                        if (typeof val === 'number') {
                          autoDetectStr = 'Number';
                          pillClass = 'bg-green-100 text-green-700 border-green-200';
                        } else if (col.toLowerCase().includes('id') || col.toLowerCase().includes('uuid')) {
                          autoDetectStr = 'Identifier-like';
                          pillClass = 'bg-red-100 text-red-700 border-red-200';
                        }

                        return (
                          <tr key={col} className="hover:bg-slate-50">
                            <td className="px-3 py-3 font-medium text-slate-800">{col}</td>
                            <td className="px-3 py-3">
                              <span className={`px-2 py-1 rounded flex w-max text-[11px] font-medium border ${pillClass}`}>
                                {autoDetectStr}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <select 
                                className="w-full text-slate-700 text-[13px] border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-blue-500 bg-white"
                                value={mapperState[col] || "Category"}
                                onChange={(e) => {
                                  setMapperState({ ...mapperState, [col]: e.target.value });
                                  setSchemaValid(false);
                                  setValidatedTargetColumn("");
                                  setSchemaOK(false);
                                  setValidationMsg(null);
                                }}
                              >
                                <option value="Target">Target (what we predict)</option>
                                <option value="Number">Number</option>
                                <option value="Category">Category</option>
                                <option value="Ignore">Ignore</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[13px] shrink-0">
                  <span className="mt-0.5 shrink-0 text-lg">ℹ️</span>
                  <div><span className="font-bold">Blocking rules:</span> No target column = blocked · Target column has more than 20% missing values = blocked · All columns set to Ignore = blocked</div>
                </div>
              </div>

            </div>

            {/* Modal Foot */}
            <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center shrink-0">
              <div className="text-[13px] text-slate-500">
                Validate first, then save to unlock Step 3.
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsMapperOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-[14px] font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!schemaValid || !validatedTargetColumn) {
                      setValidationMsg({ type: "error", text: "Please validate the mapping first." });
                      return;
                    }
                    try {
                      const response = await fetch(`/api/dataset/${datasetId}/map-columns`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ mappedColumns: mapperState, targetColumn: validatedTargetColumn }),
                      });
                      if (!response.ok) throw new Error("Failed to save mapping");

                      setSchemaOK(true);
                      setTargetColumn(validatedTargetColumn);
                      setValidationMsg({ type: "success", text: "Saved! Step 3 is now unlocked." });
                      setIsMapperOpen(false);
                    } catch (e: any) {
                      setValidationMsg({ type: "error", text: e.message });
                    }
                  }}
                  disabled={!schemaValid || !validatedTargetColumn}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-[14px] font-medium transition cursor-pointer"
                >
                  Save Mapping
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
