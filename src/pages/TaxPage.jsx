// frontend/src/pages/TaxPage.jsx
import React from 'react';
import TaxDashboard from '../Components/TaxDashboard';
import TaxCalculator from '../Components/TaxCalculator';

const TaxPage = ({ userSession }) => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tax Center content */}
        <TaxDashboard />
        <TaxCalculator />
        {/* You can replace above with tabbed interface if needed */}
      </div>
    </div>
  );
};

export default TaxPage;
