import { useState } from 'react';
import { Sun, Moon, Desktop } from '@phosphor-icons/react';
import { useTheme, type Theme } from '@/lib/theme';
import { motion, AnimatePresence } from 'framer-motion';

const themes: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'system', icon: Desktop, label: 'System' },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const currentTheme = themes.find((t) => t.value === theme) || themes[2];
  const Icon = currentTheme.icon;

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        aria-label="Toggle theme"
      >
        <Icon size={18} weight="bold" style={{ color: 'var(--text-secondary)' }} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-50 rounded-xl p-1 min-w-[120px]"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              {themes.map((t) => {
                const TIcon = t.icon;
                return (
                  <button
                    key={t.value}
                    onClick={() => { setTheme(t.value); setOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors"
                    style={{
                      color: theme === t.value ? 'var(--color-primary)' : 'var(--text-secondary)',
                      background: theme === t.value ? 'var(--bg-card-hover)' : 'transparent',
                    }}
                  >
                    <TIcon size={16} weight={theme === t.value ? 'fill' : 'regular'} />
                    {t.label}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
