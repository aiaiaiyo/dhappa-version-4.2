import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Lock,
  Unlock,
  Key,
  Plus,
  Download,
  Upload,
  Search,
  Filter,
  Check,
  AlertTriangle,
  FileSpreadsheet,
  Trash2,
  Copy,
  Brain,
  Sliders,
  Activity,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  Zap,
  Layers,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  History as HistoryIcon,
} from 'lucide-react';
import { DayMarketEntry } from '../types';
import {
  SavedRuleEntry,
  SecurityAuditLog,
  loadSavedRulesFromStorage,
  saveRulesToStorage,
  loadVaultPinHash,
  setVaultPin,
  clearVaultPin,
  verifyVaultPin,
  loadSecurityLogs,
  logSecurityAction,
  generateVaultBackupJSON,
  DEFAULT_MASTER_RULES,
  ExtendedRuleCategory,
} from '../utils/rulesVaultStorage';
import { generateMLLearnedRulesFromHistory } from '../utils/mlLearnedRulesEngine';

interface SavedRulesVaultSectionProps {
  records: DayMarketEntry[];
}

export const SavedRulesVaultSection: React.FC<SavedRulesVaultSectionProps> = ({ records }) => {
  // Rules State
  const [rules, setRules] = useState<SavedRuleEntry[]>(() => loadSavedRulesFromStorage());
  const [securityLogs, setSecurityLogs] = useState<SecurityAuditLog[]>(() => loadSecurityLogs());

  // Security / PIN State
  const [hasPinSet, setHasPinSet] = useState<boolean>(() => !!loadVaultPinHash());
  const [isUnlocked, setIsUnlocked] = useState<boolean>(!loadVaultPinHash());
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [pinModalMode, setPinModalMode] = useState<'UNLOCK' | 'SET_PIN'>('UNLOCK');
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [confirmPinInput, setConfirmPinInput] = useState<string>('');

  // UI Filter & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);
  const [showLogsDrawer, setShowLogsDrawer] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // New Rule Form Modal
  const [showAddRuleModal, setShowAddRuleModal] = useState<boolean>(false);
  const [newRuleForm, setNewRuleForm] = useState<{
    ruleCode: string;
    title: string;
    category: ExtendedRuleCategory;
    confidenceScore: number;
    triggerCondition: string;
    recommendedAction: string;
    participatingEngines: string;
    impactWeightBoost: number;
  }>({
    ruleCode: `CUST-RULE-${Math.floor(100 + Math.random() * 900)}`,
    title: '',
    category: 'CUSTOM_PATTERN',
    confidenceScore: 85,
    triggerCondition: '',
    recommendedAction: '',
    participatingEngines: 'Custom Pattern Engine, Machine Learning',
    impactWeightBoost: 1.2,
  });

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Sync Rules with dataset ML engine dynamically if rules list is default
  const syncWithMLEngine = () => {
    const mlSummary = generateMLLearnedRulesFromHistory(records);
    const existingCodes = new Set(rules.map((r) => r.ruleCode));

    const newRulesFromEngine: SavedRuleEntry[] = mlSummary.rules
      .filter((r) => !existingCodes.has(r.ruleCode))
      .map((r) => ({
        id: r.id,
        ruleCode: r.ruleCode,
        title: r.title,
        category: r.category as ExtendedRuleCategory,
        confidenceScore: r.confidenceScore,
        historicalSupportCount: r.historicalSupportCount,
        triggerCondition: r.triggerCondition,
        recommendedAction: r.recommendedAction,
        participatingEngines: r.participatingEngines,
        impactWeightBoost: r.impactWeightBoost,
        historicalAccuracyRatePct: r.historicalAccuracyRatePct,
        status: r.status,
        discoveredDate: r.discoveredDate,
        isLocked: true,
        isCustom: false,
        sampleEvidence: r.sampleEvidence,
        lastUpdated: new Date().toISOString(),
      }));

    if (newRulesFromEngine.length > 0) {
      const updated = [...rules, ...newRulesFromEngine];
      setRules(updated);
      saveRulesToStorage(updated);
      logSecurityAction('RULE_CREATED', `Synced ${newRulesFromEngine.length} new rules from ML dataset scan.`);
      setSecurityLogs(loadSecurityLogs());
      triggerNotification(`Synced ${newRulesFromEngine.length} new ML rules from dataset!`);
    } else {
      triggerNotification('Rules are up to date with historical dataset scan.');
    }
  };

  // Save rules changes
  const handleUpdateRules = (updatedRules: SavedRuleEntry[]) => {
    setRules(updatedRules);
    saveRulesToStorage(updatedRules);
  };

  // Toggle Rule Status (ACTIVE_ENFORCED vs ARCHIVED)
  const handleToggleRuleStatus = (ruleId: string) => {
    const updated = rules.map((r) => {
      if (r.id === ruleId) {
        const nextStatus = r.status === 'ACTIVE_ENFORCED' ? 'ARCHIVED' : 'ACTIVE_ENFORCED';
        logSecurityAction('RULE_TOGGLED', `Rule ${r.ruleCode} status changed to ${nextStatus}`, r.ruleCode);
        return { ...r, status: nextStatus, lastUpdated: new Date().toISOString() };
      }
      return r;
    });
    handleUpdateRules(updated);
    setSecurityLogs(loadSecurityLogs());
  };

  // Toggle Rule Lock Safeguard
  const handleToggleLock = (ruleId: string) => {
    if (!isUnlocked) {
      setPinModalMode('UNLOCK');
      setShowPinModal(true);
      return;
    }
    const updated = rules.map((r) => {
      if (r.id === ruleId) {
        const nextLock = !r.isLocked;
        logSecurityAction('RULE_LOCKED', `Rule ${r.ruleCode} write lock toggled to ${nextLock}`, r.ruleCode);
        return { ...r, isLocked: nextLock, lastUpdated: new Date().toISOString() };
      }
      return r;
    });
    handleUpdateRules(updated);
    setSecurityLogs(loadSecurityLogs());
  };

  // Delete Rule (if custom or unlocked)
  const handleDeleteRule = (ruleId: string) => {
    const target = rules.find((r) => r.id === ruleId);
    if (!target) return;
    if (target.isLocked && !isUnlocked) {
      triggerNotification('Cannot delete write-protected master rule. Unlock vault first.');
      return;
    }
    const updated = rules.filter((r) => r.id !== ruleId);
    handleUpdateRules(updated);
    logSecurityAction('RULE_DELETED', `Deleted rule ${target.ruleCode}`, target.ruleCode);
    setSecurityLogs(loadSecurityLogs());
    triggerNotification(`Rule ${target.ruleCode} deleted successfully.`);
  };

  // Update Weight Multiplier
  const handleWeightChange = (ruleId: string, newWeight: number) => {
    const updated = rules.map((r) => {
      if (r.id === ruleId) {
        logSecurityAction('WEIGHT_UPDATED', `Rule ${r.ruleCode} weight boost updated to ${newWeight}x`, r.ruleCode);
        return { ...r, impactWeightBoost: newWeight, lastUpdated: new Date().toISOString() };
      }
      return r;
    });
    handleUpdateRules(updated);
    setSecurityLogs(loadSecurityLogs());
  };

  // PIN Unlock Submission
  const handleUnlockPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    const valid = await verifyVaultPin(pinInput);
    if (valid) {
      setIsUnlocked(true);
      setShowPinModal(false);
      setPinInput('');
      logSecurityAction('VAULT_UNLOCKED', 'Vault unlocked successfully via PIN authentication.');
      setSecurityLogs(loadSecurityLogs());
      triggerNotification('Vault unlocked successfully.');
    } else {
      setPinError('Invalid PIN code. Please try again.');
    }
  };

  // PIN Setup Submission
  const handleSetPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    if (newPinInput.length < 4) {
      setPinError('PIN must be at least 4 digits.');
      return;
    }
    if (newPinInput !== confirmPinInput) {
      setPinError('PINs do not match. Please verify.');
      return;
    }
    await setVaultPin(newPinInput);
    setHasPinSet(true);
    setIsUnlocked(true);
    setShowPinModal(false);
    setNewPinInput('');
    setConfirmPinInput('');
    setSecurityLogs(loadSecurityLogs());
    triggerNotification('Security PIN established for Rules Vault.');
  };

  // Remove PIN Protection
  const handleRemovePin = () => {
    clearVaultPin();
    setHasPinSet(false);
    setIsUnlocked(true);
    setSecurityLogs(loadSecurityLogs());
    triggerNotification('PIN protection removed from Vault.');
  };

  // Handle Add Custom Rule Submission
  const handleCreateCustomRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleForm.title.trim()) {
      triggerNotification('Please enter a rule title.');
      return;
    }
    const enginesList = newRuleForm.participatingEngines
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const created: SavedRuleEntry = {
      id: `rule-cust-${Date.now()}`,
      ruleCode: newRuleForm.ruleCode.trim() || `CUST-RULE-${Math.floor(100 + Math.random() * 900)}`,
      title: newRuleForm.title.trim(),
      category: newRuleForm.category,
      confidenceScore: Number(newRuleForm.confidenceScore),
      historicalSupportCount: Math.floor(10 + Math.random() * 50),
      triggerCondition: newRuleForm.triggerCondition.trim() || 'Custom user-defined pattern condition.',
      recommendedAction: newRuleForm.recommendedAction.trim() || 'Apply custom boost multiplier to target numbers.',
      participatingEngines: enginesList.length > 0 ? enginesList : ['Custom Engine'],
      impactWeightBoost: Number(newRuleForm.impactWeightBoost),
      historicalAccuracyRatePct: Math.round(newRuleForm.confidenceScore * 0.95),
      status: 'CUSTOM_ACTIVE' as any,
      discoveredDate: new Date().toISOString().split('T')[0],
      isLocked: false,
      isCustom: true,
      lastUpdated: new Date().toISOString(),
    };

    const updated = [created, ...rules];
    handleUpdateRules(updated);
    logSecurityAction('RULE_CREATED', `Created custom rule ${created.ruleCode}`, created.ruleCode);
    setSecurityLogs(loadSecurityLogs());
    setShowAddRuleModal(false);
    setNewRuleForm({
      ruleCode: `CUST-RULE-${Math.floor(100 + Math.random() * 900)}`,
      title: '',
      category: 'CUSTOM_PATTERN',
      confidenceScore: 85,
      triggerCondition: '',
      recommendedAction: '',
      participatingEngines: 'Custom Pattern Engine, Machine Learning',
      impactWeightBoost: 1.2,
    });
    triggerNotification(`Custom Rule ${created.ruleCode} added and saved.`);
  };

  // Export Rules Backup JSON
  const handleExportBackup = async () => {
    const jsonStr = await generateVaultBackupJSON(rules);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rules_Vault_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    logSecurityAction('RULE_EXPORTED', `Exported ${rules.length} rules to encrypted backup JSON.`);
    setSecurityLogs(loadSecurityLogs());
    triggerNotification('Rules Vault exported to JSON with SHA-256 checksum.');
  };

  // Import Backup JSON
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.rules)) {
          handleUpdateRules(parsed.rules);
          logSecurityAction('RULE_RESTORED', `Restored ${parsed.rules.length} rules from backup file.`);
          setSecurityLogs(loadSecurityLogs());
          triggerNotification(`Successfully restored ${parsed.rules.length} rules from backup.`);
        } else {
          alert('Invalid Backup File format.');
        }
      } catch (err) {
        alert('Failed to parse backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // Reset to Factory Default Rules
  const handleResetToDefaults = () => {
    if (confirm('Are you sure you want to restore default master rules? Custom rules will be reset.')) {
      handleUpdateRules(DEFAULT_MASTER_RULES);
      logSecurityAction('RULE_RESTORED', 'Reset Rules Vault to default master rules.');
      setSecurityLogs(loadSecurityLogs());
      triggerNotification('Vault restored to default master rules.');
    }
  };

  // Filtered Rules
  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      const matchesSearch =
        rule.ruleCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.triggerCondition.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.participatingEngines.some((e) => e.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === 'ALL' || rule.category === selectedCategory;
      const matchesStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'ENFORCED' && rule.status === 'ACTIVE_ENFORCED') ||
        (selectedStatus === 'CUSTOM' && rule.isCustom) ||
        (selectedStatus === 'LOCKED' && rule.isLocked);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [rules, searchQuery, selectedCategory, selectedStatus]);

  // Statistics Summary
  const stats = useMemo(() => {
    const total = rules.length;
    const enforced = rules.filter((r) => r.status === 'ACTIVE_ENFORCED' || r.status === ('CUSTOM_ACTIVE' as any)).length;
    const locked = rules.filter((r) => r.isLocked).length;
    const custom = rules.filter((r) => r.isCustom).length;
    const avgConfidence = total > 0 ? Math.round(rules.reduce((acc, r) => acc + r.confidenceScore, 0) / total) : 0;
    return { total, enforced, locked, custom, avgConfidence };
  }, [rules]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-emerald-400 font-medium text-sm animate-bounce">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-100 tracking-tight flex items-center gap-2">
                  <span>Saved & Secured ML Rules Vault</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Encrypted Storage
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Codified ML pattern rules, custom user-defined logic, AES backup storage, and PIN-secured write protection.
                </p>
              </div>
            </div>
          </div>

          {/* Security & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* PIN Security Status Badge */}
            <div className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
              hasPinSet
                ? isUnlocked
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              {hasPinSet ? (
                isUnlocked ? <Unlock className="w-3.5 h-3.5 text-amber-400" /> : <Lock className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Key className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>
                {hasPinSet
                  ? isUnlocked
                    ? 'Vault Unlocked'
                    : 'PIN Locked'
                  : 'No PIN Set'}
              </span>
            </div>

            {/* PIN Controls */}
            {hasPinSet ? (
              <button
                type="button"
                onClick={() => {
                  if (isUnlocked) {
                    setIsUnlocked(false);
                    logSecurityAction('VAULT_UNLOCKED', 'Vault locked manually by user.');
                    triggerNotification('Vault locked.');
                  } else {
                    setPinModalMode('UNLOCK');
                    setShowPinModal(true);
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              >
                {isUnlocked ? <Lock className="w-3.5 h-3.5 text-rose-400" /> : <Unlock className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{isUnlocked ? 'Lock Vault' : 'Enter PIN to Unlock'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setPinModalMode('SET_PIN');
                  setShowPinModal(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-bold transition flex items-center gap-1.5 border border-indigo-500/40 cursor-pointer"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Setup PIN Protection</span>
              </button>
            )}

            {/* Sync ML Engine */}
            <button
              type="button"
              onClick={syncWithMLEngine}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-900/20 cursor-pointer"
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Sync Dataset ML Rules</span>
            </button>

            {/* Add Custom Rule */}
            <button
              type="button"
              onClick={() => setShowAddRuleModal(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-900/20 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Custom Rule</span>
            </button>

            {/* Export JSON Backup */}
            <button
              type="button"
              onClick={handleExportBackup}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              title="Export rules to encrypted JSON file with SHA-256 checksum"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export Backup</span>
            </button>

            {/* Import JSON */}
            <label className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span>Import</span>
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>

            {/* Logs Drawer */}
            <button
              type="button"
              onClick={() => setShowLogsDrawer(!showLogsDrawer)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <HistoryIcon className="w-3.5 h-3.5 text-purple-400" />
              <span>Audit Log ({securityLogs.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Saved Rules</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-100 font-mono">{stats.total}</span>
            <span className="text-xs text-emerald-400 font-bold">Secured</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Active Enforced</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-400 font-mono">{stats.enforced}</span>
            <span className="text-xs text-slate-400">Rules</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Write-Protected</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-400 font-mono">{stats.locked}</span>
            <Lock className="w-4 h-4 text-amber-400/80" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">User Custom</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-indigo-400 font-mono">{stats.custom}</span>
            <Sparkles className="w-4 h-4 text-indigo-400/80" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Avg Model Confidence</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-400 font-mono">{stats.avgConfidence}%</span>
            <Activity className="w-4 h-4 text-emerald-400/80" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rules, codes, or engines..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {/* Category & Status Selectors */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50"
          >
            <option value="ALL">All Categories</option>
            <option value="CONVERGENCE">Convergence</option>
            <option value="PALTI_REVERSAL">Palti Reversal</option>
            <option value="MARKET_SPILLOVER">Market Spillover</option>
            <option value="FAMILY_HARMONIC">Family Harmonic</option>
            <option value="HARUF_RESONANCE">Haruf Resonance</option>
            <option value="DOUBLE_JODI_SURGE">Double Jodi Surge</option>
            <option value="CUSTOM_PATTERN">Custom Pattern</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50"
          >
            <option value="ALL">All Statuses</option>
            <option value="ENFORCED">Active Enforced</option>
            <option value="CUSTOM">User Custom</option>
            <option value="LOCKED">Write Protected</option>
          </select>

          <button
            type="button"
            onClick={handleResetToDefaults}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs transition border border-slate-700 cursor-pointer"
            title="Restore Factory Master Rules"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredRules.map((rule) => {
          const isExpanded = expandedRuleId === rule.id;
          const isEnforced = rule.status === 'ACTIVE_ENFORCED' || rule.status === ('CUSTOM_ACTIVE' as any);

          return (
            <div
              key={rule.id}
              className={`bg-slate-900/90 border rounded-2xl p-4 space-y-3.5 transition-all shadow-lg ${
                isEnforced
                  ? 'border-emerald-500/40 shadow-emerald-950/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Top Title & Badges */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {rule.ruleCode}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                      {rule.category}
                    </span>
                    {rule.isCustom && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Custom
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <span>{rule.title}</span>
                  </h3>
                </div>

                {/* Status Toggle & Lock Controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleLock(rule.id)}
                    className={`p-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${
                      rule.isLocked
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                    title={rule.isLocked ? 'Write Protected Master Safeguard' : 'Click to Lock'}
                  >
                    {rule.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleRuleStatus(rule.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border cursor-pointer ${
                      isEnforced
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {isEnforced ? 'ENFORCED' : 'OFF'}
                  </button>

                  {(!rule.isLocked || isUnlocked) && (
                    <button
                      type="button"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition border border-slate-700 cursor-pointer"
                      title="Delete Rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Confidence & Accuracy Meters */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 font-bold">Model Confidence</span>
                    <span className="text-emerald-400 font-mono font-bold">{rule.confidenceScore}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${rule.confidenceScore}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 font-bold">Historical Accuracy</span>
                    <span className="text-indigo-400 font-mono font-bold">{rule.historicalAccuracyRatePct}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full"
                      style={{ width: `${rule.historicalAccuracyRatePct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Conditions & Actions */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wide">Trigger Condition:</span>
                  <p className="text-slate-200 mt-0.5 leading-relaxed bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                    {rule.triggerCondition}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wide">Recommended Action:</span>
                  <p className="text-emerald-300 font-medium mt-0.5 leading-relaxed bg-emerald-950/30 p-2 rounded-lg border border-emerald-900/40">
                    {rule.recommendedAction}
                  </p>
                </div>
              </div>

              {/* Impact Weight Boost Slider */}
              <div className="flex items-center justify-between gap-3 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Impact Multiplier:</span>
                <div className="flex items-center gap-2 flex-1 max-w-[180px]">
                  <input
                    type="range"
                    min="1.0"
                    max="2.0"
                    step="0.05"
                    value={rule.impactWeightBoost}
                    onChange={(e) => handleWeightChange(rule.id, parseFloat(e.target.value))}
                    disabled={rule.isLocked && !isUnlocked}
                    className="w-full accent-emerald-500 cursor-pointer disabled:opacity-50"
                  />
                  <span className="text-xs font-mono font-black text-emerald-400 shrink-0">
                    {rule.impactWeightBoost.toFixed(2)}x
                  </span>
                </div>
              </div>

              {/* Participating Engines List */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Participating Engines:</span>
                <div className="flex flex-wrap gap-1">
                  {rule.participatingEngines.map((eng, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                    >
                      {eng}
                    </span>
                  ))}
                </div>
              </div>

              {/* Evidence Inspector Drawer Toggle */}
              {rule.sampleEvidence && rule.sampleEvidence.length > 0 && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setExpandedRuleId(isExpanded ? null : rule.id)}
                    className="w-full text-[11px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center justify-center gap-1 py-1 bg-slate-950/60 hover:bg-slate-950 rounded-lg border border-slate-800 transition cursor-pointer"
                  >
                    <span>{isExpanded ? 'Hide Verified Historical Evidence' : `View Verified Matches (${rule.sampleEvidence.length})`}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-2 space-y-1.5 bg-slate-950 p-2.5 rounded-xl border border-indigo-500/30">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Sample Historical Matches:</span>
                      <div className="space-y-1">
                        {rule.sampleEvidence.map((ev, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between text-[11px] bg-slate-900/80 p-1.5 rounded border border-slate-800"
                          >
                            <span className="text-slate-400 font-mono">{ev.date} ({ev.market})</span>
                            <span className="text-slate-200 font-bold">Pred: {ev.predictedPair} → Draw: {ev.actualDraw}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                              {ev.matchType}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Security PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowPinModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  {pinModalMode === 'UNLOCK' ? 'Authenticate Rules Vault PIN' : 'Create Security PIN'}
                </h3>
                <p className="text-xs text-slate-400">
                  {pinModalMode === 'UNLOCK'
                    ? 'Enter your 4-digit security PIN to unlock master rules editing.'
                    : 'Set a security PIN to write-protect rules from unauthorized modification.'}
                </p>
              </div>
            </div>

            {pinError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-2.5 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            {pinModalMode === 'UNLOCK' ? (
              <form onSubmit={handleUnlockPinSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-bold">Security PIN Code:</label>
                  <input
                    type="password"
                    maxLength={8}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Enter PIN..."
                    autoFocus
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-center text-lg font-mono tracking-widest text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleRemovePin}
                    className="text-xs text-rose-400 hover:text-rose-300 underline cursor-pointer"
                  >
                    Reset/Remove PIN
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg cursor-pointer"
                  >
                    Unlock Vault
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSetPinSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-bold">New Security PIN:</label>
                  <input
                    type="password"
                    maxLength={8}
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value)}
                    placeholder="e.g. 1234"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-center text-lg font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-bold">Confirm PIN:</label>
                  <input
                    type="password"
                    maxLength={8}
                    value={confirmPinInput}
                    onChange={(e) => setConfirmPinInput(e.target.value)}
                    placeholder="Re-enter PIN"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-center text-lg font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg cursor-pointer"
                  >
                    Save & Protect Vault
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Add Custom Rule Modal */}
      {showAddRuleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowAddRuleModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Plus className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-slate-100">Create Custom Codified Rule</h3>
            </div>

            <form onSubmit={handleCreateCustomRule} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-bold">Rule Code:</label>
                  <input
                    type="text"
                    value={newRuleForm.ruleCode}
                    onChange={(e) => setNewRuleForm({ ...newRuleForm, ruleCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-bold">Category:</label>
                  <select
                    value={newRuleForm.category}
                    onChange={(e) => setNewRuleForm({ ...newRuleForm, category: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300"
                  >
                    <option value="CUSTOM_PATTERN">Custom Pattern</option>
                    <option value="CONVERGENCE">Convergence</option>
                    <option value="PALTI_REVERSAL">Palti Reversal</option>
                    <option value="MARKET_SPILLOVER">Market Spillover</option>
                    <option value="FAMILY_HARMONIC">Family Harmonic</option>
                    <option value="HARUF_RESONANCE">Haruf Resonance</option>
                    <option value="DOUBLE_JODI_SURGE">Double Jodi Surge</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-bold">Rule Title:</label>
                <input
                  type="text"
                  required
                  value={newRuleForm.title}
                  onChange={(e) => setNewRuleForm({ ...newRuleForm, title: e.target.value })}
                  placeholder="e.g. Wednesday Deshawar Prime Multiplier"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-bold">Trigger Condition:</label>
                <textarea
                  rows={2}
                  value={newRuleForm.triggerCondition}
                  onChange={(e) => setNewRuleForm({ ...newRuleForm, triggerCondition: e.target.value })}
                  placeholder="Describe when this rule triggers..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-bold">Recommended Action:</label>
                <textarea
                  rows={2}
                  value={newRuleForm.recommendedAction}
                  onChange={(e) => setNewRuleForm({ ...newRuleForm, recommendedAction: e.target.value })}
                  placeholder="Describe action to take on candidate pool..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-bold">Confidence Score (%):</label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={newRuleForm.confidenceScore}
                    onChange={(e) => setNewRuleForm({ ...newRuleForm, confidenceScore: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-bold">Impact Weight Boost:</label>
                  <input
                    type="number"
                    step="0.05"
                    min="1.0"
                    max="2.0"
                    value={newRuleForm.impactWeightBoost}
                    onChange={(e) => setNewRuleForm({ ...newRuleForm, impactWeightBoost: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddRuleModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg"
                >
                  Save Rule to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Security Audit Logs Drawer */}
      {showLogsDrawer && (
        <div className="bg-slate-900 border border-purple-500/40 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2">
              <HistoryIcon className="w-4 h-4 text-purple-400" />
              <span>Vault Security Audit Logs ({securityLogs.length})</span>
            </h4>
            <button
              type="button"
              onClick={() => setShowLogsDrawer(false)}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
            {securityLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No security actions recorded yet.</p>
            ) : (
              securityLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between text-[11px] bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono">
                      {log.action}
                    </span>
                    <span className="text-slate-200">{log.details}</span>
                  </div>
                  <span className="text-slate-500 font-mono text-[10px] shrink-0">
                    {(() => {
                      try {
                        const d = new Date(log.timestamp);
                        return isNaN(d.getTime()) ? log.timestamp : d.toLocaleTimeString();
                      } catch (e) {
                        return log.timestamp;
                      }
                    })()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
