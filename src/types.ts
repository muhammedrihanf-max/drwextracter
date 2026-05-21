/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Drawing {
  id: string;
  pageNo: number;
  projectTitle: string;
  drawingTitle: string;
  companyDrawingNo: string;
  contractorDrawingNo: string;
  companyFileName: string;
  pdfFileName?: string;
  createdAt: string;
  confidenceScore: number; // 0 to 100
  drawingType: 'Support' | 'Structural' | 'Cable Tray' | 'Isometric' | 'General' | 'Other';
}

export interface BomItem {
  id: string;
  drawingId: string;
  pos: string;
  description: string;
  dimension: string;
  qty: string;
  material: string;
  weight: string; // text or weighted numeric
}

export interface DrawingWithBom extends Drawing {
  billOfMaterial: BomItem[];
}

export interface DashboardStats {
  totalPdfs: number;
  totalDrawings: number;
  totalBomItems: number;
  drawingsByType: Record<string, number>;
  averageConfidence: number;
}
