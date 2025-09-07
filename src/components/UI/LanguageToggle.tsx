import React, { useState } from 'react';
import { Globe, Check } from 'lucide-react';
import { useTranslation } from '../../context/TranslationContext';

export const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' }
  ];

  const currentLanguage = languages.find(lang => lang.code === language);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
        title="Change Language"
      >
        <Globe className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-200">
          {currentLanguage?.flag} {currentLanguage?.name}
        </span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-40">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Select Language
              </div>
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code as 'en' | 'fr');
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                    language === lang.code
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{lang.flag}</span>
                    <span className="font-medium">{lang.name}</span>
                  </div>
                  {language === lang.code && (
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};