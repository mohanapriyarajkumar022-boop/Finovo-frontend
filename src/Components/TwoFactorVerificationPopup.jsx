// Frontend/src/components/TwoFactorVerificationPopup.jsx
import React, { useState } from 'react';
import './TwoFactorVerificationPopup.css';

const TwoFactorVerificationPopup = ({ onVerified, isPeriodicVerification = false }) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('verify');
  const [backupCode, setBackupCode] = useState('');

  const getEnvVariable = (key, defaultValue = '') => {
    if (typeof import.meta.env !== 'undefined' && import.meta.env[key] !== undefined) {
      return import.meta.env[key];
    }
    if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
      return process.env[key];
    }
    return defaultValue;
  };

  const API_URL = getEnvVariable('VITE_API_URL', 'http://localhost:5000');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
    const tenantId = localStorage.getItem('tenantId') || localStorage.getItem('userId');
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Tenant-ID': tenantId,
      'X-Tenant-ID': tenantId
    };
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/two-factor/verify-login`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          code: verificationCode
        })
      });

      const data = await response.json();

      if (data.success && data.verified) {
        // Call success callback - backend handles timestamp update
        if (onVerified) onVerified();
        
        setError('');
        
        if (isPeriodicVerification) {
          console.log('✅ Periodic verification successful');
        } else {
          alert('✅ Verification successful! You can now use the app.');
        }
      } else {
        setError(data.message || 'Invalid verification code. Please try again.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Failed to verify code. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackupCode = async () => {
    if (!backupCode || backupCode.length < 8) {
      setError('Please enter a valid backup code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/two-factor/verify-backup`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ backupCode })
      });

      const data = await response.json();

      if (data.success) {
        // Call success callback - backend handles timestamp update
        if (onVerified) onVerified();
        
        if (isPeriodicVerification) {
          console.log('✅ Periodic backup verification successful');
        } else {
          alert('✅ Backup code verified! You can now use the app.');
        }
      } else {
        setError(data.message || 'Invalid backup code. Please try again.');
      }
    } catch (error) {
      console.error('Backup verification error:', error);
      setError('Failed to verify backup code. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (step === 'verify') {
        handleVerify();
      } else {
        handleBackupCode();
      }
    }
  };

  return (
    <div className="two-factor-overlay">
      <div className="two-factor-popup compact">
        <div className="two-factor-header">
          <div className="lock-icon">🔒</div>
          <h2>
            {isPeriodicVerification 
              ? 'Security Check Required' 
              : 'Security Verification Required'
            }
          </h2>
          <p className="subtitle">
            {isPeriodicVerification 
              ? 'For your security, we verify your identity every 15 days (WhatsApp-style)'
              : step === 'verify' 
                ? 'Please verify your identity to continue using the app'
                : 'Enter your backup code to verify'
            }
          </p>
        </div>

        <div className="two-factor-body">
          {step === 'verify' ? (
            <>
              <div className="verification-info">
                <div className="info-icon">🛡️</div>
                <p>
                  {isPeriodicVerification
                    ? 'Like WhatsApp, we verify your identity every 15 days for enhanced security.'
                    : 'For your security, we need to verify your identity.'
                  }
                </p>
                <p className="info-detail">
                  {isPeriodicVerification
                    ? 'Open your authenticator app and enter the 6-digit code to continue.'
                    : 'Open your authenticator app and enter the 6-digit code.'
                  }
                </p>
                {isPeriodicVerification && (
                  <div className="whatsapp-style-notice">
                    <span className="notice-icon">💡</span>
                    <span>This 15-day verification keeps your account secure, just like WhatsApp</span>
                  </div>
                )}
              </div>

              <div className="verification-input-group">
                <label>Enter 6-Digit Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength="6"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  onKeyPress={handleKeyPress}
                  placeholder="000000"
                  className="code-input"
                  disabled={loading}
                  autoFocus
                />
              </div>

              {error && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  {error}
                </div>
              )}

              <button
                className="verify-button"
                onClick={handleVerify}
                disabled={loading || verificationCode.length !== 6}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Verifying...
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    {isPeriodicVerification ? 'Verify & Continue' : 'Verify & Continue'}
                  </>
                )}
              </button>

              <div className="backup-option">
                <button
                  className="backup-link"
                  onClick={() => setStep('backup')}
                  disabled={loading}
                >
                  Lost access to authenticator? Use backup code
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="verification-info">
                <div className="info-icon">🔑</div>
                <p>Enter one of your backup codes to verify your identity.</p>
                <p className="info-detail">Each backup code can only be used once.</p>
              </div>

              <div className="verification-input-group">
                <label>Enter Backup Code</label>
                <input
                  type="text"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter 8-digit backup code"
                  className="code-input"
                  disabled={loading}
                  autoFocus
                />
              </div>

              {error && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  {error}
                </div>
              )}

              <button
                className="verify-button"
                onClick={handleBackupCode}
                disabled={loading || !backupCode}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Verifying...
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    Verify Backup Code
                  </>
                )}
              </button>

              <div className="backup-option">
                <button
                  className="backup-link"
                  onClick={() => {
                    setStep('verify');
                    setBackupCode('');
                    setError('');
                  }}
                  disabled={loading}
                >
                  ← Back to authenticator code
                </button>
              </div>
            </>
          )}
        </div>

        <div className="two-factor-footer">
          <div className="security-note">
            <span className="shield-icon">🛡️</span>
            <span>
              {isPeriodicVerification
                ? '15-day verification keeps your account secure (WhatsApp-style)'
                : 'This verification helps keep your account secure'
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorVerificationPopup;