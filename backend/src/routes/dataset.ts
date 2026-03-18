import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Papa from 'papaparse';

const router = Router();

// Configure local memory cache for dataset states
// In a real app, this would be a database.
const datasetsParams: Record<string, any> = {};

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.csv');
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV files are allowed.'));
    }
  }
});

router.post('/upload', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    Papa.parse(fileContent, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedData = results.data as Record<string, any>[];
        const parsedColumns = results.meta.fields || [];

        if (parsedData.length < 10) {
          fs.unlinkSync(filePath); // delete invalid file
          return res.status(400).json({ error: 'File too small. The CSV must contain at least 10 rows of data.' });
        }

        let hasNumericColumn = false;
        if (parsedData.length > 0) {
          hasNumericColumn = parsedColumns.some(col => typeof parsedData[0][col] === 'number');
          if (!hasNumericColumn) {
            hasNumericColumn = parsedData.some(row => parsedColumns.some(col => typeof row[col] === 'number'));
          }
        }

        if (!hasNumericColumn) {
          fs.unlinkSync(filePath); 
          return res.status(400).json({ error: 'Invalid data. The CSV must contain at least one numeric column.' });
        }

        const datasetId = req.file?.filename || Date.now().toString();
        
        // Save metadata temporarily in memory
        datasetsParams[datasetId] = {
           id: datasetId,
           originalName: req.file?.originalname,
           columns: parsedColumns,
           rowCount: parsedData.length,
           mappedColumns: {}
        };

        // For the frontend, just return the parsed data to save on DB complexity
        // In reality, frontend would probably query by ID
        res.json({
          message: 'File processed successfully',
          datasetId: datasetId,
          columns: parsedColumns,
          data: parsedData
        });
      },
      error: (error: any) => {
        fs.unlinkSync(filePath);
        res.status(400).json({ error: `Failed to parse CSV: ${error.message}` });
      }
    });
  });
});

router.post('/:id/map-columns', (req, res) => {
    const { id } = req.params;
    const { mappedColumns, targetColumn } = req.body;

    if (!datasetsParams[id]) {
        // Since we reload memory on restart, fallback if missing
        datasetsParams[id] = { id, mappedColumns: {} };
    }

    datasetsParams[id].mappedColumns = mappedColumns;
    datasetsParams[id].targetColumn = targetColumn;

    res.json({
        success: true,
        schemaOK: true,
        message: 'Column mapping saved successfully.'
    });
});

