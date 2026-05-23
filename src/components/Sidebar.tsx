import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  Cpu,
  ShieldCheck,
  KeyRound,
  LogOut,
  FolderOpen,
  Sliders,
  Database
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  currentTab: string;
  onChangeTab: (tab: string) => void;
  user: User | null;
  onLogout: () => void;
  isLicensed: boolean;
  activeJobsCount: number;
}

export default function Sidebar({
  currentTab,
  onChangeTab,
  user,
  onLogout,
  isLicensed,
  activeJobsCount
}: SidebarProps) {
  const tabs: Array<{ id: string; label: string; icon: any; roles: string[]; badge?: number }> = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard, roles: ['Admin', 'User'] },
    { id: 'upload', label: 'Drawing Ingest (PDF)', icon: UploadCloud, roles: ['Admin', 'User'] },
    { id: 'admin', label: 'Admin Audit & Overrides', icon: Sliders, roles: ['Admin'] },
    { id: 'licenses', label: 'HW Fingerprint License', icon: KeyRound, roles: ['Admin', 'User'] }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between text-slate-300 select-none">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center space-x-3">
          <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-md text-amber-500">
            <Database className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-sm font-semibold tracking-tight text-white block">Spool Number Extractor</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-4 space-y-1">
          {tabs.map((tab) => {
            // Check roles access
            if (user && !tab.roles.includes(user.role)) return null;

            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`sidebar-tab-${tab.id}`}
                onClick={() => onChangeTab(tab.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{tab.label}</span>
                </div>
                {tab.badge !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-slate-950 text-amber-400' : 'bg-red-500 text-white'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Account section */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        {/* Hardware Licensing State */}
        <div className="mb-4 px-3 py-2 bg-slate-900/80 rounded-lg border border-slate-800/80 flex items-center space-x-2.5">
          <ShieldCheck className={`w-4 h-4 ${isLicensed ? 'text-emerald-400' : 'text-red-400'}`} />
          <div className="text-xs">
            <span className="block font-mono text-[10px] text-slate-500">HARDWARE STATUS</span>
            <span className="font-medium text-slate-300">
              {isLicensed ? 'HW LOK VALIDATED' : 'LICENSE REQUIRED'}
            </span>
          </div>
        </div>

        {user && (
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-amber-400 uppercase">
                  {user.username.slice(0, 2)}
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-slate-200 truncate max-w-[100px]">{user.username}</p>
                  <p className="text-[10px] text-amber-500 font-mono tracking-tighter">{user.role.toUpperCase()}</p>
                </div>
              </div>
              
              <button
                id="sidebar-logout-btn"
                onClick={onLogout}
                className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-red-400 transition-colors"
                title="Logout Session"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            <div className="pt-2 border-t border-slate-850 text-center">
              <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest leading-relaxed">
                Published by
              </span>
              <span className="block text-[10px] font-sans text-slate-400 font-semibold tracking-wide">
                Muhammed Rihan
              </span>
              <a href="tel:+971566202782" className="block text-[9px] font-mono text-amber-500 hover:underline mt-0.5">
                +971 56 620 2782
              </a>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
