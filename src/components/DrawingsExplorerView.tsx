/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Search, 
  SlidersHorizontal, 
  Trash2, 
  Eye, 
  Cpu, 
  ChevronRight, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Award,
  Filter,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { DrawingWithBom } from '../types';

interface DrawingsExplorerViewProps {
  drawings: DrawingWithBom[];
  onSelectDrawing: (drawing: DrawingWithBom) => void;
  onDeleteDrawing: (id: string) => void;
  filters: {
    query: string;
    drawingType: string;
    minConfidence: number;
    material: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    query: string;
    drawingType: string;
    minConfidence: number;
    material: string;
  }>>;
}

export default function DrawingsExplorerView({
  drawings,
  onSelectDrawing,
  onDeleteDrawing,
  filters,
  setFilters,
}: DrawingsExplorerViewProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const getConfidenceBadgeColor = (score: number) => {
    if (score >= 85) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 65) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-red-700 bg-red-50 border-red-200';
  };

  const drawingTypes = [
    { id: 'ALL', name: 'All Classifications' },
    { id: 'Support', name: 'Pipe & Conduit Supports' },
    { id: 'Structural', name: 'Structural / Metal Framing' },
    { id: 'Cable Tray', name: 'Cable Tray Drawings' },
    { id: 'Isometric', name: 'Isometric piping sheets' },
    { id: 'General', name: 'General layouts' },
    { id: 'Other', name: 'Other detail sheets' },
  ];

  const getExportUrl = (format: 'excel' | 'csv') => {
    const params = new URLSearchParams();
    if (filters.query) params.append('query', filters.query);
    if (filters.drawingType && filters.drawingType !== 'ALL') params.append('drawingType', filters.drawingType);
    if (filters.minConfidence > 0) params.append('minConfidence', String(filters.minConfidence));
    if (filters.material) params.append('material', filters.material);
    return `/api/export/${format}?${params.toString()}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight font-sans">
            Drawings Ledger
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Browse and query extracted drawings metadata and BOM lists. Click a card to preview original sheets and modify items.
          </p>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <a
            href={getExportUrl('excel')}
            download
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-4 py-2 rounded-lg flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export to Excel</span>
          </a>
          <a
            href={getExportUrl('csv')}
            download
            className="bg-slate-700 hover:bg-slate-800 text-white font-medium text-xs px-4 py-2 rounded-lg flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <FileText className="h-4 w-4" />
            <span>Export to CSV</span>
          </a>
        </div>
      </div>

      {/* Filter and Query Panel */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Main search bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Company Doc No., Contractor Doc No., Title, Project name..."
              value={filters.query}
              onChange={(e) => handleFilterChange('query', e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 text-slate-700 font-semibold"
            />
          </div>

          {/* Type dropdown */}
          <div className="w-full md:w-64">
            <select
              value={filters.drawingType}
              onChange={(e) => handleFilterChange('drawingType', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-700 font-semibold cursor-pointer"
            >
              {drawingTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-4 py-2 border rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              showAdvanced || filters.material || filters.minConfidence > 0
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Advanced Filters</span>
          </button>
        </div>

        {/* Advanced Filters Drawer */}
        {showAdvanced && (
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-down">
            {/* Filter by Material */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">
                Filter by Material Grade
              </label>
              <input
                type="text"
                placeholder="e.g. S355JR, S275JR, Grade 60..."
                value={filters.material}
                onChange={(e) => handleFilterChange('material', e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 placeholder:text-slate-400 font-semibold"
              />
            </div>

            {/* Confidence score slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-600">Minimum Confidence Score Accuracy</span>
                <span className="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-bold">
                  {filters.minConfidence}% +
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={filters.minConfidence}
                onChange={(e) => handleFilterChange('minConfidence', Number(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>
        )}
      </div>

      {/* Grid listing */}
      {drawings.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-3">
          <AlertCircle className="h-8 w-8 text-slate-400" />
          <h3 className="text-sm font-bold text-slate-700">No drawings matching filters</h3>
          <p className="text-xs text-slate-400 max-w-sm leading-normal">
            Try revising your search text, lowering the confidence barrier, or upload original PDF blueprint packages.
          </p>
          <button
            onClick={() => setFilters({ query: '', drawingType: 'ALL', minConfidence: 0, material: '' })}
            className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
          >
            Reset query filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {drawings.map((dwg) => (
            <div
              key={dwg.id}
              onClick={() => onSelectDrawing(dwg)}
              className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between group cursor-pointer"
            >
              <div className="space-y-3.5">
                {/* Upper line: Page No, Badge Type, Confidence */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase tracking-wider">
                      Page {dwg.pageNo}
                    </span>
                    <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-0.5 rounded-full font-bold uppercase">
                      {dwg.drawingType}
                    </span>
                  </div>
                </div>

                {/* Left hand: Details of codes */}
                <div className="space-y-2 select-text">
                  <h4 className="text-xs font-mono font-bold text-blue-600 limit-lines truncate" title={dwg.companyDrawingNo}>
                    {dwg.companyDrawingNo && dwg.companyDrawingNo !== 'N/A' && dwg.companyDrawingNo !== '' ? (
                      dwg.companyDrawingNo
                    ) : (
                      <span className="text-red-600 flex items-center space-x-1.5">
                        <span className="bg-red-50 text-red-700 border border-red-200 text-[8px] px-1.5 py-0.5 rounded font-mono font-extrabold uppercase">[Missing Dwg No]</span>
                        <span className="italic text-slate-400 font-semibold text-[11px]">(No Company Drawing No)</span>
                      </span>
                    )}
                  </h4>
                  
                  <p className="text-[10px] font-mono text-slate-400 truncate">
                    {dwg.contractorDrawingNo && dwg.contractorDrawingNo !== 'N/A' && dwg.contractorDrawingNo !== '' ? (
                      `Contractor Ref: ${dwg.contractorDrawingNo}`
                    ) : (
                      <span className="text-red-500 flex items-center space-x-1">
                        <span className="bg-red-50 text-red-600 border border-red-100 text-[8px] px-1 py-0.2 rounded font-mono font-extrabold uppercase">[Missing Contractor Ref]</span>
                      </span>
                    )}
                  </p>

                  <h3 className="text-sm font-extrabold text-slate-800 tracking-tight leading-snug line-clamp-2">
                    {dwg.drawingTitle && !dwg.drawingTitle.includes('Untitled Sheet') && !dwg.drawingTitle.includes('OCR Fallback') && dwg.drawingTitle !== '' ? (
                      dwg.drawingTitle
                    ) : (
                      <span className="text-red-600 flex items-center space-x-1.5">
                        <span className="bg-red-50 text-red-700 border border-red-200 text-[8px] px-1.5 py-0.5 rounded font-mono font-extrabold uppercase">[Requires Audit]</span>
                        <span className="italic text-slate-400 font-normal">Untitled Sheet</span>
                      </span>
                    )}
                  </h3>
                  
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-tight line-clamp-1">
                    {dwg.projectTitle && !dwg.projectTitle.includes('Unknown Project') && !dwg.projectTitle.includes('OCR Fallback') && dwg.projectTitle !== '' ? (
                      dwg.projectTitle
                    ) : (
                      <span className="text-red-600 flex items-center space-x-1.5">
                        <span className="bg-red-50 text-red-700 border border-red-200 text-[8px] px-1.5 py-0.5 rounded font-mono font-extrabold uppercase">[Not Extracted]</span>
                        <span className="italic text-slate-400 font-normal text-[11px]">(Project details missing)</span>
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Lower summary row */}
              <div className="pt-4 border-t border-slate-100 mt-4 flex justify-between items-center bg-slate-50/50 p-2 rounded-lg">
                <div className="flex items-center space-x-1">
                  <span className="text-[11px] font-mono font-extrabold text-slate-600">
                    {dwg.billOfMaterial?.length || 0}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    BOM Item Rows
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDrawing(dwg.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete record from ledger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                    className="p-1 text-blue-600 bg-white group-hover:bg-blue-600 group-hover:text-white rounded-lg shadow-xs hover:shadow-md transition-all flex items-center justify-center cursor-pointer"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
