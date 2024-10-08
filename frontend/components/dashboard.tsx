"use client"

import { useState, useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from "@/components/ui/button"
import { Stock, fetchWatchlist, addStockToWatchlist, removeStockFromWatchlist, fetchStockPriceData } from "@/components/data/stock"
import { Watchlist } from "@/components/watchlist";
import { StockChart } from "@/components/stockchart"

export function Dashboard() {
  const [watchlist, setWatchlist] = useState<Stock[]>([]) // Initialize as empty array
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null) // Initialize as null
  const { setTheme, theme } = useTheme()
  const [stockData, setStockData] = useState<any[]>([]) // Adjust type as needed
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [watchlistError, setWatchlistError] = useState<string | null>(null) // New state for watchlist errors
  const [generalMessage, setGeneralMessage] = useState<string | null>(null) // For general success messages
  const [generalError, setGeneralError] = useState<string | null>(null) // For general error messages

  // Fetch stock data from the backend
  const fetchStockDataFromBackend = async (symbol: string) => {
    try {
      const data = await fetchStockPriceData(symbol);
      console.log('Fetched stock data:', stockData);
      setStockData(data);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      setGeneralError('Failed to fetch stock data.');
    }
  }

  useEffect(() => {
    const getWatchlist = async () => {
      try {
        const data = await fetchWatchlist()
        setWatchlist(data)
        if (data.length > 0) {
          setSelectedStock(data[0]) // Set the first stock as selected by default
          fetchStockDataFromBackend(data[0].symbol); // Fetch initial stock data from backend
        }
      } catch (err: any) {
        console.error('Failed to load watchlist:', err)
        setWatchlistError('Failed to load watchlist.')
      } finally {
        setLoading(false)
      }
    }

    getWatchlist()
  }, [])

  useEffect(() => {
    if (!selectedStock) return;

    const fetchData = async () => {
      await fetchStockDataFromBackend(selectedStock.symbol);
    };

    fetchData(); // Initial fetch

    // Set up polling every 5 seconds
    const intervalId = setInterval(fetchData, 5000);

    // Clean up interval on component unmount or when selected stock changes
    return () => clearInterval(intervalId);
  }, [selectedStock])

  useEffect(() => {
    setMounted(true)
  }, [])

  const addToWatchlistHandler = async (stock: Stock) => {
    try {
      const addedStock = await addStockToWatchlist(stock.symbol)
      setWatchlist([...watchlist, addedStock])
      setGeneralMessage(`Successfully added ${addedStock.symbol} to watchlist.`)
      setGeneralError(null) // Clear any previous errors
    } catch (err: any) {
      console.error('Error adding to watchlist:', err)
      setGeneralError(err.message || 'Failed to add stock to watchlist.')
      setGeneralMessage(null) // Clear any previous messages
    }
  }

  const removeFromWatchlistHandler = async (stock: Stock) => {
    try {
      await removeStockFromWatchlist(stock.symbol);
      setWatchlist(watchlist.filter(s => s.symbol !== stock.symbol));
      if (selectedStock?.symbol === stock.symbol) {
        setSelectedStock(watchlist[0] || null);
        if (watchlist[0]) {
          await fetchStockDataFromBackend(watchlist[0].symbol);
        } else {
          setStockData([]);
        }
      }
      setGeneralMessage(`Successfully removed ${stock.symbol} from watchlist.`);
      setGeneralError(null);
    } catch (err: any) {
      console.error('Error removing stock:', err);
      setGeneralError('Failed to remove stock from watchlist.');
      setGeneralMessage(null);
    }
  };

  // Custom tick formatter for X-axis
  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  // Custom tick formatter for Y-axis
  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`
    }
    return `$${value.toFixed(0)}`
  }

  if (!mounted) return null

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex justify-between items-center p-4 border-b">
        <h1 className="text-2xl font-bold"> Real-Time Stock Dashboard</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </header>
      <main className="flex-grow p-4">
        {(generalMessage || generalError) && (
          <div className="mb-4 p-2 rounded">
            {generalMessage && (
              <div className="p-2 bg-green-100 text-green-800 rounded">
                {generalMessage}
              </div>
            )}
            {generalError && (
              <div className="p-2 bg-red-100 text-red-800 rounded">
                {generalError}
              </div>
            )}
          </div>
        )}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {!watchlistError && !loading && selectedStock && (
            <Watchlist
              watchlist={watchlist}
              selectedStock={selectedStock}
              setSelectedStock={setSelectedStock}
              addToWatchlist={addToWatchlistHandler}
              removeFromWatchlist={removeFromWatchlistHandler}
            />
          )}
          {watchlistError && (
            <div className="p-4 bg-red-100 text-red-800 rounded">
              {watchlistError}
            </div>
          )}
          {selectedStock && (
            <StockChart
              stockData={stockData}
              selectedStock={selectedStock}
              watchlist={watchlist}
              setSelectedStock={setSelectedStock}
              formatXAxis={formatXAxis}
              formatYAxis={formatYAxis}
            />
          )}
        </section>
      </main>
      <footer className="border-t p-4 text-center text-sm text-muted-foreground">
        Made by <a href="https://github.com/Pietro-G" target="_blank" rel="noopener noreferrer" className="underline">PietroG</a>
      </footer>
    </div>
  )
}
