import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ValueChart = ({ history }) => {
  // Sort history by date
  const sortedHistory = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));

  const data = {
    labels: sortedHistory.map(record => 
      new Date(record.date).toLocaleDateString()
    ),
    datasets: [
      {
        label: 'Asset Value',
        data: sortedHistory.map(record => record.value),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
        fill: true
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Value Over Time'
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
        }
      }
    }
  };

  return (
    <div className="h-80">
      <Line data={data} options={options} />
    </div>
  );
};

export default ValueChart;