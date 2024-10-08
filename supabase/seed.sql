-- Drop the stockprices table if it exists
DROP TABLE IF EXISTS stockprices;

-- Drop the watchlist table if it exists
DROP TABLE IF EXISTS public.watchlist;

-- Create the watchlist table
CREATE TABLE public.watchlist (
    id serial NOT NULL,
    stock_symbol character varying(10) NOT NULL,
    short_name character varying(50) NOT NULL,
    added_at timestamp without time zone NULL DEFAULT current_timestamp,
    data jsonb NULL,
    user_id integer NULL,
    CONSTRAINT watchlist_pkey PRIMARY KEY (id),
    CONSTRAINT watchlist_stock_symbol_key UNIQUE (stock_symbol)
) TABLESPACE pg_default;

-- Create the stockprices table
CREATE TABLE stockprices (
    id SERIAL PRIMARY KEY,
    stock_symbol VARCHAR(10) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stock_symbol) REFERENCES public.watchlist(stock_symbol)
);

-- Ensure stock_symbol is unique in watchlist
ALTER TABLE watchlist
ADD CONSTRAINT unique_stock_symbol UNIQUE (stock_symbol);

-- Add composite index on stock_symbol and timestamp
CREATE INDEX idx_stockprices_symbol_timestamp ON stockprices(stock_symbol, timestamp);

-- Add some sample data (optional)
INSERT INTO public.watchlist (stock_symbol, short_name) VALUES
('AAPL', 'Apple Inc'),
('GOOGL', 'Alphabet Inc'),
('TSLA', 'Tesla Corp');

INSERT INTO stockprices (stock_symbol, price) VALUES
('AAPL', 150.25),
('GOOGL', 2800.50),
('TSLA', 720.15);
