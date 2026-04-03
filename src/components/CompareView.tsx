import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Demo } from '@/lib/api';
import { getDemoUrl } from '@/lib/api';
import { getModelByKey, getModelLogo } from '@/lib/models';
import { useLanguage } from '@/lib/language';
import { ArrowLeft, X } from '@phosphor-icons/react';

type CompareOrientationMode = 'auto' | 'vertical' | 'horizontal';

interface CompareViewProps {
  demos: Demo[];
  onClose: () => void;
}

export function CompareView({ demos, onClose }: CompareViewProps) {
  const { t } = useLanguage();
  const [orientationMode, setOrientationMode] = useState<CompareOrientationMode>('auto');
  const [autoIsVertical, setAutoIsVertical] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : false
  );
  const isVertical = orientationMode === 'auto' ? autoIsVertical : orientationMode === 'vertical';

  useEffect(() => {
    const onResize = () => setAutoIsVertical(window.innerHeight > window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const orientationOptions: Array<{ key: CompareOrientationMode; label: string }> = [
    { key: 'auto', label: t('autoLayout') },
    { key: 'vertical', label: t('verticalLayout') },
    { key: 'horizontal', label: t('horizontalLayout') },
  ];

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
        className="flex items-center justify-between gap-3 px-4 py-3 flex-shrink-0 sm:px-6"
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
        <div className="flex items-center gap-2">
          <div
            className="hidden sm:flex items-center gap-1 rounded-2xl p-1"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
            role="group"
            aria-label={t('compareLayout')}
          >
            {orientationOptions.map((option) => {
              const isActive = orientationMode === option.key;

              return (
                <motion.button
                  key={option.key}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setOrientationMode(option.key)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                  style={{
                    background: isActive ? 'var(--color-primary)' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  }}
                >
                  {option.label}
                </motion.button>
              );
            })}
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }} aria-label={t('close')}>
            <X size={20} />
          </button>
        </div>
      </div>

      <div
        className="sm:hidden flex items-center gap-1 px-4 py-2 overflow-x-auto"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}
        role="group"
        aria-label={t('compareLayout')}
      >
        {orientationOptions.map((option) => {
          const isActive = orientationMode === option.key;

          return (
            <motion.button
              key={option.key}
              whileTap={{ scale: 0.97 }}
              onClick={() => setOrientationMode(option.key)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors"
              style={{
                background: isActive ? 'var(--color-primary)' : 'var(--bg)',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                border: `1px solid ${isActive ? 'var(--color-primary)' : 'var(--border)'}`,
              }}
            >
              {option.label}
            </motion.button>
          );
        })}
      </div>

      {/* Compare grid */}
      <div className={`flex-1 flex min-h-0 ${isVertical ? 'flex-col' : 'flex-row'}`}>
        {demos.map((demo, idx) => {
          const model = getModelByKey(demo.model_key);
          const color = model?.color || '#6366f1';
          const demoUrl = getDemoUrl(demo);

          return (
            <motion.div
              key={demo.id}
              initial={{ opacity: 0, ...(isVertical ? { y: (idx - 1) * 30 } : { x: (idx - 1) * 30 }) }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex-1 flex flex-col min-w-0 min-h-0"
              style={{
                borderRight: !isVertical && idx < demos.length - 1 ? '1px solid var(--border)' : undefined,
                borderBottom: isVertical && idx < demos.length - 1 ? '1px solid var(--border)' : undefined,
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
