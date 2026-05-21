/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  FileText, 
  Layers, 
  Database, 
  Target, 
  ShieldCheck, 
  Wrench, 
  Flame, 
  Layout,
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { DashboardStats } from '../types';

interface DashboardViewProps {
  stats: DashboardStats | null;
  setView: (view: string) => void;
}

export default function DashboardView({ stats, setView }: DashboardViewProps) {
  const kpis = [
    {
      title: 'Total Original PDFs',
      value: stats?.totalPdfs || 0,
      description: 'Unique electronic CAD packages',
      icon: FileText,
      color: 'border-blue-500 text-blue-600 bg-blue-50/50',
    },
    {
      title: 'Total Drawing Sheets',
      value: stats?.totalDrawings || 0,
      description: 'Analyzed drawings & blueprints',
      icon: Layers,
      color: 'border-indigo-500 text-indigo-600 bg-indigo-50/50',
    },
    {
      title: 'Extracted BOM Items',
      value: stats?.totalBomItems || 0,
      description: 'Structural component details',
      icon: Database,
      color: 'border-emerald-500 text-emerald-600 bg-emerald-50/50',
    },
  ];

  // Map drawing types to styling
  const typeIcons: Record<string, any> = {
    'Support': Wrench,
    'Structural': Layers,
    'Cable Tray': Layout,
    'Isometric': Flame,
    'General': FileText,
    'Other': FileText,
  };

  const drawingTypes = [
    { id: 'Support', name: 'Pipe & Conduit Supports', count: stats?.drawingsByType['Support'] || 0, color: 'bg-blue-600' },
    { id: 'Structural', name: 'Structural / Metal Framing', count: stats?.drawingsByType['Structural'] || 0, color: 'bg-indigo-600' },
    { id: 'Cable Tray', name: 'Cable Tray Routing', count: stats?.drawingsByType['Cable Tray'] || 0, color: 'bg-amber-600' },
    { id: 'Isometric', name: 'Isometric piping sheets', count: stats?.drawingsByType['Isometric'] || 0, color: 'bg-orange-600' },
    { id: 'General', name: 'General layouts & schematics', count: stats?.drawingsByType['General'] || 0, color: 'bg-slate-600' },
    { id: 'Other', name: 'Miscellaneous details', count: stats?.drawingsByType['Other'] || 0, color: 'bg-teal-600' },
  ];

  const totalTypesCount = drawingTypes.reduce((sum, item) => sum + item.count, 0) || 1;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
            Operations Workspace
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Automated PDF extraction pipeline for Pipe Supports, Isometric drawings, and Structural fabrication.
          </p>
        </div>
        <button
          onClick={() => setView('upload')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-5 py-2.5 rounded-lg flex items-center space-x-2 shadow-sm transition-colors cursor-pointer self-start md:self-auto"
        >
          <span>Upload PDF Drawings</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div 
              key={idx} 
              className={`bg-white border-l-4 rounded-xl p-5 shadow-sm border border-slate-100 flex items-start justify-between ${kpi.color}`}
            >
              <div className="space-y-1">
                <p className="text-xs uppercase font-mono font-bold tracking-wider text-slate-500">
                  {kpi.title}
                </p>
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
                  {kpi.value}
                </p>
                <p className="text-xs text-slate-400">
                  {kpi.description}
                </p>
              </div>
              <div className="p-2.5 bg-white/80 rounded-lg shadow-xs mt-1">
                <Icon className="h-5 w-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Statistics Chart Panel */}
      <div className="w-full">
        {/* Drawings Type Distribution Chart-Like progress */}
        <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <span>AI Smart Drawing Classification</span>
              </h3>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest font-semibold">
                Drawing sheets
              </span>
            </div>
            
            <p className="text-xs text-slate-500 mb-6">
              AI automatically classifies your uploaded drawings based on the structure of extracted elements and sheets keywords.
            </p>

            <div className="space-y-4">
              {drawingTypes.map((type) => {
                const percentage = Math.round((type.count / totalTypesCount) * 100);
                const TypeIcon = typeIcons[type.id] || FileText;
                return (
                  <div key={type.id} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <div className="flex items-center space-x-2">
                        <TypeIcon className="h-3.5 w-3.5 text-slate-400" />
                        <span>{type.name}</span>
                      </div>
                      <div className="font-mono">
                        <span className="text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded font-bold mr-1">{type.count}</span>
                        <span className="text-slate-400 text-[10px] font-normal">({percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${type.color}`}
                        style={{ width: `${stats?.totalDrawings ? percentage : 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-5 border-t border-slate-100 mt-6 flex justify-between items-center text-xs text-slate-500">
            <span>Requires human verification validation of empty tags</span>
            <button 
              onClick={() => setView('explorer')}
              className="text-blue-600 hover:text-blue-700 font-bold flex items-center space-x-1 hover:underline text-xs cursor-pointer"
            >
              <span>Verify drawings</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
