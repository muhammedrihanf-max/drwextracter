/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Building2, 
  LayoutDashboard, 
  UploadCloud, 
  FileText, 
  TableProperties, 
  Cpu,
  Download,
  Terminal,
  Layers,
  Trash2
} from 'lucide-react';
import { DashboardStats } from '../types';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  stats: DashboardStats | null;
  onExportExcel: () => void;
  onExportCSV: () => void;
  onClearAll: () => void;
}

export default function Sidebar({ 
  currentView, 
  setView, 
  stats,
  onExportExcel,
  onExportCSV,
  onClearAll
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', name: 'Upload Drawing PDFs', icon: UploadCloud },
    { id: 'explorer', name: 'Drawings Catalog', icon: FileText },
    { id: 'bom', name: 'BOM Item List', icon: TableProperties },
  ];

  return (
    <div className="w-64 bg-slate-900 text-slate-100 flex flex-col h-full border-r border-slate-800">
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="bg-blue-600 p-2 rounded-lg text-white shadow-md shadow-blue-500/20">
          <Layers className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-sans font-extrabold text-base tracking-tight text-white leading-tight">
            DRW<span className="text-blue-500">Extracter</span>
          </h1>
          <p className="font-mono text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
            Blueprint Intelligence
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <p className="px-3 font-mono text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-2">
          Operations
        </p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </button>
          );
        })}

        {/* Live Status Indicators as design decorations */}
        <div className="pt-6 border-t border-slate-800/80 mt-6">
          <p className="px-3 font-mono text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-3">
            Local Data
          </p>
          <div className="px-3 space-y-2 text-xs text-slate-400">
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Drawings:</span>
              <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-semibold">
                {stats?.totalDrawings || 0}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">BOM Rows:</span>
              <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-blue-400 font-semibold">
                {stats?.totalBomItems || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Export & Action Panel Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50 space-y-2">
        <button
          onClick={onExportExcel}
          disabled={!stats?.totalDrawings}
          className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 hover:text-white border border-slate-700 font-medium py-2 px-3 rounded-lg text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export Excel Reports</span>
        </button>
        <button
          onClick={onExportCSV}
          disabled={!stats?.totalDrawings}
          className="w-full bg-slate-950 hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed text-slate-400 hover:text-slate-200 border border-slate-800/10 font-medium py-1.5 px-3 rounded-lg text-[11px] flex items-center justify-center space-x-2 transition-colors cursor-pointer"
        >
          <Terminal className="h-3 w-3 text-slate-500" />
          <span>Raw CSV Log Export</span>
        </button>
        <button
          onClick={onClearAll}
          className="w-full bg-red-950/20 hover:bg-red-900/30 border border-red-900/50 text-red-400 hover:text-red-300 font-medium py-1.5 px-3 rounded-lg text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer mt-1"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Clear All Data</span>
        </button>
        <div className="text-center pt-2">
          <span className="text-[10px] text-slate-600 font-mono tracking-tight block">
            System Online • v1.1
          </span>
        </div>
      </div>
    </div>
  );
}
