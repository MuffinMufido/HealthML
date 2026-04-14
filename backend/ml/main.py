"""
HealthML Python ML Service
Real scikit-learn training, ablation-based explanations, subgroup fairness.
Run with: venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
"""

import uuid
import time
from typing import Any, Dict, List

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from imblearn.over_sampling import SMOTE
from pydantic import BaseModel
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.inspection import permutation_importance
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import auc as sklearn_auc, roc_curve
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.preprocessing import MinMaxScaler, StandardScaler
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier

app = FastAPI(title="HealthML ML Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory model store — keyed by modelId (UUID)
model_store: Dict[str, Any] = {}


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class PrepareRequest(BaseModel):
    dataset: List[Dict[str, Any]]
    targetColumn: str = ""
    mappedColumns: Dict[str, str] = {}
    missingValues: str = "median"   # mean | median | mode | drop
    normalize: str = "zscore"       # zscore | minmax | none
    imbalance: str = "smote"        # smote | weights | none
    trainSplit: float = 80


class TrainRequest(BaseModel):
    dataset: List[Dict[str, Any]]
    targetColumn: str
    modelType: str = "randomForest"
    params: Dict[str, Any] = {}
    trainSplit: float = 80
    imbalance: str = "none"   # smote | weights | none


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def to_binary(val: Any) -> int:
    v = str(val or "").strip().lower()
    return 1 if v in {"1", "yes", "true", "positive", "abnormal"} else 0


def build_model(model_type: str, params: dict, class_weight=None):
    if model_type == "logistic":
        max_iter = max(100, int(params.get("iterations", 500)))
        C = max(1e-3, float(params.get("regularization", 1.0)))
        return LogisticRegression(C=C, max_iter=max_iter, random_state=42, class_weight=class_weight)

    if model_type == "decisionTree":
        depth = max(1, int(params.get("depth", 5)))
        min_samples = max(1, int(params.get("minSamples", 2)))
        return DecisionTreeClassifier(max_depth=depth, min_samples_leaf=min_samples, random_state=42, class_weight=class_weight)

    if model_type == "randomForest":
        n_trees = max(10, int(params.get("trees", 100)))
        raw_depth = params.get("depth", 5)
        depth = None if not raw_depth else max(1, int(raw_depth))
        return RandomForestClassifier(n_estimators=n_trees, max_depth=depth, random_state=42, class_weight=class_weight)

    if model_type == "svm":
        C = max(1e-3, float(params.get("C", 1.0)))
        kernel = str(params.get("kernel", "rbf")).lower()
        if kernel not in ("linear", "rbf", "poly", "sigmoid"):
            kernel = "rbf"
        return SVC(C=C, kernel=kernel, probability=True, random_state=42, class_weight=class_weight)

    if model_type == "knn":
        k = max(1, min(25, int(params.get("k", 5))))
        return KNeighborsClassifier(n_neighbors=k)  # KNN has no class_weight

    if model_type == "naiveBayes":
        var_smoothing = max(1e-12, float(params.get("varSmoothing", 1)) * 1e-9)
        return GaussianNB(var_smoothing=var_smoothing)  # GaussianNB has no class_weight

    return RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42, class_weight=class_weight)


def compute_metrics(y_true: np.ndarray, y_prob: np.ndarray, threshold: float = 0.5) -> dict:
    y_pred = (y_prob >= threshold).astype(int)
    tp = int(((y_true == 1) & (y_pred == 1)).sum())
    tn = int(((y_true == 0) & (y_pred == 0)).sum())
    fp = int(((y_true == 0) & (y_pred == 1)).sum())
    fn = int(((y_true == 1) & (y_pred == 0)).sum())
    total = max(1, tp + tn + fp + fn)
    accuracy = (tp + tn) / total
    sensitivity = tp / max(1, tp + fn)
    specificity = tn / max(1, tn + fp)
    precision = tp / max(1, tp + fp)
    f1 = (2 * precision * sensitivity) / max(1e-9, precision + sensitivity)
    return {
        "confusion": {"tn": tn, "fp": fp, "fn": fn, "tp": tp},
        "metrics": {
            "accuracy": accuracy,
            "sensitivity": sensitivity,
            "specificity": specificity,
            "precision": precision,
            "f1": f1,
        },
    }


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok", "message": "HealthML Python ML service running"}


