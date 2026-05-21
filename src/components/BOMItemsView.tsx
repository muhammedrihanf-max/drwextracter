/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Database, 
  Trash2, 
  FileSpreadsheet, 
  Building2, 
  FileText, 
  ChevronRight,
  TrendingUp,
  Scale
} from 'lucide-react';
import { DrawingWithBom, BomItem } from '../types';

interface BOMItemsViewProps {
  drawings: DrawingWithBom[];
  onSelectDrawing: (drawing: DrawingWithBom) => void;
}

export default function BOMItemsView({ drawings, onSelectDrawing }: BOMItemsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [materialFilter, setMaterialFilter] = useState('');

  // Expand and compile all BOM items with reference drawing metadata (for materials dropdown and global calculations)
  const compiledBoms = useMemo(() => {
    const list: Array<BomItem & { 
      companyDrawingNo: string; 
      drawingTitle: string;
      projectTitle: string;
      parentDrawing: DrawingWithBom;
    }> = [];

    drawings.forEach((dwg) => {
      if (dwg.billOfMaterial) {
        dwg.billOfMaterial.forEach((bom) => {
          list.push({
            ...bom,
            companyDrawingNo: dwg.companyDrawingNo,
            drawingTitle: dwg.drawingTitle,
            projectTitle: dwg.projectTitle,
            parentDrawing: dwg,
          });
        });
      }
    });

    return list;
  }, [drawings]);

  // Group and filter drawings with their corresponding BOM items
  const drawingsWithFilteredBoms = useMemo(() => {
    return drawings
      .map((dwg) => {
        const filteredBom = (dwg.billOfMaterial || []).filter((bom) => {
          const matchesSearch =
            searchTerm === '' ||
            bom.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bom.dimension.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dwg.companyDrawingNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dwg.drawingTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dwg.projectTitle.toLowerCase().includes(searchTerm.toLowerCase());

          const matchesMaterial =
            materialFilter === '' ||
            bom.material.toLowerCase().includes(materialFilter.toLowerCase());

          return matchesSearch && matchesMaterial;
        });

        return {
          ...dwg,
          filteredBom,
        };
      })
      .filter((dwg) => dwg.filteredBom.length > 0);
  }, [drawings, searchTerm, materialFilter]);

  // Compute aggregated stats based on filtered BOM items
  const aggregateStats = useMemo(() => {
    let totalItemsCount = 0;
    let totalWeightKg = 0;

    drawingsWithFilteredBoms.forEach((dwg) => {
      dwg.filteredBom.forEach((bom) => {
        totalItemsCount += 1;
        totalWeightKg += parseFloat(bom.weight) || 0;
      });
    });

    return {
      totalItemsCount,
      estimatedWeight: Math.round(totalWeightKg * 10) / 10,
    };
  }, [drawingsWithFilteredBoms]);

  // Get list of unique materials for filtering options
  const uniqueMaterials = useMemo(() => {
    const mats = new Set<string>();
    compiledBoms.forEach((b) => {
      if (b.material && b.material.trim() !== '') {
        mats.add(b.material.trim().toUpperCase());
      }
    });
    return Array.from(mats).sort();
  }, [compiledBoms]);

  const getExportUrl = (format: 'excel' | 'csv') => {
    const params = new URLSearchParams();
    if (searchTerm) params.append('query', searchTerm);
    if (materialFilter) params.append('material', materialFilter);
    return `/api/export/${format}?${params.toString()}`;
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-700">
      {/* View Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight font-sans">
            Inventory & Material Log (BOM)
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Browse and compile global Bill of Materials compiled from your active CAD blueprint sheets. Matches steel grades and profiles.
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

      {/* KPI Stats summaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">Unique Ledger Rows</p>
            <p className="text-xl font-extrabold text-slate-900 font-sans mt-0.5">{aggregateStats.totalItemsCount}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">Total Structural Weight</p>
            <p className="text-xl font-extrabold text-slate-900 font-sans mt-0.5">{aggregateStats.estimatedWeight} kg</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">Unique Material Standards</p>
            <p className="text-xl font-extrabold text-slate-900 font-sans mt-0.5">{uniqueMaterials.length}</p>
          </div>
        </div>
      </div>

      {/* Grid Filtering */}
      <div className="bg-white border border-slate-150 rounded-xl p-4 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search material description, profiles, dimensions, parent drawing #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-semibold"
          />
        </div>

        <div className="w-full md:w-56">
          <select
            value={materialFilter}
            onChange={(e) => setMaterialFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-semibold cursor-pointer"
          >
            <option value="">All Materials ({uniqueMaterials.length})</option>
            {uniqueMaterials.map((mat) => (
              <option key={mat} value={mat}>
                {mat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* BOM Tabular Ledger - Separate tables per page */}
      {drawingsWithFilteredBoms.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl border border-slate-150 flex flex-col items-center justify-center space-y-3">
          <Database className="h-8 w-8 text-slate-350" />
          <h3 className="text-sm font-bold text-slate-700">No BOM items recorded</h3>
          <p className="text-xs text-slate-400 max-w-sm leading-normal">
            Upload engineering PDFs or write manual revisions to populate the central material inventory lists.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {drawingsWithFilteredBoms.map((dwg) => (
            <div key={dwg.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-sm transition-all">
              {/* Drawing Page Header */}
              <div className="bg-slate-900 text-slate-100 p-4 border-b border-slate-800">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <span className="text-[9px] font-mono font-bold tracking-widest text-blue-400 bg-blue-950 px-2.5 py-0.5 rounded uppercase mr-2">
                      Page {dwg.pageNo}
                    </span>
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase">
                      {dwg.projectTitle && !dwg.projectTitle.includes('Unknown Project') && !dwg.projectTitle.includes('OCR Fallback') && dwg.projectTitle !== '' ? (
                        <span className="text-slate-400">{dwg.projectTitle}</span>
                      ) : (
                        <span className="text-red-400 font-bold flex items-center inline-flex space-x-1">
                          <span className="bg-red-950/80 text-red-400 border border-red-900 text-[8px] px-1 py-0.2 rounded font-mono mr-1 font-extrabold uppercase">[Not Extracted]</span>
                          <span className="italic font-normal">(Project Title)</span>
                        </span>
                      )}
                    </span>
                    <h3 className="text-sm font-extrabold text-white mt-1">
                      {dwg.drawingTitle && !dwg.drawingTitle.includes('Untitled Sheet') && !dwg.drawingTitle.includes('OCR Fallback') && dwg.drawingTitle !== '' ? (
                        dwg.drawingTitle
                      ) : (
                        <span className="text-red-400 font-bold flex items-center inline-flex space-x-1">
                          <span className="bg-red-950/80 text-red-400 border border-red-900 text-[8px] px-1 py-0.2 rounded font-mono mr-1 font-extrabold uppercase">[Requires Audit]</span>
                          <span className="italic font-normal">(Untitled Sheet)</span>
                        </span>
                      )}
                    </h3>
                  </div>
                  
                  <button
                    onClick={() => onSelectDrawing(dwg)}
                    className="self-start md:self-auto bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 border border-slate-750 text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <span>Audit Design Sheet</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 pt-3 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
                  <div>
                    <span className="block text-slate-500 font-bold uppercase tracking-wider text-[8px]">Company Dwg No</span>
                    {dwg.companyDrawingNo && dwg.companyDrawingNo !== 'N/A' && dwg.companyDrawingNo !== '' ? (
                      <span className="text-slate-200 font-bold">{dwg.companyDrawingNo}</span>
                    ) : (
                      <span className="text-red-450 font-bold flex items-center inline-flex space-x-1">
                        <span className="bg-red-950/50 text-red-400 border border-red-900/60 text-[7px] px-1 rounded font-mono font-extrabold uppercase">[Missing]</span>
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="block text-slate-500 font-bold uppercase tracking-wider text-[8px]">Contractor Dwg No</span>
                    {dwg.contractorDrawingNo && dwg.contractorDrawingNo !== 'N/A' && dwg.contractorDrawingNo !== '' ? (
                      <span className="text-slate-200 font-bold">{dwg.contractorDrawingNo}</span>
                    ) : (
                      <span className="text-red-450 font-bold flex items-center inline-flex space-x-1">
                        <span className="bg-red-950/50 text-red-400 border border-red-900/60 text-[7px] px-1 rounded font-mono font-extrabold uppercase">[Missing]</span>
                      </span>
                    )}
                  </div>
                  <div className="col-span-2">
                    <span className="block text-slate-500 font-bold uppercase tracking-wider text-[8px]">Company File Name</span>
                    <span className="text-slate-200 font-bold truncate block" title={dwg.companyFileName}>{dwg.companyFileName}</span>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse bg-white">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-4 w-16">POS</th>
                      <th className="py-2.5 px-4">Component Description</th>
                      <th className="py-2.5 px-4">Dimension Size</th>
                      <th className="py-2.5 px-4 text-center w-24">Qty</th>
                      <th className="py-2.5 px-4">Steel Grade</th>
                      <th className="py-2.5 px-4 text-right w-28">Wt (kg)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-[11px] font-sans">
                    {dwg.filteredBom.map((bom) => (
                      <tr key={bom.id} className="hover:bg-slate-50/40 group font-medium text-slate-700 select-text">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-400">{bom.pos || '-'}</td>
                        <td className="py-2.5 px-4 text-slate-800 font-bold">{bom.description}</td>
                        <td className="py-2.5 px-4 font-mono font-semibold text-blue-600">{bom.dimension || '-'}</td>
                        <td className="py-2.5 px-4 text-center">
                          <span className="font-mono font-bold bg-slate-50 text-slate-700 border border-slate-200/60 rounded px-1.5 py-0.5 text-[10px]">
                            {bom.qty || '-'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100/50 text-indigo-700 rounded-md font-mono font-bold text-[10px]">
                            {bom.material || '-'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800">{bom.weight || '0.0'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
