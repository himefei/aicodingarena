import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import type { Demo } from '@/lib/api';
import { getDemoUrl, getThumbnailUrl } from '@/lib/api';
import { getModelByKey, getModelLogo } from '@/lib/models';
import { Plus, Check, Play, FilePy, Heart, Article } from '@phosphor-icons/react';
import { useLanguage } from '@/lib/language';

interface DemoTileProps {
  demo: Demo;
  index: number;
  compareMode: boolean;
  isSelected: boolean;
  onToggleCompare: (demo: Demo) => void;
  onClick: (demo: Demo) => void;
  likeCount?: number;
  liked?: boolean;
  onLike?: (demo: Demo) => void;
}

export function DemoTile({ demo, index, compareMode, isSelected, onToggleCompare, onClick, likeCount = 0, liked = false, onLike }: DemoTileProps) {
  const { language } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const model = getModelByKey(demo.model_key);
  const logoSrc = getModelLogo(demo.model_key);
  const modelColor = model?.color || '#6366f1';
  const thumbnailUrl = getThumbnailUrl(demo);
  const demoUrl = getDemoUrl(demo);

  const date = new Date(demo.created_at);
  const dateStr = date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative rounded-2xl overflow-hidden cursor-pointer tile-shadow"
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${isSelected ? modelColor : 'var(--border)'}`,
        borderWidth: isSelected ? '2px' : '1px',
      }}
      onClick={() => {
        if (compareMode) {
          onToggleCompare(demo);
        } else {
          onClick(demo);
        }
      }}
    >
      {/* Preview Area */}
      <div className="relative aspect-[4/3] overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
        {/* Thumbnail fallback */}
        {thumbnailUrl && !isHovered && (
          <img
            src={thumbnailUrl}
            alt={`${demo.model_name} preview`}
            className="w-full h-full object-cover object-top transition-opacity duration-200"
            style={{ opacity: isHovered ? 0 : 1 }}
          />
        )}

        {/* Live iframe on hover - HTML demos only (Python is too heavy for preview) */}
        {demo.demo_type !== 'python' && (isHovered || !thumbnailUrl) && (
          <div className="absolute inset-0">
            <div className="w-[400%] h-[400%] origin-top-left" style={{ transform: 'scale(0.25)' }}>
              <iframe
                ref={iframeRef}
                src={demoUrl}
                title={`${demo.model_name} demo`}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin"
                loading="lazy"
                onLoad={() => setIframeLoaded(true)}
                style={{ pointerEvents: 'none' }}
              />
            </div>
            {!iframeLoaded && !thumbnailUrl && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
                <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--text-muted)', borderTopColor: 'transparent' }} />
              </div>
            )}
          </div>
        )}

        {/* Python demo placeholder (no live preview to avoid freezing) */}
        {demo.demo_type === 'python' && !thumbnailUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
            <FilePy size={48} weight="duotone" className="text-blue-400 opacity-60" />
            <span className="text-xs text-blue-300/60 font-medium">Python Demo</span>
          </div>
        )}

        {/* Play overlay on hover (non-compare mode) */}
        {isHovered && !compareMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black/30"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
            >
              <Play size={24} weight="fill" className="text-gray-800 ml-1" />
            </motion.div>
          </motion.div>
        )}

        {/* Demo type badge */}
        <div
          className="absolute top-3 left-3 px-2 py-0.5 rounded-md text-xs font-medium"
          style={{
            background: demo.demo_type === 'python' ? 'rgba(59,130,246,0.9)' : demo.demo_type === 'markdown' ? 'rgba(16,185,129,0.9)' : 'rgba(99,102,241,0.9)',
            color: 'white',
          }}
        >
          {demo.demo_type === 'python' ? 'Python' : demo.demo_type === 'markdown' ? 'Markdown' : 'HTML'}
        </div>

        {/* Compare select button */}
        {compareMode && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare(demo);
            }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{
              background: isSelected ? modelColor : 'rgba(255,255,255,0.9)',
              color: isSelected ? 'white' : 'var(--text-secondary)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {isSelected ? <Check size={16} weight="bold" /> : <Plus size={16} weight="bold" />}
          </motion.button>
        )}

        {/* Like button - bottom right of preview */}
        {onLike && (
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => {
              e.stopPropagation();
              onLike(demo);
            }}
            className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all"
            style={{
              background: liked ? 'rgba(239,68,68,0.9)' : 'rgba(0,0,0,0.5)',
              color: 'white',
              backdropFilter: 'blur(4px)',
            }}
          >
            <Heart size={14} weight={liked ? 'fill' : 'regular'} />
            {likeCount > 0 && <span>{likeCount}</span>}
          </motion.button>
        )}
      </div>

      {/* Info bar */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{ background: `${modelColor}15`, border: `1px solid ${modelColor}30` }}
        >
          <img
            src={logoSrc}
            alt={demo.model_name}
            className="w-5 h-5 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
            {demo.model_name}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{dateStr}</div>
        </div>
      </div>

      {/* Comment (conditional) */}
      {demo.comment && (
        <div className="px-4 pb-3 -mt-1">
          <p
            className="text-xs leading-relaxed"
            style={{
              color: 'var(--text-muted)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {demo.comment}
          </p>
        </div>
      )}
    </motion.div>
  );
}
