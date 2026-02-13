import { motion } from 'framer-motion';
import type { Demo } from '@/lib/api';
import { getDemoUrl } from '@/lib/api';
import { getModelByKey, getModelLogo } from '@/lib/models';
import { useLanguage } from '@/lib/language';
import { ArrowLeft, ArrowsOut } from '@phosphor-icons/react';

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

  const handleFullscreen = () => {
    const iframe = document.getElementById('demo-viewer-iframe') as HTMLIFrameElement;
    if (iframe?.requestFullscreen) {
      iframe.requestFullscreen();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'var(--bg)' }}
    >
      {/* Floating toolbar */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
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
      </motion.div>

      {/* Demo iframe */}
      <iframe
        id="demo-viewer-iframe"
        src={demoUrl}
        title={`${demo.model_name} demo`}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin"
      />
    </motion.div>
  );
}
