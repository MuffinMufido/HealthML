import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import http from 'http';
import Papa from 'papaparse';

const router = Router();

const ML_HOST = process.env.ML_HOST || 'localhost';
const ML_PORT = 8000;

function postToML(mlPath: string, body: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: ML_HOST,
        port: ML_PORT,
        path: mlPath,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => { raw += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(raw);
            if ((res.statusCode ?? 200) >= 400) {
              reject({ status: res.statusCode, message: parsed.detail || 'ML service error' });
            } else {
              resolve(parsed);
            }
          } catch {
            reject({ status: 500, message: 'Invalid response from ML service' });
          }
        });
      }
    );
    req.on('error', (e) => reject({ status: 502, message: `ML service unavailable: ${e.message}` }));
    req.write(data);
    req.end();
  });
}

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



const handleTrainRequest = async (req: any, res: any) => {
  const { dataset, targetColumn, modelType, params, trainSplit } = req.body || {};

  if (!Array.isArray(dataset) || dataset.length < 20) {
    return res.status(400).json({ error: 'Dataset must include at least 20 rows for training.' });
  }
  if (!targetColumn || typeof targetColumn !== 'string') {
    return res.status(400).json({ error: 'targetColumn is required.' });
  }

  try {
    const result = await postToML('/train', { dataset, targetColumn, modelType, params, trainSplit });
    res.json(result);
  } catch (e: any) {
    res.status(e.status || 502).json({ error: e.message || 'ML service unavailable. Is the Python ML service running on port 8000?' });
  }
};

router.post('/train', handleTrainRequest);
router.post('/:id/train', handleTrainRequest);

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

router.post('/:id/prepare', async (req: any, res: any) => {
    const { id } = req.params;
    const { missingValues, normalize, imbalance, trainSplit, dataset, targetColumn: bodyTargetColumn } = req.body;

    if (!datasetsParams[id]) {
       datasetsParams[id] = { id, mappedColumns: {} };
    }

    const mappedColumns = datasetsParams[id].mappedColumns || {};
    const targetColumn = datasetsParams[id].targetColumn || bodyTargetColumn || '';

    try {
        const result = await postToML('/prepare', {
            dataset,
            targetColumn: targetColumn || '',
            mappedColumns,
            missingValues,
            normalize,
            imbalance,
            trainSplit,
        });
        return res.json(result);
    } catch (e: any) {
        return res.status(e.status || 502).json({ error: e.message || 'ML service unavailable.' });
    }
});


export default router;
