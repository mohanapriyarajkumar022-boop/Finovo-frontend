// ProfitLossPage.jsx - Completely Redesigned
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  BarChart3, 
  Calendar,
  Target,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import '../styles/profitloss.css';

const ProfitLossPage = ({ userSession }) => {
  const [timeRange, setTimeRange] = useState('2025-2026');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [profitLossData, setProfitLossData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('overview');
  const [profitAnalysis, setProfitAnalysis] = useState(null);

  useEffect(() => {
    fetchProfitLossData();
  }, [timeRange, selectedMonth]);

  useEffect(() => {
    if (profitLossData) {
      analyzeProfits();
    }
  }, [profitLossData]);

  const fetchProfitLossData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/profit-loss', {
        headers: {
          'Authorization': `Bearer ${userSession?.token}`,
          'Tenant-ID': userSession?.tenantId
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfitLossData(data);
      }
    } catch (error) {
      console.error('Error fetching profit loss data:', error);
      const mockData = generateMockData();
      setProfitLossData(mockData);
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    return {
      revenue: {
        salesRevenue: [65209, 12356, 146343, 89299, 117500, 133993, 160997, 182392, 129189, 98500, 112000, 145000],
        otherRevenue: [0, 13000, 0, 0, 103000, 0, 61000, 13400, 0, 25000, 18000, 0],
        salesDiscounts: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        salesReturns: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      },
      costOfGoodsSold: {
        awsServer: [24403, 27003, 31669, 21050, 29734, 85409, 68275, 73502, 54446, 35315, 28750, 31200],
        directSalaries: [70000, 80756, 152204, 140132, 174013, 90140, 79274, 184792, 90658, 84312, 78900, 82500],
        internshipSalaries: [0, 0, 0, 0, 15000, 0, 19000, 0, 0, 12000, 0, 15000],
        securedFunds: [0, 0, 0, 0, 15000, 0, 19000, 15220, 0, 0, 0, 0],
        projectProfitShare: [0, 0, 0, 0, 0, 69620, 94389, 53798, 46600, 38900, 42500, 51200],
        internshipProfitShare: [0, 0, 0, 0, 61608, 0, 34242, 5725, 0, 0, 0, 0]
      },
      expenses: {
        marketingAdvertising: [3108, 5343, 0, 763, 818, 5591, 1400, 1400, 2986, 2200, 1800, 2500],
        chatOpt: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        canva: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        legalFees: [5000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        computersRepair: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        officeExpenses: [2000, 1500, 1800, 2200, 2500, 3000, 2800, 3200, 2600, 2400, 2200, 3000],
        deepseekAI: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        claudeAI: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        openAI: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        utilities: [1500, 1600, 1550, 1700, 1650, 1800, 1750, 1900, 1850, 1700, 1600, 1950],
        internetBill: [1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200],
        internshipExpenses: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        googleWorkspace: [600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600],
        biliaryPayment: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        miscellaneous: [800, 650, 720, 900, 850, 1100, 950, 1200, 880, 760, 690, 1300]
      }
    };
  };

  const analyzeProfits = () => {
    if (!profitLossData) return;

    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    
    const monthlyAnalysis = months.map((month, index) => {
      const revenue = (profitLossData.revenue?.salesRevenue[index] || 0) + 
                     (profitLossData.revenue?.otherRevenue[index] || 0);
      const cogs = Object.values(profitLossData.costOfGoodsSold || {}).reduce((sum, arr) => 
        sum + (arr[index] || 0), 0);
      const expenses = Object.values(profitLossData.expenses || {}).reduce((sum, arr) => 
        sum + (arr[index] || 0), 0);
      const netProfit = revenue - cogs - expenses;
      const grossProfit = revenue - cogs;

      const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
      const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

      let financialHealth = 'EXCELLENT';
      if (netMargin < 0) financialHealth = 'CRITICAL';
      else if (netMargin < 5) financialHealth = 'POOR';
      else if (netMargin < 15) financialHealth = 'FAIR';
      else if (netMargin < 25) financialHealth = 'GOOD';

      return {
        month,
        revenue,
        cogs,
        expenses,
        grossProfit,
        netProfit,
        grossMargin,
        netMargin,
        financialHealth
      };
    });

    const ytdRevenue = monthlyAnalysis.reduce((sum, month) => sum + month.revenue, 0);
    const ytdCogs = monthlyAnalysis.reduce((sum, month) => sum + month.cogs, 0);
    const ytdExpenses = monthlyAnalysis.reduce((sum, month) => sum + month.expenses, 0);
    const ytdNetProfit = monthlyAnalysis.reduce((sum, month) => sum + month.netProfit, 0);
    const ytdGrossProfit = monthlyAnalysis.reduce((sum, month) => sum + month.grossProfit, 0);
    const ytdNetMargin = ytdRevenue > 0 ? (ytdNetProfit / ytdRevenue) * 100 : 0;

    const ytdAnalysis = {
      month: 'YTD',
      revenue: ytdRevenue,
      cogs: ytdCogs,
      expenses: ytdExpenses,
      grossProfit: ytdGrossProfit,
      netProfit: ytdNetProfit,
      netMargin: ytdNetMargin,
      financialHealth: ytdNetProfit < 0 ? 'CRITICAL' : 
                     ytdNetMargin < 5 ? 'POOR' : 
                     ytdNetMargin < 15 ? 'FAIR' : 
                     ytdNetMargin < 25 ? 'GOOD' : 'EXCELLENT'
    };

    setProfitAnalysis({
      monthly: monthlyAnalysis,
      ytd: ytdAnalysis,
      summary: {
        profitableMonths: monthlyAnalysis.filter(m => m.netProfit > 0).length,
        totalMonths: monthlyAnalysis.length,
        bestMonth: monthlyAnalysis.reduce((best, current) => 
          current.netProfit > best.netProfit ? current : best, monthlyAnalysis[0]),
        worstMonth: monthlyAnalysis.reduce((worst, current) => 
          current.netProfit < worst.netProfit ? current : worst, monthlyAnalysis[0]),
        averageNetMargin: monthlyAnalysis.reduce((sum, month) => sum + month.netMargin, 0) / monthlyAnalysis.length
      }
    });
  };

  const formatINR = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercent = (value) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="profit-loss-loading">
        <div className="loading-spinner"></div>
        <p>Analyzing Financial Data...</p>
      </div>
    );
  }

  return (
    <div className="profit-loss-page">
      {/* Header */}
      <div className="pl-header">
        <div className="pl-header-content">
          <div className="pl-header-main">
            <h1>Financial Dashboard</h1>
            <p>Profit & Loss Analysis • {timeRange}</p>
          </div>
          <div className="pl-header-controls">
            <div className="control-group">
              <Calendar size={16} />
              <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                <option value="2024-2025">2024-2025</option>
                <option value="2025-2026">2025-2026</option>
                <option value="2026-2027">2026-2027</option>
              </select>
            </div>
            <div className="control-group">
              <BarChart3 size={16} />
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                {['ALL', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="pl-navigation">
        <button 
          className={`nav-btn ${activeView === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveView('overview')}
        >
          <PieChart size={18} />
          Overview
        </button>
        <button 
          className={`nav-btn ${activeView === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveView('analysis')}
        >
          <BarChart3 size={18} />
          Detailed Analysis
        </button>
        <button 
          className={`nav-btn ${activeView === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveView('insights')}
        >
          <TrendingUp size={18} />
          Insights
        </button>
      </div>

      {/* Main Content */}
      <div className="pl-content">
        {activeView === 'overview' && (
          <OverviewView 
            data={profitLossData} 
            analysis={profitAnalysis} 
            formatINR={formatINR} 
            formatPercent={formatPercent} 
          />
        )}
        {activeView === 'analysis' && (
          <AnalysisView 
            data={profitLossData} 
            analysis={profitAnalysis} 
            formatINR={formatINR} 
            formatPercent={formatPercent} 
          />
        )}
        {activeView === 'insights' && (
          <InsightsView 
            analysis={profitAnalysis} 
            formatINR={formatINR} 
            formatPercent={formatPercent} 
          />
        )}
      </div>
    </div>
  );
};

// Overview View Component
const OverviewView = ({ data, analysis, formatINR, formatPercent }) => {
  if (!analysis) return null;

  const { ytd, summary } = analysis;

  return (
    <div className="overview-view">
      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card revenue">
          <div className="metric-icon">
            <DollarSign size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Total Revenue</div>
            <div className="metric-value">{formatINR(ytd.revenue)}</div>
            <div className="metric-trend positive">
              <TrendingUp size={16} />
              +12.8%
            </div>
          </div>
        </div>

        <div className="metric-card profit">
          <div className="metric-icon">
            <TrendingUp size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Net Profit</div>
            <div className="metric-value">{formatINR(ytd.netProfit)}</div>
            <div className="metric-trend positive">
              <TrendingUp size={16} />
              +8.4%
            </div>
          </div>
        </div>

        <div className="metric-card margin">
          <div className="metric-icon">
            <Target size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Net Margin</div>
            <div className="metric-value">{formatPercent(ytd.netMargin)}</div>
            <div className="metric-subtext">Industry Avg: 15%</div>
          </div>
        </div>

        <div className="metric-card health">
          <div className="metric-icon">
            <CheckCircle2 size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Financial Health</div>
            <div className={`metric-value health-${ytd.financialHealth.toLowerCase()}`}>
              {ytd.financialHealth}
            </div>
            <div className="metric-subtext">
              {summary.profitableMonths}/{summary.totalMonths} Profitable Months
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-header">
            <h3>Revenue vs Expenses</h3>
            <span className="chart-subtitle">Monthly Trend</span>
          </div>
          <div className="chart-container">
            <RevenueExpenseChart data={analysis.monthly} formatINR={formatINR} />
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Profit Analysis</h3>
            <span className="chart-subtitle">Gross vs Net Profit</span>
          </div>
          <div className="chart-container">
            <ProfitTrendChart data={analysis.monthly} formatINR={formatINR} />
          </div>
        </div>
      </div>

      {/* Quick Summary */}
      <div className="summary-cards">
        <div className="summary-card">
          <h4>Performance Highlights</h4>
          <div className="highlight-list">
            <div className="highlight-item positive">
              <CheckCircle2 size={16} />
              <span>Best month: <strong>{summary.bestMonth.month}</strong> ({formatINR(summary.bestMonth.netProfit)})</span>
            </div>
            <div className="highlight-item positive">
              <CheckCircle2 size={16} />
              <span>Success rate: <strong>{((summary.profitableMonths / summary.totalMonths) * 100).toFixed(0)}%</strong></span>
            </div>
            <div className="highlight-item neutral">
              <Target size={16} />
              <span>Average margin: <strong>{formatPercent(summary.averageNetMargin)}</strong></span>
            </div>
          </div>
        </div>

        <div className="summary-card">
          <h4>Financial Breakdown</h4>
          <div className="breakdown-stack">
            <div className="breakdown-item">
              <span>Revenue</span>
              <span>{formatINR(ytd.revenue)}</span>
            </div>
            <div className="breakdown-item">
              <span>COGS</span>
              <span>{formatINR(ytd.cogs)}</span>
            </div>
            <div className="breakdown-item">
              <span>Gross Profit</span>
              <span className="profit-text">{formatINR(ytd.grossProfit)}</span>
            </div>
            <div className="breakdown-item">
              <span>Expenses</span>
              <span>{formatINR(ytd.expenses)}</span>
            </div>
            <div className="breakdown-item total">
              <span>Net Profit</span>
              <span className={ytd.netProfit >= 0 ? 'profit-text' : 'loss-text'}>
                {formatINR(ytd.netProfit)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Analysis View Component
const AnalysisView = ({ data, analysis, formatINR, formatPercent }) => {
  if (!analysis) return null;

  return (
    <div className="analysis-view">
      <div className="analysis-grid">
        <div className="analysis-section">
          <h3>Revenue Analysis</h3>
          <RevenueTable data={data} formatINR={formatINR} />
        </div>

        <div className="analysis-section">
          <h3>COGS Breakdown</h3>
          <COGSTable data={data} formatINR={formatINR} />
        </div>

        <div className="analysis-section">
          <h3>Expenses Details</h3>
          <ExpensesTable data={data} formatINR={formatINR} />
        </div>

        <div className="analysis-section full-width">
          <h3>Profit & Loss Summary</h3>
          <ProfitLossTable analysis={analysis} formatINR={formatINR} formatPercent={formatPercent} />
        </div>
      </div>
    </div>
  );
};

// Insights View Component
const InsightsView = ({ analysis, formatINR, formatPercent }) => {
  if (!analysis) return null;

  const { summary, monthly } = analysis;

  const getRecommendations = () => {
    const recs = [];
    if (summary.averageNetMargin < 10) {
      recs.push("Optimize operational costs to improve net margin");
    }
    if (summary.profitableMonths < summary.totalMonths / 2) {
      recs.push("Focus on revenue growth during low-performing months");
    }
    const highExpenseMonths = monthly.filter(m => m.expenses > m.revenue * 0.4);
    if (highExpenseMonths.length > 0) {
      recs.push("Review expense patterns in high-spending months");
    }
    return recs;
  };

  return (
    <div className="insights-view">
      <div className="insights-grid">
        <div className="insight-card large">
          <h4>📈 Performance Overview</h4>
          <div className="insight-content">
            <p>Your business shows <strong>{summary.profitableMonths} profitable months</strong> out of {summary.totalMonths}, achieving a <strong>{((summary.profitableMonths / summary.totalMonths) * 100).toFixed(0)}% success rate</strong>.</p>
            <div className="performance-stats">
              <div className="stat">
                <span>Best Month</span>
                <strong>{summary.bestMonth.month}</strong>
                <span className="profit-text">{formatINR(summary.bestMonth.netProfit)}</span>
              </div>
              <div className="stat">
                <span>Average Margin</span>
                <strong>{formatPercent(summary.averageNetMargin)}</strong>
                <span>Net Profit</span>
              </div>
            </div>
          </div>
        </div>

        <div className="insight-card">
          <h4>🎯 Recommendations</h4>
          <div className="recommendation-list">
            {getRecommendations().map((rec, index) => (
              <div key={index} className="recommendation-item">
                <CheckCircle2 size={16} />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="insight-card">
          <h4>⚠️ Areas to Watch</h4>
          <div className="warning-list">
            {monthly.filter(m => m.netProfit < 0).map(month => (
              <div key={month.month} className="warning-item">
                <AlertCircle size={16} />
                <span>{month.month}: Loss of {formatINR(Math.abs(month.netProfit))}</span>
              </div>
            ))}
            {monthly.filter(m => m.netProfit < 0).length === 0 && (
              <div className="warning-item positive">
                <CheckCircle2 size={16} />
                <span>No loss-making months detected</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Chart Components (Simplified for example)
const RevenueExpenseChart = ({ data, formatINR }) => {
  return (
    <div className="simple-chart">
      <div className="chart-bars">
        {data.map((month, index) => (
          <div key={month.month} className="bar-group">
            <div className="bar-label">{month.month}</div>
            <div className="bars">
              <div 
                className="bar revenue-bar" 
                style={{ height: `${(month.revenue / 200000) * 100}%` }}
                title={`Revenue: ${formatINR(month.revenue)}`}
              ></div>
              <div 
                className="bar expense-bar" 
                style={{ height: `${((month.cogs + month.expenses) / 200000) * 100}%` }}
                title={`Expenses: ${formatINR(month.cogs + month.expenses)}`}
              ></div>
            </div>
          </div>
        ))}
      </div>
      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-color revenue"></div>
          <span>Revenue</span>
        </div>
        <div className="legend-item">
          <div className="legend-color expense"></div>
          <span>Expenses</span>
        </div>
      </div>
    </div>
  );
};

const ProfitTrendChart = ({ data, formatINR }) => {
  return (
    <div className="simple-chart">
      <div className="chart-lines">
        {data.map((month, index) => (
          <div key={month.month} className="line-group">
            <div 
              className="line-point gross" 
              style={{ bottom: `${(month.grossProfit / 150000) * 100}%` }}
              title={`Gross: ${formatINR(month.grossProfit)}`}
            ></div>
            <div 
              className="line-point net" 
              style={{ bottom: `${((month.netProfit + 50000) / 150000) * 100}%` }}
              title={`Net: ${formatINR(month.netProfit)}`}
            ></div>
          </div>
        ))}
      </div>
      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-color gross"></div>
          <span>Gross Profit</span>
        </div>
        <div className="legend-item">
          <div className="legend-color net"></div>
          <span>Net Profit</span>
        </div>
      </div>
    </div>
  );
};

// Table Components (Simplified)
const RevenueTable = ({ data, formatINR }) => (
  <SimpleTable 
    data={data?.revenue} 
    formatINR={formatINR}
    title="Revenue Breakdown"
  />
);

const COGSTable = ({ data, formatINR }) => (
  <SimpleTable 
    data={data?.costOfGoodsSold} 
    formatINR={formatINR}
    title="COGS Details"
  />
);

const ExpensesTable = ({ data, formatINR }) => (
  <SimpleTable 
    data={data?.expenses} 
    formatINR={formatINR}
    title="Expenses Analysis"
  />
);

const SimpleTable = ({ data, formatINR, title }) => {
  if (!data) return null;
  
  return (
    <div className="simple-table">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data).map(([key, value]) => (
              <tr key={key}>
                <td>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</td>
                <td>{formatINR(value.reduce((a, b) => a + b, 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ProfitLossTable = ({ analysis, formatINR, formatPercent }) => {
  const { monthly, ytd } = analysis;

  return (
    <div className="pl-table">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Revenue</th>
              <th>COGS</th>
              <th>Gross Profit</th>
              <th>Expenses</th>
              <th>Net Profit</th>
              <th>Margin</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {monthly.map(month => (
              <tr key={month.month}>
                <td><strong>{month.month}</strong></td>
                <td>{formatINR(month.revenue)}</td>
                <td>{formatINR(month.cogs)}</td>
                <td className={month.grossProfit >= 0 ? 'profit' : 'loss'}>
                  {formatINR(month.grossProfit)}
                </td>
                <td>{formatINR(month.expenses)}</td>
                <td className={month.netProfit >= 0 ? 'profit' : 'loss'}>
                  <strong>{formatINR(month.netProfit)}</strong>
                </td>
                <td className={month.netMargin >= 15 ? 'profit' : month.netMargin >= 5 ? 'warning' : 'loss'}>
                  {formatPercent(month.netMargin)}
                </td>
                <td>
                  <span className={`status-badge ${month.financialHealth.toLowerCase()}`}>
                    {month.netProfit >= 0 ? 'PROFIT' : 'LOSS'}
                  </span>
                </td>
              </tr>
            ))}
            <tr className="total-row">
              <td><strong>{ytd.month}</strong></td>
              <td><strong>{formatINR(ytd.revenue)}</strong></td>
              <td><strong>{formatINR(ytd.cogs)}</strong></td>
              <td className={ytd.grossProfit >= 0 ? 'profit' : 'loss'}>
                <strong>{formatINR(ytd.grossProfit)}</strong>
              </td>
              <td><strong>{formatINR(ytd.expenses)}</strong></td>
              <td className={ytd.netProfit >= 0 ? 'profit' : 'loss'}>
                <strong>{formatINR(ytd.netProfit)}</strong>
              </td>
              <td className={ytd.netMargin >= 15 ? 'profit' : ytd.netMargin >= 5 ? 'warning' : 'loss'}>
                <strong>{formatPercent(ytd.netMargin)}</strong>
              </td>
              <td>
                <span className={`status-badge ${ytd.financialHealth.toLowerCase()}`}>
                  {ytd.netProfit >= 0 ? 'PROFIT' : 'LOSS'}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProfitLossPage;