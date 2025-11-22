// frontend/src/Components/TaxDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChartBarIcon, 
  CalculatorIcon, 
  DocumentChartBarIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CurrencyRupeeIcon,
  LightBulbIcon,
  ArrowPathIcon,
  TableCellsIcon,
  ChartPieIcon,
  SparklesIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import taxService from '../services/taxService.js';

const TaxDashboard = ({ userSession }) => {
  const [currentTax, setCurrentTax] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [taxRates, setTaxRates] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailedView, setShowDetailedView] = useState(false);

  // Fallback tax data function
  const getFallbackTaxData = () => {
    return {
      totalIncome: 0,
      totalDeductions: 0,
      taxableIncome: 0,
      taxLiability: 0,
      incomeBreakdown: {},
      deductionBreakdown: { standard: 75000 },
      taxBreakdown: [],
      hasIncomeData: false,
      isManualCalculation: false,
      taxOptimizationScore: 0,
      aiTaxRecommendations: [],
      year: new Date().getFullYear(),
      status: 'no_income_data'
    };
  };

  const getDefaultTaxRates = () => {
    const currentYear = new Date().getFullYear();
    return {
      financialYear: `${currentYear}-${currentYear + 1}`,
      lastUpdated: new Date().toISOString(),
      source: 'Default Rates',
      brackets: [
        { range: "Up to ₹3,00,000", rate: 0, description: "No tax", min: 0, max: 300000, slab: "0-3L" },
        { range: "₹3,00,001 - ₹6,00,000", rate: 5, description: "Tax on amount exceeding ₹3L", min: 300001, max: 600000, slab: "3L-6L" },
        { range: "₹6,00,001 - ₹9,00,000", rate: 10, description: "Tax on amount exceeding ₹6L", min: 600001, max: 900000, slab: "6L-9L" },
        { range: "₹9,00,001 - ₹12,00,000", rate: 15, description: "Tax on amount exceeding ₹9L", min: 900001, max: 1200000, slab: "9L-12L" },
        { range: "₹12,00,001 - ₹15,00,000", rate: 20, description: "Tax on amount exceeding ₹12L", min: 1200001, max: 1500000, slab: "12L-15L" },
        { range: "Above ₹15,00,000", rate: 30, description: "Tax on amount exceeding ₹15L", min: 1500001, max: null, slab: "15L+" }
      ],
      deductions: {
        standard: 75000,
        section80C: 150000,
        section80D: 25000,
        hra: 0,
        medical: 25000,
        nps: 50000
      },
      cess: 0.04
    };
  };

  // Memoized data loading function
  const loadData = useCallback(async (isRefresh = false) => {
    try {
      setError(null);
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      console.log('🔄 Loading tax data...');
      
      const tenantId = userSession?.user?.tenantId || localStorage.getItem('tenantId');
      if (!tenantId) {
        throw new Error('Tenant ID not found. Please log in again.');
      }

      // Load data with better error handling
      const [currentResponse, ratesResponse, aiResponse, reportsResponse] = await Promise.allSettled([
        taxService.getCurrentTaxCalculation().catch(err => {
          console.warn('Current tax calculation failed, using fallback');
          return { data: { data: getFallbackTaxData() } };
        }),
        taxService.getTaxRates().catch(err => {
          console.warn('Tax rates failed, using default');
          return { data: { data: getDefaultTaxRates() } };
        }),
        taxService.getAIRecommendations().catch(err => {
          console.warn('AI recommendations failed, using empty array');
          return { data: { data: { recommendations: [], optimizationScore: 0 } } };
        }),
        taxService.getTaxReports().catch(err => {
          console.warn('Tax reports failed, using empty array');
          return { data: { data: [] } };
        })
      ]);

      // Process responses
      const results = {
        currentTax: currentResponse.status === 'fulfilled' ? currentResponse.value.data.data : getFallbackTaxData(),
        taxRates: ratesResponse.status === 'fulfilled' ? ratesResponse.value.data.data : getDefaultTaxRates(),
        aiRecommendations: aiResponse.status === 'fulfilled' ? aiResponse.value.data.data?.recommendations || [] : [],
        reports: reportsResponse.status === 'fulfilled' ? reportsResponse.value.data.data || [] : []
      };

      setCurrentTax(results.currentTax);
      setTaxRates(results.taxRates);
      setAiRecommendations(results.aiRecommendations);
      setReports(results.reports);

      console.log('✅ Tax data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading tax data:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load tax data';
      setError(errorMessage);
      
      // Set fallback data
      setCurrentTax(getFallbackTaxData());
      setTaxRates(getDefaultTaxRates());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userSession]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    await loadData(true);
  };

  const handleResetToIncomeTax = async () => {
    try {
      setLoading(true);
      const response = await taxService.resetToIncomeTax();
      setCurrentTax(response.data.data);
      
      // Refresh AI recommendations
      try {
        const aiResponse = await taxService.getAIRecommendations();
        setAiRecommendations(aiResponse.data.data?.recommendations || []);
      } catch (aiError) {
        console.warn('Failed to refresh AI recommendations:', aiError);
      }
    } catch (error) {
      console.error('❌ Error resetting tax calculation:', error);
      setError(error.response?.data?.message || 'Failed to reset tax calculation');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced AI Tax Rate Visualization Component
  const AITaxRateVisualization = () => {
    if (!taxRates) return null;

    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl border border-blue-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <SparklesIcon className="h-6 w-6 mr-2 text-blue-500" />
              AI Tax Intelligence
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Real-time tax rates for {taxRates.financialYear} • Updated {new Date(taxRates.lastUpdated).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowDetailedView(!showDetailedView)}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              {showDetailedView ? <EyeSlashIcon className="h-4 w-4 mr-1" /> : <EyeIcon className="h-4 w-4 mr-1" />}
              {showDetailedView ? 'Simple View' : 'Detailed View'}
            </button>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
              {taxRates.source}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tax Slabs Visualization */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700">Tax Slabs Breakdown</h4>
            <div className="space-y-3">
              {taxRates.brackets.map((bracket, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-gray-800 text-sm">{bracket.range}</span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">
                        {bracket.rate}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-500"
                        style={{ 
                          width: `${Math.min(100, (bracket.rate / 30) * 100)}%` 
                        }}
                      ></div>
                    </div>
                    {showDetailedView && (
                      <p className="text-xs text-gray-500 mt-1">{bracket.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Deductions & Cess */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700">Deductions & Benefits</h4>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(taxRates.deductions).map(([key, value]) => (
                <div key={key} className="bg-white p-3 rounded-lg border border-green-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-medium text-green-800 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <InformationCircleIcon className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-lg font-bold text-green-600">
                    ₹{value?.toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-yellow-800">Health & Education Cess</span>
                <span className="text-lg font-bold text-yellow-700">
                  {(taxRates.cess * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Comprehensive Tax Graph Component
  const ComprehensiveTaxGraph = ({ taxData }) => {
    if (!taxData) return null;

    const totalTax = taxData.taxLiability || 0;
    const totalIncome = taxData.totalIncome || 0;
    const taxableIncome = taxData.taxableIncome || 0;
    const totalDeductions = taxData.totalDeductions || 0;

    return (
      <div className="space-y-6">
        {/* Income Distribution Graph */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
            <h4 className="font-semibold text-gray-700 mb-4">Income Distribution</h4>
            <div className="space-y-4">
              {[
                { label: 'Total Income', value: totalIncome, color: 'bg-green-500', width: 100 },
                { label: 'Taxable Income', value: taxableIncome, color: 'bg-blue-500', width: totalIncome > 0 ? (taxableIncome / totalIncome) * 100 : 0 },
                { label: 'Tax Liability', value: totalTax, color: 'bg-red-500', width: totalIncome > 0 ? (totalTax / totalIncome) * 100 : 0 },
                { label: 'Deductions', value: totalDeductions, color: 'bg-purple-500', width: totalIncome > 0 ? (totalDeductions / totalIncome) * 100 : 0 }
              ].map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="font-medium">₹{item.value.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${item.color} transition-all duration-700`}
                      style={{ width: `${item.width}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tax Efficiency Graph */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
            <h4 className="font-semibold text-gray-700 mb-4">Tax Efficiency</h4>
            <div className="space-y-4">
              {[
                { 
                  label: 'Effective Tax Rate', 
                  value: totalIncome > 0 ? (totalTax / totalIncome) * 100 : 0, 
                  color: 'bg-orange-500',
                  display: `${totalIncome > 0 ? ((totalTax / totalIncome) * 100).toFixed(1) : '0'}%`
                },
                { 
                  label: 'Deduction Utilization', 
                  value: Math.min(100, (totalDeductions / 250000) * 100), 
                  color: 'bg-teal-500',
                  display: `${((totalDeductions / 250000) * 100).toFixed(1)}%`
                },
                { 
                  label: 'Tax Optimization Score', 
                  value: taxData.taxOptimizationScore || 0, 
                  color: 'bg-indigo-500',
                  display: `${taxData.taxOptimizationScore?.toFixed(0) || '0'}/100`
                }
              ].map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="font-medium">{item.display}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${item.color} transition-all duration-700`}
                      style={{ width: `${item.value}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tax Breakdown Graph */}
        {taxData.taxBreakdown && taxData.taxBreakdown.length > 0 && (
          <div className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
            <h4 className="font-semibold text-gray-700 mb-4">Tax Breakdown by Slabs</h4>
            <div className="space-y-3">
              {taxData.taxBreakdown.map((item, index) => {
                const percentage = totalTax > 0 ? (item.tax / totalTax) * 100 : 0;
                const color = item.slab === 'cess' ? 'bg-red-500' :
                             item.slab === 'surcharge' ? 'bg-orange-500' :
                             index === taxData.taxBreakdown.length - 1 ? 'bg-yellow-500' : 'bg-blue-500';
                
                return (
                  <div key={index} className="flex items-center space-x-3 hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <div className={`w-3 h-3 rounded-full ${color}`}></div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{item.range}</span>
                        <span className="text-gray-600">{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${color} transition-all duration-700`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>₹{item.tax?.toLocaleString('en-IN')}</span>
                        <span>{item.rate}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Enhanced Income Sources Graph
  const IncomeSourcesGraph = ({ taxData }) => {
    if (!taxData || !taxData.incomeBreakdown) return null;

    const incomeEntries = Object.entries(taxData.incomeBreakdown);
    const totalIncome = taxData.totalIncome || 1;

    return (
      <div className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
        <h4 className="font-semibold text-gray-700 mb-4">Income Sources</h4>
        <div className="space-y-3">
          {incomeEntries.map(([source, amount], index) => {
            const percentage = (amount / totalIncome) * 100;
            const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-red-500'];
            const color = colors[index % colors.length];
            
            return (
              <div key={source} className="flex items-center space-x-3 hover:bg-gray-50 p-2 rounded-lg transition-colors">
                <div className={`w-3 h-3 rounded-full ${color}`}></div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 capitalize">
                      {source.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-gray-600">{percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${color} transition-all duration-700`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>₹{amount?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Enhanced AI Recommendations Component
  const AIRecommendations = () => {
    if (!aiRecommendations.length) {
      return (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-100 rounded-2xl border border-purple-200 p-6">
          <div className="text-center py-8">
            <LightBulbIcon className="h-12 w-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">AI Tax Insights</h3>
            <p className="text-gray-600 text-sm">
              {currentTax && currentTax.totalIncome > 0 ? 'Analyzing your tax data for optimization opportunities...' : 'Enter your income data to get AI-powered tax recommendations'}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-100 rounded-2xl border border-purple-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <LightBulbIcon className="h-6 w-6 mr-2 text-purple-500" />
            AI Tax Optimization
          </h3>
          {currentTax?.taxOptimizationScore && (
            <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
              Score: {currentTax.taxOptimizationScore.toFixed(0)}/100
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {aiRecommendations.map((rec, index) => (
            <div key={index} className="bg-white rounded-xl border border-purple-100 p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="flex items-start justify-between mb-3">
                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                  rec.type === 'investment' ? 'bg-green-100 text-green-800' :
                  rec.type === 'deduction' ? 'bg-blue-100 text-blue-800' :
                  rec.type === 'optimization' ? 'bg-purple-100 text-purple-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {rec.type}
                </span>
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${
                    rec.confidence > 0.8 ? 'bg-green-500' :
                    rec.confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-xs text-gray-500">{(rec.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-800 mb-3 line-clamp-3">{rec.description}</p>
              
              <div className="flex justify-between items-center">
                {rec.potentialSavings > 0 && (
                  <span className="text-sm font-semibold text-green-600">
                    Save: ₹{rec.potentialSavings?.toLocaleString('en-IN')}
                  </span>
                )}
                {rec.amount > 0 && (
                  <span className="text-sm text-gray-600">
                    Invest: ₹{rec.amount?.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Loading State
  if (loading && !refreshing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading AI-powered tax data...</p>
        </div>
      </div>
    );
  }

  // Color mapping for dynamic classes
  const getColorClasses = (color) => {
    const colorMap = {
      blue: { bg: 'bg-blue-500', from: 'from-blue-50', to: 'to-blue-100', border: 'border-blue-200', text: 'text-blue-500' },
      green: { bg: 'bg-green-500', from: 'from-green-50', to: 'to-green-100', border: 'border-green-200', text: 'text-green-500' },
      purple: { bg: 'bg-purple-500', from: 'from-purple-50', to: 'to-purple-100', border: 'border-purple-200', text: 'text-purple-500' },
      red: { bg: 'bg-red-500', from: 'from-red-50', to: 'to-red-100', border: 'border-red-200', text: 'text-red-500' },
      orange: { bg: 'bg-orange-500', from: 'from-orange-50', to: 'to-orange-100', border: 'border-orange-200', text: 'text-orange-500' }
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <SparklesIcon className="h-8 w-8 mr-3 text-blue-500" />
                AI Tax Intelligence
              </h1>
              <p className="text-gray-600 mt-2">
                Smart tax calculations with real-time AI insights and optimization
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-6">
          {/* AI Tax Rate Visualization */}
          <AITaxRateVisualization />

          {/* Tabs Navigation */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px overflow-x-auto">
                {[
                  { id: 'overview', name: 'Tax Overview', icon: DocumentChartBarIcon },
                  { id: 'graph', name: 'Visual Analysis', icon: ChartBarIcon },
                  { id: 'sources', name: 'Income Sources', icon: TableCellsIcon }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 min-w-[120px] flex items-center justify-center py-4 px-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className="h-5 w-5 mr-2" />
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'overview' && currentTax && (
                <div className="space-y-6">
                  {/* Tax Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Income', value: currentTax.totalIncome, color: 'blue', icon: CurrencyRupeeIcon },
                      { label: 'Deductions', value: currentTax.totalDeductions, color: 'green', icon: DocumentChartBarIcon },
                      { label: 'Taxable Income', value: currentTax.taxableIncome, color: 'purple', icon: CalculatorIcon },
                      { label: 'Tax Liability', value: currentTax.taxLiability, color: 'red', icon: ChartBarIcon }
                    ].map((card, index) => {
                      const colorClass = getColorClasses(card.color);
                      return (
                        <div key={index} className={`bg-gradient-to-br ${colorClass.from} ${colorClass.to} border ${colorClass.border} rounded-xl p-4 hover:shadow-lg transition-shadow`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">{card.label}</p>
                              <p className="text-2xl font-bold text-gray-800 mt-1">
                                ₹{card.value?.toLocaleString('en-IN') || '0'}
                              </p>
                            </div>
                            <card.icon className={`h-8 w-8 ${colorClass.text}`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Comprehensive Graphs */}
                  <ComprehensiveTaxGraph taxData={currentTax} />
                </div>
              )}

              {activeTab === 'graph' && currentTax && (
                <ComprehensiveTaxGraph taxData={currentTax} />
              )}

              {activeTab === 'sources' && currentTax && (
                <div className="space-y-6">
                  <IncomeSourcesGraph taxData={currentTax} />
                  
                  {/* Deductions Breakdown */}
                  {currentTax.deductionBreakdown && (
                    <div className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
                      <h4 className="font-semibold text-gray-700 mb-4">Deductions Breakdown</h4>
                      <div className="space-y-3">
                        {Object.entries(currentTax.deductionBreakdown).map(([deduction, amount]) => (
                          <div key={deduction} className="flex justify-between items-center py-2 border-b border-gray-100 hover:bg-gray-50 px-2 rounded transition-colors">
                            <span className="capitalize text-gray-600">
                              {deduction.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <span className="font-medium text-green-600">
                              ₹{amount?.toLocaleString('en-IN') || '0'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* AI Recommendations */}
          <AIRecommendations />

          {/* Bottom Section - Tax History and Calculation Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tax History */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <DocumentChartBarIcon className="h-6 w-6 mr-2 text-orange-500" />
                Tax History
              </h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {reports.slice(0, 5).map((report, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="font-medium text-gray-800">FY {report.year}</p>
                      <p className="text-sm text-gray-600">
                        Tax: ₹{report.taxLiability?.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        report.isManualCalculation ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {report.isManualCalculation ? 'Manual' : 'Auto'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(report.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {reports.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No tax history available</p>
                )}
              </div>
            </div>

            {/* Calculation Status */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <InformationCircleIcon className="h-6 w-6 mr-2 text-blue-500" />
                Calculation Status
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'Data Source', value: currentTax?.isManualCalculation ? 'Manual Entry' : currentTax?.hasIncomeData ? 'Income Module' : 'No Data', color: currentTax?.isManualCalculation ? 'yellow' : currentTax?.hasIncomeData ? 'green' : 'gray' },
                  { label: 'Tax Year', value: currentTax?.year || new Date().getFullYear() },
                  { label: 'Last Updated', value: currentTax?.updatedAt ? new Date(currentTax.updatedAt).toLocaleDateString() : 'Never' },
                  { label: 'Tax Rates Source', value: taxRates?.source || 'default' }
                ].map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <span className={`text-sm font-medium ${
                      item.color === 'yellow' ? 'text-yellow-600' :
                      item.color === 'green' ? 'text-green-600' :
                      item.color === 'gray' ? 'text-gray-600' : 'text-gray-900'
                    }`}>
                      {item.value}
                    </span>
                  </div>
                ))}

                {currentTax?.isManualCalculation && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <InformationCircleIcon className="h-4 w-4 text-yellow-600 mr-2" />
                      <span className="text-yellow-800 text-sm">
                        Manual Calculation: ₹{currentTax.manualIncome?.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <button
                      onClick={handleResetToIncomeTax}
                      className="w-full bg-gray-600 text-white py-2 px-4 rounded text-sm font-medium hover:bg-gray-700 transition-colors"
                    >
                      Reset to Income Data
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxDashboard;