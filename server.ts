import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const getAppRoot = () => {
  if (process.env.VERCEL) {
    return process.cwd();
  }
  const currentFilename = typeof __filename !== 'undefined' ? __filename : fileURLToPath(import.meta.url);
  const normalized = currentFilename.replace(/\\/g, '/');
  const parts = normalized.split('/');
  parts.pop(); // Remove filename
  const currentDirname = parts.join('/');
  
  if (currentDirname.endsWith('/dist') || currentDirname.endsWith('\\dist')) {
    return currentDirname.substring(0, currentDirname.length - 5);
  }
  return currentDirname || '.';
};

// Load environment variables
dotenv.config({ path: path.resolve(getAppRoot(), '.env.local') });
dotenv.config({ path: path.resolve(getAppRoot(), '.env') });

import express from 'express';
import multer from 'multer';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { db } from './src/server/db.js';
import { extractPDFPagesText, extractDrawingDataFromText } from './src/server/extractor.js';
import { generateExcelWorkbook, generateCSVContent } from './src/server/export.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Rewrite Base URL path prefix from cPanel/Passenger subfolder deployments
app.use((req, res, next) => {
  if (req.url.startsWith('/drwextracter')) {
    req.url = req.url.substring('/drwextracter'.length) || '/';
  }
  next();
});

// Middleware for parsing JSON & URL encoded forms
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload directory exists
const UPLOADS_DIR = process.env.VERCEL ? '/tmp/uploads' : path.resolve(getAppRoot(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded original files statically for the built-in PDF preview
app.use('/uploads', express.static(UPLOADS_DIR));

// Configure Multer storage to retain original names securely with random suffixes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${base}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB as specified
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== '.pdf') {
      return cb(new Error('Only standard engineering PDF documents are supported'));
    }
    cb(null, true);
  },
});

// --- API ENDPOINTS ---

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

/**
 * Get Stats Dashboard KPIs
 */
