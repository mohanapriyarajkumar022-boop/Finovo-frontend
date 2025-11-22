import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import assetService from '../../services/assetService';
import ValueChart from './charts/ValueChart';

const AssetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssetDetails();
  }, [id]);

  const loadAssetDetails = async () => {
    try {
      const response = await assetService.getAsset(id);
      setAsset(response.data.asset);
      setHistory(response.data.history);
    } catch (error) {
      console.error('Error loading asset details:', error);
      alert('Failed to load asset details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        await assetService.deleteAsset(id);
        navigate('/assets');
      } catch (error) {
        console.error('Error deleting asset:', error);
        alert('Failed to delete asset');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Asset Not Found</h2>
        <Link to="/assets" className="text-blue-600 hover:text-blue-700">
          Back to Assets
        </Link>
      </div>
    );
  }

  const profitLoss = asset.currentValue - asset.purchasePrice;
  const profitLossPercentage = (profitLoss / asset.purchasePrice) * 100;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <Link to="/assets" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back to Assets
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{asset.name}</h1>
          <p className="text-gray-600">
            {assetService.getCategoryDisplayName(asset.category)} • {assetService.getTypeDisplayName(asset.type)}
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            to={`/assets/${asset._id}/forecast`}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            View Forecast
          </Link>
          <button
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Value Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Value History</h2>
            <ValueChart history={history} />
          </div>

          {/* Asset Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Asset Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Purchase Price</label>
                <p className="text-lg font-semibold">${asset.purchasePrice.toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Current Value</label>
                <p className="text-lg font-semibold">${asset.currentValue.toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Profit/Loss</label>
                <p className={`text-lg font-semibold ${
                  profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ${profitLoss.toLocaleString()} ({profitLossPercentage.toFixed(2)}%)
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Holding Period</label>
                <p className="text-lg font-semibold">
                  {Math.floor((new Date() - new Date(asset.purchaseDate)) / (1000 * 60 * 60 * 24 * 365.25))} years
                </p>
              </div>
            </div>

            {asset.description && (
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-600">Description</label>
                <p className="text-gray-800 mt-1">{asset.description}</p>
              </div>
            )}

            {asset.location && (
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-600">Location</label>
                <p className="text-gray-800 mt-1">📍 {asset.location}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Purchase Date</p>
                <p className="font-medium">{new Date(asset.purchaseDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Quantity</p>
                <p className="font-medium">{asset.quantity}</p>
              </div>
              {asset.appreciationRate > 0 && (
                <div>
                  <p className="text-sm text-gray-600">Appreciation Rate</p>
                  <p className="font-medium text-green-600">{(asset.appreciationRate * 100).toFixed(2)}%</p>
                </div>
              )}
              {asset.depreciationRate > 0 && (
                <div>
                  <p className="text-sm text-gray-600">Depreciation Rate</p>
                  <p className="font-medium text-red-600">{(asset.depreciationRate * 100).toFixed(2)}%</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent History */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Value Updates</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {history.slice(0, 10).map((record, index) => (
                <div key={record._id} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-medium">${record.value.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(record.date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    record.type === 'manual_update' ? 'bg-blue-100 text-blue-800' :
                    record.type === 'market_update' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {record.type}
                  </span>
                </div>
              ))}
              {history.length === 0 && (
                <p className="text-gray-500 text-sm">No history records yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetDetails;