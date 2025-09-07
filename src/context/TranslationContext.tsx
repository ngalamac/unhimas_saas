import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'fr';

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

interface TranslationProviderProps {
  children: ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Check localStorage first
    const saved = localStorage.getItem('language');
    if (saved && (saved === 'en' || saved === 'fr')) {
      return saved as Language;
    }
    // Check browser language
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('fr')) {
      return 'fr';
    }
    return 'en';
  });

  const [translations, setTranslations] = useState<Record<string, any>>({});

  useEffect(() => {
    // Load translation files
    const loadTranslations = async () => {
      try {
        const [enModule, frModule] = await Promise.all([
          import('../translations/en.json'),
          import('../translations/fr.json')
        ]);
        
        setTranslations({
          en: enModule.default,
          fr: frModule.default
        });
      } catch (error) {
        console.error('Failed to load translations:', error);
      }
    };

    loadTranslations();
  }, []);

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('language', language);
    
    // Update document language attribute
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if key not found in current language
        value = translations['en'];
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Return key if not found in any language
          }
        }
        break;
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    // Replace parameters in the translation
    if (params) {
      return Object.entries(params).reduce((str, [paramKey, paramValue]) => {
        return str.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue));
      }, value);
    }

    return value;
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
};