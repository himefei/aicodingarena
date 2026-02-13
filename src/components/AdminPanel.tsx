import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/lib/language';
import {
  fetchTabs, createTab, updateTab, deleteTab as apiDeleteTab,
  fetchDemos, deleteDemo as apiDeleteDemo, uploadDemo,
  fetchModels, createModel, deleteModel as apiDeleteModel,
  type Tab, type Demo, type ModelRegistryEntry, type UploadPayload,
  logoutAdmin,
} from '@/lib/api';
import { AVAILABLE_LOGOS } from '@/lib/models';
import { clearKonamiActivation } from '@/hooks/use-konami-code';
import {
  Plus, Trash, PencilSimple, Upload, SignOut, Folder,
  Code, Robot, CaretDown, X, Check,
} from '@phosphor-icons/react';
import { Toaster, toast } from 'sonner';

interface AdminPanelProps {
  onLogout: () => void;
}

export function AdminPanel({ onLogout }: AdminPanelProps) {
  const { t, language } = useLanguage();
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [demos, setDemos] = useState<Demo[]>([]);
  const [models, setModels] = useState<ModelRegistryEntry[]>([]);
  const [activeSection, setActiveSection] = useState<'tabs' | 'demos' | 'upload' | 'models'>('upload');
  const [loading, setLoading] = useState(true);

  // Upload state
  const [uploadTabId, setUploadTabId] = useState('');
  const [uploadModelKey, setUploadModelKey] = useState('');
  const [uploadModelName, setUploadModelName] = useState('');
  const [uploadType, setUploadType] = useState<'html' | 'python'>('html');
  const [uploadCode, setUploadCode] = useState('');
  const [uploading, setUploading] = useState(false);

  // Tab form state
  const [tabForm, setTabForm] = useState({ name_cn: '', name_en: '', slug: '' });
  const [editingTabId, setEditingTabId] = useState<string | null>(null);

  // New model form
  const [newModel, setNewModel] = useState({ key: '', name: '', logo_filename: AVAILABLE_LOGOS[0], color: '#6366f1' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tabsData, demosData, modelsData] = await Promise.all([
        fetchTabs(), fetchDemos(), fetchModels(),
      ]);
      setTabs(tabsData);
      setDemos(demosData);
      setModels(modelsData);
      if (tabsData.length > 0 && !uploadTabId) {
        setUploadTabId(tabsData[0].id);
      }
    } catch (e) {
      toast.error('Failed to load data');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    logoutAdmin();
    clearKonamiActivation();
    onLogout();
    toast.success(t('loggedOut'));
  };

  // ---- Tab CRUD ----
  const handleSaveTab = async () => {
    try {
      if (editingTabId) {
        await updateTab(editingTabId, tabForm);
        toast.success('Tab updated');
      } else {
        await createTab(tabForm);
        toast.success('Tab created');
      }
      setTabForm({ name_cn: '', name_en: '', slug: '' });
      setEditingTabId(null);
      loadData();
    } catch (e) {
      toast.error('Failed to save tab');
    }
  };

  const handleDeleteTab = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await apiDeleteTab(id);
      toast.success('Tab deleted');
      loadData();
    } catch (e) {
      toast.error('Failed to delete tab');
    }
  };

  const handleDeleteDemo = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await apiDeleteDemo(id);
      toast.success('Demo deleted');
      loadData();
    } catch (e) {
      toast.error('Failed to delete demo');
    }
  };

  // ---- Upload ----
  const handleUpload = async () => {
    if (!uploadTabId || !uploadModelKey || !uploadCode.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setUploading(true);
    try {
      const selectedModel = models.find(m => m.key === uploadModelKey);
      const payload: UploadPayload = {
        tab_id: uploadTabId,
        model_key: uploadModelKey,
        model_name: uploadModelName || selectedModel?.name || uploadModelKey,
        demo_type: uploadType,
        code: uploadCode,
      };

      await uploadDemo(payload);
      toast.success('Demo uploaded!');
      setUploadCode('');
      loadData();
    } catch (e) {
      toast.error('Upload failed');
    }
    setUploading(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadCode(ev.target?.result as string);
    };
    reader.readAsText(file);
  };

  // ---- Model CRUD ----
  const handleAddModel = async () => {
    if (!newModel.key || !newModel.name) return;
    try {
      await createModel({
        key: newModel.key,
        name: newModel.name,
        logo_filename: newModel.logo_filename,
        color: newModel.color,
      });
      toast.success('Model added');
      setNewModel({ key: '', name: '', logo_filename: AVAILABLE_LOGOS[0], color: '#6366f1' });
      loadData();
    } catch (e) {
      toast.error('Failed to add model');
    }
  };

  const handleDeleteModel = async (key: string) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await apiDeleteModel(key);
      toast.success('Model deleted');
      loadData();
    } catch (e) {
      toast.error('Failed to delete model');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const sections = [
    { key: 'upload' as const, icon: Upload, label: t('uploadDemo') },
    { key: 'demos' as const, icon: Code, label: t('demoManagement') },
    { key: 'tabs' as const, icon: Folder, label: t('tabManagement') },
    { key: 'models' as const, icon: Robot, label: t('modelManagement') },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold gradient-text" style={{ fontFamily: 'var(--font-display)' }}>
          {t('adminPanel')}
        </h2>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-400 transition-colors"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <SignOut size={16} weight="bold" />
          {t('logout')}
        </motion.button>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {sections.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
            style={{
              background: activeSection === key ? 'var(--color-primary)' : 'var(--bg-card)',
              color: activeSection === key ? 'white' : 'var(--text-secondary)',
              border: `1px solid ${activeSection === key ? 'var(--color-primary)' : 'var(--border)'}`,
            }}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Section content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* ===== UPLOAD SECTION ===== */}
          {activeSection === 'upload' && (
            <div className="rounded-2xl p-6 space-y-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Tab select */}
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>{t('selectTab')}</label>
                  <select
                    value={uploadTabId}
                    onChange={(e) => setUploadTabId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  >
                    {tabs.map(tab => (
                      <option key={tab.id} value={tab.id}>
                        {language === 'zh' ? tab.name_cn : tab.name_en}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Model select */}
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>{t('selectModel')}</label>
                  <select
                    value={uploadModelKey}
                    onChange={(e) => {
                      setUploadModelKey(e.target.value);
                      const m = models.find(m => m.key === e.target.value);
                      if (m) setUploadModelName(m.name);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  >
                    <option value="">{t('selectModel')}...</option>
                    {models.map(m => (
                      <option key={m.key} value={m.key}>{m.name}</option>
                    ))}
                  </select>
                </div>

                {/* Type select */}
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>{t('demoType')}</label>
                  <select
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value as 'html' | 'python')}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  >
                    <option value="html">HTML</option>
                    <option value="python">Python</option>
                  </select>
                </div>
              </div>

              {/* Code area */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{t('pasteCode')}</label>
                  <label className="text-xs cursor-pointer transition-colors" style={{ color: 'var(--color-primary)' }}>
                    {t('orUploadFile')}
                    <input type="file" accept=".html,.htm,.py,.txt" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
                <textarea
                  value={uploadCode}
                  onChange={(e) => setUploadCode(e.target.value)}
                  placeholder={uploadType === 'html' ? '<!DOCTYPE html>\n<html>...' : 'import pygame\n...'}
                  rows={12}
                  className="w-full px-4 py-3 rounded-xl text-sm font-mono outline-none resize-y"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleUpload}
                disabled={uploading || !uploadCode.trim() || !uploadModelKey}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}
              >
                {uploading ? t('uploading') : t('upload')}
              </motion.button>
            </div>
          )}

          {/* ===== DEMOS SECTION ===== */}
          {activeSection === 'demos' && (
            <div className="space-y-3">
              {demos.length === 0 ? (
                <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
                  <Code size={48} className="mx-auto mb-3 opacity-30" />
                  <p>{t('noDemo')}</p>
                </div>
              ) : (
                demos.map((demo) => (
                  <motion.div
                    key={demo.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 rounded-xl transition-colors"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          background: demo.demo_type === 'python' ? 'rgba(59,130,246,0.15)' : 'rgba(99,102,241,0.15)',
                          color: demo.demo_type === 'python' ? '#3b82f6' : '#6366f1',
                        }}
                      >
                        {demo.demo_type}
                      </div>
                      <div>
                        <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{demo.model_name}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {tabs.find(t => t.id === demo.tab_id)?.[language === 'zh' ? 'name_cn' : 'name_en']} · {new Date(demo.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteDemo(demo.id)}
                      className="p-2 rounded-lg transition-colors text-red-400 hover:bg-red-400/10"
                    >
                      <Trash size={16} />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* ===== TABS SECTION ===== */}
          {activeSection === 'tabs' && (
            <div className="space-y-4">
              {/* Add/Edit form */}
              <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {editingTabId ? t('editTab') : t('addTab')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    value={tabForm.name_cn}
                    onChange={(e) => setTabForm({ ...tabForm, name_cn: e.target.value })}
                    placeholder={t('tabNameCn')}
                    className="px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                  <input
                    value={tabForm.name_en}
                    onChange={(e) => setTabForm({ ...tabForm, name_en: e.target.value })}
                    placeholder={t('tabNameEn')}
                    className="px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                  <input
                    value={tabForm.slug}
                    onChange={(e) => setTabForm({ ...tabForm, slug: e.target.value })}
                    placeholder={t('tabSlug')}
                    className="px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveTab}
                    disabled={!tabForm.name_cn || !tabForm.name_en || !tabForm.slug}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-40"
                    style={{ background: 'var(--color-primary)' }}
                  >
                    {t('save')}
                  </button>
                  {editingTabId && (
                    <button
                      onClick={() => { setEditingTabId(null); setTabForm({ name_cn: '', name_en: '', slug: '' }); }}
                      className="px-4 py-2 rounded-xl text-sm font-medium"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {t('cancel')}
                    </button>
                  )}
                </div>
              </div>

              {/* Existing tabs list */}
              {tabs.map((tab) => (
                <motion.div
                  key={tab.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {language === 'zh' ? tab.name_cn : tab.name_en}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>/{tab.slug}</div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingTabId(tab.id);
                        setTabForm({ name_cn: tab.name_cn, name_en: tab.name_en, slug: tab.slug });
                      }}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <PencilSimple size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteTab(tab.id)}
                      className="p-2 rounded-lg transition-colors text-red-400 hover:bg-red-400/10"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* ===== MODELS SECTION ===== */}
          {activeSection === 'models' && (
            <div className="space-y-4">
              {/* Add model form */}
              <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t('addModel')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <input
                    value={newModel.key}
                    onChange={(e) => setNewModel({ ...newModel, key: e.target.value })}
                    placeholder={t('modelKey')}
                    className="px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                  <input
                    value={newModel.name}
                    onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                    placeholder={t('modelName')}
                    className="px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                  {/* SVG Logo picker */}
                  <div className="relative">
                    <select
                      value={newModel.logo_filename}
                      onChange={(e) => setNewModel({ ...newModel, logo_filename: e.target.value })}
                      className="w-full h-full px-3 py-2.5 pl-9 rounded-xl text-sm outline-none appearance-none cursor-pointer"
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    >
                      {AVAILABLE_LOGOS.map(logo => (
                        <option key={logo} value={logo}>{logo.replace('.svg', '')}</option>
                      ))}
                    </select>
                    <img
                      src={`/logos/${newModel.logo_filename}`}
                      alt=""
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 object-contain pointer-events-none"
                    />
                    <CaretDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                  </div>
                  {/* Add button */}
                  <button
                    onClick={handleAddModel}
                    disabled={!newModel.key || !newModel.name}
                    className="flex items-center justify-center gap-2 rounded-xl text-sm font-medium text-white disabled:opacity-40 transition-all"
                    style={{ background: 'var(--color-primary)', minHeight: '42px' }}
                  >
                    <Plus size={16} />
                    {t('addModel')}
                  </button>
                </div>
              </div>

              {/* Model list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {models.map((model) => (
                  <motion.div
                    key={model.key}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 p-3 rounded-xl group"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
                      style={{ background: `${model.color}15`, border: `1px solid ${model.color}30` }}
                    >
                      <img src={`/logos/${model.logo_filename}`} alt="" className="w-5 h-5 object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{model.name}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{model.key}</div>
                    </div>
                    <button
                      onClick={() => handleDeleteModel(model.key)}
                      className="p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-400/10 flex-shrink-0"
                    >
                      <Trash size={14} />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
