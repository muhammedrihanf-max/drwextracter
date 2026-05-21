import { createRequire } from 'module';
const req = createRequire(
  import.meta && import.meta.url
    ? import.meta.url
    : typeof __filename !== 'undefined'
      ? __filename
      : 'file:///' + process.cwd() + '/server.cjs'
);
const { PDFParse } = req('pdf-parse');
import { GoogleGenAI, Type } from '@google/genai';
import { Drawing, BomItem, DrawingWithBom } from '../types.js';

// Initialize Gemini Client
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/**
 * Regex patterns as requested in the specification for direct heuristic extraction / fallback validation
 */
export function extractMetadataHeuristics(text: string): Partial<Drawing> {
  // 1. Extract CAD File Name (ends in .dwg or .dgn)
  const dwgMatch = text.match(/\b[a-zA-Z0-9_-]+\.(dwg|dgn)\b/i);
  const companyFileName = dwgMatch ? dwgMatch[0] : '';

  // 2. Extract Company Drawing Number (e.g. 2-P24002-MM5163-E04-0006-00)
  const companyNoMatch = text.match(/\b\d-P\d{5}-[A-Z0-9]+-[A-Z0-9]+-\d{4}-\d{2,4}\b/i);
  const companyDrawingNo = companyNoMatch ? companyNoMatch[0] : '';

  // 3. Extract Contractor Drawing Number (e.g. 4422-FY-VD-EG18304630000006)
  const contractorNoMatch = text.match(/\b4422-[A-Z0-9-]+-[A-Z0-9_]+\b/i);
  const contractorDrawingNo = contractorNoMatch ? contractorNoMatch[0] : '';

  // 4. Extract Project Title (look for lines containing "PROJECT" or "DEVELOPMENT")
  let projectTitle = '';
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const projectLine = lines.find(l => 
    (l.toLowerCase().includes('project') || l.toLowerCase().includes('development')) &&
    !l.toLowerCase().includes('project title') &&
    !l.toLowerCase().includes('tecnimont')
  );
  if (projectLine) {
    projectTitle = projectLine;
  }

  // 5. Extract Drawing Title (e.g. "SUPPORT DETAILS FOR CABLEWAYS")
  let drawingTitle = '';
  const titleKeywords = ['support', 'detail', 'arrangement', 'cableways', 'diagram', 'section', 'layout', 'elevation', 'plan'];
  const titleLine = lines.find(l => {
    const lower = l.toLowerCase();
    return titleKeywords.some(keyword => lower.includes(keyword)) &&
      l === l.toUpperCase() &&
      !lower.includes('project') &&
      !lower.includes('drawing') &&
      !lower.includes('company') &&
      !lower.includes('adnoc') &&
      !lower.includes('class') &&
      !lower.includes('standard') &&
      !l.endsWith(':') &&
      l.length > 5;
  });
  if (titleLine) {
    drawingTitle = titleLine;
  }

  return {
    projectTitle,
    drawingTitle: drawingTitle || 'Untitled Sheet (OCR Fallback)',
    companyDrawingNo,
    contractorDrawingNo,
    companyFileName,
  };
}

/**
 * Custom PDF page-by-page text parser using pdf-parse's options
 */
export async function extractPDFPagesText(buffer: Buffer): Promise<string[]> {
  try {
    const parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    return textResult.pages.map((page: any) => page.text);
  } catch (error) {
    console.error('Error extracting text via PDFParse:', error);
    return [];
  }
}

/**
 * Use Gemini model with a structured JSON schema to parse metadata and BOM from extracted page text
 */