@app.post("/prepare")
def prepare(req: PrepareRequest):
    if len(req.dataset) < 10:
        raise HTTPException(400, "Dataset must have at least 10 rows.")

    df = pd.DataFrame(req.dataset)
    target_col = req.targetColumn

    # Identify numeric feature columns
    if req.mappedColumns:
        numeric_cols = [c for c, t in req.mappedColumns.items() if t == "Number" and c in df.columns]
    else:
        numeric_cols = [
            c for c in df.columns
            if c != target_col and pd.to_numeric(df[c], errors="coerce").notna().any()
        ]

    if not numeric_cols:
        raise HTTPException(400, "No numeric columns found.")

    # ── 1. Missing values ────────────────────────────────────────────────────
    if req.missingValues == "drop":
        df = df.dropna(subset=numeric_cols).reset_index(drop=True)
    else:
        strategy = req.missingValues if req.missingValues in ("mean", "median", "most_frequent") else "median"
        if req.missingValues == "mode":
            strategy = "most_frequent"
        imputer = SimpleImputer(strategy=strategy)
        df[numeric_cols] = imputer.fit_transform(df[numeric_cols])

    if len(df) < 10:
        raise HTTPException(400, "Not enough rows remaining after dropping missing values.")

    # ── 2. Train / test split (shuffle first) ────────────────────────────────
    train_pct = max(0.60, min(0.90, req.trainSplit / 100))
    df_shuffled = df.sample(frac=1, random_state=42).reset_index(drop=True)
    n_train = max(1, min(len(df_shuffled) - 1, round(train_pct * len(df_shuffled))))
    df_train = df_shuffled.iloc[:n_train].copy()
    df_test  = df_shuffled.iloc[n_train:].copy()

    # ── 3. Normalization (fit on train, transform both) ──────────────────────
    viz_col = numeric_cols[0] if numeric_cols else None
    before_stats = {"min": 0.0, "max": 0.0, "avg": 0.0}
    after_stats  = {"min": 0.0, "max": 0.0, "avg": 0.0}

    if viz_col:
        vals = pd.to_numeric(df_train[viz_col], errors="coerce").dropna()
        before_stats = {
            "min": float(vals.min()),
            "max": float(vals.max()),
            "avg": float(vals.mean()),
        }

    if req.normalize != "none" and numeric_cols:
        scaler = MinMaxScaler() if req.normalize == "minmax" else StandardScaler()
        df_train[numeric_cols] = scaler.fit_transform(df_train[numeric_cols])
        df_test[numeric_cols]  = scaler.transform(df_test[numeric_cols])

        if viz_col:
            vals_after = pd.to_numeric(df_train[viz_col], errors="coerce").dropna()
            after_stats = {
                "min": float(vals_after.min()),
                "max": float(vals_after.max()),
                "avg": float(vals_after.mean()),
            }
    else:
        after_stats = before_stats.copy()

    # ── 4. Class imbalance — real SMOTE on training set only ─────────────────
    def count_classes(data: pd.DataFrame):
        if not target_col or target_col not in data.columns:
            return {"positive": 0, "negative": 0, "total": len(data)}
        labels = data[target_col].apply(to_binary)
        pos = int(labels.sum())
        neg = int(len(labels) - pos)
        return {"positive": pos, "negative": neg, "total": len(data)}

    before_class = count_classes(df_train)
    after_class  = before_class.copy()
    smote_note = "No imbalance treatment applied."

    if req.imbalance == "smote" and target_col and target_col in df_train.columns:
        X_tr = df_train[numeric_cols].values.astype(float)
        y_tr = df_train[target_col].apply(to_binary).values

        unique, counts = np.unique(y_tr, return_counts=True)
        min_count = int(counts.min()) if len(counts) > 0 else 0
        k_neighbors = min(5, min_count - 1) if min_count > 1 else 0

        if len(unique) == 2 and k_neighbors >= 1:
            try:
                sm = SMOTE(k_neighbors=k_neighbors, random_state=42)
                X_res, y_res = sm.fit_resample(X_tr, y_tr)
                n_orig = len(X_tr)

                # Rebuild df_train with SMOTE rows
                df_smote = pd.DataFrame(X_res, columns=numeric_cols)
                df_smote[target_col] = y_res
                # Restore non-numeric columns with majority value for synthetic rows
                for col in df_train.columns:
                    if col not in numeric_cols and col != target_col:
                        df_smote[col] = df_train[col].mode()[0] if len(df_train[col].mode()) > 0 else None
                # Tag synthetic rows so /train can keep them out of the test set
                df_smote["__smote__"] = False
                df_smote.loc[n_orig:, "__smote__"] = True
                df_train = df_smote
                after_class = count_classes(df_train)
                smote_note = f"Real SMOTE applied: {n_orig} → {len(X_res)} training samples (k_neighbors={k_neighbors})."
            except Exception as e:
                smote_note = f"SMOTE skipped: {e}"
        else:
            smote_note = f"SMOTE skipped: need ≥2 classes and ≥2 minority samples (found min_count={min_count})."

    # ── 5. Combine and return ─────────────────────────────────────────────────
    combined = pd.concat([df_train, df_test], ignore_index=True)
    # Convert NaN → None so JSON serialises cleanly
    result_data = combined.where(pd.notna(combined), None).to_dict(orient="records")

    return {
        "success": True,
        "message": f"Data prepared. {smote_note}",
        "stats": {
            "normalize": {
                "vizCol": viz_col,
                "before": before_stats,
                "after": after_stats,
            },
            "split": {
                "trainPct": round(train_pct * 100),
                "trainCount": int(len(df_train)),
                "testCount": int(len(df_test)),
                "scope": "SMOTE applied to training set only",
            },
            "imbalance": {
                "scope": "training",
                "before": before_class,
                "after": after_class,
            },
        },
        "data": result_data,
    }


@app.post("/train")
def train(req: TrainRequest):
    start = time.time()

    if len(req.dataset) < 20:
        raise HTTPException(400, "Dataset must have at least 20 rows.")

    df = pd.DataFrame(req.dataset)
    target_col = req.targetColumn

    if target_col not in df.columns:
        raise HTTPException(400, f"Target column '{target_col}' not found.")

    # Segregate SMOTE-synthetic rows — they must stay in training only
    smote_col = "__smote__"
    if smote_col in df.columns:
        smote_mask = df[smote_col].fillna(False).astype(bool)
        df_smote_only = df[smote_mask].drop(columns=[smote_col]).reset_index(drop=True)
        df = df[~smote_mask].drop(columns=[smote_col]).reset_index(drop=True)
    else:
        df_smote_only = pd.DataFrame()

    id_words = {"id", "uuid", "index", "patient_id", "patientid"}
    feature_cols = [
        c for c in df.columns
        if c != target_col
        and not any(w in c.lower() for w in id_words)
        and pd.to_numeric(df[c], errors="coerce").notna().any()
    ]

    if not feature_cols:
        raise HTTPException(400, "No numeric feature columns found.")

    X_raw = df[feature_cols].apply(pd.to_numeric, errors="coerce")
    y_raw = df[target_col].apply(to_binary)
    mask = X_raw.notna().all(axis=1)
    X_raw, y_raw = X_raw[mask], y_raw[mask]
    df_clean = df[mask].reset_index(drop=True)

    if len(X_raw) < 20:
        raise HTTPException(400, "Not enough valid rows after cleaning.")

    X = X_raw.values.astype(float)
    y = y_raw.values.astype(int)

    train_pct = max(0.60, min(0.90, req.trainSplit / 100))
    n_train = max(1, min(len(X) - 1, round(train_pct * len(X))))
    idx = np.random.permutation(len(X))
    train_idx, test_idx = idx[:n_train], idx[n_train:]

    X_train, X_test = X[train_idx], X[test_idx]
    y_train, y_test = y[train_idx], y[test_idx]

    # Append SMOTE synthetic rows to training set only
    if len(df_smote_only) > 0 and all(c in df_smote_only.columns for c in feature_cols + [target_col]):
        X_syn = df_smote_only[feature_cols].apply(pd.to_numeric, errors="coerce").fillna(0).values.astype(float)
        y_syn = df_smote_only[target_col].apply(to_binary).values.astype(int)
        X_train = np.vstack([X_train, X_syn])
        y_train = np.concatenate([y_train, y_syn])

    scaler = StandardScaler()
    X_train_sc = scaler.fit_transform(X_train)
    X_test_sc = scaler.transform(X_test)

    class_weight = "balanced" if req.imbalance == "weights" else None
    model = build_model(req.modelType, req.params, class_weight=class_weight)
    try:
        model.fit(X_train_sc, y_train)
    except Exception as e:
        raise HTTPException(500, f"Training failed: {e}")

    y_prob = model.predict_proba(X_test_sc)[:, 1]
    result = compute_metrics(y_test, y_prob, 0.5)

    roc_points = []
    for t_int in range(21):
        t = t_int / 20
        m = compute_metrics(y_test, y_prob, t)
        roc_points.append({
            "threshold": round(t, 2),
            "tpr": m["metrics"]["sensitivity"],
            "fpr": 1 - m["metrics"]["specificity"],
        })
    roc_sorted = sorted(roc_points, key=lambda p: p["fpr"])

    if len(np.unique(y_test)) > 1:
        fpr_arr, tpr_arr, _ = roc_curve(y_test, y_prob)
        auc_val = float(sklearn_auc(fpr_arr, tpr_arr))
    else:
        auc_val = 0.5

    model_id = str(uuid.uuid4())
    model_store[model_id] = {
        "model": model,
        "scaler": scaler,
        "feature_cols": feature_cols,
        "X_train_sc": X_train_sc,
        "X_test_sc": X_test_sc,
        "X_test_raw": X_test,
        "X_train_mean": X_train.mean(axis=0),
        "X_train_std": X_train.std(axis=0) + 1e-9,
        "y_test": y_test,
        "y_prob": y_prob,
        "df_full": df_clean,
        "target_col": target_col,
        "model_type": req.modelType,
    }

    return {
        "success": True,
        "modelType": req.modelType,
        "modelId": model_id,
        "split": {
            "trainPct": round(train_pct * 100),
            "trainCount": int(len(X_train)),
            "testCount": int(len(X_test)),
        },
        "featureColumns": feature_cols,
        "confusionMatrix": result["confusion"],
        "metrics": {**result["metrics"], "auc": auc_val},
        "roc": roc_sorted,
        "thresholds": {
            "accuracy":    {"green": 0.80, "amber": 0.70},
            "sensitivity": {"green": 0.75, "amber": 0.50},
            "specificity": {"green": 0.80, "amber": 0.70},
            "precision":   {"green": 0.75, "amber": 0.60},
            "f1":          {"green": 0.75, "amber": 0.60},
            "auc":         {"green": 0.85, "amber": 0.70},
        },
        "flags": {"lowSensitivityDanger": result["metrics"]["sensitivity"] < 0.5},
        "trainingLatencyMs": round((time.time() - start) * 1000),
    }


def _pretty_name(col: str) -> str:
    """Convert snake_case column name to Title Case with spaces."""
    return col.replace("_", " ").replace("-", " ").title()


def _qualitative(z: float) -> str:
    if z < -1.5: return "very low"
    if z < -0.5: return "low"
    if z <= 0.5: return "average"
    if z <= 1.5: return "high"
    return "very high"


def _global_importance(entry: dict) -> list:
    model = entry["model"]
    feature_cols = entry["feature_cols"]
    model_type = entry["model_type"]

    if model_type in ("randomForest", "decisionTree"):
        importances = model.feature_importances_.copy()
    elif model_type == "logistic":
        importances = np.abs(model.coef_[0])
    else:
        perm = permutation_importance(
            model, entry["X_test_sc"], entry["y_test"],
            n_repeats=10, random_state=42, scoring="roc_auc",
        )
        importances = np.maximum(perm.importances_mean, 0)

    total = importances.sum()
    norm = (importances / total) if total > 0 else np.ones(len(importances)) / len(importances)
    order = np.argsort(norm)[::-1]
    max_val = float(norm[order[0]]) if len(order) > 0 else 1.0

    result = []
    for i in order[:6]:
        val = float(norm[i])
        pct_int = round(val / max_val * 100) if max_val > 0 else 0
        result.append({"label": _pretty_name(feature_cols[i]), "value": round(val, 3), "pct": f"{pct_int}%"})
    return result


