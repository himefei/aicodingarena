import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Demo } from '@/lib/api';
import { getDemoUrl } from '@/lib/api';
import { getModelByKey, getModelLogo } from '@/lib/models';
import { useLanguage } from '@/lib/language';
import { ArrowLeft, ArrowsOut, ArrowSquareOut, Play, X } from '@phosphor-icons/react';

interface DemoViewerProps {
  demo: Demo;
  onClose: () => void;
}

export function DemoViewer({ demo, onClose }: DemoViewerProps) {
  const { t, language } = useLanguage();
  const model = getModelByKey(demo.model_key);
  const color = model?.color || '#6366f1';
  const demoUrl = getDemoUrl(demo);
  const logoSrc = getModelLogo(demo.model_key);
  const isPython = demo.demo_type === 'python';
  const [pythonLoaded, setPythonLoaded] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);

  const handleFullscreen = () => {
    const iframe = document.getElementById('demo-viewer-iframe') as HTMLIFrameElement;
    if (iframe?.requestFullscreen) {
      iframe.requestFullscreen();
    }
  };

  const handleOpenNewTab = () => {
    window.open(demoUrl, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'var(--bg)' }}
    >
      {/* Toolbar toggle hint */}
      <AnimatePresence>
        {!showToolbar && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => setShowToolbar(true)}
            className="absolute top-0 left-1/2 -translate-x-1/2 z-10 px-4 py-1 rounded-b-lg text-xs cursor-pointer"
            style={{
              background: 'rgba(0,0,0,0.45)',
              color: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {language === 'zh' ? '▼ 点击显示工具栏' : '▼ Tap to show toolbar'}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Floating toolbar */}
      <AnimatePresence>
        {showToolbar && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 px-4 py-2 rounded-2xl glass"
            style={{
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft size={16} />
          {t('back')}
        </motion.button>

        <div className="w-px h-6" style={{ background: 'var(--border)' }} />

        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden"
            style={{ background: `${color}15`, border: `1px solid ${color}30` }}
          >
            <img src={logoSrc} alt="" className="w-4 h-4 object-contain" />
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {demo.model_name}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-md"
            style={{
              background: demo.demo_type === 'python' ? 'rgba(59,130,246,0.15)' : 'rgba(99,102,241,0.15)',
              color: demo.demo_type === 'python' ? '#3b82f6' : '#6366f1',
            }}
          >
            {demo.demo_type === 'python' ? 'Python' : 'HTML'}
          </span>
        </div>

        <div className="w-px h-6" style={{ background: 'var(--border)' }} />

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleFullscreen}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowsOut size={16} />
          {t('fullscreen')}
        </motion.button>

          <button
            onClick={() => setShowToolbar(false)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={14} />
          </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Demo content */}
      {isPython && !pythonLoaded ? (
        /* Python: show launch screen to avoid freezing parent page */
        <div className="flex-1 flex flex-col items-center justify-center gap-6" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
          <div className="text-6xl">🐍</div>
          <p className="text-lg font-medium" style={{ color: '#94a3b8' }}>
            {language === 'zh' ? 'Python Demo 需要加载运行时环境' : 'Python Demo requires loading the runtime'}
          </p>
          <p className="text-sm max-w-md text-center" style={{ color: '#64748b' }}>
            {language === 'zh'
              ? 'Pyodide 运行时约 15MB，首次加载需要 5-10 秒。加载后浏览器会缓存，下次秒开。'
              : 'Pyodide runtime is ~15MB. First load takes 5-10s. Cached after that for instant loads.'}
          </p>
          <div className="flex gap-3 mt-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPythonLoaded(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <Play size={18} weight="fill" />
              {language === 'zh' ? '在此页面运行' : 'Run on this page'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleOpenNewTab}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}
            >
              <ArrowSquareOut size={18} />
              {language === 'zh' ? '新标签页打开（推荐）' : 'Open in new tab (recommended)'}
            </motion.button>
          </div>
          <p className="text-xs mt-4" style={{ color: '#475569' }}>
            {language === 'zh'
              ? '💡 新标签页打开不会卡住主页面'
              : '💡 New tab won\'t freeze the main page'}
          </p>
        </div>
      ) : (
        /* HTML demos or Python after user clicks Run */
        <iframe
          id="demo-viewer-iframe"
          src={demoUrl}
          title={`${demo.model_name} demo`}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
        />
      )}
    </motion.div>
  );
}
