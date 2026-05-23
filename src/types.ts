export interface Spool {
  id: string;
  spoolNumber: string;
  pageNumber: number;
  pdfName: string;
  uploadDate: string;
  userId: string;
  status: 'aligned_completed' | 'processing' | 'failed';
  ocrConfidence: number;
  qrData: string | null;
  skuCode?: string;
  skewAngle: number;
  orientation: number; // 0, 90, 180, 270 degrees
  boundingBox: { x: number; y: number; width: number; height: number };
  systemLabel?: string;
  pipelineSpecs?: string;
  svgDrawingDataId?: string; // Links to high-quality SVG/Drawing layout
}

export interface ProcessingJob {
  id: string;
  fileName: string;
  fileSize: string;
  status: 'uploaded' | 'splitting' | 'aligning' | 'ocr_qr' | 'indexing' | 'completed' | 'failed';
  totalPages: number;
  processedPages: number;
  startTime: string;
  logs: string[];
}

export interface License {
  key: string;
  expiryDate: string;
  deviceLimit: number;
  activatedDevices: string[];
  status: 'active' | 'disabled' | 'expired';
  customerName: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'Admin' | 'User';
  password?: string;
}

export interface UserLog {
  id: string;
  timestamp: string;
  userId: string;
  username: string;
  action: string;
  details: string;
}

export interface CADSymbol {
  id: string;
  type: 'valve' | 'flange' | 'pump' | 'reducer' | 'elbow' | 'tee' | 'weld';
  x: number;
  y: number;
  spec?: string;
  isInspected?: boolean;
}

export interface SpoolMatchResult {
  spool: Spool;
  score: number;
  matchingSnippet: string;
}
