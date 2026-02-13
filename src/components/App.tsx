import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LanguageProvider, useLanguage } from '@/lib/language';
import { ThemeProvider } from '@/lib/theme';
import { fetchTabs, fetchDemos, isAuthenticated, verifyToken, type Tab, type Demo } from '@/lib/api';
import { useKonamiCode, isKonamiActivated } from '@/hooks/use-konami-code';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { TabBar } from '@/components/TabBar';
import { DemoTile } from '@/components/DemoTile';
import { CompareBar } from '@/components/CompareBar';
import { CompareView } from '@/components/CompareView';
import { DemoViewer } from '@/components/DemoViewer';
import { AdminLoginDialog } from '@/components/AdminLoginDialog';
import { AdminPanel } from '@/components/AdminPanel';
import { Toaster } from 'sonner';
import {
  Sword, GearSix, Rows, GridFour,
} from '@phosphor-icons/react';

function AppInner() {
  const { t, language } = useLanguage();

  // Data
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [demos, setDemos] = useState<Demo[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Compare mode
  const [compareMode, setCompareMode] = useState(false);
  const [selectedDemos, setSelectedDemos] = useState<Demo[]>([]);
  const [showCompareView, setShowCompareView] = useState(false);

  // Demo viewer
  const [viewingDemo, setViewingDemo] = useState<Demo | null>(null);

  // Admin
  const [showAdmin, setShowAdmin] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Konami code
  const konamiActivated = useKonamiCode();

  // Layout
  const [gridCols, setGridCols] = useState<2 | 3 | 4>(3);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const tabsData = await fetchTabs();
      setTabs(tabsData);
      if (tabsData.length > 0 && !activeTabId) {
        setActiveTabId(tabsData[0].id);
      }
    } catch (e) {
      console.error('Failed to load tabs:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Load demos when tab changes
  useEffect(() => {
    if (!activeTabId) return;
    const loadDemos = async () => {
      try {
        const data = await fetchDemos(activeTabId);
        setDemos(data);
      } catch (e) {
        console.error('Failed to load demos:', e);
        setDemos([]);
      }
    };
    loadDemos();
  }, [activeTabId]);

  // Check admin status
  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated()) {
        const valid = await verifyToken();
        setIsAdmin(valid);
      }
    };
    checkAuth();
  }, []);

  // Show admin button when Konami activated
  useEffect(() => {
    if (konamiActivated && !isAdmin) {
      setShowLoginDialog(true);
    }
  }, [konamiActivated]);

  // ---- Handlers ----
  const handleTabChange = (tabId: string) => {
    setActiveTabId(tabId);
    setSelectedDemos([]);
    setCompareMode(false);
  };

  const handleDemoClick = (demo: Demo) => {
    if (compareMode) {
      toggleDemoSelection(demo);
    } else {
      setViewingDemo(demo);
    }
  };

  const toggleDemoSelection = (demo: Demo) => {
    setSelectedDemos(prev => {
      const exists = prev.find(d => d.id === demo.id);
      if (exists) return prev.filter(d => d.id !== demo.id);
      if (prev.length >= 3) return prev;
      return [...prev, demo];
    });
  };

  const handleCompareStart = () => {
    if (selectedDemos.length >= 2) {
      setShowCompareView(true);
    }
  };

  const handleLoginSuccess = () => {
    setIsAdmin(true);
    setShowLoginDialog(false);
    setShowAdmin(true);
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setShowAdmin(false);
  };

  const filteredDemos = demos;

  // Grid class
  const gridClassName = `grid gap-4 ${
    gridCols === 2 ? 'grid-cols-1 sm:grid-cols-2' :
    gridCols === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  }`;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Toaster position="top-right" richColors />

      {/* ===== HEADER ===== */}
      <header
        className="sticky top-0 z-30 glass"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => { setShowAdmin(false); setViewingDemo(null); }}
            >
              <div className="relative">
                <Sword size={28} weight="duotone" style={{ color: 'var(--color-primary)' }} />
                <div
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse"
                  style={{ background: 'var(--color-accent)' }}
                />
              </div>
              <div>
                <h1
                  className="text-lg font-bold leading-tight gradient-text"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {t('siteTitle')}
                </h1>
                <p className="text-xs leading-tight" style={{ color: 'var(--text-muted)' }}>
                  {t('siteSubtitle')}
                </p>
              </div>
            </motion.div>

            {/* Right controls */}
            <div className="flex items-center gap-2">
              {/* Grid size toggles */}
              {!showAdmin && (
                <div className="hidden sm:flex items-center gap-1 mr-1">
                  {([2, 3, 4] as const).map(cols => (
                    <button
                      key={cols}
                      onClick={() => setGridCols(cols)}
                      className="p-1.5 rounded-lg transition-all"
                      style={{
                        color: gridCols === cols ? 'var(--color-primary)' : 'var(--text-muted)',
                        background: gridCols === cols ? 'var(--color-primary)10' : 'transparent',
                      }}
                      title={`${cols} columns`}
                    >
                      {cols === 2 ? <Rows size={16} /> : <GridFour size={16} />}
                    </button>
                  ))}
                </div>
              )}

              {/* Compare toggle */}
              {!showAdmin && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setCompareMode(!compareMode);
                    if (compareMode) setSelectedDemos([]);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: compareMode ? 'var(--color-primary)' : 'var(--bg-secondary)',
                    color: compareMode ? 'white' : 'var(--text-secondary)',
                    border: `1px solid ${compareMode ? 'var(--color-primary)' : 'var(--border)'}`,
                  }}
                >
                  {t('compare')}
                </motion.button>
              )}

              <LanguageSwitch />
              <ThemeToggle />

              {/* Admin access */}
              {(isKonamiActivated() || isAdmin) && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (isAdmin) {
                      setShowAdmin(!showAdmin);
                    } else {
                      setShowLoginDialog(true);
                    }
                  }}
                  className="p-2 rounded-xl transition-all"
                  style={{
                    background: showAdmin ? 'var(--color-primary)' : 'var(--bg-secondary)',
                    color: showAdmin ? 'white' : 'var(--text-secondary)',
                    border: `1px solid ${showAdmin ? 'var(--color-primary)' : 'var(--border)'}`,
                  }}
                >
                  <GearSix size={18} weight={showAdmin ? 'fill' : 'regular'} />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <AnimatePresence mode="wait">
          {showAdmin && isAdmin ? (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AdminPanel onLogout={handleLogout} />
            </motion.div>
          ) : (
            <motion.div
              key="gallery"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Tab Bar */}
              {tabs.length > 0 && (
                <TabBar
                  tabs={tabs}
                  activeTabId={activeTabId}
                  onTabChange={handleTabChange}
                />
              )}

              {/* Compare hint */}
              <AnimatePresence>
                {compareMode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-center py-3"
                  >
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {t('selectToCompare')}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Demo Grid */}
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div
                    className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
                  />
                </div>
              ) : filteredDemos.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-20"
                >
                  <Sword size={64} weight="thin" className="mx-auto mb-4" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                  <p className="text-lg font-medium" style={{ color: 'var(--text-muted)' }}>
                    {t('noDemo')}
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
                    {t('addFirstDemo')}
                  </p>
                </motion.div>
              ) : (
                <div className={gridClassName}>
                  {filteredDemos.map((demo, index) => (
                    <motion.div
                      key={demo.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                      <DemoTile
                        demo={demo}
                        index={index}
                        compareMode={compareMode}
                        isSelected={!!selectedDemos.find(d => d.id === demo.id)}
                        onToggleCompare={toggleDemoSelection}
                        onClick={() => setViewingDemo(demo)}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ===== OVERLAYS ===== */}

      {/* Compare bar */}
      <AnimatePresence>
        {compareMode && selectedDemos.length > 0 && (
          <CompareBar
            selectedDemos={selectedDemos}
            onRemove={(id) => setSelectedDemos(prev => prev.filter(d => d.id !== id))}
            onCompare={handleCompareStart}
            onExit={() => { setCompareMode(false); setSelectedDemos([]); }}
          />
        )}
      </AnimatePresence>

      {/* Compare view overlay */}
      <AnimatePresence>
        {showCompareView && (
          <CompareView
            demos={selectedDemos}
            onClose={() => {
              setShowCompareView(false);
              setCompareMode(false);
              setSelectedDemos([]);
            }}
          />
        )}
      </AnimatePresence>

      {/* Demo viewer overlay */}
      <AnimatePresence>
        {viewingDemo && (
          <DemoViewer
            demo={viewingDemo}
            onClose={() => setViewingDemo(null)}
          />
        )}
      </AnimatePresence>

      {/* Admin login dialog */}
      <AnimatePresence>
        {showLoginDialog && (
          <AdminLoginDialog
            onClose={() => setShowLoginDialog(false)}
            onSuccess={handleLoginSuccess}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="text-center py-6 text-xs" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
        <p>AI Coding Arena · {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppInner />
      </LanguageProvider>
    </ThemeProvider>
  );
}
