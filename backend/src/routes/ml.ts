import { Router } from 'express';
import http from 'http';

const router = Router();

const ML_HOST = 'localhost';
const ML_PORT = 8000;

function getFromML(path: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: ML_HOST, port: ML_PORT, path, method: 'GET' },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => { raw += chunk; });
        res.on('end', () => {
          try {
            const body = JSON.parse(raw);
            if ((res.statusCode ?? 200) >= 400) {
              reject({ status: res.statusCode, message: body.detail || 'ML service error' });
            } else {
              resolve(body);
            }
          } catch {
            reject({ status: 500, message: 'Invalid response from ML service' });
          }
        });
      }
    );
    req.on('error', (e) => reject({ status: 502, message: `ML service unavailable: ${e.message}` }));
    req.end();
  });
}

router.get('/explain', async (req, res) => {
  const modelId = req.query.modelId as string;
  if (!modelId) {
    return res.status(400).json({ error: 'modelId query param required' });
  }
  try {
    const data = await getFromML(`/explain?modelId=${encodeURIComponent(modelId)}`);
    res.json(data);
  } catch (e: any) {
    res.status(e.status || 502).json({ error: e.message || 'ML service unavailable' });
  }
});

router.get('/fairness', async (req, res) => {
  const modelId = req.query.modelId as string;
  if (!modelId) {
    return res.status(400).json({ error: 'modelId query param required' });
  }
  try {
    const data = await getFromML(`/fairness?modelId=${encodeURIComponent(modelId)}`);
    res.json(data);
  } catch (e: any) {
    res.status(e.status || 502).json({ error: e.message || 'ML service unavailable' });
  }
});

export default router;
