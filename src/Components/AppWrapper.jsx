// Frontend/src/components/AppWrapper.jsx - WhatsApp-style PIN verification
import React, { useState, useEffect } from 'react';
import TwoFactorPinVerification from './TwoFactorPinVerification';

const getEnvVariable = (key, defaultValue = '') => {
  if (typeof import.meta.env !== 'undefined' && import.meta.env[key] !== undefined) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
    return process.env[key];
  }
  return defaultValue;
};

const AppWrapper = ({ children }) => {
  const [show2FAPopup, setShow2FAPopup] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [verificationChecked, setVerificationChecked] = useState(false);
  const [verificationData, setVerificationData] = useState(null);

  const API_URL = getEnvVariable('VITE_API_URL', 'http://localhost:5000');

  // WhatsApp-style: Check if 30 days have passed since last verification
  const checkVerificationRequired = (lastVerified) => {
    if (!lastVerified) {
      console.log('🔍 No previous verification found - requiring verification');
      return true;
    }
    
    const daysSinceVerification = Math.floor(
      (new Date() - new Date(lastVerified)) / (1000 * 60 * 60 * 24)
    );
    
    console.log(`🛡️ Days since last verification: ${daysSinceVerification}`);
    
    // Show popup ONLY if 30+ days have passed (WhatsApp-style)
    const requiresVerification = daysSinceVerification >= 30;
    
    if (requiresVerification) {
      console.log('⚠️ 30 days passed - showing verification popup');
    } else {
      console.log(`✅ Verified recently - ${30 - daysSinceVerification} days remaining`);
    }
    
    return requiresVerification;
  };

  const checkTwoFactorStatus = async () => {
    try {
      const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId') || localStorage.getItem('userId');

      if (!token) {
        setIsVerifying(false);
        setVerificationChecked(true);
        return;
      }

      const response = await fetch(`${API_URL}/api/two-factor/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Tenant-ID': tenantId,
          'X-Tenant-ID': tenantId
        }
      });

      if (!response.ok) {
        throw new Error('Failed to check 2FA status');
      }

      const data = await response.json();

      if (data.success && data.isEnabled) {
        setIs2FAEnabled(true);
        setVerificationData(data);
        
        // Check if verification is required (WhatsApp-style every 30 days)
        const requiresVerification = checkVerificationRequired(data.lastVerified);
        
        if (requiresVerification) {
          setShow2FAPopup(true);
        } else {
          setShow2FAPopup(false);
        }
      } else {
        setIs2FAEnabled(false);
        setShow2FAPopup(false);
      }

      setIsVerifying(false);
      setVerificationChecked(true);
    } catch (error) {
      console.error('Failed to check 2FA status:', error);
      setIsVerifying(false);
      setVerificationChecked(true);
      setShow2FAPopup(false);
    }
  };

  useEffect(() => {
    checkTwoFactorStatus();
    
    // Check every 5 minutes if verification is needed
    const interval = setInterval(() => {
      if (is2FAEnabled) {
        checkTwoFactorStatus();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [is2FAEnabled]);

  const handleVerified = () => {
    setShow2FAPopup(false);
    console.log('✅ PIN verification successful - 30-day timer reset');
    
    // Show success message
    setTimeout(() => {
      alert('✅ Security verification completed! You are now verified for the next 30 days.');
    }, 100);
  };

  // Show loading screen while verifying
  if (isVerifying) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-primary, #ffffff)'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #e0e0e0',
          borderTopColor: '#25D366',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}></div>
        <p style={{
          marginTop: '20px',
          color: 'var(--text-primary, #333)',
          fontSize: '16px'
        }}>
          Checking security status...
        </p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // If 2FA popup should be shown, block the app (WhatsApp-style)
  if (show2FAPopup && verificationChecked) {
    return (
      <TwoFactorPinVerification 
        onVerified={handleVerified}
        isPeriodicVerification={true}
        verificationData={verificationData}
      />
    );
  }

  // Otherwise, render the normal app
  return <>{children}</>;
};

export default AppWrapper;