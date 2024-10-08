import React from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Stock } from "@/components/data/stock";

// Helper function to format the timestamp to 'MM/DD' or your preferred format
const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  const month = date.getMonth() + 1; // Months are 0-indexed, so +1
  const day = date.getDate();
  return `${month}/${day}`;
};

interface StockChartProps {
  stockData: any[]; // Ensure this matches the data from your backend
  selectedStock: Stock;
  watchlist: Stock[];
  setSelectedStock: (stock: Stock) => void;
  formatXAxis: (tickItem: string) => string;
  formatYAxis: (value: number) => string;
}

export function StockChart({
  stockData,
  selectedStock,
  watchlist,
  setSelectedStock,
  formatXAxis,
  formatYAxis,
}: StockChartProps) {
  const formattedStockData = stockData.map((data) => ({
    // Parse and format the timestamp (date)
    date: formatDate(data.timestamp) || 'N/A', // Using 'timestamp' from the backend
    price: isNaN(parseFloat(data.price)) ? 0 : parseFloat(data.price), // Ensure price is a number
  }));

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Stock Performance</h2>
      
      {/* Dropdown to select stock */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between mb-4">
            {selectedStock.short_name}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48">
          {watchlist.map((stock) => (
            <DropdownMenuItem key={stock.symbol} onClick={() => setSelectedStock(stock)}>
              {stock.short_name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Chart displaying the stock data */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formattedStockData}>
          <XAxis dataKey="date" tickFormatter={formatXAxis} />
          <YAxis tickFormatter={formatYAxis} />
          <Tooltip
            formatter={(value: number) => {
              if (typeof value === 'number' && !isNaN(value)) {
                return [`$${value.toFixed(2)}`, 'Price'];
              }
              return ['N/A', 'Price']; // Handle non-numeric cases
            }}
          />
          <Line type="monotone" dataKey="price" stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
