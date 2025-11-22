import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import assetService from '../services/assetService';
import AssetCard from './AssetCard';
import PortfolioChart from './charts/PortfolioChart';

const AssetDashboard = () => {
  const [assets, setAssets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadAssets();
    loadSummary();
  }, []);

  const loadAssets = async () => {
    try {
      const response = await assetService.getAssets();
      setAssets(response.data);
    } catch (error) {
      console.error('Error loading assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const response = await assetService.getPortfolioSummary();
      setSummary(response.data);
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  };

  const filteredAssets = filter === 'all' 
    ? assets 
    : assets.filter(asset => asset.type === filter);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Asset Portfolio</h1>
          <p className="text-gray-600">Manage and track your assets</p>
        </div>
        <Link
          to="/assets/add"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Add New Asset
        </Link>
      </div>

      {/* Portfolio Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Assets</h3>
            <p className="text-3xl font-bold text-gray-900">{summary.summary.totalAssets}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Value</h3>
            <p className="text-3xl font-bold text-green-600">
              ${summary.summary.totalCurrentValue?.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Profit/Loss</h3>
            <p className={`text-3xl font-bold ${
              summary.summary.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ${summary.summary.totalProfitLoss?.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Return %</h3>
            <p className={`text-3xl font-bold ${
              summary.summary.totalProfitLossPercentage >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {summary.summary.totalProfitLossPercentage?.toFixed(2)}%
            </p>
          </div>
        </div>
      )}

      {/* Portfolio Chart */}
      {summary && <PortfolioChart data={summary} />}

      {/* Filters */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium ${
            filter === 'all' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All Assets
        </button>
        <button
          onClick={() => setFilter('physical')}
          className={`px-4 py-2 rounded-lg font-medium ${
            filter === 'physical' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Physical
        </button>
        <button
          onClick={() => setFilter('financial')}
          className={`px-4 py-2 rounded-lg font-medium ${
            filter === 'financial' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Financial
        </button>
        <button
          onClick={() => setFilter('digital')}
          className={`px-4 py-2 rounded-lg font-medium ${
            filter === 'digital' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Digital
        </button>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssets.map(asset => (
          <AssetCard 
            key={asset._id} 
            asset={asset} 
            onUpdate={loadAssets}
          />
        ))}
      </div>

      {filteredAssets.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No assets found</h3>
          <p className="text-gray-500 mb-6">
            {filter === 'all' 
              ? "You haven't added any assets yet." 
              : `No ${filter} assets found.`}
          </p>
          <Link
            to="/assets/add"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Add Your First Asset
          </Link>
        </div>
      )}
    </div>
  );
};

export default AssetDashboard;