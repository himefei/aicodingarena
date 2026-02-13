import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/lib/language';
import { login as apiLogin, type LoginResponse } from '@/lib/api';
import { Lock, Eye, EyeSlash, X } from '@phosphor-icons/react';

interface AdminLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginSuccess: () => void;
}

export function AdminLoginDialog({ open, onOpenChange, onLoginSuccess }: AdminLoginDialogProps) {
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutMinutes, setLockoutMinutes] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || !password) return;

    setIsLoading(true);
    setError('');

    try {
      const data: LoginResponse = await apiLogin(password);

      if (data.success && data.token) {
        sessionStorage.setItem('admin-token', data.token);
        sessionStorage.setItem('admin-token-expiry', String(data.expiresAt));
        setIsLocked(false);
        setLockoutMinutes(0);
        onLoginSuccess();
        onOpenChange(false);
        setPassword('');
      } else {
        if (data.locked) {
          setIsLocked(true);
          setLockoutMinutes(data.remainingMinutes || 60);
        }
        setError(data.message || t('incorrectPassword'));
      }
    } catch (err) {
      // Dev fallback
      if (password === 'dev-admin-123') {
        sessionStorage.setItem('admin-token', 'dev-token');
        sessionStorage.setItem('admin-token-expiry', String(Date.now() + 24 * 60 * 60 * 1000));
        onLoginSuccess();
        onOpenChange(false);
        setPassword('');
      } else {
        setError(t('incorrectPassword'));
      }
    }

    setIsLoading(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-md rounded-2xl p-6"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}>
                  <Lock size={20} weight="bold" className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                    {t('admin')} {t('login')}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {t('password')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('enterPassword')}
                    autoFocus
                    disabled={isLocked}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm px-3 py-2 rounded-lg"
                  style={{
                    background: isLocked ? 'rgba(234,179,8,0.1)' : 'rgba(239,68,68,0.1)',
                    color: isLocked ? '#eab308' : '#ef4444',
                  }}
                >
                  {error}
                </motion.p>
              )}

              {isLocked && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {t('tryAgainIn', { minutes: String(lockoutMinutes) })}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { onOpenChange(false); setPassword(''); setError(''); }}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !password || isLocked}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                  }}
                >
                  {isLoading ? '...' : isLocked ? '🔒' : t('login')}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
