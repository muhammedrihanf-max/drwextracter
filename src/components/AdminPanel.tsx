import React, { useState, useEffect } from 'react';
import {
  Users,
  Settings,
  ShieldCheck,
  UserPlus,
  RefreshCw,
  Search,
  Database,
  Pencil,
  Sliders,
  BellRing,
  Trash2,
  ListRestart,
  Eye,
  EyeOff
} from 'lucide-react';
import { User, UserLog, Spool } from '../types';

interface AdminPanelProps {
  onRefresh: () => void;
  users: User[];
  logs: UserLog[];
  spools: Spool[];
}

export default function AdminPanel({ onRefresh, users, logs, spools }: AdminPanelProps) {
  // User creation states
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'Admin' | 'User'>('User');
  const [creatingUser, setCreatingUser] = useState(false);

  // Correction Override states
  const [editingSpoolId, setEditingSpoolId] = useState<string | null>(null);
  const [overrideSpoolNumber, setOverrideSpoolNumber] = useState('');
  const [overrideLabel, setOverrideLabel] = useState('');
  const [overrideSpecs, setOverrideSpecs] = useState('');
  const [overrideStatusMsg, setOverrideStatusMsg] = useState<string | null>(null);

  // Search parameters for correction grid
  const [dbSearch, setDbSearch] = useState('');

  // Gemini API Key states
  const [geminiKey, setGeminiKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [keyStatusMsg, setKeyStatusMsg] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);

  useEffect(() => {
    const fetchKey = async () => {
      try {
        const res = await fetch('/api/admin/config');
        if (res.ok) {
          const data = await res.json();
          setGeminiKey(data.geminiApiKey || '');
        }
      } catch (err) {
        console.error("Failed to load Gemini config", err);
      }
    };
    fetchKey();
  }, []);

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingKey(true);
    setKeyStatusMsg(null);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiApiKey: geminiKey })
      });
      if (res.ok) {
        setKeyStatusMsg('Key updated successfully!');
        setTimeout(() => setKeyStatusMsg(null), 3000);
      } else {
        setKeyStatusMsg('Failed to update config.');
      }
    } catch (err) {
      setKeyStatusMsg('Network error.');
    } finally {
      setSavingKey(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newEmail || !newPassword) return;
    setCreatingUser(true);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername,
          email: newEmail,
          role: newRole,
          password: newPassword
        })
      });

      if (response.ok) {
        setNewUsername('');
        setNewEmail('');
        setNewPassword('');
        setNewRole('User');
        onRefresh();
        alert('User successfully provisioned on network registry!');
      } else {
        alert('Provisioning rejected by central gateway.');
      }
    } catch (err) {
      alert('Network anomaly: failed to register profile.');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleStartEdit = (spool: Spool) => {
    setEditingSpoolId(spool.id);
    setOverrideSpoolNumber(spool.spoolNumber);
    setOverrideLabel(spool.systemLabel || '');
    setOverrideSpecs(spool.pipelineSpecs || '');
    setOverrideStatusMsg(null);
  };

  const handleSaveCorrection = async (id: string) => {
    if (!overrideSpoolNumber.trim()) return;
    setOverrideStatusMsg('Saving indices changes...');

    try {
      const response = await fetch('/api/spools/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          spoolNumber: overrideSpoolNumber,
          systemLabel: overrideLabel,
          pipelineSpecs: overrideSpecs
        })
      });

      if (response.ok) {
        setEditingSpoolId(null);
        onRefresh();
        setOverrideStatusMsg(null);
      } else {
        setOverrideStatusMsg('Rejection: DB update denied.');
      }
    } catch (err) {
      setOverrideStatusMsg('Anomaly: database network timeout.');
    }
  };

  const filteredSpools = spools.filter(s =>
    s.spoolNumber.toLowerCase().includes(dbSearch.toLowerCase()) ||
    s.pdfName.toLowerCase().includes(dbSearch.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full bg-slate-950 text-slate-100">
      
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold tracking-wide">Administrator Gate Console</h2>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Manual database corrective overrides, user credentials validation, and system access logs auditing.
          </p>
        </div>

        <button
          id="admin-sync-btn"
          onClick={onRefresh}
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-mono text-slate-300 flex items-center space-x-2 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>FORCE DB RESYNC</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* User Gating Gird */}
        <div className="space-y-6">
          
          {/* Create User Profile */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center space-x-2.5 text-amber-500">
              <UserPlus className="w-4.5 h-4.5" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest">Provision Officer Credentials</h3>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Username ID</label>
                <input
                  id="admin-new-username"
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. ssmith"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2 text-xs text-white outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Secure Email address</label>
                <input
                  id="admin-new-email"
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="ssmith@pipingfab.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2 text-xs text-white outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Account Password</label>
                <div className="relative">
                  <input
                    id="admin-new-password"
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2 pr-10 text-xs text-white outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-350 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">System clearance role</label>
                <select
                  id="admin-new-role"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2 text-xs text-white font-mono outline-none"
                >
                  <option value="User">User (Engineer / QA Supervisor)</option>
                  <option value="Admin">Admin (Lead Administrator)</option>
                </select>
              </div>

              <button
                id="admin-btn-create-user"
                type="submit"
                disabled={creatingUser}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer"
              >
                {creatingUser ? 'PROVISIONING...' : 'REGISTER OFFICER GATE'}
              </button>
            </form>
          </div>

          {/* User grid display */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3.5">
            <h3 className="text-xs font-mono tracking-widest font-bold text-slate-400 uppercase">ACTIVE OFFICERS INDEX ({users.length})</h3>
            <div className="divide-y divide-slate-800/60 max-h-48 overflow-y-auto select-none">
              {users.map(u => (
                <div key={u.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-white">{u.username}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{u.email}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold ${
                    u.role === 'Admin' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {u.role.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>

        {/* Global Gateway Config settings */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center space-x-2.5 text-amber-500">
              <Settings className="w-4.5 h-4.5" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest">Global AI Engine Gateway</h3>
            </div>

            <form onSubmit={handleSaveKey} className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Gemini API Key</label>
                <div className="relative">
                  <input
                    id="admin-config-gemini-key"
                    type={showGeminiKey ? "text" : "password"}
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="Enter Gemini API Key..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2 pr-10 text-xs text-white outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-350 cursor-pointer"
                  >
                    {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="admin-btn-save-config"
                type="submit"
                disabled={savingKey}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer"
              >
                {savingKey ? 'UPDATING...' : 'SAVE CONFIGURATION'}
              </button>
            </form>

            {keyStatusMsg && (
              <p className="text-[10px] text-emerald-400 font-mono animate-pulse">{keyStatusMsg}</p>
            )}
          </div>
        </div>

        {/* Database overrides corrective panel */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5 text-amber-500">
                <Database className="w-4.5 h-4.5" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest">Manual Drawing database Overrides</h3>
              </div>

              {/* Correction Search field */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
                <input
                  id="admin-db-search-input"
                  type="text"
                  placeholder="Spool correction search..."
                  value={dbSearch}
                  onChange={(e) => setDbSearch(e.target.value)}
                  className="bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg py-1 pl-7 pr-3 text-xs text-white font-mono placeholder-slate-600 outline-none w-48"
                />
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-sans mt-1">
              Correct low-confidence OCR results. Overriding Spool numbers immediately re-binds download formats, title block components, and validation parameters.
            </p>

            <div className="overflow-x-auto border border-slate-800 rounded-lg bg-slate-950 text-slate-300 font-mono text-[11px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-900/85 border-b border-slate-800 text-[9px] uppercase tracking-wider text-slate-500 font-bold">
                    <th className="py-2.5 px-3">Orig Tag</th>
                    <th className="py-2.5 px-3">Manual Override Change fields</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredSpools.map((spool) => {
                    const isEditing = editingSpoolId === spool.id;
                    return (
                      <tr key={spool.id} className="hover:bg-slate-900/30">
                        <td className="py-3 px-3 font-semibold text-amber-500 max-w-[100px] truncate">
                          {spool.spoolNumber}
                          <span className="block text-[9px] text-slate-500">{spool.pdfName}</span>
                        </td>
                        
                        <td className="py-3 px-3">
                          {isEditing ? (
                            <div className="space-y-2 max-w-xs">
                              <input
                                id="admin-override-spool-input"
                                type="text"
                                value={overrideSpoolNumber}
                                onChange={(e) => setOverrideSpoolNumber(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-xs text-white outline-none focus:border-amber-500"
                                placeholder="Corrected spool tag"
                              />
                              <input
                                id="admin-override-label-input"
                                type="text"
                                value={overrideLabel}
                                onChange={(e) => setOverrideLabel(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-[10px] text-slate-300 outline-none focus:border-amber-500"
                                placeholder="System label (e.g. HIGH PRESSURE TI-LINE)"
                              />
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="block text-slate-200">System: {spool.systemLabel || 'SYS-DEFAULT'}</span>
                              <span className="block text-[9px] text-slate-500">MIME Details: {spool.pipelineSpecs || 'Class 150#'}</span>
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right">
                          {isEditing ? (
                            <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-1.5">
                              <button
                                id={`admin-override-save-${spool.id}`}
                                onClick={() => handleSaveCorrection(spool.id)}
                                className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 border border-emerald-500/20 hover:border-transparent rounded font-sans text-[10px] font-bold cursor-pointer"
                              >
                                SAVE
                              </button>
                              <button
                                id={`admin-override-cancel-${spool.id}`}
                                onClick={() => setEditingSpoolId(null)}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded font-sans text-[10px] cursor-pointer"
                              >
                                QUIT
                              </button>
                            </div>
                          ) : (
                            <button
                              id={`admin-btn-override-edit-${spool.id}`}
                              onClick={() => handleStartEdit(spool)}
                              className="p-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded cursor-pointer"
                              title="Tweak and Map Indices"
                            >
                              <Pencil className="w-3.5 h-3.5 text-amber-500" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {overrideStatusMsg && (
              <p className="text-[10px] text-slate-400 font-mono animate-pulse">{overrideStatusMsg}</p>
            )}
          </div>
        </div>

      </div>

      {/* Audit Logs events history track */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center space-x-2 text-amber-400">
          <BellRing className="w-4.5 h-4.5 animate-bounce-slow" />
          <h3 className="text-sm font-semibold text-white tracking-wide">Enterprise Registry Audit Logs</h3>
        </div>
        
        <div className="overflow-x-auto border border-slate-800 rounded-lg bg-slate-950">
          <table className="w-full text-left border-collapse text-[11px] font-mono text-slate-300">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                <th className="py-2 px-3">Timestamp (UTC)</th>
                <th className="py-2 px-3">Officer Name</th>
                <th className="py-2 px-3">Target Action</th>
                <th className="py-2 px-3">Security Ledger details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/20">
                  <td className="py-2 px-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="py-2 px-3 italic font-semibold text-white">{log.username}</td>
                  <td className="py-2 px-3 text-amber-500 font-bold">{log.action}</td>
                  <td className="py-2 px-3 text-slate-400 max-w-sm truncate" title={log.details}>{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
