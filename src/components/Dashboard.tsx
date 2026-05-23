import React, { useState } from 'react';
import {
  FileText,
  Search,
  CheckCircle,
  AlertTriangle,
  KeyRound,
  Users,
  Database,
  ArrowRight,
  TrendingUp,
  Cpu,
  RefreshCw,
  QrCode,
  Trash2,
  Eye,
  Download
} from 'lucide-react';
import { Spool, User } from '../types';

interface DashboardProps {
  spools: Spool[];
  user: User | null;
  onRefresh: () => void;
  onNavigateToTab: (tabId: string) => void;
  onSelectSpoolForViewer: (spool: Spool) => void;
  isLicensed: boolean;
}

export default function Dashboard({
  spools,
  user,
  onRefresh,
  onNavigateToTab,
  onSelectSpoolForViewer,
  isLicensed
}: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [confidenceFilter, setConfidenceFilter] = useState<number>(0);
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [activePreviewPdfUrl, setActivePreviewPdfUrl] = useState<string | null>(null);
  const [activePreviewSpool, setActivePreviewSpool] = useState<Spool | null>(null);

  const handleClearDatabase = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      // Automatically reset confirmation state after 4 seconds
      setTimeout(() => setConfirmClear(false), 4000);
      return;
    }
    setConfirmClear(false);
    setClearing(true);
    try {
      const res = await fetch('/api/spools/clear', { method: 'POST' });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error("Error clearing registry", err);
    } finally {
      setClearing(false);
    }
  };

  const handleDeleteSpool = async (id: string, sNumber: string) => {
    if (!window.confirm(`Confirm permanent deletion of spool drawing ${sNumber}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/spools/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error("Error deleting spool index", err);
    }
  };

  const handleExportToExcel = () => {
    if (filteredSpools.length === 0) {
      alert("No data available to export.");
      return;
    }

    const headers = [
      "Spool Number",
      "Page Number",
      "PDF Name",
      "Upload Date",
      "OCR Confidence (%)",
      "QR Data Content",
      "SKU Code",
      "Skew Angle (deg)",
      "Orientation (deg)",
      "System Label",
      "Pipeline Specifications"
    ];

    const rows = filteredSpools.map(spool => [
      spool.spoolNumber,
      spool.pageNumber,
      spool.pdfName,
      spool.uploadDate,
      spool.ocrConfidence,
      spool.qrData || "",
      spool.skuCode || "",
      spool.skewAngle || 0,
      spool.orientation || 0,
      spool.systemLabel || "",
      spool.pipelineSpecs || ""
    ]);

    const csvContent = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `spool_extraction_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Statistics calculation
  const totalSpools = spools.length;
  const uniquePdfs = Array.from(new Set(spools.map(s => s.pdfName))).length;
  
  const avgOcrConfidence = totalSpools > 0
    ? (spools.reduce((acc, s) => acc + s.ocrConfidence, 0) / totalSpools).toFixed(1)
    : '0';

  const failedOcrJobs = spools.filter(s => s.status === 'failed').length;

  // Filter spools
  const filteredSpools = spools.filter(spool => {
    const matchesSearch = spool.spoolNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          spool.pdfName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (spool.systemLabel && spool.systemLabel.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesConfidence = spool.ocrConfidence >= confidenceFilter;
    return matchesSearch && matchesConfidence;
  });

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full bg-slate-950 text-slate-100">
      
      {/* Header telemetry and controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0">
        <div>
          <h2 className="text-xl font-bold font-sans tracking-wide">Enterprise Operations Console</h2>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            id="dash-launch-ingest"
            onClick={() => onNavigateToTab('upload')}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold rounded-lg flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
          >
            <span>INGEST PDF FILE</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Industrial KPI Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Card 1: Total Spool Drawings */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-semibold">TOTAL SPOOLS INDEXED</span>
              <p className="text-3xl font-extrabold text-white mt-2 font-sans">{totalSpools}</p>
            </div>
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] font-mono text-slate-500 mt-3 flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>SQLite registrar synced</span>
          </p>
          <div className="absolute bottom-0 inset-x-0 h-1 bg-blue-500 opacity-60" />
        </div>

        {/* Card 4: Safety / System License */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-semibold">LICENSING STATUS</span>
              <p className={`text-xl font-bold mt-3 font-sans ${isLicensed ? 'text-emerald-400' : 'text-red-500'}`}>
                {isLicensed ? 'HW-LOK VALID' : 'SECURE LOCKED'}
              </p>
            </div>
            <div className={`p-2.5 rounded-lg border ${
              isLicensed
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-500'
            }`}>
              <KeyRound className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] font-mono text-slate-500 mt-3 truncate">
            {isLicensed ? 'Device signature lock online' : 'Activation key input required'}
          </p>
          <div className={`absolute bottom-0 inset-x-0 h-1 ${isLicensed ? 'bg-emerald-500' : 'bg-red-500'} opacity-60`} />
        </div>

      </div>

      {/* Main Database Table showing Registered Drawings */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-5 pb-4 border-b border-slate-800/60">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide flex items-center space-x-2">
              <span>Spool Index Repository</span>
            </h3>
            <p className="text-xs text-slate-400 font-sans mt-1">
              Manage indexed drawings, query extracts, and monitor pipeline logs.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <button
              id="dash-clear-db-btn"
              onClick={handleClearDatabase}
              disabled={clearing}
              className={`px-3.5 py-2 text-white rounded-lg text-xs font-semibold font-mono tracking-wide transition-all uppercase cursor-pointer flex items-center space-x-1.5 shadow-md hover:scale-[1.02] ${
                confirmClear 
                  ? 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700 shadow-amber-900/20 animate-pulse' 
                  : 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700 shadow-rose-900/20'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5 text-white" />
              <span>{clearing ? 'Clearing...' : confirmClear ? 'Click Again to Confirm!' : 'Clear All Data'}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0 mb-5">
          <div>
            <span className="text-xs text-slate-400 font-mono">
              Filter and search indexed results:
            </span>
          </div>
          
          {/* Filters controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                id="dash-table-search"
                type="text"
                placeholder="Search Spool / PDF / Specs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-48 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white font-mono placeholder-slate-600 transition-all outline-none"
              />
            </div>

            {/* Export Excel Button */}
            <button
              id="dash-export-excel-btn"
              onClick={handleExportToExcel}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-505 text-white text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 shadow-md transition-all cursor-pointer border border-emerald-550/40 hover:scale-[1.02]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT TO EXCEL</span>
            </button>
          </div>
        </div>

        {/* Database Grid */}
        <div className="overflow-x-auto border border-slate-800 rounded-lg bg-slate-950">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                <th className="py-3 px-4">Spool Number</th>
                <th className="py-3 px-3.5">Page Number</th>
                <th className="py-3 px-4">Drawing Preview</th>
                <th className="py-3 px-4">QR Data Content</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-800/60 text-slate-300 font-mono">
              {filteredSpools.length > 0 ? (
                filteredSpools.map((spool) => (
                  <tr
                    key={spool.id}
                    className="hover:bg-slate-900/60 transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-amber-500">
                      {spool.spoolNumber}
                    </td>
                    <td className="py-3 px-3.5">
                      P.{spool.pageNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div 
                        onClick={() => {
                          setActivePreviewPdfUrl(`/uploads/${spool.pdfName}`);
                          setActivePreviewSpool(spool);
                        }}
                        className="flex items-center space-x-3 cursor-pointer group hover:opacity-80 transition-all w-fit"
                        title="Click to preview PDF page"
                      >
                        <div className="w-10 h-7 rounded bg-slate-950 border border-slate-800/80 group-hover:border-amber-500/50 flex items-center justify-center relative overflow-hidden bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:3px_3px]">
                          <svg className="w-8 h-5 text-cyan-500/70 group-hover:text-amber-500/70" viewBox="0 0 40 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d={spool.pageNumber % 2 === 0 ? "M 8 18 L 18 10 L 22 14 L 32 8" : "M 8 8 L 18 16 L 26 10 L 32 14"} strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="absolute bottom-0 right-0.5 text-[7px] font-sans text-cyan-400 group-hover:text-amber-400 scale-90 px-0.5 rounded leading-none">
                            PDF
                          </span>
                        </div>
                        <span className="text-slate-400 font-semibold text-[10px] font-mono group-hover:text-slate-200 flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-500" />
                          <span>Page {spool.pageNumber}</span>
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 truncate max-w-[200px]" title={spool.qrData || ''}>
                      {spool.qrData || 'NO_BARCODE'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <a
                          id={`dash-action-download-${spool.id}`}
                          href={`/uploads/${spool.pdfName}`}
                          download={`${spool.spoolNumber}.pdf`}
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-750 rounded font-sans text-[11px] font-semibold transition-all cursor-pointer flex items-center space-x-1"
                          title="Download spool page"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-400" />
                          <span>Download</span>
                        </a>

                        <button
                          id={`dash-action-delete-${spool.id}`}
                          onClick={() => handleDeleteSpool(spool.id, spool.spoolNumber)}
                          className="p-1 px-1.5 bg-slate-900 border border-slate-800 hover:border-red-500/40 text-slate-400 hover:text-red-400 rounded transition-all cursor-pointer"
                          title="Delete spool drawing"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500 font-sans">
                    No registered spools matched current telemetry filter parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center mt-3 text-[10px] font-mono text-slate-500">
          <span>Displaying {filteredSpools.length} of {totalSpools} indexed drawings</span>
          <span>Database status: READ / WRITE persistent</span>
        </div>
      </div>

      {activePreviewPdfUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
              <div>
                <h3 className="text-sm font-semibold text-white font-mono flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-500" />
                  <span>Drawing Preview: {activePreviewSpool?.spoolNumber}</span>
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Page {activePreviewSpool?.pageNumber} | File: {activePreviewSpool?.pdfName}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <a
                  href={`/uploads/${activePreviewSpool?.pdfName}`}
                  download={`${activePreviewSpool?.spoolNumber}.pdf`}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded text-xs font-semibold font-mono flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>DOWNLOAD PAGE</span>
                </a>
                <button
                  onClick={() => {
                    setActivePreviewPdfUrl(null);
                    setActivePreviewSpool(null);
                  }}
                  className="p-1 px-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded text-xs font-mono transition-all cursor-pointer"
                >
                  CLOSE
                </button>
              </div>
            </div>
            
            {/* Modal Content - PDF Iframe */}
            <div className="flex-1 bg-slate-950 relative">
              <iframe
                src={`/uploads/${activePreviewSpool?.pdfName}`}
                className="w-full h-full border-none"
                title={`Spool drawing preview: ${activePreviewSpool?.spoolNumber}`}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