app.get('/api/stats', (req, res) => {
  try {
    const stats = db.getStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get drawings metadata under filter choices
 */
app.get('/api/drawings', (req, res) => {
  try {
    const { query, drawingType, minConfidence, material } = req.query;
    const drawings = db.search({
      query: query ? String(query) : undefined,
      drawingType: drawingType ? String(drawingType) : undefined,
      minConfidence: minConfidence ? Number(minConfidence) : undefined,
      material: material ? String(material) : undefined,
    });
    res.json(drawings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get a specific drawing with its BOM list
 */
app.get('/api/drawings/:id', (req, res) => {
  try {
    const drawing = db.getDrawingWithBom(req.params.id);
    if (!drawing) {
      return res.status(404).json({ error: 'Drawing metadata block not found' });
    }
    res.json(drawing);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete drawing record
 */
app.delete('/api/drawings/:id', (req, res) => {
  try {
    const success = db.deleteDrawing(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Drawing record does not exist' });
    }
    res.json({ success: true, message: 'Drawing deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete all drawings and BOM records
 */
app.post('/api/drawings/clear-all', (req, res) => {
  try {
    db.clearAllDrawings();
    
    // Also clean up uploaded PDF files from uploads folder
    if (fs.existsSync(UPLOADS_DIR)) {
      const files = fs.readdirSync(UPLOADS_DIR);
      for (const file of files) {
        if (!file.startsWith('.')) {
          try {
            fs.unlinkSync(path.join(UPLOADS_DIR, file));
          } catch (err: any) {
            console.warn(`Could not delete uploaded file ${file} (possibly locked by Windows):`, err.message);
          }
        }
      }
    }
    
    res.json({ success: true, message: 'All drawings and BOM items cleared successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Manual edit/revisions endpoint
 */
app.post('/api/drawings/:id/edit', (req, res) => {
  try {
    const drawingId = req.params.id;
    const { drawingData, boms } = req.body;
    
    // Save/update in DB
    const updated = db.saveDrawingWithBom(
      {
        pageNo: Number(drawingData.pageNo || 1),
        projectTitle: String(drawingData.projectTitle || ''),
        drawingTitle: String(drawingData.drawingTitle || ''),
        companyDrawingNo: String(drawingData.companyDrawingNo || ''),
        contractorDrawingNo: String(drawingData.contractorDrawingNo || ''),
        companyFileName: String(drawingData.companyFileName || ''),
        confidenceScore: Number(drawingData.confidenceScore || 100),
        drawingType: drawingData.drawingType || 'General',
        pdfFileName: drawingData.pdfFileName,
      },
      (boms || []).map((b: any) => ({
        pos: String(b.pos || ''),
        description: String(b.description || ''),
        dimension: String(b.dimension || ''),
        qty: String(b.qty || ''),
        material: String(b.material || ''),
        weight: String(b.weight || ''),
      })),
      true // Overwrite
    );

    res.json({ success: true, drawing: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Shared BOM filter helper – avoids duplicating identical filter logic
 * in both Excel and CSV export endpoints.
 */
function applyBomFilters(drawings: any[], qStr: string, matStr: string) {
  if (!qStr && !matStr) return drawings;
  return drawings
    .map((dwg) => ({
      ...dwg,
      billOfMaterial: (dwg.billOfMaterial || []).filter((bom: any) => {
        const matchesSearch =
          qStr === '' ||
          bom.description.toLowerCase().includes(qStr) ||
          bom.dimension.toLowerCase().includes(qStr) ||
          dwg.companyDrawingNo.toLowerCase().includes(qStr) ||
          dwg.drawingTitle.toLowerCase().includes(qStr) ||
          dwg.projectTitle.toLowerCase().includes(qStr);
        const matchesMaterial =
          matStr === '' || bom.material.toLowerCase().includes(matStr);
        return matchesSearch && matchesMaterial;
      }),
    }))
    .filter((dwg) => dwg.billOfMaterial.length > 0);
}

/**
 * PDF Document upload and AI Parsing Entry point
 */
app.post('/api/upload-pdf', upload.single('file'), async (req, res) => {
  let filepath: string | undefined;
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No engineering PDF was provided.' });
    }

    filepath = req.file.path;

    // Async read — does not block the event loop for large files
    const buffer = await fs.promises.readFile(filepath);

    // Page-by-page direct text extraction
    const pagesText = await extractPDFPagesText(buffer);

    if (pagesText.length === 0) {
      return res.status(400).json({ error: 'This PDF appears empty or unreadable.' });
    }

    // Process pages in parallel batches of 5 for ~5x speed improvement
    const BATCH_SIZE = 5;
    const extractedDrawings: any[] = [];

    for (let i = 0; i < pagesText.length; i += BATCH_SIZE) {
      const batch = pagesText.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map((pageText, j) =>
          extractDrawingDataFromText(pageText, i + j + 1, req.file!.originalname)
        )
      );

      for (const extracted of batchResults) {
        const storedDrawing = db.saveDrawingWithBom(
          {
            pageNo: extracted.pageNo,
            projectTitle: extracted.projectTitle,
            drawingTitle: extracted.drawingTitle,
            companyDrawingNo: extracted.companyDrawingNo,
            contractorDrawingNo: extracted.contractorDrawingNo,
            companyFileName: extracted.companyFileName,
            confidenceScore: extracted.confidenceScore,
            drawingType: extracted.drawingType,
            pdfFileName: req.file!.filename,
          },
          extracted.billOfMaterial,
          true
        );
        extractedDrawings.push(storedDrawing);
      }
    }

    // Do not delete the file since it is used for drawing preview
    // fs.promises.unlink(filepath).catch(() => {});

    res.json({
      status: 'success',
      drawings: extractedDrawings,
    });
  } catch (error: any) {
    // Best-effort cleanup on failure too
    if (filepath) fs.promises.unlink(filepath).catch(() => {});
    console.error('Core PDF upload pipeline failure:', error);
    res.status(500).json({ error: error.message || 'Verification and OCR parsing failed' });
  }
});

/**
 * Export Excel Endpoint
 */
app.get('/api/export/excel', async (req, res) => {
  try {
    const { query, drawingType, minConfidence, material } = req.query;
    const qStr = query ? String(query).toLowerCase() : '';
    const matStr = material ? String(material).toLowerCase() : '';

    let drawings = db.search({
      query: query ? String(query) : undefined,
      drawingType: drawingType ? String(drawingType) : undefined,
      minConfidence: minConfidence ? Number(minConfidence) : undefined,
      material: material ? String(material) : undefined,
    });

    drawings = applyBomFilters(drawings, qStr, matStr);

    const buffer = await generateExcelWorkbook(drawings);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Engineering_Drawings_BOM_Export.xlsx"');
    res.send(buffer);
  } catch (error: any) {
    res.status(500).send(`Export failed: ${error.message}`);
  }
});

/**
 * Export CSV Endpoint
 */
app.get('/api/export/csv', (req, res) => {
  try {
    const { query, drawingType, minConfidence, material } = req.query;
    const qStr = query ? String(query).toLowerCase() : '';
    const matStr = material ? String(material).toLowerCase() : '';

    let drawings = db.search({
      query: query ? String(query) : undefined,
      drawingType: drawingType ? String(drawingType) : undefined,
      minConfidence: minConfidence ? Number(minConfidence) : undefined,
      material: material ? String(material) : undefined,
    });

    drawings = applyBomFilters(drawings, qStr, matStr);

    const csvContent = generateCSVContent(drawings);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="Engineering_Drawings_BOM_List.csv"');
    res.send(csvContent);
  } catch (error: any) {
    res.status(500).send(`Export failed: ${error.message}`);
  }
});

// --- PLATFORM DEV VS PROD WORKFLOWS ---

const isProduction = process.env.NODE_ENV === 'production' || 
  (!fs.existsSync(path.resolve(getAppRoot(), 'server.ts')) && fs.existsSync(path.resolve(getAppRoot(), 'dist/index.html')));

async function startServer() {
  if (!isProduction) {
    // Development Environment: Mount Vite in middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    
    app.use(vite.middlewares);
    
    // Explicit wildcard route to serve transformed index.html for UI page requests in dev mode
    app.get('*', async (req, res, next) => {
      // Don't intercept API or uploaded files
      if (req.originalUrl.startsWith('/api/') || req.originalUrl.startsWith('/uploads/')) {
        return next();
      }
      try {
        const htmlFile = path.resolve(getAppRoot(), 'index.html');
        if (fs.existsSync(htmlFile)) {
          let template = fs.readFileSync(htmlFile, 'utf-8');
          template = await vite.transformIndexHtml(req.originalUrl, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        } else {
          next();
        }
      } catch (e) {
        next(e);
      }
    });

    console.log('Vite middleware mounted successfully on API Server');
  } else {
    // Production Environment: Serve static built files from dist/ folder
    const distPath = path.join(getAppRoot(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, () => {
      console.log(`-----------------------------------------------`);
      console.log(`🚀 Industrial extraction server bound on ${PORT}`);
      console.log(`-----------------------------------------------`);
    });
  }
}

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Critical initialization failure:', err);
  });
}

export default app;
