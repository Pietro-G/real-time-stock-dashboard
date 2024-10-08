const express = require('express');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const WebSocket = require('ws');
const { Pool } = require('pg');
const yahooFinance = require('yahoo-finance2').default;
const dotenv = require('dotenv');
const cron = require('node-cron');
dotenv.config();

const app = express();
app.use(express.json());

console.log('Connecting to database at:', process.env.DATABASE_URL);

const cors = require('cors');

app.use(cors({
  origin: process.env.FRONTEND_API_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'DELETE'],
  credentials: true,
}));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Swagger configuration
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Stock API',
      version: '1.0.0',
      description: 'API for stock management',
    },
    servers: [
      {
        url: process.env.BACKEND_API_URL || 'http://localhost:5000',
      },
    ],
  },
  apis: ['./index.js'], // This points to the current file for Swagger docs
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

//TODO: Real-time stock price updates (using a graph or something) 
// WebSocket server for real-time stock price updates
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws) => {
  console.log('Client connected');

  const interval = setInterval(() => {
    const stockPrice = (Math.random() * 100).toFixed(2);
    ws.send(JSON.stringify({ symbol: 'AAPL', price: stockPrice }));
  }, 5000);

  ws.on('close', () => {
    clearInterval(interval);
    console.log('Client disconnected');
  });
});

