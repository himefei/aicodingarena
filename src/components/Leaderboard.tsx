import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/lib/language';
import { fetchLeaderboard, type LeaderboardEntry, type Tab } from '@/lib/api';
import { getModelLogo } from '@/lib/models';
import { Trophy, Crown } from '@phosphor-icons/react';

interface LeaderboardProps {
  tabs: Tab[];
  activeTabId: string;
}

const CROWN_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32']; // gold, silver, bronze

export function Leaderboard({ tabs, activeTabId }: LeaderboardProps) {
  const { t, language } = useLanguage();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [filterTab, setFilterTab] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchLeaderboard(filterTab || undefined);
      setEntries(data);
    } catch (e) {
      console.error('Failed to load leaderboard:', e);
      setEntries([]);
    }
    setLoading(false);
  }, [filterTab]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const maxCount = entries.length > 0 ? Math.max(...entries.map(e => e.like_count)) : 0;
  const BAR_MAX_HEIGHT = 180;

  if (loading && entries.length === 0) {
    return null; // Don't show skeleton on first load
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-2xl overflow-hidden"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <Trophy size={20} weight="duotone" style={{ color: 'var(--color-primary)' }} />
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            {t('leaderboard')}
          </h2>
        </div>

        {/* Tab filter dropdown */}
        <select
          value={filterTab}
          onChange={(e) => setFilterTab(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium outline-none cursor-pointer"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        >
          <option value="">{t('totalRanking')}</option>
          {tabs.map(tab => (
            <option key={tab.id} value={tab.id}>
              {language === 'zh' ? tab.name_cn : tab.name_en}
            </option>
          ))}
        </select>
      </div>

      {/* Chart */}
      <div className="px-5 py-4">
        <AnimatePresence mode="wait">
          {entries.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <Trophy size={40} weight="thin" className="mx-auto mb-2" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('noLikesYet')}</p>
            </motion.div>
          ) : (
            <motion.div
              key={filterTab || 'all'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Bar chart container */}
              <div className="flex items-end gap-1 sm:gap-2 overflow-x-auto pb-2" style={{ minHeight: BAR_MAX_HEIGHT + 60 }}>
                {entries.map((entry, idx) => {
                  const barHeight = maxCount > 0
                    ? Math.max(8, (entry.like_count / maxCount) * BAR_MAX_HEIGHT)
                    : 8;
                  const barColor = entry.color || '#6366f1';
                  const labelText = entry.brand_name
                    ? `${entry.brand_name} ${entry.model_name}`
                    : entry.model_name;
                  const logoSrc = getModelLogo(entry.model_key);

                  return (
                    <div
                      key={entry.demo_id}
                      className="flex flex-col items-center flex-shrink-0"
                      style={{ minWidth: entries.length <= 6 ? `${Math.floor(100 / Math.min(entries.length, 8))}%` : 60 }}
                    >
                      {/* Crown for top 3 */}
                      <div className="h-7 flex items-end justify-center mb-1">
                        {idx < 3 && (
                          <motion.div
                            initial={{ scale: 0, rotate: -30 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: idx * 0.1 + 0.3, type: 'spring', stiffness: 400, damping: 15 }}
                          >
                            <Crown
                              size={idx === 0 ? 24 : 20}
                              weight="fill"
                              style={{ color: CROWN_COLORS[idx] }}
                            />
                          </motion.div>
                        )}
                      </div>

                      {/* Count label */}
                      <span
                        className="text-xs font-bold mb-1"
                        style={{ color: barColor }}
                      >
                        {entry.like_count}
                      </span>

                      {/* Bar */}
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: barHeight }}
                        transition={{ duration: 0.5, delay: idx * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="w-full rounded-t-lg relative overflow-hidden"
                        style={{
                          background: `linear-gradient(180deg, ${barColor}, ${barColor}99)`,
                          minWidth: 24,
                          maxWidth: 60,
                          margin: '0 auto',
                        }}
                      >
                        {/* Shine effect */}
                        <div
                          className="absolute inset-0 opacity-20"
                          style={{
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                          }}
                        />
                      </motion.div>

                      {/* Logo + Label */}
                      <div className="mt-2 flex flex-col items-center gap-0.5" style={{ width: '100%' }}>
                        <img
                          src={logoSrc}
                          alt={entry.model_name}
                          className="w-4 h-4 object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <span
                          className="text-xs font-medium text-center leading-tight"
                          style={{
                            color: 'var(--text-secondary)',
                            writingMode: entries.length > 6 ? 'vertical-rl' : undefined,
                            transform: entries.length > 6 ? 'rotate(180deg)' : undefined,
                            maxWidth: entries.length > 6 ? undefined : 80,
                            maxHeight: entries.length > 6 ? 70 : undefined,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: entries.length > 6 ? 'nowrap' : undefined,
                            display: '-webkit-box',
                            WebkitLineClamp: entries.length > 6 ? undefined : 2,
                            WebkitBoxOrient: entries.length > 6 ? undefined : 'vertical',
                          }}
                          title={labelText}
                        >
                          {labelText}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
