import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, ArrowRight, BarChart2 } from 'lucide-react';

export default function SignIn() {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showGoogleAccounts, setShowGoogleAccounts] = useState(false);

  const mockGoogleAccounts = [
    { email: 'john.farmer@gmail.com', name: 'John Farmer' },
    { email: 'farm.operations@agri.com', name: 'Agri Ops' }
  ];

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
    // Proceed to dashboard normally, mocking login
    setShowGoogleAccounts(false);
    alert(`Signed in successfully as ${account.email}`);
    // navigate('/dashboard'); // uncomment when dashboard exists
  };

  return (
    <div className="app-container signin-container">
      {/* Brand Header */}
      <div className="signin-header">
        <div className="brand-logo-large">
          AQ
        </div>
        <h1 className="brand-title">Dharadhristi</h1>
        <p className="brand-subtitle">Precision Agronomy & Intelligence</p>
      </div>

      {/* Main Card */}
      <div className="signin-card">
        <h2 className="card-title">Welcome back</h2>
        <p className="card-subtitle">Sign in to manage your precision systems</p>

        <div className="form-group">
          <label className="form-label">PHONE NUMBER</label>
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
          <div className="success-banner">
            OTP sent successfully to {phoneNumber}
          </div>
        ) : (
          <button className="btn-primary w-full mt-4" onClick={handleSendOTP}>
            Send Login OTP <ArrowRight size={20} />
          </button>
        )}

        <div className="divider">
          <span>OR CONTINUE WITH</span>
        </div>

        <button className="btn-secondary w-full" onClick={handleGoogleSignInClick}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google Logo" className="google-icon" />
          Sign in with Google
        </button>

        {/* System Status Banner */}
        <div className="system-status">
          <div className="status-icon-wrapper">
            <BarChart2 size={16} color="white" />
          </div>
          <p className="status-text">
            <strong>System Status:</strong> All 42 irrigation nodes in <u>California Central Valley</u> are currently synchronized and online.
          </p>
        </div>
      </div>

      {/* Footer Links */}
      <div className="signin-footer">
        <p>Don't have an account? <span className="text-link" onClick={() => navigate('/request-access')}>Request access</span></p>
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
            <h3 className="modal-title">Choose an account</h3>
            <p className="modal-subtitle">to continue to Dharadhristi</p>
            <div className="account-list">
              {mockGoogleAccounts.map((acc, idx) => (
                <div key={idx} className="account-item" onClick={() => selectGoogleAccount(acc)}>
                  <div className="account-avatar">{acc.name.charAt(0)}</div>
                  <div className="account-details">
                    <p className="account-name">{acc.name}</p>
                    <p className="account-email">{acc.email}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-text-only mt-4" onClick={() => setShowGoogleAccounts(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