const server = app.listen(process.env.PORT || 5000, () => {
  console.log(`Server is running on port ${process.env.PORT || 5000}`);
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

app.get('/', (req, res) => {
  res.send(`
    <h1>Welcome to the stock-api-backend</h1>
    <p>Click <a href="/api-docs">here</a> for the Swagger API documentation.</p>
  `);
});

// Helper function to fetch stock data
async function fetchStockData(ticker) {
  try {
    const quote = await yahooFinance.quote(ticker);
    return quote; // Return the fetched stock data
  } catch (error) {
    console.error(`Error fetching stock data for ${ticker}:`, error);
    throw new Error('Failed to fetch stock data: ' + error.message);
  }
}

/**
 * @swagger
 * /api/stocks/{ticker}:
 *   get:
 *     summary: Get stock data for a specific ticker using Yahoo Finance as source
 *     parameters:
 *       - in: path
 *         name: ticker
 *         required: true
 *         schema:
 *           type: string
 *         description: The stock ticker symbol (e.g., AAPL)
 *     responses:
 *       200:
 *         description: A JSON object containing stock data
 *       500:
 *         description: Internal server error
 */
app.get('/api/stocks/:ticker', async (req, res) => {
  const { ticker } = req.params;
  try {
    const quote = await fetchStockData(ticker); // Use the helper function
    res.json(quote);
  } catch (error) {
    console.error('Error in /api/stocks:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

/**
 * @swagger
 * /api/watchlist:
 *   get:
 *     summary: Get all stocks in the watchlist
 *     responses:
 *       200:
 *         description: A list of stocks in the watchlist
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   symbol:
 *                     type: string
 *                   name:
 *                     type: string
 *       500:
 *         description: Internal server error
 */
app.get('/api/watchlist', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT stock_symbol, short_name FROM watchlist');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching stocks:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

/**
 * @swagger
 * /api/watchlist:
 *   post:
 *     summary: Add a new stock to the watchlist by fetching stock data
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ticker:
 *                 type: string
 *     responses:
 *       201:
 *         description: Stock added to the watchlist
 *       500:
 *         description: Internal server error
 */
app.post('/api/watchlist', async (req, res) => {
  const { ticker } = req.body; // Get ticker from the request body
  try {
    const quote = await fetchStockData(ticker); // Use the helper function

    // Check if stock already exists
    const existing = await pool.query(
      'SELECT * FROM watchlist WHERE stock_symbol = $1',
      [quote.symbol]
    )
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Stock already in watchlist.' })
    }

    // Insert the stock symbol and JSON blob into the database
    await pool.query(
      'INSERT INTO watchlist (stock_symbol, short_name, data) VALUES ($1, $2, $3)',
      [quote.symbol, quote.shortName || '', JSON.stringify(quote)] // Ensure 'short_name' is stored
    )

    res.status(201).json({ message: 'Stock added to watchlist', stock: { symbol: quote.symbol, short_name: quote.shortName || '' } })
  } catch (error) {
    if (error.message.includes('Failed to fetch stock data')) {
      return res.status(404).json({ error: 'Stock not found.' })
    }
    console.error('Error adding stock:', error)
    res.status(500).json({ error: 'Internal Server Error', details: error.message })
  }
})

/**
 * @swagger
 * /api/watchlist/{ticker}:
 *   delete:
 *     summary: Remove a stock from the watchlist
 *     parameters:
 *       - in: path
 *         name: ticker
 *         required: true
 *         schema:
 *           type: string
 *         description: The stock ticker symbol (e.g., AAPL)
 *     responses:
 *       200:
 *         description: Stock removed from the watchlist
 *       404:
 *         description: Stock not found in the watchlist
 *       500:
 *         description: Internal server error
 */
app.delete('/api/watchlist/:ticker', async (req, res) => {
  const { ticker } = req.params;

  try {
    await pool.query('DELETE FROM stockprices WHERE stock_symbol = $1', [ticker]);

    const result = await pool.query('DELETE FROM watchlist WHERE stock_symbol = $1', [ticker]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Stock not found in the watchlist' });
    }

    res.json({ message: 'Stock removed from the watchlist' });
  } catch (error) {
    console.error('Error removing stock:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

const generateStockData = (lastPrice) => {
  // Simulate a price change between -5% to +5%
  const changePercent = (Math.random() * 10 - 5) / 100; // -0.05 to +0.05
  const newPrice = lastPrice * (1 + changePercent);
  return parseFloat(newPrice.toFixed(2)); // Ensure price has two decimal places
};

// Helper function to add days to a date
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Function to insert mock data with unique timestamp and numeric price
const insertMockData = async () => {
  try {
    // Fetch all stocks from the watchlist
    const watchlistResult = await pool.query('SELECT stock_symbol FROM watchlist');
    const watchlist = watchlistResult.rows;

    for (const stock of watchlist) {
      const { stock_symbol } = stock;

      // Fetch the latest price and timestamp from stockprices table
      const latestPriceResult = await pool.query(
        'SELECT price, timestamp FROM stockprices WHERE stock_symbol = $1 ORDER BY timestamp DESC LIMIT 1',
        [stock_symbol]
      );

      let lastPrice = 100.00; // Default starting price
      let lastTimestamp = new Date(); // Default to current date if no previous timestamp

      if (latestPriceResult.rows.length > 0) {
        lastPrice = parseFloat(latestPriceResult.rows[0].price); // Ensure lastPrice is a number
        lastTimestamp = new Date(latestPriceResult.rows[0].timestamp); // Get last inserted timestamp
      }

      // Generate new mock price
      const newPrice = generateStockData(lastPrice);

      // Add one day to the last timestamp
      const newTimestamp = addDays(lastTimestamp, 1).toISOString(); // Increment by one day

      // Insert new price into stockprices table with incremented timestamp
      await pool.query(
        'INSERT INTO stockprices (stock_symbol, price, timestamp) VALUES ($1, $2, $3)',
        [stock_symbol, newPrice, newTimestamp] // Insert incremented timestamp and price
      );

      console.log(`Inserted new price for ${stock_symbol}: $${newPrice} at ${newTimestamp}`);
    }
  } catch (error) {
    console.error('Error inserting mock data:', error);
  }
};

cron.schedule('*/15 * * * * *', () => {
  console.log('Running scheduled task: insertMockData');
  insertMockData();
});


/**
 * @swagger
 * /api/stocks/priceData/{ticker}:
 *   get:
 *     summary: Get mock price data for a specific stock
 *     parameters:
 *       - in: path
 *         name: ticker
 *         required: true
 *         schema:
 *           type: string
 *         description: The stock ticker symbol (e.g., AAPL)
 *     responses:
 *       200:
 *         description: A list of historical stock prices
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   price:
 *                     type: number
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *       404:
 *         description: Stock not found in watchlist
 *       500:
 *         description: Internal server error
 */
app.get('/api/stocks/priceData/:ticker', async (req, res) => {
  const { ticker } = req.params;

  try {
    // Check if the stock exists in watchlist
    const watchlistCheck = await pool.query(
      'SELECT * FROM watchlist WHERE stock_symbol = $1',
      [ticker.toUpperCase()]
    );

    if (watchlistCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Stock not found in watchlist.' });
    }

    // Fetch all price data for the ticker, ordered by timestamp ascending
    const priceDataResult = await pool.query(
      'SELECT price, timestamp FROM stockprices WHERE stock_symbol = $1 ORDER BY timestamp ASC',
      [ticker.toUpperCase()]
    );

    res.json(priceDataResult.rows);
  } catch (error) {
    console.error('Error fetching price data:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});