import { Spool, CADSymbol } from '../types';

export interface SpoolLocation {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  description: string;
}

export interface BlueprintData {
  spool: Spool;
  pipePath: string; // Dynamic path for SVG drawing
  symbols: CADSymbol[];
  spoolLocations?: SpoolLocation[];
  titleBlock: {
    client: string;
    project: string;
    drawingNo: string;
    revision: string;
    date: string;
    designer: string;
  };
}

export const initialSpools: Spool[] = [
  {
    id: 'spool-01',
    spoolNumber: 'SP-001245',
    pageNumber: 1,
    pdfName: 'isometric-piping-section-A.pdf',
    uploadDate: '2026-05-20T10:30:00Z',
    userId: 'admin-01',
    status: 'aligned_completed',
    ocrConfidence: 98.4,
    qrData: 'SYS-A-ISO-001245 | REV.A3 | PIPING SPEC: SCH-80S',
    skuCode: 'PI-9221-A',
    skewAngle: 0.8,
    orientation: 0,
    boundingBox: { x: 580, y: 395, width: 140, height: 35 },
    systemLabel: 'HP-STEAM SECTION A',
    pipelineSpecs: '6" NPS, ASTM A312 TP316L, Class 150# RF'
  },
  {
    id: 'spool-02',
    spoolNumber: 'SPOOL-1001',
    pageNumber: 2,
    pdfName: 'isometric-piping-section-A.pdf',
    uploadDate: '2026-05-20T10:30:00Z',
    userId: 'admin-01',
    status: 'aligned_completed',
    ocrConfidence: 94.2,
    qrData: 'FLOW-SPEC-1001 | REV.04 | FEED-VESSEL INTEGRATION',
    skuCode: 'PI-9221-B',
    skewAngle: -1.2,
    orientation: 0,
    boundingBox: { x: 620, y: 400, width: 120, height: 30 },
    systemLabel: 'LUBE OIL STORAGE SYS',
    pipelineSpecs: '3" NPS, Carbon Steel ASTM A106 Gr. B'
  },
  {
    id: 'spool-03',
    spoolNumber: '24"-FW-001',
    pageNumber: 3,
    pdfName: 'heavy-fabrication-mainline.pdf',
    uploadDate: '2026-05-21T14:15:00Z',
    userId: 'user-02',
    status: 'aligned_completed',
    ocrConfidence: 97.8,
    qrData: 'MAIN-TRUNK-24-FW-001 | RIG4-FAB-SPEC',
    skuCode: 'PI-8119-Z',
    skewAngle: 0.3,
    orientation: 0,
    boundingBox: { x: 550, y: 380, width: 150, height: 40 },
    systemLabel: 'CRUDE DISCHARGE JETTY',
    pipelineSpecs: '24" NPS, ASTM A53 Gr. B, ASME B36.10M'
  },
  {
    id: 'spool-04',
    spoolNumber: '260015-60-010990',
    pageNumber: 1,
    pdfName: 'EMARAT_ALOULA_ISO_260015.pdf',
    uploadDate: '2026-05-22T10:00:00Z',
    userId: 'admin-01',
    status: 'aligned_completed',
    ocrConfidence: 99.9,
    qrData: '260015-60-010990 | TECNIMONT | HAIL_AND_GHASHA_PKG2',
    skuCode: 'PI-4422-C',
    skewAngle: 0.0,
    orientation: 0,
    boundingBox: { x: 575, y: 65, width: 135, height: 22 },
    systemLabel: 'HAIL & GHASHA PACKAGE-2',
    pipelineSpecs: '6" PIPE ASME B36.10/36.19 A333 6-SMLS BE BE S-40'
  }
];

