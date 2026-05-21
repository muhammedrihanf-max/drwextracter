import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Drawing, BomItem, DrawingWithBom, DashboardStats } from '../types.js';

import { fileURLToPath } from 'url';

function getAppRoot() {
  if (process.env.VERCEL) {
    return process.cwd();
  }
  const currentFilename = typeof __filename !== 'undefined' ? __filename : fileURLToPath(import.meta.url);
  const currentDirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(currentFilename);
  let root = currentDirname;
  if (root.endsWith('src/server') || root.endsWith('src\\server')) {
    root = path.resolve(root, '../..');
  } else if (root.endsWith('dist')) {
    root = path.resolve(root, '..');
  }
  return root;
}

const getDbDir = () => process.env.VERCEL ? '/tmp/data' : path.resolve(getAppRoot(), 'data');
const getDbFile = () => path.join(getDbDir(), 'database.json');

interface Schema {
  drawings: Drawing[];
  bom_items: BomItem[];
}

function initializeDb() {
  const dbDir = getDbDir();
  const dbFile = getDbFile();
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  if (!fs.existsSync(dbFile)) {
    const repoDbFile = path.resolve(process.cwd(), 'data', 'database.json');
    if (process.env.VERCEL && fs.existsSync(repoDbFile)) {
      try {
        fs.copyFileSync(repoDbFile, dbFile);
      } catch (err) {
        console.error('Failed to copy bundled database.json:', err);
        const defaultData: Schema = { drawings: [], bom_items: [] };
        fs.writeFileSync(dbFile, JSON.stringify(defaultData, null, 2), 'utf-8');
      }
    } else {
      const defaultData: Schema = { drawings: [], bom_items: [] };
      fs.writeFileSync(dbFile, JSON.stringify(defaultData, null, 2), 'utf-8');
    }
  }
}