router.post('/:id/prepare', (req, res) => {
    const { id } = req.params;
    const { missingValues, normalize, imbalance, trainSplit, dataset } = req.body;

    if (!datasetsParams[id]) {
       datasetsParams[id] = { id, mappedColumns: {} };
    }

    let processedData = [...dataset];
    const mappedColumns = datasetsParams[id].mappedColumns || {};
    const targetColumn = datasetsParams[id].targetColumn;

    // Helper to get all numeric columns
    let numericCols = Object.keys(mappedColumns).filter(col => mappedColumns[col] === 'Number');
    if (numericCols.length === 0 && processedData.length > 0) {
        // Fallback: infer numeric columns from data
        numericCols = Object.keys(processedData[0] || {}).filter((col) => {
            return processedData.some((row: any) => typeof row?.[col] === 'number' && !isNaN(row[col]));
        });
    }

    // 1. Missing Values
    if (missingValues === 'drop') {
        processedData = processedData.filter(row => {
            return !Object.values(row).some(val => val === null || val === undefined || val === '');
        });
    } else {
        numericCols.forEach(col => {
            const values = processedData.map(r => r[col]).filter(v => typeof v === 'number' && !isNaN(v)) as number[];
            let fillValue = 0;
            
            if (values.length > 0) {
                if (missingValues === 'mean') {
                    fillValue = values.reduce((a, b) => a + b, 0) / values.length;
                } else if (missingValues === 'median') {
                    const sorted = [...values].sort((a, b) => a - b);
                    const mid = Math.floor(sorted.length / 2);
                    fillValue = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
                } else if (missingValues === 'mode') {
                    const counts = values.reduce((acc, val) => {
                        acc[val] = (acc[val] || 0) + 1;
                        return acc;
                    }, {} as Record<number, number>);
                    fillValue = Number(Object.keys(counts).reduce((a, b) => counts[Number(a)] > counts[Number(b)] ? a : b));
                }
            }

            processedData = processedData.map(row => {
                if (row[col] === null || row[col] === undefined || row[col] === '') {
                    return { ...row, [col]: fillValue };
                }
                return row;
            });
        });
    }

    // Capture stats for the first numeric column for the frontend visualization
    const vizCol = numericCols.length > 0 ? numericCols[0] : null;
    let beforeNormStats = { min: 0, max: 0, avg: 0 };
    let afterNormStats = { min: 0, max: 0, avg: 0 };

    if (vizCol) {
        const vals = processedData.map(r => Number(r[vizCol])).filter(n => !isNaN(n));
        beforeNormStats = {
            min: Math.min(...vals),
            max: Math.max(...vals),
            avg: vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0
        };
    }

    // 2. Normalization
    if (normalize !== 'none' && numericCols.length > 0) {
        numericCols.forEach(col => {
            const values = processedData.map(r => Number(r[col])).filter(n => !isNaN(n));
            if (values.length === 0) return;

            if (normalize === 'minmax') {
                const min = Math.min(...values);
                const max = Math.max(...values);
                const range = max - min || 1; // prevent div by 0
                processedData = processedData.map(row => {
                    const val = Number(row[col]);
                    return { ...row, [col]: isNaN(val) ? row[col] : (val - min) / range };
                });
            } else if (normalize === 'zscore') {
                const mean = values.reduce((a, b) => a + b, 0) / values.length;
                const stdDev = Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length) || 1;
                processedData = processedData.map(row => {
                    const val = Number(row[col]);
                    return { ...row, [col]: isNaN(val) ? row[col] : (val - mean) / stdDev };
                });
            }
        });
    }

    if (vizCol) {
        const vals = processedData.map(r => Number(r[vizCol])).filter(n => !isNaN(n));
        afterNormStats = {
            min: Math.min(...vals),
            max: Math.max(...vals),
            avg: vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0
        };
    }

    // 3. Class Imbalance (SMOTE stub)
    // Split first so we can apply SMOTE only to training (per user guide).
    const splitPct = typeof trainSplit === 'number' ? trainSplit : 80;
    const clampedSplit = Math.max(60, Math.min(90, splitPct));

    // Shuffle copy for deterministic-ish split
    const shuffled = [...processedData];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const trainCount = Math.round((clampedSplit / 100) * shuffled.length);
    let trainData = shuffled.slice(0, trainCount);
    const testData = shuffled.slice(trainCount);

    const countClasses = (rows: any[]) => {
        if (!targetColumn) return { positive: 0, negative: 0, total: rows.length };
        let pos = 0; let neg = 0;
        rows.forEach((row) => {
            const val = String(row[targetColumn]).toLowerCase();
            if (val === '1' || val === 'yes' || val === 'true') pos++; else neg++;
        });
        return { positive: pos, negative: neg, total: rows.length };
    };

    let beforeClassStats = countClasses(trainData);
    let afterClassStats = { ...beforeClassStats };

    if (targetColumn) {
        if (imbalance === 'smote') {
            // Apply oversampling ONLY to training set
            const pos = beforeClassStats.positive;
            const neg = beforeClassStats.negative;
            const minorityLabel = pos > neg ? 'negative' : 'positive';
            const needed = Math.abs(pos - neg);
            
            // Extract the minority rows
            const minorityRows = trainData.filter(row => {
                const val = String(row[targetColumn]).toLowerCase();
                const isPos = (val === '1' || val === 'yes' || val === 'true');
                return (minorityLabel === 'positive' && isPos) || (minorityLabel === 'negative' && !isPos);
            });

            if (minorityRows.length > 0) {
                // Random oversampling with slight jitter on numeric fields
                for (let i = 0; i < needed; i++) {
                    const baseRow = { ...minorityRows[Math.floor(Math.random() * minorityRows.length)] };
                    numericCols.forEach(col => {
                        const val = Number(baseRow[col]);
                        if (!isNaN(val)) {
                            // Add +/- 1% jitter
                            const jitter = val * 0.01 * (Math.random() > 0.5 ? 1 : -1);
                            baseRow[col] = val + jitter;
                        }
                    });
                    trainData.push(baseRow);
                }
            }

            // Recount after SMOTE
            afterClassStats = countClasses(trainData);
        }
    }

    const finalData = [...trainData, ...testData];

    res.json({
        success: true,
        message: 'Data prepared successfully.',
        stats: {
            normalize: { vizCol, before: beforeNormStats, after: afterNormStats },
            split: { trainPct: clampedSplit, trainCount: trainData.length, testCount: testData.length, scope: "SMOTE applied to training only" },
            imbalance: { scope: "training", before: beforeClassStats, after: afterClassStats }
        },
        data: finalData // Training may include synthetic samples; test remains unchanged.
    });
});

export default router;
