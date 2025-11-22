// src/components/GlobalHeader.jsx
import React, { useState } from 'react';
import { useGlobalSignOut } from '../hooks/useGlobalSignOut';

const GlobalHeader = () => {
  const { handleGlobalSignOut } = useGlobalSignOut();
  const [showSignoutModal, setShowSignoutModal] = useState(false);

  return (
    <header className="global-header">
      {/* Your header content */}
      <button 
        className="btn-signout"
        onClick={() => setShowSignoutModal(true)}
        title="Sign out from your account"
      >
        🚪 Sign Out
      </button>

      {/* Signout Modal (same as in Settings) */}
      {showSignoutModal && (
        <div className="modal-overlay" onClick={() => setShowSignoutModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🚪 Sign Out</h3>
              <button 
                className="modal-close"
                onClick={() => setShowSignoutModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="signout-warning">
                <div className="warning-icon">⚠️</div>
                <div className="warning-content">
                  <h4>Are you sure you want to sign out?</h4>
                  <p>You will need to sign in again to access your account.</p>
                  <ul>
                    <li>All unsaved changes will be lost</li>
                    <li>You'll be redirected to the login page</li>
                    <li>Your session data will be cleared</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setShowSignoutModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-danger" 
                onClick={handleGlobalSignOut}
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default GlobalHeader;