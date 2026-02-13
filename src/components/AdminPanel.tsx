import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/lib/language';
import {
  fetchTabs, createTab, updateTab, deleteTab as apiDeleteTab,
  fetchDemos, deleteDemo as apiDeleteDemo, uploadDemo, updateDemo,
  fetchModels, createModel, deleteModel as apiDeleteModel,
  fetchBrands, createBrand, deleteBrand as apiDeleteBrand,
  fetchLogos, uploadLogo, deleteLogo as apiDeleteLogo,
  type Tab, type Demo, type ModelRegistryEntry, type Brand, type UploadPayload,
  logoutAdmin,
} from '@/lib/api';
import { clearKonamiActivation } from '@/hooks/use-konami-code';
import {
  Plus, Trash, PencilSimple, Upload, SignOut, Folder,
  Code, Robot, CaretDown, X, Check, Image,
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
  const [brands, setBrands] = useState<Brand[]>([]);
  const [availableLogos, setAvailableLogos] = useState<string[]>([]);
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

  // Edit demo state
  const [editingDemoId, setEditingDemoId] = useState<string | null>(null);
  const [editDemoTabId, setEditDemoTabId] = useState('');
  const [editDemoModelKey, setEditDemoModelKey] = useState('');
  const [editDemoType, setEditDemoType] = useState<'html' | 'python'>('html');
  const [editDemoCode, setEditDemoCode] = useState('');
  const [editingSaving, setEditingSaving] = useState(false);

  // SVG upload form
  const [svgFileContent, setSvgFileContent] = useState('');
  const [svgName, setSvgName] = useState('');

  // Brand form
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandLogo, setNewBrandLogo] = useState('');

  // Model form
  const [newModelBrand, setNewModelBrand] = useState('');
  const [newModelName, setNewModelName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tabsData, demosData, modelsData, brandsData, logosData] = await Promise.all([
        fetchTabs(), fetchDemos(), fetchModels(), fetchBrands(), fetchLogos(),
      ]);
      setTabs(tabsData);
      setDemos(demosData);
      setModels(modelsData);
      setBrands(brandsData);
      setAvailableLogos(logosData);
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

  const handleEditDemo = (demo: Demo) => {
    setEditingDemoId(demo.id);
    setEditDemoTabId(demo.tab_id);
    setEditDemoModelKey(demo.model_key);
    setEditDemoType(demo.demo_type as 'html' | 'python');
    setEditDemoCode('');
  };

  const handleCancelEditDemo = () => {
    setEditingDemoId(null);
    setEditDemoCode('');
  };

  const handleSaveDemo = async () => {
    if (!editingDemoId) return;
    setEditingSaving(true);
    try {
      const selectedModel = models.find(m => m.key === editDemoModelKey);
      await updateDemo(editingDemoId, {
        tab_id: editDemoTabId,
        model_key: editDemoModelKey,
        model_name: selectedModel?.name || editDemoModelKey,
        demo_type: editDemoType,
        ...(editDemoCode.trim() ? { code: editDemoCode } : {}),
      });
      toast.success('Demo updated!');
      setEditingDemoId(null);
      setEditDemoCode('');
      loadData();
    } catch (e) {
      toast.error('Failed to update demo');
    }
    setEditingSaving(false);
  };

  const handleEditFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setEditDemoCode(ev.target?.result as string);
    };
    reader.readAsText(file);
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
    if (!newModelBrand || !newModelName.trim()) return;
    try {
      await createModel({ brand_key: newModelBrand, name: newModelName.trim() });
      toast.success('Model added');
      setNewModelName('');
      loadData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to add model');
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

  // ---- SVG Logo CRUD ----
  const handleSvgFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSvgFileContent(ev.target?.result as string);
      // Auto-fill name from filename if empty
      if (!svgName) {
        setSvgName(file.name.replace(/\.svg$/i, ''));
      }
    };
    reader.readAsText(file);
  };

  const handleUploadSvg = async () => {
    if (!svgFileContent || !svgName.trim()) return;
    try {
      await uploadLogo({ name: svgName.trim(), content: svgFileContent });
      toast.success('SVG uploaded');
      setSvgFileContent('');
      setSvgName('');
      loadData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to upload SVG');
    }
  };

  const handleDeleteSvg = async (name: string) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await apiDeleteLogo(name);
      toast.success('SVG deleted');
      loadData();
    } catch (e) {
      toast.error('Failed to delete SVG');
    }
  };

  // ---- Brand CRUD ----
  const handleAddBrand = async () => {
    if (!newBrandName.trim() || !newBrandLogo) return;
    const key = newBrandName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    try {
      await createBrand({ key, name: newBrandName.trim(), logo_filename: newBrandLogo });
      toast.success('Brand added');
      setNewBrandName('');
      setNewBrandLogo('');
      loadData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to add brand');
    }
  };

  const handleDeleteBrand = async (key: string) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await apiDeleteBrand(key);
      toast.success('Brand deleted');
      loadData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete brand');
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
                    {brands.map(brand => {
                      const brandModels = models.filter(m => m.brand_key === brand.key);
                      if (brandModels.length === 0) return null;
                      return (
                        <optgroup key={brand.key} label={brand.name}>
                          {brandModels.map(m => (
                            <option key={m.key} value={m.key}>{m.name}</option>
                          ))}
                        </optgroup>
                      );
                    })}
                    {/* Models without brand */}
                    {models.filter(m => !m.brand_key || !brands.find(b => b.key === m.brand_key)).length > 0 && (
                      <optgroup label="Other">
                        {models.filter(m => !m.brand_key || !brands.find(b => b.key === m.brand_key)).map(m => (
                          <option key={m.key} value={m.key}>{m.name}</option>
                        ))}
                      </optgroup>
                    )}
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
                    layout
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl overflow-hidden transition-colors"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                  >
                    {/* Demo row header */}
                    <div className="flex items-center justify-between p-4">
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
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => editingDemoId === demo.id ? handleCancelEditDemo() : handleEditDemo(demo)}
                          className="p-2 rounded-lg transition-colors"
                          style={{ color: editingDemoId === demo.id ? 'var(--color-primary)' : 'var(--text-muted)' }}
                        >
                          <PencilSimple size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteDemo(demo.id)}
                          className="p-2 rounded-lg transition-colors text-red-400 hover:bg-red-400/10"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Inline edit form */}
                    <AnimatePresence>
                      {editingDemoId === demo.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-4" style={{ borderTop: '1px solid var(--border)' }}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
                              {/* Tab select */}
                              <div>
                                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>{t('selectTab')}</label>
                                <select
                                  value={editDemoTabId}
                                  onChange={(e) => setEditDemoTabId(e.target.value)}
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
                                  value={editDemoModelKey}
                                  onChange={(e) => setEditDemoModelKey(e.target.value)}
                                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                >
                                  {models.map(m => (
                                    <option key={m.key} value={m.key}>{m.name}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Type select */}
                              <div>
                                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>{t('demoType')}</label>
                                <select
                                  value={editDemoType}
                                  onChange={(e) => setEditDemoType(e.target.value as 'html' | 'python')}
                                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                >
                                  <option value="html">HTML</option>
                                  <option value="python">Python</option>
                                </select>
                              </div>
                            </div>

                            {/* Code area (optional - only if re-uploading) */}
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                                  {t('pasteCode')} <span className="opacity-60">({language === 'zh' ? '留空则保留原文件' : 'leave empty to keep existing file'})</span>
                                </label>
                                <label className="text-xs cursor-pointer transition-colors" style={{ color: 'var(--color-primary)' }}>
                                  {t('orUploadFile')}
                                  <input type="file" accept=".html,.htm,.py,.txt" className="hidden" onChange={handleEditFileUpload} />
                                </label>
                              </div>
                              <textarea
                                value={editDemoCode}
                                onChange={(e) => setEditDemoCode(e.target.value)}
                                placeholder={editDemoType === 'html' ? '<!DOCTYPE html>\n<html>...' : 'import pygame\n...'}
                                rows={8}
                                className="w-full px-4 py-3 rounded-xl text-sm font-mono outline-none resize-y"
                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                              />
                            </div>

                            {/* Save / Cancel */}
                            <div className="flex gap-2">
                              <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={handleSaveDemo}
                                disabled={editingSaving}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
                                style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}
                              >
                                {editingSaving ? t('uploading') : t('save')}
                              </motion.button>
                              <button
                                onClick={handleCancelEditDemo}
                                className="px-4 py-2.5 rounded-xl text-sm font-medium"
                                style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                              >
                                {t('cancel')}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
            <div className="space-y-6">

              {/* ---- 1. Upload SVG ---- */}
              <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Image size={16} />
                  {t('uploadSvg')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-colors"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: svgFileContent ? 'var(--color-primary)' : 'var(--text-muted)' }}
                  >
                    <Upload size={14} />
                    {svgFileContent ? 'SVG loaded' : 'Choose SVG file'}
                    <input type="file" accept=".svg" className="hidden" onChange={handleSvgFileSelect} />
                  </label>
                  <input
                    value={svgName}
                    onChange={(e) => setSvgName(e.target.value)}
                    placeholder={t('svgName')}
                    className="px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                  <button
                    onClick={handleUploadSvg}
                    disabled={!svgFileContent || !svgName.trim()}
                    className="flex items-center justify-center gap-2 rounded-xl text-sm font-medium text-white disabled:opacity-40 transition-all"
                    style={{ background: 'var(--color-primary)', minHeight: '42px' }}
                  >
                    <Plus size={14} />
                    {t('addSvg')}
                  </button>
                </div>

                {/* SVG icons grid */}
                {availableLogos.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {availableLogos.map((logoName) => (
                      <div
                        key={logoName}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs group"
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                      >
                        <img src={`/api/logo/${logoName}`} alt="" className="w-4 h-4 object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/logos/default.svg'; }} />
                        <span style={{ color: 'var(--text-muted)' }}>{logoName.replace('.svg', '')}</span>
                        <button
                          onClick={() => handleDeleteSvg(logoName)}
                          className="p-0.5 rounded transition-all opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-400/10"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ---- 2. Brand Management ---- */}
              <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Robot size={16} />
                  {t('brandManagement')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    placeholder={t('brandName')}
                    className="px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                  {/* SVG picker */}
                  <div className="relative">
                    <select
                      value={newBrandLogo}
                      onChange={(e) => setNewBrandLogo(e.target.value)}
                      className="w-full h-full px-3 py-2.5 pl-9 rounded-xl text-sm outline-none appearance-none cursor-pointer"
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    >
                      <option value="">{t('selectSvg')}...</option>
                      {availableLogos.map(logo => (
                        <option key={logo} value={logo}>{logo.replace('.svg', '')}</option>
                      ))}
                    </select>
                    {newBrandLogo && (
                      <img
                        src={`/api/logo/${newBrandLogo}`}
                        alt=""
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 object-contain pointer-events-none"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                    <CaretDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <button
                    onClick={handleAddBrand}
                    disabled={!newBrandName.trim() || !newBrandLogo}
                    className="flex items-center justify-center gap-2 rounded-xl text-sm font-medium text-white disabled:opacity-40 transition-all"
                    style={{ background: 'var(--color-primary)', minHeight: '42px' }}
                  >
                    <Plus size={14} />
                    {t('addBrand')}
                  </button>
                </div>

                {/* Brand list */}
                {brands.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {brands.map((brand) => (
                      <div
                        key={brand.key}
                        className="flex items-center gap-3 p-2.5 rounded-xl group"
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
                          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                          <img src={`/api/logo/${brand.logo_filename}`} alt="" className="w-4 h-4 object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/logos/default.svg'; }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{brand.name}</div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{brand.key}</div>
                        </div>
                        <button
                          onClick={() => handleDeleteBrand(brand.key)}
                          className="p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-400/10 flex-shrink-0"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ---- 3. Model Management ---- */}
              <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Code size={16} />
                  {t('addModel')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Brand selector */}
                  <div className="relative">
                    <select
                      value={newModelBrand}
                      onChange={(e) => setNewModelBrand(e.target.value)}
                      className="w-full h-full px-3 py-2.5 pl-9 rounded-xl text-sm outline-none appearance-none cursor-pointer"
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    >
                      <option value="">{t('selectBrand')}...</option>
                      {brands.map(brand => (
                        <option key={brand.key} value={brand.key}>{brand.name}</option>
                      ))}
                    </select>
                    {newModelBrand && (
                      <img
                        src={`/api/logo/${brands.find(b => b.key === newModelBrand)?.logo_filename || 'default.svg'}`}
                        alt=""
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 object-contain pointer-events-none"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                    <CaretDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <input
                    value={newModelName}
                    onChange={(e) => setNewModelName(e.target.value)}
                    placeholder={t('modelName')}
                    className="px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                  <button
                    onClick={handleAddModel}
                    disabled={!newModelBrand || !newModelName.trim()}
                    className="flex items-center justify-center gap-2 rounded-xl text-sm font-medium text-white disabled:opacity-40 transition-all"
                    style={{ background: 'var(--color-primary)', minHeight: '42px' }}
                  >
                    <Plus size={14} />
                    {t('addModel')}
                  </button>
                </div>

                {/* Model list */}
                {models.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {models.map((model) => (
                      <motion.div
                        key={model.key}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-3 p-2.5 rounded-xl group"
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
                          style={{ background: `${model.color || '#6366f1'}15`, border: `1px solid ${model.color || '#6366f1'}30` }}
                        >
                          <img src={`/api/logo/${model.logo_filename}`} alt="" className="w-4 h-4 object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/logos/default.svg'; }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{model.name}</div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{model.brand_name || model.brand_key}</div>
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
                )}
              </div>

            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
