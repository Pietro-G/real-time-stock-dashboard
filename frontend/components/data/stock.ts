import axios from 'axios';
const API_BASE_URL = 'http://localhost:5000/api'; // TODO: Move to .env later

// Stock interface for type checking
export interface Stock {
  symbol: string;
  short_name: string;
}

// Magnificent 7 stocks
export const magnificent7: Stock[] = [
  { symbol: 'AAPL', short_name: 'Apple Inc.' },
  { symbol: 'MSFT', short_name: 'Microsoft Corporation' },
  { symbol: 'GOOGL', short_name: 'Alphabet Inc.' },
  { symbol: 'AMZN', short_name: 'Amazon.com Inc.' },
  { symbol: 'NVDA', short_name: 'NVIDIA Corporation' },
  { symbol: 'TSLA', short_name: 'Tesla, Inc.' },
  { symbol: 'META', short_name: 'Meta Platforms, Inc.' },
];

// Mock NASDAQ stocks (for demonstration purposes)
export const watchlist: Stock[] = [
  ...magnificent7,
  { symbol: 'NFLX', short_name: 'Netflix, Inc.' },
  { symbol: 'CSCO', short_name: 'Cisco Systems, Inc.' },
  { symbol: 'INTC', short_name: 'Intel Corporation' },
  { symbol: 'CMCSA', short_name: 'Comcast Corporation' },
  { symbol: 'PEP', short_name: 'PepsiCo, Inc.' },
  { symbol: 'ADBE', short_name: 'Adobe Inc.' },
  { symbol: 'PYPL', short_name: 'PayPal Holdings, Inc.' },
];

// Function to generate realistic stock data
export const generateStockData = (symbol: string) => {
  const basePrice = Math.random() * 1000 + 100;
  const volatility = Math.random() * 0.1 + 0.05;
  const dataPoints = 30;

  return Array.from({ length: dataPoints }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (dataPoints - 1 - i));
    const price = basePrice * (1 + Math.sin(i / 5) * volatility + (Math.random() - 0.5) * volatility);
    return {
      date: date.toISOString().split('T')[0],
      price: parseFloat(price.toFixed(2)),
    };
  });
};

export const fetchWatchlist = async (): Promise<Stock[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/watchlist`);
      return response.data.map((item: any) => ({
        symbol: item.stock_symbol,
        short_name: item.short_name,
      }));
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      throw error;
    }
  };

  export const addStockToWatchlist = async (ticker: string): Promise<Stock> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/watchlist`, { ticker });
      const stock = response.data.stock;
      return {
        symbol: stock.symbol,
        short_name: stock.short_name,
      };
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        throw new Error('Stock not found.');
      } else if (error.response && error.response.status === 400) {
        throw new Error('Stock already in watchlist.');
      }
      console.error('Error adding stock to watchlist:', error);
      throw new Error('Failed to add stock to watchlist.');
    }
  };
  
export const removeStockFromWatchlist = async (ticker: string): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/watchlist/${ticker}`);
  } catch (error) {
    console.error('Error removing stock from watchlist:', error);
    throw error;
  }
};

export const fetchStockPriceData = async (ticker: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/stocks/priceData/${ticker}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching stock price data:', error);
      throw new Error('Failed to fetch stock price data.');
    }
  };