def _patient_explanations(entry: dict) -> list:
    model = entry["model"]
    X_test_sc = entry["X_test_sc"]
    X_test_raw = entry["X_test_raw"]
    y_prob = entry["y_prob"]
    feature_cols = entry["feature_cols"]
    X_means_sc = entry["X_train_sc"].mean(axis=0)
    X_train_mean = entry["X_train_mean"]
    X_train_std = entry["X_train_std"]

    if len(X_test_sc) == 0:
        return []

    high_idx   = np.where(y_prob > 0.65)[0]
    low_idx    = np.where(y_prob < 0.35)[0]
    border_idx = np.where((y_prob >= 0.40) & (y_prob <= 0.60))[0]
    sorted_desc = np.argsort(y_prob)[::-1]

    candidates = {
        "HIGH RISK": int(high_idx[0])    if len(high_idx)    else int(sorted_desc[0]),
        "LOW RISK":  int(low_idx[0])     if len(low_idx)     else int(sorted_desc[-1]),
        "MODERATE":  int(border_idx[0])  if len(border_idx)  else int(sorted_desc[len(sorted_desc) // 2]),
    }

    patients = []
    for risk_label, idx in candidates.items():
        patient_sc = X_test_sc[idx]
        patient_raw = X_test_raw[idx]
        prob = float(y_prob[idx])
        base_prob = model.predict_proba([patient_sc])[0][1]

        contributions = []
        for feat_i, feat_name in enumerate(feature_cols):
            modified = patient_sc.copy()
            modified[feat_i] = X_means_sc[feat_i]
            ablated = model.predict_proba([modified])[0][1]
            contributions.append((feat_i, feat_name, float(base_prob - ablated)))

        contributions.sort(key=lambda x: abs(x[2]), reverse=True)
        top5 = contributions[:5]
        max_abs = max(abs(c[2]) for c in top5) if top5 else 1.0
        if max_abs < 1e-9:
            max_abs = 1e-9

        bars = []
        for feat_i, feat_name, contrib in top5:
            is_bad = contrib > 0
            pct_int = round(abs(contrib) / max_abs * 80)
            raw_val = float(patient_raw[feat_i])
            z = (raw_val - float(X_train_mean[feat_i])) / float(X_train_std[feat_i])
            descriptor = _qualitative(z)
            pretty = _pretty_name(feat_name)
            # Format value: if it looks like a proportion (0–1), show as %; else round to 1 dp
            if 0.0 <= raw_val <= 1.0 and float(X_train_mean[feat_i]) <= 1.0:
                val_display = f"{round(raw_val * 100)}%"
            else:
                val_display = f"{raw_val:.1f}"
            label = f"{pretty} — {descriptor} ({val_display})"
            val_str = f"+{contrib:.3f}" if contrib >= 0 else f"{contrib:.3f}"
            bars.append({
                "label": label,
                "val": val_str,
                "pct": f"{pct_int}%",
                "type": "bad" if is_bad else "good",
            })

        top_pretty = _pretty_name(top5[0][1]) if top5 else "Unknown"
        if top5 and top5[0][2] > 0:
            drop_pct = round(abs(top5[0][2]) * 100)
            info = (f"'{top_pretty}' most strongly increases this patient's risk. "
                    f"If it were closer to the population average, predicted risk would "
                    f"fall by approximately {drop_pct} percentage points.")
        elif top5:
            info = f"'{top_pretty}' most strongly protects against risk for this patient — it is pulling the prediction toward a safe outcome."
        else:
            info = "No dominant feature identified."

        patients.append({
            "index": idx,
            "risk": risk_label,
            "prob": f"{round(prob * 100)}%",
            "summary": f"Test Patient {idx + 1} · {risk_label} ({round(prob * 100)}%)",
            "bars": bars,
            "info": info,
        })

    return patients


@app.get("/explain")
def explain(modelId: str = Query(...)):
    if modelId not in model_store:
        raise HTTPException(404, "Model not found. Train a model first.")
    entry = model_store[modelId]
    return {"globalFeatures": _global_importance(entry), "patients": _patient_explanations(entry)}


@app.get("/fairness")
def fairness(modelId: str = Query(...)):
    if modelId not in model_store:
        raise HTTPException(404, "Model not found. Train a model first.")

    entry = model_store[modelId]
    model, scaler = entry["model"], entry["scaler"]
    feature_cols, df = entry["feature_cols"], entry["df_full"]
    target_col = entry["target_col"]

    X_all = df[feature_cols].apply(pd.to_numeric, errors="coerce").fillna(0).values.astype(float)
    y_all = df[target_col].apply(to_binary).values.astype(int)
    y_prob_all = model.predict_proba(scaler.transform(X_all))[:, 1]

    overall = compute_metrics(y_all, y_prob_all, 0.5)["metrics"]
    overall_sensitivity = overall["sensitivity"]

    def status_for_gap(gap: float):
        if gap > 0.15: return "bad", "⚠ Review Needed"
        if gap > 0.08: return "warn", "Review"
        return "good", "OK"

    subgroups = []

    gender_col = next((c for c in df.columns if c.lower() in ("gender", "sex")), None)
    if gender_col:
        for group_val in df[gender_col].dropna().unique():
            mask = (df[gender_col] == group_val).values
            if mask.sum() < 5:
                continue
            m = compute_metrics(y_all[mask], y_prob_all[mask], 0.5)["metrics"]
            st, fl = status_for_gap(overall_sensitivity - m["sensitivity"])
            subgroups.append({
                "group": str(group_val),
                "accuracy": f"{round(m['accuracy'] * 100)}%",
                "sensitivity": f"{round(m['sensitivity'] * 100)}%",
                "specificity": f"{round(m['specificity'] * 100)}%",
                "fairness": fl, "status": st,
            })

    age_col = next((c for c in df.columns if c.lower() == "age"), None)
    if age_col:
        age_vals = pd.to_numeric(df[age_col], errors="coerce")
        for name, band in [("Age 18–60", (age_vals >= 18) & (age_vals <= 60)),
                           ("Age 61–75", (age_vals >= 61) & (age_vals <= 75)),
                           ("Age 76+",   age_vals > 75)]:
            mask = band.fillna(False).values
            if mask.sum() < 5:
                continue
            m = compute_metrics(y_all[mask], y_prob_all[mask], 0.5)["metrics"]
            st, fl = status_for_gap(overall_sensitivity - m["sensitivity"])
            subgroups.append({
                "group": name,
                "accuracy": f"{round(m['accuracy'] * 100)}%",
                "sensitivity": f"{round(m['sensitivity'] * 100)}%",
                "specificity": f"{round(m['specificity'] * 100)}%",
                "fairness": fl, "status": st,
            })

    bad_groups = [s for s in subgroups if s["status"] == "bad"]
    bias_detected = len(bad_groups) > 0
    bias_message = ""
    if bias_detected:
        w = bad_groups[0]
        bias_message = (
            f"Sensitivity for {w['group']} ({w['sensitivity']}) is significantly "
            f"below overall ({round(overall_sensitivity * 100)}%). "
            f"Do not deploy without retraining on a more representative dataset."
        )

    representation: dict = {}
    if gender_col:
        for val, pct in df[gender_col].value_counts(normalize=True).items():
            representation[str(val).lower()] = round(float(pct), 2)

    return {
        "subgroups": subgroups,
        "biasDetected": bias_detected,
        "biasMessage": bias_message,
        "representation": representation,
        "overallMetrics": {k: round(v * 100) for k, v in overall.items()},
    }
