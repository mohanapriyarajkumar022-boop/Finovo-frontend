import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styled, { keyframes } from 'styled-components';

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.7;
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// --- STYLED COMPONENTS ---

const Container = styled.div`
  background: linear-gradient(120deg, #5b247a 0%, #1b143e 100%);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-height: 250px;
  display: flex;
  flex-direction: column;
`;

const Title = styled.h2`
  margin: 0 0 24px 0;
  font-size: 24px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 16px;
  flex-shrink: 0;
`;

const SuggestionGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    animation: ${fadeIn} 0.5s ease-out;
`;

const PromptCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px 24px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  transition: transform 0.3s ease, background-color 0.3s ease;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 100px;
  font-size: 16px;
  font-weight: 500;
  color: #e0e0e0;

  &:hover { 
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.1);
  }
`;

const DetailView = styled.div`
  animation: ${fadeIn} 0.5s ease-out;
`;

const CardHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
`;

const Icon = styled.span`
    font-size: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    flex-shrink: 0;
    background-color: ${props => {
        switch (props.type) {
            case 'warning': return 'rgba(243, 156, 18, 0.2)';
            case 'success': return 'rgba(39, 174, 96, 0.2)';
            default: return 'rgba(52, 152, 219, 0.2)';
        }
    }};
    color: ${props => {
        switch (props.type) {
            case 'warning': return '#f39c12';
            case 'success': return '#27ae60';
            default: return '#3498db';
        }
    }};
`;

const SuggestionTitle = styled.h4`
  margin: 0;
  color: #f0f0f0;
  font-size: 18px;
  font-weight: 500;
`;

const SuggestionDescription = styled.p`
  margin: 16px 0;
  color: #c5c5c5;
  font-size: 15px;
  line-height: 1.6;
`;

const Category = styled.span`
  display: inline-block;
  background: rgba(0, 0, 0, 0.3);
  color: #e0e0e0;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 24px;
`;

const BackButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 10px 20px;
  border-radius: 20px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  font-weight: 500;
  margin-top: 16px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const StatusContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    flex-grow: 1;
    text-align: center;
    flex-direction: column;
    gap: 12px;
`;

const LoadingText = styled.p`
  font-size: 18px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  animation: ${pulse} 2s ease-in-out infinite;
`;

const ErrorText = styled.p`
  color: #ffdddd;
  background: rgba(255, 0, 0, 0.2);
  padding: 16px 24px;
  border-radius: 12px;
  border: 1px solid rgba(255, 100, 100, 0.5);
  font-weight: 500;
`;

const InfoBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 16px;
`;

const RetryButton = styled.button`
  background: rgba(139, 92, 246, 0.8);
  border: 1px solid rgba(139, 92, 246, 1);
  color: white;
  padding: 10px 24px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  font-size: 14px;
  
  &:hover {
    background: rgba(139, 92, 246, 1);
    transform: translateY(-2px);
  }
