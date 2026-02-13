import { motion, AnimatePresence } from 'framer-motion';
import type { Demo } from '@/lib/api';
import { useLanguage } from '@/lib/language';
import { X, ArrowsOutSimple } from '@phosphor-icons/react';
import { getModelByKey, getModelLogo } from '@/lib/models';

interface CompareBarProps {
  selectedDemos: Demo[];
  onRemove: (id: string) => void;
  onCompare: () => void;
  onExit: () => void;
}

export function CompareBar({ selectedDemos, onRemove, onCompare, onExit }: CompareBarProps) {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-50 glass"
      style={{
        borderTop: '1px solid var(--border)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
      }}
    >
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        {/* Selected items */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-sm font-medium whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
            {t('selected')}: {selectedDemos.length}/3
          </span>
          <div className="flex gap-2 overflow-x-auto">
            <AnimatePresence mode="popLayout">
              {selectedDemos.map((demo) => {
                const model = getModelByKey(demo.model_key);
                const color = model?.color || '#6366f1';
                return (
                  <motion.div
                    key={demo.id}
                    layout
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{
                      background: `${color}15`,
                      border: `1px solid ${color}40`,
                      color: color,
                    }}
                  >
                    <img src={getModelLogo(demo.model_key)} alt="" className="w-4 h-4" />
                    <span className="truncate max-w-[80px]">{demo.model_name}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemove(demo.id); }}
                      className="ml-1 hover:opacity-70"
                    >
                      <X size={12} weight="bold" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onExit}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            {t('exitCompare')}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCompare}
            disabled={selectedDemos.length < 2}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: selectedDemos.length >= 2
                ? 'linear-gradient(135deg, var(--color-primary), var(--color-accent))'
                : 'var(--text-muted)',
            }}
          >
            <span className="flex items-center gap-2">
              <ArrowsOutSimple size={16} weight="bold" />
              {t('startCompare')}
            </span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
