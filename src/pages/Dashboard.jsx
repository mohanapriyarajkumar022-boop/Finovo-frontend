// ✅ CORRECTED FILE: frontend/src/pages/Dashboardpage.jsx

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import styled, { keyframes } from 'styled-components';

// Make sure the paths to these components are correct for your project structure
import Chatbot from './chatbot.jsx';
import AISuggestions from '../pages/AISuggestions';
import MarketNews from './MarketNews.jsx'; // ✅ IMPORT THE NEW COMPONENT

// Register Chart.js components required for the Pie chart to work
ChartJS.register(ArcElement, Tooltip, Legend);

// --- ANIMATIONS ---
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
`;

// --- STYLED COMPONENTS ---
const PageWrapper = styled.div`
  background-color: #101418;
  color: #e0e0e0;
  padding: 24px;
  min-height: 100vh;
  font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif;
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Header = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0; /* Margin is now on the container */
  text-align: left;
`;

const MarketNewsButton = styled.button`
  background: linear-gradient(45deg, #5b247a, #1b143e);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 12px rgba(0,0,0,0.3);
  }
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 24px;
`;
// ... (The rest of your original styled components are fine here)
const Widget = styled.div`
  background: linear-gradient(145deg, rgba(38, 43, 52, 0.8), rgba(30, 35, 42, 0.8));
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  animation: ${fadeIn} 0.5s ease-out forwards;
`;

const SummaryWidget = styled(Widget)`
  grid-column: span 12; // Full width
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); // Responsive columns
  gap: 20px;

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const SummaryCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  h4 {
    margin: 0;
    color: #a0a0e0;
    font-size: 1rem;
    font-weight: 400;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  p {
    margin: 0;
    font-size: 2rem;
    font-weight: 600;
  }
`;

const IncomeText = styled.p` color: #27ae60; `;
const ExpenseText = styled.p` color: #e74c3c; `;
const BalanceText = styled.p` color: #3498db; `;

const AISuggestionsWidget = styled.div`
  grid-column: span 12;
  margin-bottom: 24px;
`;

const ChartWidget = styled(Widget)`
  grid-column: span 12;
  h3 {
    text-align: center;
    margin-top: 0;
    font-weight: 500;
  }
  @media (min-width: 1024px) {
    grid-column: span 4;
  }
`;

const TransactionsWidget = styled(Widget)`
  grid-column: span 12;
  @media (min-width: 1024px) {
    grid-column: span 8;
  }
  
  h3 {
    margin-top: 0;
    font-weight: 500;
    font-size: 1.5rem;
  }
`;

const TransactionList = styled.ul`
  list-style-type: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px; // Limit height to prevent page stretching
  overflow-y: auto;  // Add scrollbar if content overflows
`;

const TransactionItem = styled.li`
  display: flex;
  align-items: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border-left: 4px solid ${props => props.type === 'income' ? '#27ae60' : '#e74c3c'};
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.4);
  }
`;

const TransactionInfo = styled.div`
  flex-grow: 1;
  margin-left: 16px;
  span { display: block; }
  .description { font-weight: 500; color: #f0f0f0; }
  .date { font-size: 0.8rem; color: #888; }
`;

const TransactionAmount = styled.span`
  font-weight: 600;
  font-size: 1.1rem;
  color: ${props => props.type === 'income' ? '#27ae60' : '#e74c3c'};
`;

const DeleteButton = styled.button`
  cursor: pointer;
  background: transparent;
  color: #999;
  border: none;
  padding: 5px 10px;
  border-radius: 5px;
  margin-left: 16px;
  opacity: 0.6;
  transition: opacity 0.2s ease, color 0.2s ease;
  font-size: 20px;
  
  &:hover {
    opacity: 1;
    color: #e74c3c;
  }
`;

const ChatbotToggleButton = styled.button`
  position: fixed;
  bottom: 25px;
  right: 25px;
  background: linear-gradient(45deg, #5b247a, #1b143e);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 60px;
  height: 60px;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 6px 12px rgba(0,0,0,0.3);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
  }
`;
const Dashboardpage = () => {
  const [transactions, setTransactions] = useState([]);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [balance, setBalance] = useState(0);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // ✅ ADD STATE FOR THE MARKET NEWS PANEL
  const [isMarketNewsOpen, setMarketNewsOpen] = useState(false);

  // Reusable function to fetch and process transaction data
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { 
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: true 
      };
      const response = await axios.get('http://localhost:5000/api/transactions', config);
      const fetchedTransactions = response.data.transactions || [];
      setTransactions(fetchedTransactions);

      const incomeTotal = fetchedTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const expenseTotal = fetchedTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

      setIncome(incomeTotal);
      setExpense(expenseTotal);
      setBalance(incomeTotal - expenseTotal);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const deleteTransaction = async (id) => {
    try {
        const token = localStorage.getItem('token');
        const config = { 
            headers: { 'Authorization': `Bearer ${token}` },
            withCredentials: true 
        };
      await axios.delete(`http://localhost:5000/api/transactions/${id}`, config);
      fetchData();
    } catch (error) {
      console.error("Failed to delete transaction:", error);
    }
  };

  const toggleChatbot = () => setIsChatbotOpen(!isChatbotOpen);

  // ✅ ADD A TOGGLE FUNCTION FOR THE MARKET NEWS PANEL
  const toggleMarketNews = () => setMarketNewsOpen(!isMarketNewsOpen);

  // Data and options for the Pie Chart
  const pieChartData = { /* ... your data ... */ };
  const pieChartOptions = { /* ... your options ... */ };

  return (
    <PageWrapper>
      {/* ✅ CONDITIONALLY RENDER THE MARKET NEWS PANEL AT THE TOP */}
      {isMarketNewsOpen && <MarketNews onClose={toggleMarketNews} />}
      
      {/* ✅ USE THE NEW HEADER LAYOUT */}
      <HeaderContainer>
        <Header>Dashboard</Header>
        <MarketNewsButton onClick={toggleMarketNews}>
          📈 Market News
        </MarketNewsButton>
      </HeaderContainer>

      <AISuggestionsWidget>
        <AISuggestions />
      </AISuggestionsWidget>
      
      <DashboardGrid>
        <SummaryWidget>
          <SummaryCard>
            <h4>💰 Total Income</h4>
            <IncomeText>₹{income.toFixed(2)}</IncomeText>
          </SummaryCard>
          <SummaryCard>
            <h4>💸 Total Expense</h4>
            <ExpenseText>₹{expense.toFixed(2)}</ExpenseText>
          </SummaryCard>
          <SummaryCard>
            <h4>🏦 Current Balance</h4>
            <BalanceText>₹{balance.toFixed(2)}</BalanceText>
          </SummaryCard>
        </SummaryWidget>

        {(income > 0 || expense > 0) && (
          <ChartWidget>
            <h3>Summary Breakdown</h3>
            <div style={{ height: '300px', position: 'relative' }}>
              <Pie data={pieChartData} options={pieChartOptions} />
            </div>
          </ChartWidget>
        )}
        
        <TransactionsWidget style={(income === 0 && expense === 0) ? { gridColumn: 'span 12' } : {}}>
          <h3>Transaction History</h3>
          <TransactionList>
            {transactions.length > 0 ? (
              transactions.map(transaction => (
                <TransactionItem key={transaction._id} type={transaction.type}>
                  <TransactionInfo>
                    <span className="description">{transaction.description}</span>
                    <span className="date">{new Date(transaction.date).toLocaleDateString()}</span>
                  </TransactionInfo>
                  <TransactionAmount type={transaction.type}>
                    {transaction.type === 'expense' ? '-' : '+'}₹{Math.abs(transaction.amount).toFixed(2)}
                  </TransactionAmount>
                  <DeleteButton onClick={() => deleteTransaction(transaction._id)}>
                    🗑️
                  </DeleteButton>
                </TransactionItem>
              ))
            ) : (
              <p>No transactions to display yet.</p>
            )}
          </TransactionList>
        </TransactionsWidget>
      </DashboardGrid>

      {!isChatbotOpen && (
        <ChatbotToggleButton onClick={toggleChatbot}>
            💬
        </ChatbotToggleButton>
      )}
      {isChatbotOpen && <Chatbot closeChatbot={toggleChatbot} />}
    </PageWrapper>
  );
};

export default Dashboardpage;