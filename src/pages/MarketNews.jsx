import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import styled, { keyframes } from 'styled-components';

// --- Animations ---
const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const zoomIn = keyframes`from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; }`;
const spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;

// --- Styled Components ---
const Overlay = styled.div`
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex; justify-content: center; align-items: flex-start;
  padding-top: 5vh; z-index: 1000; animation: ${fadeIn} 0.3s ease-out;
  overflow-y: auto;
`;

const MarketPanel = styled.div`
  background: linear-gradient(145deg, rgba(38, 43, 52, 0.98), rgba(30, 35, 42, 0.98));
  border-radius: 16px; padding: 24px; border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); width: 90%; max-width: 1200px;
  color: #e0e0e0; position: relative; animation: ${zoomIn} 0.4s ease-out;
  margin-bottom: 5vh;
`;

const MarketGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 20px;
  margin-bottom: 30px;
`;

const MarketCard = styled.div`
  background: rgba(0, 0, 0, 0.2); border-radius: 12px; padding: 16px; text-align: center;
  border-left: 4px solid ${props => {
    const change = parseFloat(props.change);
    if (isNaN(change) || change === 0) return '#7f8c8d';
    return change > 0 ? '#27ae60' : '#e74c3c';
  }};
`;

const MarketTitle = styled.h4`
  margin: 0 0 8px 0; font-size: 0.9rem; color: #a0a0e0; 
  text-transform: uppercase; letter-spacing: 0.5px;
`;
const MarketValue = styled.p`
  margin: 0 0 4px 0; font-size: 1.5rem; font-weight: 600; color: #fff;
`;
const MarketChange = styled.p`
  margin: 0; font-size: 1rem; font-weight: 500;
  color: ${props => {
    const change = parseFloat(props.change);
    if (isNaN(change) || change === 0) return '#bdc3c7';
    return change > 0 ? '#27ae60' : '#e74c3c';
  }};
`;

const CloseButton = styled.button`
  position: absolute; top: 15px; right: 15px; background: transparent; border: none;
  color: #aaa; font-size: 1.8rem; cursor: pointer; &:hover { color: #fff; }
`;

const StatusText = styled.p`text-align: center; font-size: 1.1rem; padding: 40px 20px; color: #b0b0b0;`;

const LoadingSpinner = styled.div`
  width: 40px; height: 40px; margin: 0 auto;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top: 4px solid #5b247a;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const LoadingContainer = styled.div`
  text-align: center; padding: 40px 20px;
`;

const ErrorText = styled.div`
  color: #ffdddd; background-color: rgba(255, 70, 70, 0.15); border-radius: 8px;
  border: 1px solid rgba(255, 70, 70, 0.2);
  padding: 20px; margin: 20px 0; text-align: center;
`;

const RetryButton = styled.button`
  background: linear-gradient(45deg, #5b247a, #1b143e); color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px; padding: 10px 20px; font-size: 1rem; cursor: pointer; margin-top: 15px;
  transition: transform 0.2s ease; &:hover { transform: scale(1.05); }
`;

const SectionTitle = styled.h3`
  text-align: center; margin: 0 0 20px 0; 
  display: flex; align-items: center; justify-content: center; gap: 10px;
`;

// ✅ UPDATED: Maps Indian commodity symbols to clean, readable names.
const symbolDisplayNames = {
  'GOLD.MCX': 'Gold (INR)',
  'SILVER.MCX': 'Silver (INR)',
};

// ✅ FINAL CORRECTED FUNCTION: This function now correctly assigns ₹ to all Indian assets.
const getCurrencySymbol = (symbol) => {
  const upperSymbol = symbol.toUpperCase();
  if (upperSymbol.includes('.NSE') || upperSymbol.includes('.BSE') || upperSymbol.includes('.MCX')) {
    return '₹'; // Rupee for all Indian markets (NSE, BSE, MCX)
  }
  return '$'; // Fallback for any non-Indian assets
};

const MarketNews = ({ onClose }) => {
  const [marketData, setMarketData] = useState([]);
  const [loadingMarket, setLoadingMarket] = useState(true);
  const [marketError, setMarketError] = useState(null);
  
  const isMountedRef = useRef(true);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      fetchMarketData();
    }
    return () => { isMountedRef.current = false; };
  }, []);

  const fetchMarketData = async () => {
    setLoadingMarket(true);
    setMarketError(null);
    setMarketData([]);

    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      if (!token || !tenantId) throw new Error("Authentication details missing.");

      const config = {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId },
        timeout: 15000
      };

      const response = await axios.get('http://localhost:5000/api/market-data', config);
      
      if (isMountedRef.current && response.data) {
        // Filter to only show items that loaded successfully
        const validData = response.data.filter(d => d.price !== 'N/A' && parseFloat(d.price) > 0);
        setMarketData(validData);
      }
    } catch (error) {
      if (isMountedRef.current) {
          const errorDetails = error.response?.data?.details || error.message;
          setMarketError(`Failed to load market data. ${errorDetails}`);
      }
    } finally {
      if (isMountedRef.current) setLoadingMarket(false);
    }
  };

  return (
    <Overlay onClick={onClose}>
      <MarketPanel onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <SectionTitle>📈 Market Updates</SectionTitle>

        {loadingMarket ? (
          <LoadingContainer>
            <LoadingSpinner />
            <StatusText>Loading market data...</StatusText>
          </LoadingContainer>
        ) : marketError ? (
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <ErrorText>{marketError}</ErrorText>
            <RetryButton onClick={fetchMarketData}>🔄 Retry Market Data</RetryButton>
          </div>
        ) : marketData.length > 0 ? (
          <MarketGrid>
            {marketData.map(data => (
              <MarketCard key={data.symbol} change={data.changePercent}>
                <MarketTitle>{symbolDisplayNames[data.symbol] || data.symbol}</MarketTitle>
                <MarketValue>
                  {`${getCurrencySymbol(data.symbol)}${data.price}`}
                </MarketValue>
                <MarketChange change={data.changePercent}>{data.changePercent}</MarketChange>
              </MarketCard>
            ))}
          </MarketGrid>
        ) : (
          <StatusText>No market data available. Please check your API plan entitlements.</StatusText>
        )}
      </MarketPanel>
    </Overlay>
  );
};

export default MarketNews;