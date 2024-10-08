// frontend/app/components/watchlist.tsx

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, X } from 'lucide-react';
import { Stock } from './data/stock';

interface WatchlistProps {
  watchlist: Stock[];
  selectedStock: Stock;
  setSelectedStock: (stock: Stock) => void;
  addToWatchlist: (stock: Stock) => void;
  removeFromWatchlist: (stock: Stock) => void;
}

export const Watchlist: React.FC<WatchlistProps> = ({ watchlist, selectedStock, setSelectedStock, addToWatchlist, removeFromWatchlist }) => {
  const [tickerInput, setTickerInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  const handleAdd = async () => {
    const ticker = tickerInput.trim().toUpperCase();

    if (!ticker) {
      setInputError('Ticker symbol cannot be empty.');
      return;
    }

    // Optional: Validate ticker format (e.g., only letters)
    const tickerRegex = /^[A-Z]{1,5}$/;
    if (!tickerRegex.test(ticker)) {
      setInputError('Invalid ticker symbol format.');
      return;
    }

    setInputError(null); // Clear previous errors

    // Create a stock object with the ticker; short_name will be fetched from backend
    const newStock: Stock = { symbol: ticker, short_name: '' };

    // Call the addToWatchlist prop function
    await addToWatchlist(newStock);

    // Clear the input field after attempting to add
    setTickerInput('');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Your Watchlist</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Stock
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Stock to Watchlist</DialogTitle>
            </DialogHeader>
            <div className="mb-4">
              <Input
                placeholder="Enter ticker symbol (e.g., AAPL)"
                value={tickerInput}
                onChange={(e) => setTickerInput(e.target.value)}
                className="mb-2"
              />
              {inputError && (
                <div className="text-red-500 text-sm mb-2">
                  {inputError}
                </div>
              )}
            </div>
            <Button onClick={handleAdd} className="w-full">
              Add to Watchlist
            </Button>
          </DialogContent>
        </Dialog>
      </div>
      <ul className="space-y-2">
        {watchlist.map((stock) => (
          <li key={stock.symbol} className="flex justify-between items-center">
            <Button
              variant={selectedStock.symbol === stock.symbol ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setSelectedStock(stock)}
            >
              <span className="font-mono mr-2">{stock.symbol}</span>
              {stock.short_name}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeFromWatchlist(stock)}
              className="ml-2"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remove {stock.symbol}</span>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
};