export async function extractDrawingDataFromText(
  pageText: string,
  pageNumber: number,
  fallbackFilename: string
): Promise<Omit<DrawingWithBom, 'id' | 'createdAt'>> {
  // If there's barely any text, alert that extraction might be difficult or represent a blueprint image
  const isImageOrEmpty = pageText.trim().length < 100;
  
  const prompt = `
     You are an advanced Engineering Drawing PDF Extraction AI Engine.
     Analyze the following extracted text from Page ${pageNumber} of an engineering drawing PDF.
     
     --- EXTRACTED PAGE TEXT START ---
     ${pageText}
     --- EXTRACTED PAGE TEXT END ---

     Identify and extract:
     1. Project Title: Detailed multi-line title of the project (e.g., HAIL AND GHASHA DEVELOPMENT PROJECT... Onshore Facilities)
     2. Drawing Title: Description of this drawing sheet (e.g., SUPPORT DETAILS FOR CABLEWAYS)
     3. Company Drawing Number: Formal identifiers designated by the company (commonly with dash patterns e.g. 2-P24002-MM5163-E04-0006-00)
     4. Contractor Drawing Number: Heuristic or technical reference designated by contractor (e.g. 4422-FY-VD-EG18304630000006)
     5. Company File Name: Associated CAD/drawing filename ending in .dwg, .dgn or similar (e.g., 2-P24002-MM5163-E04-0006-102_01.dwg)
     6. Drawing Type: Decide whether this represents a "Support" drawing (pipe support, duct support, cables), "Structural" drawing (structural grids, baseplates, rafters), "Cable Tray" drawing, "Isometric" drawing, "General" overview layout, or "Other".
     7. Bill of Material (BOM): Scan for any table representing components, parts list or items. Extract into flat rows. The rows must have:
        - pos: POS sequence number
        - description: Standard descriptive beam, anchor plate, plate or part detail
        - dimension: Measured format e.g., L 80 x 8 or HEB 200 or PL 200x200x12
        - qty: Exact numeric count or measurement (e.g., 1, 0.5 m, 3 pcs)
        - material: Metal or specification standards e.g., S275JR or S355JR-EN10025
        - weight: Total or Unit weight in KG (numeric value as a string representing the KG value)

     Edge Cases:
     - If a property is completely missing, return an empty string "" instead of null or default placeholders.
     - Evaluate extraction accuracy and provide a confidence_score between 0 and 100. If text is extremely cluttered or empty (scanned image), reduce confidence_score accordingly.
  `;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            project_title: { type: Type.STRING },
            drawing_title: { type: Type.STRING },
            company_drawing_no: { type: Type.STRING },
            contractor_drawing_no: { type: Type.STRING },
            company_file_name: { type: Type.STRING },
            drawing_type: { 
              type: Type.STRING,
              enum: ["Support", "Structural", "Cable Tray", "Isometric", "General", "Other"]
            },
            confidence_score: { type: Type.INTEGER },
            bill_of_material: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  pos: { type: Type.STRING },
                  description: { type: Type.STRING },
                  dimension: { type: Type.STRING },
                  qty: { type: Type.STRING },
                  material: { type: Type.STRING },
                  weight: { type: Type.STRING }
                },
                required: ["pos", "description", "dimension", "qty", "material", "weight"]
              }
            }
          },
          required: [
            "project_title",
            "drawing_title",
            "company_drawing_no",
            "contractor_drawing_no",
            "company_file_name",
            "drawing_type",
            "confidence_score",
            "bill_of_material"
          ]
        }
      }
    });

    const resultText = response.text ? response.text.trim() : '{}';
    const parsed = JSON.parse(resultText);

    // Apply heuristic fallbacks for empty metadata keys
    const heuristics = extractMetadataHeuristics(pageText);

    const projectTitle = parsed.project_title || heuristics.projectTitle || 'Unknown Project';
    const drawingTitle = parsed.drawing_title || heuristics.drawingTitle || 'Untitled Sheet';
    const companyDrawingNo = parsed.company_drawing_no || heuristics.companyDrawingNo || '';
    const contractorDrawingNo = parsed.contractor_drawing_no || heuristics.contractorDrawingNo || '';
    const companyFileName = parsed.company_file_name || heuristics.companyFileName || fallbackFilename;
    const confidenceScore = parsed.confidence_score !== undefined ? parsed.confidence_score : (isImageOrEmpty ? 30 : 85);
    const drawingType = parsed.drawing_type || 'General';

    const boms: BomItem[] = (parsed.bill_of_material || []).map((b: any) => ({
      id: '',
      drawingId: '',
      pos: String(b.pos || ''),
      description: String(b.description || ''),
      dimension: String(b.dimension || ''),
      qty: String(b.qty || ''),
      material: String(b.material || ''),
      weight: String(b.weight || ''),
    }));

    return {
      pageNo: pageNumber,
      projectTitle,
      drawingTitle,
      companyDrawingNo,
      contractorDrawingNo,
      companyFileName,
      confidenceScore,
      drawingType,
      billOfMaterial: boms,
    };
  } catch (error) {
    console.error('Gemini extraction error, parsing failed:', error);
    // Absolute fallback when Gemini API fails
    const heuristics = extractMetadataHeuristics(pageText);

    // Heuristically extract BOM items from tab-separated lines
    const boms: BomItem[] = [];
    const lines = pageText.split('\n');
    lines.forEach((line) => {
      const parts = line.split('\t').map(p => p.trim());
      if (parts.length >= 5 && /^\d+$/.test(parts[0])) {
        boms.push({
          id: '',
          drawingId: '',
          pos: parts[0],
          description: parts[1] || '',
          dimension: parts[2] || '',
          qty: parts[3] || '',
          material: parts[4] || '',
          weight: parts[5] || '',
        });
      }
    });

    return {
      pageNo: pageNumber,
      projectTitle: heuristics.projectTitle || 'Unknown Project (OCR Fallback)',
      drawingTitle: heuristics.drawingTitle || 'Untitled Drawing (OCR Fallback)',
      companyDrawingNo: heuristics.companyDrawingNo || 'N/A',
      contractorDrawingNo: heuristics.contractorDrawingNo || 'N/A',
      companyFileName: heuristics.companyFileName || fallbackFilename,
      confidenceScore: 40,
      drawingType: 'General',
      billOfMaterial: boms,
    };
  }
}
