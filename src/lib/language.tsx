import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type Language = 'zh' | 'en';

const translations = {
  zh: {
    siteTitle: 'AI Coding Arena',
    siteSubtitle: 'AI代码能力对比平台',
    compare: '对比',
    compareMode: '对比模式',
    exitCompare: '退出对比',
    startCompare: '开始对比',
    selectToCompare: '选择要对比的演示（最多3个）',
    selected: '已选',
    admin: '管理员',
    login: '登录',
    logout: '登出',
    password: '密码',
    enterPassword: '请输入管理员密码',
    loginSuccess: '登录成功！',
    loggedOut: '已登出',
    incorrectPassword: '密码错误',
    tooManyAttempts: '尝试次数过多，请稍后重试',
    tryAgainIn: '请在 {minutes} 分钟后重试',
    cancel: '取消',
    save: '保存',
    delete: '删除',
    confirmDelete: '确认删除？',
    upload: '上传',
    uploading: '上传中...',
    tabManagement: 'Tab 管理',
    addTab: '添加 Tab',
    editTab: '编辑 Tab',
    tabNameCn: '中文名称',
    tabNameEn: '英文名称',
    tabSlug: 'URL 标识',
    demoManagement: 'Demo 管理',
    uploadDemo: '上传 Demo',
    selectTab: '选择 Tab',
    selectModel: '选择模型',
    demoType: 'Demo 类型',
    pasteCode: '粘贴代码',
    orUploadFile: '或上传文件',
    preview: '预览',
    noDemo: '暂无演示',
    addFirstDemo: '通过管理后台添加第一个演示',
    modelManagement: '模型管理',
    addModel: '添加模型',
    modelName: '模型名称',
    modelKey: '模型标识',
    modelColor: '品牌色',
    back: '返回',
    fullscreen: '全屏',
    loading: '加载中...',
    adminPanel: '管理面板',
    theme: '主题',
    light: '浅色',
    dark: '深色',
    system: '跟随系统',
  },
  en: {
    siteTitle: 'AI Coding Arena',
    siteSubtitle: 'AI Code Capability Comparison Platform',
    compare: 'Compare',
    compareMode: 'Compare Mode',
    exitCompare: 'Exit Compare',
    startCompare: 'Start Compare',
    selectToCompare: 'Select demos to compare (up to 3)',
    selected: 'Selected',
    admin: 'Admin',
    login: 'Login',
    logout: 'Logout',
    password: 'Password',
    enterPassword: 'Enter admin password',
    loginSuccess: 'Login successful!',
    loggedOut: 'Logged out',
    incorrectPassword: 'Incorrect password',
    tooManyAttempts: 'Too many attempts. Please try again later.',
    tryAgainIn: 'Try again in {minutes} minutes',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    confirmDelete: 'Confirm delete?',
    upload: 'Upload',
    uploading: 'Uploading...',
    tabManagement: 'Tab Management',
    addTab: 'Add Tab',
    editTab: 'Edit Tab',
    tabNameCn: 'Chinese Name',
    tabNameEn: 'English Name',
    tabSlug: 'URL Slug',
    demoManagement: 'Demo Management',
    uploadDemo: 'Upload Demo',
    selectTab: 'Select Tab',
    selectModel: 'Select Model',
    demoType: 'Demo Type',
    pasteCode: 'Paste Code',
    orUploadFile: 'or Upload File',
    preview: 'Preview',
    noDemo: 'No demos yet',
    addFirstDemo: 'Add your first demo via admin panel',
    modelManagement: 'Model Management',
    addModel: 'Add Model',
    modelName: 'Model Name',
    modelKey: 'Model Key',
    modelColor: 'Brand Color',
    back: 'Back',
    fullscreen: 'Fullscreen',
    loading: 'Loading...',
    adminPanel: 'Admin Panel',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  },
} as const;

type TranslationKey = keyof typeof translations.zh;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('arena-language');
      if (saved === 'zh' || saved === 'en') return saved;
      return navigator.language.startsWith('zh') ? 'zh' : 'en';
    }
    return 'en';
  });

  useEffect(() => {
    localStorage.setItem('arena-language', language);
  }, [language]);

  const t = (key: TranslationKey, params?: Record<string, string>): string => {
    let value = translations[language][key] || translations.en[key] || key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        value = value.replace(`{${k}}`, v);
      }
    }
    return value;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
