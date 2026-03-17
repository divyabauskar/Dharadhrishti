import React, { useState } from 'react';
import { Globe, Languages, Speech, CheckCircle, ArrowRight, Settings, MapPin, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const languages = [
  {
    id: 'en',
    name: 'English',
    desc: 'Default system language',
    icon: <Globe size={24} />
  },
  {
    id: 'hi',
    name: 'Hindi',
    desc: 'हिन्दी - Primary regional',
    icon: <Languages size={24} />
  },
  {
    id: 'mr',
    name: 'Marathi',
    desc: 'मराठी - Regional precision',
    icon: <Speech size={24} />
  },
  {
    id: 'te',
    name: 'Telugu',
    desc: 'తెలుగు - Enhanced support',
    icon: <CheckCircle size={24} /> 
  }
];

export default function LanguageSelection() {
  const [selected, setSelected] = useState('en');
  const navigate = useNavigate();

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-brand">
          <MapPin color="#0B6A41" size={20} fill="#0B6A41" fillOpacity={0.2} />
          <span>Dharadhristi</span>
        </div>
        <button className="icon-button" aria-label="Settings">
          <Settings size={20} />
        </button>
      </header>

      {/* Main Content */}
      <main className="app-content">
        <div className="indicator-bar"></div>
        
        <h1 className="page-title">Choose Your Language</h1>
        <p className="page-subtitle">
          Select your preferred language to<br/>customize your Dharadhristi<br/>experience.
        </p>

        <div className="language-list">
          {languages.map((lang) => {
            const isSelected = selected === lang.id;
            return (
              <div 
                key={lang.id} 
                className={`language-card ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelected(lang.id)}
              >
                <div className="language-icon" style={{ color: isSelected ? '#0B6A41' : '#10643E' }}>
                  {lang.icon}
                </div>
                <div className="language-info">
                  <span className="language-name">{lang.name}</span>
                  <span className="language-desc">{lang.desc}</span>
                </div>
                {/* Radio indicator */}
                <div className="radio-circle"></div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Bottom Actions */}
      <div className="bottom-actions">
        <button className="btn-primary" onClick={() => navigate('/login')}>
          Continue <ArrowRight size={20} />
        </button>
        <div className="footer-info">
          <Info size={14} fill="#5E6A6E" color="white" />
          <span>You can change this anytime in Settings</span>
        </div>
      </div>
    </div>
  );
}
