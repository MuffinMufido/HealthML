# HealthML — Kapsamlı Proje Analizi

> Oluşturulma: 14 Mayıs 2026 · Grup: KaraKartallar · Ders: SENG 430

## 1. Proje Kimliği ve Amaç

| Alan | Değer |
|------|-------|
| **Ad** | HealthML — ML Clinical Visualizer |
| **Ders** | SENG 430 — Software Quality Assurance Laboratory |
| **Grup** | KaraKartallar |
| **Metodoloji** | Scrum, 5 sprint, 10 hafta |
| **Canlı URL** | http://www.healthml.com.tr/ (GCP: `35.190.207.2`) |
| **Repo** | https://github.com/MuffinMufido/HealthML.git |
| **Amaç** | Sağlık profesyonelleri ve öğrencilere klinik ML sürecini (veri → eğitim → yorumlama → adalet denetimi) **eğitim amaçlı** adım adım göstermek |

Uygulama gerçek scikit-learn eğitimi yapar; klinik karar desteği değildir. PDF sertifika, EU AI Act checklist ve ML sözlüğü ile governance/etik katmanı da vardır.

---

## 2. Mimari

```
Browser (React/Vite :5173)
    → /api/* → Express (:3001)
        → HTTP JSON → FastAPI ML (:8000)
```

**7 adımlı pipeline:** ClinicalContext → DataExploration → DataPreparation → ModelParameters → Results → Explainability → EthicsBias

Merkezi durum: `app/components/MLContext.tsx` — specialty, dataset, prep config, model config, train results, step gating.

Production Docker: Nginx :80 → static frontend + `/api/` proxy → backend → ML servisi.

---

## 3. Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React 19, Vite 8, TypeScript, Tailwind 4, Radix/shadcn, Recharts |
| Backend API | Node.js, Express 5, TypeScript, Multer, PapaParse |
| ML servisi | Python 3.11, FastAPI, scikit-learn, imbalanced-learn, fpdf2 |
| Test | Playwright E2E |
| Deploy | Docker Compose, Nginx, GCP Compute Engine |

**Veritabanı yok** — tüm state in-memory (React Context, `datasetsParams`, `model_store`).

---

## 4. ML Servisi

Dosya: `backend/ml/main.py`

### Modeller
| modelType | sklearn |
|-----------|---------|
| logistic | LogisticRegression |
| decisionTree | DecisionTreeClassifier |
| randomForest | RandomForestClassifier |
| svm | SVC(probability=True) |
| knn | KNeighborsClassifier |
| neuralNetwork | MLPClassifier |

### Endpoint'ler
- `POST /prepare` — imputation, normalizasyon, split, SMOTE
- `POST /train` — model eğitimi, metrikler, modelId
- `GET /explain` — global + hasta bazlı ablation
- `GET /fairness` — gender/yaş alt grupları, >10 pp sapma flag
- `POST /generate-certificate` — PDF rapor

---

## 5. Git Geçmişi

| Metrik | Değer |
|--------|-------|
| Commit (main) | 45 |
| Zaman aralığı | 2026-03-03 → 2026-05-06 |
| Remote | origin → MuffinMufido/HealthML |

### Katkıda bulunanlar
| Commit | Yazar |
|--------|-------|
| 21 | ismaiidogan |
| 17 | MuffinMufido |
| 5 | Mustafa Faruk Ekşi |
| 2 | Özgün Soykök |
| 1 | cerentkn04 |

### Gelişim fazları
1. **Mart 2026** — README/SETUP, Sprint 2 backend (adım 1–3)
2. **Nisan 2026** — Python ML backend, Docker, SMOTE fix, Sprint 4 testleri
3. **Mayıs 2026** — Jüri teslimi, Playwright CI, MLP model değişimi, ISO 42001

---

## 6. Test ve CI

- Playwright E2E: `tests/e2e/pipeline.spec.ts`, `sprint4_acceptance.spec.ts`
- Unit test yok (FE/BE/ML)
- GitHub Actions: 3-tier stack boot + health-check polling + Playwright

---

## 7. Tespit Edilen Sorunlar ve Uygulanan Düzeltmeler

| Sorun | Durum |
|-------|-------|
| README/Results.tsx Naive Bayes referansları (kod MLP kullanıyor) | **Düzeltildi** — Neural Network (MLP) |
| `imbalance` train proxy'de kayboluyordu | **Düzeltildi** — `dataset.ts` forward ediyor |
| `/prepare` ve `/train` bağımsız shuffle | **Düzeltildi** — `preparedTrainCount` ile pozisyonel split |
| `origin/ai_implementation` MLP UI commit'i | **Düzeltildi** — Results.tsx cherry-pick |
| CI `sleep 15` flaky | **Düzeltildi** — health endpoint polling |

### Bilinçli sınırlamalar (değiştirilmedi)
- Yalnızca binary sınıflandırma (`to_binary()`)
- Kalıcılık yok (restart/reload state sıfırlar)
- Auth yok (eğitim kapsamı)

---

## 8. Olgunluk Değerlendirmesi

| Boyut | Puan (1–5) | Not |
|-------|------------|-----|
| Mimari | 4 | Net 3-tier ayrım |
| ML derinliği | 3 | Eğitim için yeterli |
| UI/UX | 4 | 7 adımlı guided flow |
| Test kapsamı | 2 | Sadece E2E |
| Dokümantasyon | 4 | README/SETUP/Wiki zengin |
| DevOps | 4 | Docker + GHA (health-check iyileştirildi) |
| Güvenlik | 2 | Educational scope |

**Genel:** SENG 430 final teslimi için olgun, işlevsel bir eğitim ürünü.

---

## 9. Dosya Haritası

```
HealthML/
├── app/                    # React frontend + 7 pipeline steps
├── backend/src/            # Express API routes
├── backend/ml/main.py      # Tüm ML mantığı
├── tests/e2e/              # Playwright
├── deliverables/           # Raporlar, bu analiz, ISO PDF
├── .github/workflows/      # CI
└── docker-compose.yml      # 3-container orchestration
```
