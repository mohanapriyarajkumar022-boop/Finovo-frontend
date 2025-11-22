//components/assets/charts/forecastchart.jsx
import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine 
} from 'recharts';
import { Box, Typography } from '@mui/material';

const ForecastChart = ({ asset, forecast, history }) => {
  if (!forecast) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={300}>
        <Typography color="textSecondary">
          Generate forecast to see predictions
        </Typography>
      </Box>
    );
  }

  // Combine historical data with forecast
  const historicalData = history?.slice(-6).map(record => ({
    date: new Date(record.date).toLocaleDateString(),
    value: record.value,
    type: 'historical'
  })) || [];

  const forecastData = forecast.predictions?.map((pred, index) => ({
    date: `+${index + 1} month${index > 0 ? 's' : ''}`,
    value: pred.value,
    type: 'forecast'
  })) || [
    {
      date: 'Current',
      value: asset.currentValue,
      type: 'current'
    },
    {
      date: '+6 months',
      value: forecast.predictedValue * 0.6,
      type: 'forecast'
    },
    {
      date: '+1 year',
      value: forecast.predictedValue,
      type: 'forecast'
    }
  ];

  const chartData = [...historicalData, ...forecastData];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip 
          formatter={(value) => [`$${value.toLocaleString()}`, 'Value']}
        />
        <ReferenceLine x="Current" stroke="#666" strokeDasharray="3 3" />
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke="#8884d8" 
          strokeWidth={2}
          dot={{ fill: '#8884d8' }}
          strokeDasharray={chartData.find(d => d.type === 'forecast') ? "5 5" : "0"}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default ForecastChart;