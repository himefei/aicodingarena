import { useLanguage, type Language } from '@/lib/language';
import { motion } from 'framer-motion';

export function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();

  const toggle = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh');
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggle}
      className="flex items-center justify-center w-9 h-9 rounded-lg text-xs font-bold transition-colors"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        color: 'var(--text-secondary)',
      }}
      aria-label="Toggle language"
    >
      {language === 'zh' ? 'EN' : '中'}
    </motion.button>
  );
}
