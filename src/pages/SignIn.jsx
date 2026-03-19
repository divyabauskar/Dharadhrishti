import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Smartphone, ArrowRight, BarChart2 } from 'lucide-react';

export default function SignIn() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showGoogleAccounts, setShowGoogleAccounts] = useState(false);

  React.useEffect(() => {
    if (localStorage.getItem('currentUser')) {
      setShowGoogleAccounts(true);
    }
  }, []);

  const mockGoogleAccounts = [
    { email: 'john.farmer@gmail.com', name: 'John Farmer' },
    { email: 'farm.operations@agri.com', name: 'Agri Ops' }
  ];

  const getStoredAccounts = () => {
    const keys = Object.keys(localStorage);
    const users = keys
      .filter(k => k.startsWith('user_'))
      .map(k => {
        try {
          return JSON.parse(localStorage.getItem(k));
        } catch { return null; }
      })
      .filter(Boolean);
    
    // Append mock Google accounts if not already in local storage
    mockGoogleAccounts.forEach(mockAcc => {
      if (!users.find(u => u.email === mockAcc.email)) {
        users.push(mockAcc);
      }
    });
    return users;
  };

  const handleSendOTP = () => {
    // Basic validation: Check if it's a valid looking US or International number length roughly
    const cleanNum = phoneNumber.replace(/\D/g, '');
    if (cleanNum.length < 10) {
      setError('Please enter a valid phone number with at least 10 digits.');
      return;
    }
    setError('');
    setOtpSent(true);
    // In a real app we'd call an API here.
  };

  const handleGoogleSignInClick = () => {
    setShowGoogleAccounts(true);
  };

  const selectGoogleAccount = (account) => {
    setShowGoogleAccounts(false);
    
    // Save currentUser session
    localStorage.setItem('currentUser', JSON.stringify({ name: account.name, email: account.email }));
    
    // Check if farm profile exists
    if (localStorage.getItem(`farm_${account.email}`)) {
      navigate('/dashboard');
    } else {
      navigate('/request-access');
    }
  };

  return (
    <div className="app-container signin-container" style={{ position: 'relative' }}>
      {/* Back to Language Selection */}
      <button 
        onClick={() => navigate('/')}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'white',
          border: '1px solid #e2e8f0',
          color: '#475569',
          padding: '8px 16px',
          borderRadius: '9999px',
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '0.875rem',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          zIndex: 10
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.color = '#0f766e';
          e.currentTarget.style.borderColor = '#0f766e';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.color = '#475569';
          e.currentTarget.style.borderColor = '#e2e8f0';
        }}
      >
        ← {t('back') || 'Back'}
      </button>

      {/* Brand Header */}
      <div className="signin-header" style={{ marginTop: '20px' }}>
        <div className="brand-logo-large">AQ</div>
        <h1 className="brand-title">Dharadhristi</h1>
        <p className="brand-subtitle">{t('precisionAgronomy')}</p>
      </div>

      {/* Main Card */}
      <div className="signin-card">
        <h2 className="card-title">{t('welcomeBack')}</h2>
        <p className="card-subtitle">{t('signInToManage')}</p>

        <div className="form-group">
          <label className="form-label">{t('phoneNumberStr')}</label>
          <div className={`input-with-icon ${error ? 'input-error' : ''}`}>
            <Smartphone size={20} className="input-icon" color="#5E6A6E" />
            <input 
              type="tel" 
              placeholder="+1 (555) 000-0000"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                setError('');
              }}
              className="form-input text-gray-800"
            />
          </div>
          {error && <p className="error-text">{error}</p>}
        </div>

        {otpSent ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px', textAlign: 'center' }}>
            <div className="success-banner">
              {t('otpSentSuccess')} {phoneNumber}
            </div>
            <button 
              className="btn-primary w-full" 
              onClick={() => {
                const phoneEmail = `${phoneNumber.replace(/\D/g, '')}@phone.com`;
                const newAcc = { name: "Mobile User", email: phoneEmail };
                localStorage.setItem(`user_${phoneEmail}`, JSON.stringify(newAcc));
                selectGoogleAccount(newAcc);
              }}
            >
              {t('verifyAndLogin')}
            </button>
          </div>
        ) : (
          <button className="btn-primary w-full mt-4" onClick={handleSendOTP}>
            {t('sendLoginOtp')} <ArrowRight size={20} />
          </button>
        )}

        <div className="divider">
          <span>{t('orContinueWith')}</span>
        </div>

        <button className="btn-secondary w-full" onClick={handleGoogleSignInClick}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google Logo" className="google-icon" />
          {t('signInGoogle')}
        </button>

        {/* System Status Banner */}
        <div className="system-status">
          <div className="status-icon-wrapper">
            <BarChart2 size={16} color="white" />
          </div>
          <p className="status-text">
            <strong>{t('systemStatus')}:</strong> All 42 irrigation nodes in <u>California Central Valley</u> are currently synchronized and online.
          </p>
        </div>
      </div>

      {/* Footer Links */}
      <div className="signin-footer">
        <p>{t('dontHaveAccount')} <span className="text-link" onClick={() => navigate('/request-access')}>{t('requestAccess')}</span></p>
        <div className="footer-links-row">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Contact Support</a>
        </div>
      </div>

      {/* Google Account Selector Overlay Modal */}
      {showGoogleAccounts && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">{t('chooseAccount')}</h3>
            <p className="modal-subtitle">{t('continueToDhara')}</p>
            <div className="account-list">
              {getStoredAccounts().map((acc, idx) => (
                <div key={idx} className="account-item" onClick={() => selectGoogleAccount(acc)}>
                  <div className="account-avatar">{acc.name ? acc.name.charAt(0).toUpperCase() : '?'}</div>
                  <div className="account-details">
                    <p className="account-name">{acc.name}</p>
                    <p className="account-email">{acc.email}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-text-only mt-4" onClick={() => setShowGoogleAccounts(false)}>{t('cancel')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
