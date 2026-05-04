import { Router } from 'express';
import http from 'http';

const router = Router();

const ML_HOST = process.env.ML_HOST || 'localhost';
const ML_PORT = 8000;

/**
 * Sends a GET request to the ML service and returns the parsed JSON response.
 * @param path - URL path including query string, e.g. `/explain?modelId=xyz`
 * @returns Parsed JSON response body
 */
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

/**
 * Sends a POST request to the ML service and returns the raw binary response buffer.
 * Used for binary responses such as generated PDF certificates.
 * @param path - URL path on the ML service, e.g. `/generate-certificate`
 * @param body - Request payload to JSON-encode
 * @returns Object containing the raw response buffer and response headers
 */
function postToMLBinary(path: string, body: any): Promise<{ data: Buffer; headers: http.IncomingMessage['headers'] }> {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const opts = {
      hostname: ML_HOST,
      port: ML_PORT,
      path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr) },
    };
    const req = http.request(opts, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        const data = Buffer.concat(chunks);
        if ((res.statusCode ?? 200) >= 400) {
          reject({ status: res.statusCode, message: data.toString() });
        } else {
          resolve({ data, headers: res.headers });
        }
      });
    });
    req.on('error', (e) => reject({ status: 502, message: `ML service unavailable: ${e.message}` }));
    req.write(bodyStr);
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

router.post('/generate-certificate', async (req: any, res: any) => {
  try {
    const { data, headers } = await postToMLBinary('/generate-certificate', req.body);
    res.setHeader('Content-Type', headers['content-type'] || 'application/pdf');
    res.setHeader('Content-Disposition', headers['content-disposition'] || 'attachment; filename="HealthML_Certificate.pdf"');
    res.send(data);
  } catch (e: any) {
    res.status(e.status || 502).json({ error: e.message || 'ML service unavailable' });
  }
});

export default router;
