/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Plus, 
  Trash2, 
  FileText, 
  CheckCircle, 
  Loader2, 
  AlertCircle,
  Eye
} from 'lucide-react';
import { DrawingWithBom, BomItem } from '../types';

interface DrawingDetailModalProps {
  drawing: DrawingWithBom;
  onClose: () => void;
  onSave: (drawingId: string, updatedDrawing: any, updatedBoms: any[]) => Promise<void>;
}

export default function DrawingDetailModal({
  drawing,
  onClose,
  onSave,
}: DrawingDetailModalProps) {
  // Local state for drawing metadata edits
  const [projectTitle, setProjectTitle] = useState(drawing.projectTitle);
  const [drawingTitle, setDrawingTitle] = useState(drawing.drawingTitle);
  const [companyDrawingNo, setCompanyDrawingNo] = useState(drawing.companyDrawingNo);
  const [contractorDrawingNo, setContractorDrawingNo] = useState(drawing.contractorDrawingNo);
  const [drawingType, setDrawingType] = useState(drawing.drawingType);
  const [confidenceScore, setConfidenceScore] = useState(drawing.confidenceScore);
  const [companyFileName] = useState(drawing.companyFileName);
  
  // Local state for BOM items
  const [bomList, setBomList] = useState<BomItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    // Populate BOM list clone for edits
    if (drawing.billOfMaterial) {
      setBomList([...drawing.billOfMaterial]);
    }
  }, [drawing]);

  const handleBomRowChange = (index: number, key: keyof BomItem, value: string) => {
    const fresh = [...bomList];
    fresh[index] = { ...fresh[index], [key]: value };
    setBomList(fresh);
  };

  const addBomRow = () => {
    const nextPos = (bomList.length + 1).toString();
    const newRow: BomItem = {
      id: `new_bom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      drawingId: drawing.id,
      pos: nextPos,
      description: 'SUPPORT COMPONENT',
      dimension: '',
      qty: '1',
      material: 'S355JR',
      weight: '0.0',
    };
    setBomList([...bomList, newRow]);
  };

  const removeBomRow = (index: number) => {
    const fresh = bomList.filter((_, idx) => idx !== index);
    setBomList(fresh);
  };

  const handleCommit = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const revisedDrawing = {
        pageNo: drawing.pageNo,
        projectTitle,
        drawingTitle,
        companyDrawingNo,
        contractorDrawingNo,
        companyFileName,
        confidenceScore,
        drawingType,
      };

      await onSave(drawing.id, revisedDrawing, bomList);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Failed saving:', error);
      alert('Error saving modifications: ' + (error as any).message);
    } finally {
      setIsSaving(false);
    }
  };



  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-7xl h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-zoom-in">
        
        {/* Sticky Header */}
        <div className="bg-slate-900 text-slate-100 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight font-sans">
                Verification & Quality Audit Workspace
              </h3>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
                Sheet: {companyDrawingNo || 'N/A'} • Source File: {companyFileName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {saveSuccess && (
              <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-semibold bg-emerald-950/40 px-3 py-1 rounded-md animate-fade-in">
                <CheckCircle className="h-4 w-4" />
                <span>Ledger updated</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Main split workspace */}
        <div className="flex-1 overflow-hidden bg-slate-50">
          
          {/* Main Block: Structured Editor Workstation */}
          <div className="flex flex-col h-full overflow-y-auto p-6 space-y-6 bg-white">
            
            {/* Section 1: Drawing Metadata Form Block */}
            <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <h4 className="text-xs font-mono uppercase font-bold text-slate-500 tracking-wider">
                  Drawing Metadata Properties
                </h4>
                <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded tracking-wide">
                  Page No: {drawing.pageNo}
                </span>
              </div>

              <div className="space-y-3.5">
                {/* Project title */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">Project Title Reference</label>
                    {(!projectTitle || projectTitle.trim() === '' || projectTitle.includes('Unknown Project') || projectTitle.includes('OCR Fallback')) && (
                      <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">[Not Extracted]</span>
                    )}
                  </div>
                  <textarea
                    rows={2}
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    className={`w-full px-3 py-2 bg-white text-xs border rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-semibold transition-all ${
                      (!projectTitle || projectTitle.trim() === '' || projectTitle.includes('Unknown Project') || projectTitle.includes('OCR Fallback'))
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-slate-200'
                    }`}
                  />
                </div>

                {/* Grid for other numbers */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">Drawing Sheet Title</label>
                      {(!drawingTitle || drawingTitle.trim() === '' || drawingTitle.includes('Untitled Sheet') || drawingTitle.includes('OCR Fallback')) && (
                        <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">[Not Extracted]</span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={drawingTitle}
                      onChange={(e) => setDrawingTitle(e.target.value)}
                      className={`w-full px-3 py-2 bg-white text-xs border rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-semibold transition-all ${
                        (!drawingTitle || drawingTitle.trim() === '' || drawingTitle.includes('Untitled Sheet') || drawingTitle.includes('OCR Fallback'))
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                          : 'border-slate-200'
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">Drawing Classification</label>
                    <select
                      value={drawingType}
                      onChange={(e: any) => setDrawingType(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-semibold cursor-pointer"
                    >
                      <option value="Support">Pipe Support</option>
                      <option value="Structural">Structural framing</option>
                      <option value="Cable Tray">Cable Tray details</option>
                      <option value="Isometric">Isometric piping</option>
                      <option value="General">General overview</option>
                      <option value="Other">Other detail sheets</option>
                    </select>
                  </div>
                </div>

                {/* Grid for Drawing numbers */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">Company Drawing No</label>
                      {(!companyDrawingNo || companyDrawingNo.trim() === '' || companyDrawingNo === 'N/A') && (
                        <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">[Not Extracted]</span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={companyDrawingNo}
                      onChange={(e) => setCompanyDrawingNo(e.target.value)}
                      className={`w-full px-3 py-2 bg-white text-xs border rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-mono font-semibold transition-all ${
                        (!companyDrawingNo || companyDrawingNo.trim() === '' || companyDrawingNo === 'N/A')
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                          : 'border-slate-200'
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">Contractor Drawing No</label>
                      {(!contractorDrawingNo || contractorDrawingNo.trim() === '' || contractorDrawingNo === 'N/A') && (
                        <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">[Not Extracted]</span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={contractorDrawingNo}
                      onChange={(e) => setContractorDrawingNo(e.target.value)}
                      className={`w-full px-3 py-2 bg-white text-xs border rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-mono font-semibold transition-all ${
                        (!contractorDrawingNo || contractorDrawingNo.trim() === '' || contractorDrawingNo === 'N/A')
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                          : 'border-slate-200'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Bill of Materials (BOM) Editor Workspace */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center space-x-2">
                  <h4 className="text-xs font-mono uppercase font-bold text-slate-500 tracking-wider">
                    Tabulated Bill of Material (BOM) Grid
                  </h4>
                  <span className="font-mono text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                    {bomList.length} rows
                  </span>
                </div>
                <button
                  onClick={addBomRow}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold border border-blue-200/60 text-xs px-2.5 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Insert Part Row</span>
                </button>
              </div>

              {/* BOM Table */}
              {bomList.length === 0 ? (
                <div className="text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center space-y-2">
                  <AlertCircle className="h-6 w-6 text-slate-400" />
                  <p className="text-xs text-slate-500">No components recorded in Bill of Materials.</p>
                  <button 
                    onClick={addBomRow} 
                    className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    Click to add a standard part
                  </button>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse bg-white">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                          <th className="py-2.5 px-3 w-16">POS</th>
                          <th className="py-2.5 px-3 w-40">Description</th>
                          <th className="py-2.5 px-3 w-36">Dimension</th>
                          <th className="py-2.5 px-3 w-16">Qty</th>
                          <th className="py-2.5 px-3 w-28">Material</th>
                          <th className="py-2.5 px-3 w-20">Weight(kg)</th>
                          <th className="py-2.5 px-2 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 text-[11px]">
                        {bomList.map((bom, idx) => (
                          <tr key={bom.id || idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-2.5">
                              <input
                                type="text"
                                value={bom.pos}
                                onChange={(e) => handleBomRowChange(idx, 'pos', e.target.value)}
                                className="w-full px-1.5 py-1 text-center bg-slate-50/50 border border-slate-200 rounded-sm font-mono font-semibold text-slate-700"
                              />
                            </td>
                            <td className="py-2 px-1">
                              <input
                                type="text"
                                value={bom.description}
                                onChange={(e) => handleBomRowChange(idx, 'description', e.target.value)}
                                className="w-full px-1.5 py-1 border border-slate-200 rounded-sm font-semibold text-slate-700"
                              />
                            </td>
                            <td className="py-2 px-1">
                              <input
                                type="text"
                                value={bom.dimension}
                                placeholder="e.g. L 80 x 8"
                                onChange={(e) => handleBomRowChange(idx, 'dimension', e.target.value)}
                                className="w-full px-1.5 py-1 border border-slate-200 rounded-sm font-mono font-semibold text-slate-700"
                              />
                            </td>
                            <td className="py-2 px-1">
                              <input
                                type="text"
                                value={bom.qty}
                                onChange={(e) => handleBomRowChange(idx, 'qty', e.target.value)}
                                className="w-full px-1.5 py-1 text-center border border-slate-200 rounded-sm font-mono font-semibold text-slate-700"
                              />
                            </td>
                            <td className="py-2 px-1">
                              <input
                                type="text"
                                value={bom.material}
                                onChange={(e) => handleBomRowChange(idx, 'material', e.target.value)}
                                className="w-full px-1.5 py-1 border border-slate-200 rounded-sm font-mono font-semibold text-slate-700"
                              />
                            </td>
                            <td className="py-2 px-1">
                              <input
                                type="text"
                                value={bom.weight}
                                onChange={(e) => handleBomRowChange(idx, 'weight', e.target.value)}
                                className="w-full px-1.5 py-1 text-center border border-slate-200 rounded-sm font-mono font-semibold text-slate-700"
                              />
                            </td>
                            <td className="py-2 px-2 text-center">
                              <button
                                onClick={() => removeBomRow(idx)}
                                className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Modal Action Footer Bar */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-350 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            Cancel and Discard Changes
          </button>
          
          <button
            onClick={handleCommit}
            disabled={isSaving}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving Modifications...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save and Write Changes</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
