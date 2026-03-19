import React, { createContext, useContext, useState, useEffect } from 'react';
import translations from '../locales/translations.json';

const LanguageContext = createContext();

/* eslint-disable react-refresh/only-export-components */
export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('appLanguage');
    return (savedLanguage && translations[savedLanguage]) ? savedLanguage : 'en';
  });

  // On mount, check local storage for preferred language
  useEffect(() => {
    // Handled in useState initializer
  }, []);

  // Update language and save to local storage
  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
      localStorage.setItem('appLanguage', lang);
    }
  };

  // Translation function
  const t = (key) => {
    if (translations[language] && translations[language][key]) {
      return translations[language][key];
    }
    // Fallback to English if translation is missing
    if (translations['en'] && translations['en'][key]) {
      return translations['en'][key];
    }
    return key; // Fallback to key itself if no translation found at all
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
