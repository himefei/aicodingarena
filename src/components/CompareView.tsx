import { motion } from 'framer-motion';
import type { Demo } from '@/lib/api';
import { getDemoUrl } from '@/lib/api';
import { getModelByKey, getModelLogo } from '@/lib/models';
import { useLanguage } from '@/lib/language';
import { ArrowLeft, X } from '@phosphor-icons/react';

interface CompareViewProps {
  demos: Demo[];
  onClose: () => void;
}

export function CompareView({ demos, onClose }: CompareViewProps) {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'var(--bg)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft size={18} />
          {t('back')}
        </motion.button>
        <h2 className="text-sm font-bold gradient-text" style={{ fontFamily: 'var(--font-display)' }}>
          {t('compareMode')}
        </h2>
        <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
          <X size={20} />
        </button>
      </div>

      {/* Compare grid */}
      <div className="flex-1 flex min-h-0">
        {demos.map((demo, idx) => {
          const model = getModelByKey(demo.model_key);
          const color = model?.color || '#6366f1';
          const demoUrl = getDemoUrl(demo);

          return (
            <motion.div
              key={demo.id}
              initial={{ opacity: 0, x: (idx - 1) * 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex-1 flex flex-col min-w-0"
              style={{
                borderRight: idx < demos.length - 1 ? '1px solid var(--border)' : undefined,
              }}
            >
              {/* Model label */}
              <div
                className="flex items-center gap-2 px-4 py-2 flex-shrink-0"
                style={{ borderBottom: `2px solid ${color}`, background: `${color}08` }}
              >
                <img src={getModelLogo(demo.model_key)} alt="" className="w-5 h-5" />
                <span className="text-sm font-semibold truncate" style={{ color }}>
                  {demo.model_name}
                </span>
              </div>

              {/* iframe */}
              <div className="flex-1 min-h-0">
                <iframe
                  src={demoUrl}
                  title={`${demo.model_name} demo`}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