export const mockBlueprints: Record<string, BlueprintData> = {
  'spool-01': {
    spool: initialSpools[0],
    pipePath: 'M 100 150 L 300 150 L 300 350 L 550 350 L 550 200 L 700 200',
    symbols: [
      { id: 'sym-01-v1', type: 'valve', x: 200, y: 150, spec: '6" Carbon Steel Ball Valve Class 300', isInspected: true },
      { id: 'sym-01-f1', type: 'flange', x: 100, y: 150, spec: '6" WN Flange ANSI 300#', isInspected: true },
      { id: 'sym-01-f2', type: 'flange', x: 300, y: 150, spec: '6" Blind Flange ANSI 300#', isInspected: false },
      { id: 'sym-01-w1', type: 'weld', x: 420, y: 350, spec: 'Butt-Weld WF-10', isInspected: true },
      { id: 'sym-01-w2', type: 'weld', x: 550, y: 280, spec: 'Butt-Weld WF-11', isInspected: false },
      { id: 'sym-01-f3', type: 'flange', x: 700, y: 200, spec: '6" WN Flange ANSI 300#', isInspected: true }
    ],
    titleBlock: {
      client: 'chevron petrochemicals',
      project: 'alpha expansion phase ii',
      drawingNo: 'CV-PI-ISO-001245-001',
      revision: 'A3',
      date: '2026-04-12',
      designer: 'J. Harrison'
    }
  },
  'spool-02': {
    spool: initialSpools[1],
    pipePath: 'M 150 250 L 150 100 L 450 100 L 450 400 L 650 400',
    symbols: [
      { id: 'sym-02-p1', type: 'pump', x: 150, y: 250, spec: 'Centrifugal Feed Pump P-102A', isInspected: true },
      { id: 'sym-02-v1', type: 'valve', x: 300, y: 100, spec: '3" Gate Valve ASME 150#', isInspected: true },
      { id: 'sym-02-v2', type: 'valve', x: 450, y: 220, spec: '3" Check Valve Dual-Plate', isInspected: false },
      { id: 'sym-02-f1', type: 'flange', x: 650, y: 400, spec: '3" ANSI RF Flange', isInspected: true }
    ],
    titleBlock: {
      client: 'british petroleum (bp)',
      project: 'vessel tie-in system',
      drawingNo: 'BP-LU-PID-1001-002',
      revision: '04',
      date: '2025-11-08',
      designer: 'M. Radcliffe'
    }
  },
  'spool-03': {
    spool: initialSpools[2],
    pipePath: 'M 80 300 L 400 300 L 400 150 L 720 150',
    symbols: [
      { id: 'sym-03-w1', type: 'weld', x: 200, y: 300, spec: '24" High-Pressure Main Joint FW-01', isInspected: true },
      { id: 'sym-03-w2', type: 'weld', x: 400, y: 220, spec: '24" Secondary Joint FW-02', isInspected: true },
      { id: 'sym-03-v1', type: 'valve', x: 550, y: 150, spec: '24" Floating Ball Valve Hydraulic Actuated', isInspected: false },
      { id: 'sym-03-f1', type: 'flange', x: 80, y: 300, spec: '24" Class 600# Flange Spec', isInspected: true },
      { id: 'sym-03-f2', type: 'flange', x: 720, y: 150, spec: '24" Class 600# Flange Spec', isInspected: true }
    ],
    titleBlock: {
      client: 'saudi aramco',
      project: 'jetty discharge pipeline upgrade',
      drawingNo: 'SA-CR-ISO-24FW001-08',
      revision: '08',
      date: '2026-01-30',
      designer: 'K. Al-Sudairi'
    }
  },
  'spool-04': {
    spool: initialSpools[3],
    pipePath: 'M 180 340 L 460 180',
    symbols: [
      { id: 'sym-04-w1', type: 'weld', x: 320, y: 260, spec: '6" Butt-Weld Joint 1(A) - Shop Support', isInspected: true },
      { id: 'sym-04-f1', type: 'flange', x: 180, y: 340, spec: '6" ASME B36.10 Weld-Neck Flange', isInspected: true },
      { id: 'sym-04-f2', type: 'flange', x: 460, y: 180, spec: '6" ASME B36.10 Weld-Neck Flange', isInspected: false }
    ],
    spoolLocations: [
      { id: 'loc-04-1', label: 'EAI Spool Table Header', x: 605, y: 125, width: 145, height: 24, description: 'Positioned inside the top-right table block under "EAI SPOOL No."' },
      { id: 'loc-04-2', label: 'QR Code Text Label', x: 671, y: 379, width: 92, height: 16, description: 'Under the 2D Barcode / QR matrix block in the bottom alignment area.' },
      { id: 'loc-04-3', label: 'Title Block Reference', x: 540, y: 442, width: 220, height: 16, description: 'Found adjacent to the primary metadata frame (SPOOLED. ISO NO / CLIENT SPOOL NO).' }
    ],
    titleBlock: {
      client: 'TECNIMONT / ADNOC',
      project: 'HAIL & GHASHA PACKAGE-2',
      drawingNo: 'SA-4422-SP-XH-DL-305901-MM5159',
      revision: '00A',
      date: '2025-02-12',
      designer: 'Trinh Quoc Khanh'
    }
  }
};

// Generates a random CAD layout dynamically if a user uploads or references an unindexed spool
export function generateDynamicBlueprint(spoolNumber: string, originalName: string, id: string): BlueprintData {
  const normSpool = spoolNumber.toUpperCase().trim();
  const index = Math.abs(spoolNumber.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 10;
  
  const pipePathChoices = [
    'M 120 200 L 350 200 L 350 320 L 600 320',
    'M 100 120 L 100 280 L 400 280 L 400 420 L 680 420',
    'M 90 350 L 500 350 L 500 150 L 700 150',
    'M 150 150 L 150 350 L 450 350 L 450 150 L 680 150'
  ];
  
  const pipePath = pipePathChoices[index % pipePathChoices.length];
  
  const symbols: CADSymbol[] = [
    { id: `sym-dyn-v1-${id}`, type: 'valve', x: 220, y: pipePath.includes('L 350') ? 200 : 280, spec: 'Gate Valve Class 150#', isInspected: true },
    { id: `sym-dyn-f1-${id}`, type: 'flange', x: 120, y: pipePath.includes('L 350') ? 200 : 120, spec: 'WN Flange 150#', isInspected: false },
    { id: `sym-dyn-w1-${id}`, type: 'weld', x: 350, y: 250, spec: 'Butt Weld Gr.80', isInspected: true }
  ];

  return {
    spool: {
      id,
      spoolNumber: normSpool,
      pageNumber: 1,
      pdfName: originalName,
      uploadDate: new Date().toISOString(),
      userId: 'user-active',
      status: 'aligned_completed',
      ocrConfidence: Math.floor(Math.random() * 8) + 91,
      qrData: `SYS-DYN-${normSpool} | AUTOGENERATED-INDEX`,
      skuCode: `PI-DYN-${index}03`,
      skewAngle: (Math.random() * 4 - 2), // skew indicator
      orientation: 0,
      boundingBox: { x: 550, y: 380, width: 140, height: 35 },
      systemLabel: 'AI AUTO-SPLIT AND ALIGNED DRAWING',
      pipelineSpecs: '4" NPS Schedule 40S, Stainless Steel ASTM A312'
    },
    pipePath,
    symbols,
    titleBlock: {
      client: 'SINOPEC GLOBAL FABRICATION',
      project: 'UNIT-4 TIE-IN VENT SYSTEM',
      drawingNo: `SP-DYN-${normSpool}-001`,
      revision: 'B',
      date: new Date().toISOString().split('T')[0],
      designer: 'AI Extraction Engine'
    }
  };
}
