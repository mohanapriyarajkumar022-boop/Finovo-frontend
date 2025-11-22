// components/assets/charts/PortfolioChart.jsx
import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip 
} from 'recharts';
import { Box, Grid, Typography, Paper } from '@mui/material';

const COLORS = {
  physical: '#4caf50',
  financial: '#ff9800',
  digital: '#f44336',
  gold: '#ffd700',
  silver: '#c0c0c0',
  property: '#8bc34a',
  land: '#689f38',
  vehicle: '#03a9f4',
  stocks: '#2196f3',
  bonds: '#9c27b0',
  mutual_funds: '#673ab7',
  crypto: '#f44336',
  nft: '#e91e63',
  domain: '#00bcd4',
  other: '#607d8b'
};

const PortfolioChart = ({ assets, summary }) => {
  if (!assets || assets.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={300}>
        <Typography color="textSecondary">
          No data available
        </Typography>
      </Box>
    );
  }

  // Prepare data for category chart
  const categoryData = Object.entries(summary.byCategory || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    percentage: ((value / summary.totalValue) * 100).toFixed(1)
  }));

  // Prepare data for type chart
  const typeData = Object.entries(summary.byType || {}).map(([name, value]) => ({
    name: name.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' '),
    value,
    percentage: ((value / summary.totalValue) * 100).toFixed(1)
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <Paper elevation={3} sx={{ p: 1.5 }}>
          <Typography variant="body2" fontWeight="bold">
            {payload[0].name}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            ${payload[0].value.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="primary">
            {payload[0].payload.percentage}%
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (parseFloat(percentage) < 5) return null; // Don't show label for small slices

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontWeight="bold"
        fontSize="14"
      >
        {`${percentage}%`}
      </text>
    );
  };

  return (
    <Grid container spacing={3}>
      {/* Category Distribution */}
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle1" align="center" gutterBottom fontWeight="bold">
          By Category
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {categoryData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[entry.name.toLowerCase()] || COLORS.other} 
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Grid>

      {/* Type Distribution */}
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle1" align="center" gutterBottom fontWeight="bold">
          By Asset Type
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={typeData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {typeData.map((entry, index) => {
                const typeKey = entry.name.toLowerCase().replace(' ', '_');
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[typeKey] || COLORS.other} 
                  />
                );
              })}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Grid>

      {/* Asset Breakdown List */}
      <Grid item xs={12}>
        <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle2" gutterBottom fontWeight="bold">
            Asset Breakdown
          </Typography>
          <Grid container spacing={2}>
            {assets.slice(0, 6).map((asset) => {
              const percentage = ((asset.currentValue / summary.totalValue) * 100).toFixed(1);
              return (
                <Grid item xs={12} sm={6} key={asset._id}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" noWrap sx={{ maxWidth: '70%' }}>
                      {asset.name}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      {percentage}%
                    </Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
          {assets.length > 6 && (
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
              Showing top 6 assets. Total: {assets.length} assets
            </Typography>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};

export default PortfolioChart;