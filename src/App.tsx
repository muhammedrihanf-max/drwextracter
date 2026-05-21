/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import UploadView from './components/UploadView';
import DrawingsExplorerView from './components/DrawingsExplorerView';
import BOMItemsView from './components/BOMItemsView';
import DrawingDetailModal from './components/DrawingDetailModal';
import { DrawingWithBom, DashboardStats } from './types';
import { AlertCircle, RefreshCw, ChevronDown, User, Mail, Phone } from 'lucide-react';

export default function App() {
  // Navigation states
  const [currentView, setView] = useState<string>('dashboard');
  const [drawings, setDrawings] = useState<DrawingWithBom[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [selectedDrawing, setSelectedDrawing] = useState<DrawingWithBom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [showContact, setShowContact] = useState(false);

  // Explorer filter states
  const [filters, setFilters] = useState({
    query: '',
    drawingType: 'ALL',
    minConfidence: 0,
    material: '',
  });

  // Fetch compiled drawings
  const fetchDrawings = async () => {
    try {
      const params = new URLSearchParams({
        query: filters.query,
        drawingType: filters.drawingType,
        minConfidence: filters.minConfidence.toString(),
        material: filters.material,
      });

      const response = await fetch(`/api/drawings?${params.toString()}`);
      if (!response.ok) throw new Error('Could not retrieve drawings from server.');
      
      const list = await response.json();
      setDrawings(list);
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || 'Error occurred loading datasets.');
    }
  };

  // Fetch KPIs summaries stats
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      if (!response.ok) throw new Error('Could not retrieve analytical KPIs.');
      
      const dataset = await response.json();
      setStats(dataset);
    } catch (err) {
      console.error(err);
    }
  };

  // Refresh datasets on mount and filter changes
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchDrawings(), fetchStats()]);
      setIsLoading(false);
    };
    loadData();
  }, [filters]);

  // Handle PDF parsing callback
  const handleUploadComplete = async () => {
    // Re-sync catalog lists & dashboard totals
    await Promise.all([fetchDrawings(), fetchStats()]);
    // Switch to drawings catalog to review immediate parsed details
    setView('explorer');
  };

  // Deletion logic
  const handleDeleteDrawing = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to delete this drawing sheet and all associated BOM part items?')) {
      return;
    }

    try {
      const response = await fetch(`/api/drawings/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete network handshakes failed.');
      
      // Update states
      await Promise.all([fetchDrawings(), fetchStats()]);
    } catch (err: any) {
      alert('Could not delete: ' + err.message);
    }
  };

  // Modal Save/Write-back endpoint handler
  const handleSaveDrawingEdits = async (drawingId: string, updatedDrawing: any, updatedBoms: any[]) => {
    const response = await fetch(`/api/drawings/${drawingId}/edit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        drawingData: updatedDrawing,
        boms: updatedBoms,
      }),
    });

    if (!response.ok) {
      const errorObj = await response.json().catch(() => ({}));
      throw new Error(errorObj.error || 'Server rejected manual drawing edits.');
    }

    // Refresh states
    await Promise.all([fetchDrawings(), fetchStats()]);
    
    // Refresh modal focus references with latest saved details
    const refreshed = await fetch(`/api/drawings/${drawingId}`).then((r) => r.json());
    if (refreshed) {
      setSelectedDrawing(refreshed);
    }
  };

  // Download export triggers
  const handleExportExcel = () => {
    const params = new URLSearchParams({
      query: filters.query,
      drawingType: filters.drawingType,
      minConfidence: filters.minConfidence.toString(),
      material: filters.material,
    });
    window.open(`/api/export/excel?${params.toString()}`, '_blank');
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams({
      query: filters.query,
      drawingType: filters.drawingType,
      minConfidence: filters.minConfidence.toString(),
      material: filters.material,
    });
    window.open(`/api/export/csv?${params.toString()}`, '_blank');
  };

  const handleClearAll = async () => {
    if (!confirm('Are you absolutely sure you want to delete ALL drawing sheets and ALL extracted material records? This action is permanent!')) {
      return;
    }

    try {
      const response = await fetch('/api/drawings/clear-all', { method: 'POST' });
      if (!response.ok) throw new Error('Clear all endpoint rejected request.');
      
      // Refresh datasets and return to dashboard
      await Promise.all([fetchDrawings(), fetchStats()]);
      setView('dashboard');
    } catch (err: any) {
      alert('Could not clear datasets: ' + err.message);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden font-sans antialiased text-slate-800">
      
      {/* 1. Sidebar Panel Nav */}
      <Sidebar 
        currentView={currentView} 
        setView={setView} 
        stats={stats}
        onExportExcel={handleExportExcel}
        onExportCSV={handleExportCSV}
        onClearAll={handleClearAll}
      />

      {/* 2. Main Module Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Upper Brand Info bar */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center space-x-3 text-xs text-slate-400">
            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">
              WORKSPACE ACTIVE
            </span>
            <span className="text-slate-300">|</span>
            <span className="font-extrabold text-slate-750">Emarataloula Industries</span>
          </div>

          <div className="flex items-center space-x-5">
            {/* Contact Us Dropdown Button */}
            <div className="relative">
              <button 
                onClick={() => setShowContact(!showContact)}
                className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-[11px] px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer border border-slate-200/80 shadow-xs"
              >
                <span>Contact Us</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
              </button>
              
              {showContact && (
                <>
                  {/* Backdrop overlay to close when clicking outside */}
                  <div className="fixed inset-0 z-40" onClick={() => setShowContact(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200/85 rounded-xl shadow-lg p-4 z-50 animate-slide-down space-y-3">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5 font-mono">
                      Technical support
                    </div>
                    <div className="space-y-2.5">
                      <div className="flex items-center space-x-2 text-slate-700">
                        <User className="h-4 w-4 text-slate-400 shrink-0" />
                        <span className="font-bold text-xs text-slate-800">Muhammed Rihan</span>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-700">
                        <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                        <a href="mailto:muhammed.rihan@ali-sons.com" className="text-xs text-blue-600 hover:underline font-mono font-medium">
                          muhammed.rihan@ali-sons.com
                        </a>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-700">
                        <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                        <a href="tel:+971566202782" className="text-xs text-slate-600 hover:text-blue-600 hover:underline font-mono font-medium">
                          +971566202782
                        </a>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic content rendering with scroll viewport */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
          {isLoading && drawings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3.5">
              <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
              <h3 className="text-sm font-bold text-slate-600">Initializing platform environment...</h3>
              <p className="text-xs text-slate-400">Structuring engineering blueprints systems</p>
            </div>
          ) : errorStatus ? (
            <div className="max-w-xl mx-auto mt-12 bg-red-50/50 border border-red-200 rounded-2xl p-6 text-center space-y-4">
              <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">Operational Ingress Stopped</h3>
              <p className="text-xs text-slate-600">{errorStatus}</p>
              <button 
                onClick={() => { setErrorStatus(null); fetchDrawings(); }}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
              >
                Retry Database Connection
              </button>
            </div>
          ) : (
            <>
              {currentView === 'dashboard' && (
                <DashboardView stats={stats} setView={setView} />
              )}
              {currentView === 'upload' && (
                <UploadView onUploadSuccess={handleUploadComplete} />
              )}
              {currentView === 'explorer' && (
                <DrawingsExplorerView 
                  drawings={drawings} 
                  onSelectDrawing={setSelectedDrawing}
                  onDeleteDrawing={handleDeleteDrawing}
                  filters={filters}
                  setFilters={setFilters}
                />
              )}
              {currentView === 'bom' && (
                <BOMItemsView 
                  drawings={drawings} 
                  onSelectDrawing={(dwg) => {
                    setSelectedDrawing(dwg);
                  }}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* 3. Global verification review sheets modal */}
      {selectedDrawing && (
        <DrawingDetailModal 
          drawing={selectedDrawing}
          onClose={() => setSelectedDrawing(null)}
          onSave={handleSaveDrawingEdits}
        />
      )}
    </div>
  );
}
