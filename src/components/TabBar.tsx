import { useLanguage } from '@/lib/language';
import { motion } from 'framer-motion';
import type { Tab } from '@/lib/api';

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string | null;
  onTabChange: (tabId: string) => void;
}

export function TabBar({ tabs, activeTabId, onTabChange }: TabBarProps) {
  const { language } = useLanguage();

  return (
    <div className="relative">
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map((tab, idx) => {
          const isActive = tab.id === activeTabId;
          const label = language === 'zh' ? tab.name_cn : tab.name_en;

          return (
            <motion.button
              key={tab.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              onClick={() => onTabChange(tab.id)}
              className="relative px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200"
              style={{
                color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
                background: isActive ? 'var(--bg-card)' : 'transparent',
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
              }}
            >
              {label}
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ background: 'var(--color-primary)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
