//frontend/services/marketDataServices.js
class MarketDataService {
  // Gold API integration
  async getGoldPrice() {
    try {
      // Using a free gold API (example)
      const response = await fetch('https://api.goldapi.io/api/XAU/USD', {
        headers: {
          'x-access-token': process.env.REACT_APP_GOLD_API_KEY
        }
      });
      const data = await response.json();
      return data.price;
    } catch (error) {
      console.error('Gold API error:', error);
      // Fallback to mock data
      return 1950 + Math.random() * 50;
    }
  }

  // Stock API integration (Alpha Vantage example)
  async getStockPrice(symbol) {
    try {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.REACT_APP_ALPHA_VANTAGE_KEY}`
      );
      const data = await response.json();
      return parseFloat(data['Global Quote']['05. price']);
    } catch (error) {
      console.error('Stock API error:', error);
      return null;
    }
  }

  // Crypto API integration (CoinGecko example)
  async getCryptoPrice(coinId) {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
      );
      const data = await response.json();
      return data[coinId].usd;
    } catch (error) {
      console.error('Crypto API error:', error);
      return null;
    }
  }

  // Bulk market data update
  async updateMarketPrices(assets) {
    const updatedAssets = [];
    
    for (const asset of assets) {
      let newPrice = asset.currentValue;
      
      switch (asset.type) {
        case 'gold':
          newPrice = await this.getGoldPrice() * asset.quantity;
          break;
        case 'stocks':
          if (asset.tickerSymbol) {
            newPrice = await this.getStockPrice(asset.tickerSymbol) * asset.quantity;
          }
          break;
        case 'crypto':
          if (asset.marketDataId) {
            newPrice = await this.getCryptoPrice(asset.marketDataId) * asset.quantity;
          }
          break;
        default:
          // Apply appreciation/depreciation for non-market assets
          const yearsOwned = (new Date() - new Date(asset.purchaseDate)) / (365 * 24 * 60 * 60 * 1000);
          newPrice = asset.purchasePrice;
          
          if (asset.appreciationRate > 0) {
            newPrice *= Math.pow(1 + asset.appreciationRate / 100, yearsOwned);
          }
          if (asset.depreciationRate > 0) {
            newPrice *= Math.pow(1 - asset.depreciationRate / 100, yearsOwned);
          }
      }
      
      if (newPrice && newPrice !== asset.currentValue) {
        updatedAssets.push({
          asset,
          newPrice
        });
      }
    }
    
    return updatedAssets;
  }
}

export default new MarketDataService();