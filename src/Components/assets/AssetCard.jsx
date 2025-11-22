import React from 'react';
import { Link } from 'react-router-dom';
import assetService from '../services/assetService';

const AssetCard = ({ asset, onUpdate }) => {
  const profitLoss = asset.currentValue - asset.purchasePrice;
  const profitLossPercentage = (profitLoss / asset.purchasePrice) * 100;

  const getAssetIcon = (category) => {
    const icons = {
      land: '🏞️',
      property: '🏠',
      gold: '🥇',
      vehicle: '🚗',
      stocks: '📈',
      crypto: '₿',
      digital_assets: '💾',
      other: '📦'
    };
    return icons[category] || '📊';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getAssetIcon(asset.category)}</span>
          <div>
            <h3 className="font-semibold text-gray-900">{asset.name}</h3>
            <p className="text-sm text-gray-500">
              {assetService.getCategoryDisplayName(asset.category)}
            </p>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          asset.type === 'physical' ? 'bg-blue-100 text-blue-800' :
          asset.type === 'financial' ? 'bg-green-100 text-green-800' :
          'bg-purple-100 text-purple-800'
        }`}>
          {asset.type}
        </span>
      </div>

      {/* Value Information */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Purchase Value:</span>
          <span className="text-sm font-medium">{formatCurrency(asset.purchasePrice)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Current Value:</span>
          <span className="text-sm font-semibold">{formatCurrency(asset.currentValue)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Profit/Loss:</span>
          <span className={`text-sm font-semibold ${
            profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(profitLoss)} ({profitLossPercentage.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Additional Info */}
      {asset.quantity > 1 && (
        <div className="text-sm text-gray-600 mb-3">
          Quantity: {asset.quantity}
        </div>
      )}

      {asset.location && (
        <div className="text-sm text-gray-600 mb-3">
          📍 {asset.location}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <Link
          to={`/assets/${asset._id}`}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          View Details
        </Link>
        <Link
          to={`/assets/${asset._id}/forecast`}
          className="text-green-600 hover:text-green-700 text-sm font-medium"
        >
          Forecast
        </Link>
      </div>
    </div>
  );
};

export default AssetCard;