function readDb(): Schema {
  initializeDb();
  try {
    const dbFile = getDbFile();
    const content = fs.readFileSync(dbFile, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading database file, returning fresh schema:', error);
    return { drawings: [], bom_items: [] };
  }
}

function writeDb(data: Schema) {
  initializeDb();
  const dbFile = getDbFile();
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf-8');
}

export const db = {
  getDrawings(): Drawing[] {
    return readDb().drawings;
  },

  getBomItems(): BomItem[] {
    return readDb().bom_items;
  },

  getDrawingWithBom(id: string): DrawingWithBom | null {
    const data = readDb();
    const drawing = data.drawings.find((d) => d.id === id);
    if (!drawing) return null;

    const billOfMaterial = data.bom_items.filter((item) => item.drawingId === id);
    return { ...drawing, billOfMaterial };
  },

  saveDrawingWithBom(drawingData: Omit<Drawing, 'id' | 'createdAt'>, bomItemsData: Omit<BomItem, 'id' | 'drawingId'>[], overwriteDuplicate = true): DrawingWithBom {
    const data = readDb();
    
    // Duplicate Detection Logic: Fulfills prompt duplicate detection requirement
    const duplicateIndex = data.drawings.findIndex(
      (d) => {
        const hasDwgNo = drawingData.companyDrawingNo.trim() !== '' && drawingData.companyDrawingNo.toLowerCase() !== 'n/a';
        if (hasDwgNo) {
          return d.companyDrawingNo.toLowerCase() === drawingData.companyDrawingNo.toLowerCase() &&
                 d.pageNo === drawingData.pageNo;
        }
        return d.pageNo === drawingData.pageNo &&
               d.companyFileName.toLowerCase() === drawingData.companyFileName.toLowerCase();
      }
    );

    let drawingId: string;
    let createdAt: string;

    if (duplicateIndex !== -1 && overwriteDuplicate) {
      // Overwrite existing
      drawingId = data.drawings[duplicateIndex].id;
      createdAt = data.drawings[duplicateIndex].createdAt;

      data.drawings[duplicateIndex] = {
        ...drawingData,
        id: drawingId,
        createdAt,
        confidenceScore: drawingData.confidenceScore,
        drawingType: drawingData.drawingType,
      };

      // Clean old BOM items
      data.bom_items = data.bom_items.filter((item) => item.drawingId !== drawingId);
    } else {
      // Create new
      drawingId = 'dwg_' + crypto.randomUUID().replace(/-/g, '').substring(0, 12);
      createdAt = new Date().toISOString();

      data.drawings.push({
        ...drawingData,
        id: drawingId,
        createdAt,
      });
    }

    // Insert new BOM items
    const insertedBoms: BomItem[] = bomItemsData.map((item, idx) => ({
      ...item,
      id: `bom_${drawingId}_${idx}_${crypto.randomUUID().replace(/-/g, '').substring(0, 6)}`,
      drawingId,
    }));

    data.bom_items.push(...insertedBoms);
    writeDb(data);

    return {
      ...data.drawings.find((d) => d.id === drawingId)!,
      billOfMaterial: insertedBoms,
    };
  },

  deleteDrawing(id: string): boolean {
    const data = readDb();
    const drawingIndex = data.drawings.findIndex((d) => d.id === id);
    if (drawingIndex === -1) return false;

    data.drawings.splice(drawingIndex, 1);
    data.bom_items = data.bom_items.filter((item) => item.drawingId !== id);
    writeDb(data);
    return true;
  },

  clearAllDrawings(): void {
    const data = readDb();
    data.drawings = [];
    data.bom_items = [];
    writeDb(data);
  },

  search(options: {
    query?: string;
    drawingType?: string;
    minConfidence?: number;
    material?: string;
  }): DrawingWithBom[] {
    const data = readDb();
    let drawings = data.drawings;

    // Filter by type
    if (options.drawingType && options.drawingType !== 'ALL') {
      drawings = drawings.filter((d) => d.drawingType === options.drawingType);
    }

    // Filter by minimum confidence
    if (options.minConfidence !== undefined) {
      drawings = drawings.filter((d) => d.confidenceScore >= (options.minConfidence || 0));
    }

    // Filter by textual metadata query
    if (options.query) {
      const q = options.query.toLowerCase();
      drawings = drawings.filter(
        (d) =>
          d.projectTitle.toLowerCase().includes(q) ||
          d.drawingTitle.toLowerCase().includes(q) ||
          d.companyDrawingNo.toLowerCase().includes(q) ||
          d.contractorDrawingNo.toLowerCase().includes(q) ||
          d.companyFileName.toLowerCase().includes(q)
      );
    }

    // Filter by internal BOM Material if specified
    if (options.material) {
      const mat = options.material.toLowerCase();
      const matchingDrawingIds = new Set(
        data.bom_items.filter((b) => b.material.toLowerCase().includes(mat)).map((b) => b.drawingId)
      );
      drawings = drawings.filter((d) => matchingDrawingIds.has(d.id));
    }

    // Assemble drawing details with corresponding BOM items
    return drawings.map((d) => {
      const billOfMaterial = data.bom_items.filter((item) => item.drawingId === d.id);
      return { ...d, billOfMaterial };
    });
  },

  getStats(): DashboardStats {
    const data = readDb();
    const uniqueFiles = new Set(data.drawings.map((d) => d.companyFileName.toLowerCase())).size;
    const totalDrawings = data.drawings.length;
    const totalBomItems = data.bom_items.length;

    // Group drawings by type
    const drawingsByType: Record<string, number> = {};
    data.drawings.forEach((d) => {
      drawingsByType[d.drawingType] = (drawingsByType[d.drawingType] || 0) + 1;
    });

    const averageConfidence =
      totalDrawings > 0
        ? Math.round(data.drawings.reduce((sum, d) => sum + d.confidenceScore, 0) / totalDrawings)
        : 100;

    return {
      totalPdfs: uniqueFiles || totalDrawings,
      totalDrawings,
      totalBomItems,
      drawingsByType,
      averageConfidence,
    };
  },
};