`;

const AISuggestions = () => {
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSuggestion, setSelectedSuggestion] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const fetchSuggestions = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            // Get auth details from local storage (OPTIONAL)
            const token = localStorage.getItem('token');
            const tenantId = localStorage.getItem('tenantId');

            // Build headers - works with or without authentication
            const headers = {
                'Content-Type': 'application/json'
            };

            // Add auth headers if available
            if (token && tenantId) {
                headers['Authorization'] = `Bearer ${token}`;
                headers['x-tenant-id'] = tenantId;
                setIsAuthenticated(true);
                console.log('✅ Fetching personalized suggestions (authenticated)');
            } else {
                setIsAuthenticated(false);
                console.log('👤 Fetching general suggestions (guest mode)');
            }

            // Call the public endpoint
            const response = await axios.get('http://localhost:5000/api/chatbot/suggestions', {
                headers,
                timeout: 30000
            });

            if (response.data?.suggestions) {
                setSuggestions(response.data.suggestions);
                console.log(`✅ Loaded ${response.data.suggestions.length} suggestions`);
            } else {
                throw new Error('Received an unexpected data format from the server.');
            }
        } catch (err) {
            console.error("❌ Error fetching AI suggestions:", err);
            
            // Set fallback suggestions instead of just showing error
            setSuggestions([
                {
                    type: 'info',
                    title: 'Start Tracking Your Finances',
                    description: 'Add your income and expenses to get personalized AI-powered insights.',
                    category: 'Getting Started'
                },
                {
                    type: 'success',
                    title: 'Set Financial Goals',
                    description: 'Define clear short-term and long-term financial objectives to stay motivated.',
                    category: 'Planning'
                },
                {
                    type: 'info',
                    title: 'Build an Emergency Fund',
                    description: 'Save 3-6 months of expenses for financial security and peace of mind.',
                    category: 'Savings'
                },
                {
                    type: 'warning',
                    title: 'Review Your Spending',
                    description: 'Regularly monitor your expenses to identify areas where you can save money.',
                    category: 'Budgeting'
                }
            ]);
            
            const errorMessage = err.response?.data?.message || 'Using default suggestions. Log in for personalized advice.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Small delay for better UX
        const timer = setTimeout(fetchSuggestions, 500);
        return () => clearTimeout(timer);
    }, []);

    const getIconForType = (type) => {
        switch (type) {
            case 'warning': return '⚠️';
            case 'success': return '✅';
            default: return 'ℹ️';
        }
    };

    const handleSelectSuggestion = (suggestion) => setSelectedSuggestion(suggestion);
    const handleGoBack = () => setSelectedSuggestion(null);

    const renderContent = () => {
        if (isLoading) {
            return (
                <StatusContainer>
                    <LoadingText>🧠 Analyzing your financial data...</LoadingText>
                </StatusContainer>
            );
        }

        if (error && suggestions.length === 0) {
            return (
                <StatusContainer>
                    <ErrorText>{error}</ErrorText>
                    <RetryButton onClick={fetchSuggestions}>
                        🔄 Retry
                    </RetryButton>
                </StatusContainer>
            );
        }

        if (selectedSuggestion) {
            return (
                <DetailView>
                    <CardHeader>
                        <Icon type={selectedSuggestion.type}>{getIconForType(selectedSuggestion.type)}</Icon>
                        <SuggestionTitle>{selectedSuggestion.title}</SuggestionTitle>
                    </CardHeader>
                    <SuggestionDescription>{selectedSuggestion.description}</SuggestionDescription>
                    {selectedSuggestion.category && (
                        <Category>{selectedSuggestion.category}</Category>
                    )}
                    <div>
                        <BackButton onClick={handleGoBack}>← Back to Suggestions</BackButton>
                    </div>
                </DetailView>
            );
        }

        if (suggestions.length === 0) {
            return (
                <StatusContainer>
                    <p>Keep adding transactions to unlock personalized AI insights.</p>
                    <RetryButton onClick={fetchSuggestions}>
                        🔄 Refresh
                    </RetryButton>
                </StatusContainer>
            );
        }

        return (
            <>
                {error && (
                    <InfoBadge>
                        ℹ️ {error}
                    </InfoBadge>
                )}
                {!isAuthenticated && suggestions.length > 0 && (
                    <InfoBadge>
                        👤 Viewing general suggestions. Log in for personalized insights!
                    </InfoBadge>
                )}
                <SuggestionGrid>
                    {suggestions.map((suggestion, index) => (
                        <PromptCard 
                            key={index} 
                            onClick={() => handleSelectSuggestion(suggestion)}
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            {suggestion.title}
                        </PromptCard>
                    ))}
                </SuggestionGrid>
            </>
        );
    };

    return (
        <Container>
            <Title>
                <span>💡</span> AI-Powered Financial Insights
            </Title>
            {renderContent()}
        </Container>
    );
};

export default AISuggestions;