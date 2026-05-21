import ExcelJS from 'exceljs';
import { DrawingWithBom } from '../types.js';

/**
 * Creates an Excel workbook buffer from a list of drawings and their corresponding BOM items.
 * Applies beautiful formatting including cell borders, bold headers, and fill colors.
 * Sheet 1: Drawings Metadata List
 * Sheet 2: Compiled Bill of Material (BOM) Items List (Grouped by Drawing Block)
 */
export async function generateExcelWorkbook(drawingsList: DrawingWithBom[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'DRWExtracter – Emarataloula Industries';
  workbook.created = new Date();

  // Sheet 1: Drawings Metadata List
  const sheet1 = workbook.addWorksheet('Drawings Summary');
  sheet1.columns = [
    { header: 'ID', key: 'id', width: 15 },
    { header: 'Page Number', key: 'pageNo', width: 15 },
    { header: 'Project Title', key: 'projectTitle', width: 35 },
    { header: 'Drawing Title', key: 'drawingTitle', width: 35 },
    { header: 'Company Drawing No', key: 'companyDrawingNo', width: 35 },
    { header: 'Contractor Drawing No', key: 'contractorDrawingNo', width: 35 },
    { header: 'Company File Name', key: 'companyFileName', width: 40 },
    { header: 'Drawing Type', key: 'drawingType', width: 15 },
    { header: 'Confidence Score (%)', key: 'confidenceScore', width: 22 },
    { header: 'Extraction Date', key: 'extractionDate', width: 20 },
  ];
  
  // Style Header Row (Sheet 1)
  const headerRow = sheet1.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } }; // Dark Gray
  headerRow.height = 25;
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  drawingsList.forEach((d) => {
    const row = sheet1.addRow({
      id: d.id,
      pageNo: d.pageNo,
      projectTitle: d.projectTitle,
      drawingTitle: d.drawingTitle,
      companyDrawingNo: d.companyDrawingNo,
      contractorDrawingNo: d.contractorDrawingNo,
      companyFileName: d.companyFileName,
      drawingType: d.drawingType,
      confidenceScore: d.confidenceScore,
      extractionDate: d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '',
    });
    
    // Light border for data rows
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };
    });
  });

  // Sheet 2: BOM Items Grouped (Block Format)
  const sheet2 = workbook.addWorksheet('Bill of Materials (BOM)');
  
  // Standardize column widths
  sheet2.getColumn(1).width = 12; // POS / Metadata Label
  sheet2.getColumn(2).width = 45; // Description / Metadata Value
  sheet2.getColumn(3).width = 25; // Dimension
  sheet2.getColumn(4).width = 15; // Qty
  sheet2.getColumn(5).width = 25; // Material
  sheet2.getColumn(6).width = 15; // Weight
  
  const addRow = (values: any[]) => {
    return sheet2.addRow(values);
  };
  
  drawingsList.forEach((d, idx) => {
    // Spacer row between blocks
    if (idx > 0) {
      addRow([]); 
    }
    
    // Metadata Header Block
    const pushMeta = (label: string, val: any) => {
       const r = addRow([label, val || 'N/A']);
       const lblCell = r.getCell(1);
       const valCell = r.getCell(2);
       
       lblCell.font = { bold: true, color: { argb: 'FF4B5563' } }; // Slate 600
       valCell.font = { bold: true, color: { argb: 'FF111827' } }; // Slate 900
       
       // Light border around metadata pairs
       [lblCell, valCell].forEach(c => {
         c.border = {
           top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
           bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
           left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
           right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
         };
         c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
       });
    };
    
    pushMeta('Project Title', d.projectTitle);
    pushMeta('Drawing Title', d.drawingTitle);
    pushMeta('Company Drawing No', d.companyDrawingNo);
    pushMeta('Contractor Drawing No', d.contractorDrawingNo);
    pushMeta('Company File Name', d.companyFileName);
    pushMeta('Page No', d.pageNo);
    
    addRow([]); // Blank line before table header
    
    // Table Header Row
    const tableHeader = addRow(['POS', 'Description', 'Dimension', 'Qty', 'Material', 'Weight']);
    tableHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    tableHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }; // Blue 600
    tableHeader.alignment = { vertical: 'middle', horizontal: 'center' };
    
    tableHeader.eachCell((cell, colNum) => {
      if (colNum <= 6) {
        cell.border = {
          top: { style: 'medium', color: { argb: 'FF1E40AF' } },
          bottom: { style: 'medium', color: { argb: 'FF1E40AF' } },
          left: { style: 'thin', color: { argb: 'FF1E40AF' } },
          right: { style: 'thin', color: { argb: 'FF1E40AF' } }
        };
      }
    });
    
    // Table Items rows
    if (d.billOfMaterial.length === 0) {
       const emptyRow = addRow(['', 'No BOM items recorded', '', '', '', '']);
       emptyRow.getCell(2).font = { italic: true, color: { argb: 'FF9CA3AF' } };
       // Minimal border for empty row placeholder
       emptyRow.eachCell((cell, colNum) => {
         if (colNum <= 6) {
           cell.border = { bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
         }
       });
    } else {
       d.billOfMaterial.forEach((bom, rowIndex) => {
         const r = addRow([
           bom.pos || '',
           bom.description || '',
           bom.dimension || '',
           bom.qty || '',
           bom.material || '',
           bom.weight || ''
         ]);
         
         const isLastRow = rowIndex === d.billOfMaterial.length - 1;
         
         // Add borders to item cells
         r.eachCell({ includeEmpty: true }, (cell, colNum) => {
            if (colNum <= 6) {
                cell.border = {
                  top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                  left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                  right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                  // Thicker bottom border for the final row in the block
                  bottom: { style: isLastRow ? 'medium' : 'thin', color: { argb: 'FFD1D5DB' } }
                };
                
                // Center-align POS and Qty
                if (colNum === 1 || colNum === 4 || colNum === 6) {
                  cell.alignment = { horizontal: 'center' };
                }
            }
         });
       });
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as Buffer;
}

/**
 * Creates a blocked CSV string content representing each drawing and its BOM items sequentially
 */
export function generateCSVContent(drawingsList: DrawingWithBom[]): string {
  let csv = '';
  
  drawingsList.forEach((d, index) => {
    if (index > 0) {
      csv += '\n'; // Blank separator row between pages
    }
    
    const projText = (d.projectTitle || 'N/A').replace(/"/g, '""');
    const drawText = (d.drawingTitle || 'N/A').replace(/"/g, '""');
    const companyDwg = (d.companyDrawingNo || 'N/A').replace(/"/g, '""');
    const contractorDwg = (d.contractorDrawingNo || 'N/A').replace(/"/g, '""');
    const companyFile = (d.companyFileName || 'N/A').replace(/"/g, '""');
    
    // Write Metadata Header Block
    csv += `Project Title,"${projText}"\n`;
    csv += `Drawing Title,"${drawText}"\n`;
    csv += `Company Drawing No,"${companyDwg}"\n`;
    csv += `Contractor Drawing No,"${contractorDwg}"\n`;
    csv += `Company File Name,"${companyFile}"\n`;
    csv += `Page No,${d.pageNo}\n`;
    csv += `\n`; // Blank line before headers
    
    // Write BOM table headers
    csv += `POS,Description,Dimension,Qty,Material,Weight\n`;
    
    // Write BOM items
    if (d.billOfMaterial.length === 0) {
      csv += `,"No BOM items recorded",,,,\n`;
    } else {
      d.billOfMaterial.forEach((bom) => {
        const bomDesc = (bom.description || '').replace(/"/g, '""');
        const bomDim = (bom.dimension || '').replace(/"/g, '""');
        const bomMat = (bom.material || '').replace(/"/g, '""');
        const bomQty = (bom.qty || '').replace(/"/g, '""');
        const bomWt = (bom.weight || '').replace(/"/g, '""');
        const bomPos = (bom.pos || '').replace(/"/g, '""');
        
        csv += `"${bomPos}","${bomDesc}","${bomDim}","${bomQty}","${bomMat}","${bomWt}"\n`;
      });
    }
  });

  return csv;
}
