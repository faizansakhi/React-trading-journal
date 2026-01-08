/**
 * Forex Profit/Loss Calculator
 * Automatically calculates P/L based on pair type and lot size
 */

// Contract sizes for different instrument types
const CONTRACT_SIZES = {
  // Major and Minor Forex Pairs
  FOREX_STANDARD: 100000,    // 1 lot = 100,000 units
  
  // Metals
  XAUUSD: 100,              // Gold: 1 lot = 100 oz
  XAGUSD: 5000,             // Silver: 1 lot = 5000 oz
  
  // Indices (varies by broker, these are common)
  US30: 1,                  // Dow Jones
  NAS100: 1,                // Nasdaq
  SPX500: 1,                // S&P 500
  
  // Crypto (if trading CFDs)
  BTCUSD: 1,
  ETHUSD: 1,
}

// Pip values and decimal places for different pairs
const PAIR_CONFIG = {
  // Major Pairs (most traded)
  'EURUSD': { pipPosition: 4, contractSize: 100000 },
  'GBPUSD': { pipPosition: 4, contractSize: 100000 },
  'USDJPY': { pipPosition: 2, contractSize: 100000 },
  'USDCHF': { pipPosition: 4, contractSize: 100000 },
  'AUDUSD': { pipPosition: 4, contractSize: 100000 },
  'NZDUSD': { pipPosition: 4, contractSize: 100000 },
  'USDCAD': { pipPosition: 4, contractSize: 100000 },
  
  // Cross Pairs
  'EURGBP': { pipPosition: 4, contractSize: 100000 },
  'EURJPY': { pipPosition: 2, contractSize: 100000 },
  'GBPJPY': { pipPosition: 2, contractSize: 100000 },
  'EURCHF': { pipPosition: 4, contractSize: 100000 },
  'AUDJPY': { pipPosition: 2, contractSize: 100000 },
  'CADJPY': { pipPosition: 2, contractSize: 100000 },
  
  // Metals (Gold/Silver)
  'XAUUSD': { pipPosition: 2, contractSize: 100 },      // Gold
  'XAGUSD': { pipPosition: 3, contractSize: 5000 },     // Silver
  
  // Indices
  'US30': { pipPosition: 0, contractSize: 1 },          // Dow Jones
  'NAS100': { pipPosition: 1, contractSize: 1 },        // Nasdaq
  'SPX500': { pipPosition: 1, contractSize: 1 },        // S&P 500
  'GER40': { pipPosition: 1, contractSize: 1 },         // DAX
  
  // Crypto CFDs
  'BTCUSD': { pipPosition: 2, contractSize: 1 },
  'ETHUSD': { pipPosition: 2, contractSize: 1 },
}

/**
 * Calculate Forex Profit/Loss
 * @param {string} pair - Currency pair (e.g., "EURUSD", "XAUUSD")
 * @param {number} lotSize - Lot size (e.g., 0.01, 0.10, 1.00)
 * @param {number} entryPrice - Entry price
 * @param {number} exitPrice - Exit price
 * @param {string} tradeType - "BUY" or "SELL"
 * @returns {number} - Profit/Loss in USD
 */
export function calculateForexPL(pair, lotSize, entryPrice, exitPrice, tradeType) {
  if (!exitPrice || exitPrice === 0) return 0
  
  const pairUpper = pair.toUpperCase().replace(/[^A-Z0-9]/g, '')
  const config = PAIR_CONFIG[pairUpper]
  
  // Default to standard forex if pair not found
  const contractSize = config ? config.contractSize : 100000
  
  // Calculate price difference
  const priceDiff = tradeType === 'BUY' 
    ? (exitPrice - entryPrice) 
    : (entryPrice - exitPrice)
  
  // Special calculation for different instrument types
  if (pairUpper.startsWith('XAU')) {
    // Gold: Simple calculation
    // 1 lot = 100 oz, so 0.01 lot = 1 oz
    // Price move $10 with 0.01 lot = $10 profit
    return priceDiff * lotSize * 100
  } 
  else if (pairUpper.startsWith('XAG')) {
    // Silver: 1 lot = 5000 oz
    return priceDiff * lotSize * 5000
  }
  else if (pairUpper.includes('JPY')) {
    // JPY pairs: 2 decimal places
    const pipValue = (0.01 / entryPrice) * contractSize * lotSize
    return priceDiff * pipValue * 100
  }
  else if (['US30', 'NAS100', 'SPX500', 'GER40'].includes(pairUpper)) {
    // Indices: Direct point value
    return priceDiff * lotSize
  }
  else if (pairUpper.includes('BTC') || pairUpper.includes('ETH')) {
    // Crypto CFDs: Direct calculation
    return priceDiff * lotSize
  }
  else {
    // Standard Forex Pairs (EURUSD, GBPUSD, etc.)
    // 1 standard lot = 100,000 units
    // 1 pip = 0.0001 for most pairs
    return priceDiff * lotSize * 100000
  }
}

/**
 * Get formatted pair info
 * @param {string} pair - Currency pair
 * @returns {object} - Pair information
 */
export function getPairInfo(pair) {
  const pairUpper = pair.toUpperCase().replace(/[^A-Z0-9]/g, '')
  const config = PAIR_CONFIG[pairUpper]
  
  if (!config) {
    return {
      name: pair,
      type: 'Forex Pair',
      contractSize: 100000,
      pipPosition: 4
    }
  }
  
  let type = 'Forex Pair'
  if (pairUpper.startsWith('XAU')) type = 'Gold'
  else if (pairUpper.startsWith('XAG')) type = 'Silver'
  else if (['US30', 'NAS100', 'SPX500', 'GER40'].includes(pairUpper)) type = 'Index'
  else if (pairUpper.includes('BTC') || pairUpper.includes('ETH')) type = 'Crypto'
  
  return {
    name: pairUpper,
    type: type,
    contractSize: config.contractSize,
    pipPosition: config.pipPosition
  }
}

/**
 * Calculate pip value in dollars
 * @param {string} pair - Currency pair
 * @param {number} lotSize - Lot size
 * @returns {number} - Pip value in USD
 */
export function calculatePipValue(pair, lotSize) {
  const pairUpper = pair.toUpperCase().replace(/[^A-Z0-9]/g, '')
  const config = PAIR_CONFIG[pairUpper] || { contractSize: 100000, pipPosition: 4 }
  
  if (pairUpper.startsWith('XAU')) {
    // Gold: $1 move = $100 for 1 lot, $1 for 0.01 lot
    return 100 * lotSize
  } else if (pairUpper.startsWith('XAG')) {
    // Silver: $1 move = $5000 for 1 lot
    return 5000 * lotSize
  } else if (pairUpper.includes('JPY')) {
    // JPY pairs: 1 pip = 0.01
    return (config.contractSize * lotSize) / 100
  } else {
    // Standard pairs: 1 pip = 0.0001
    return (config.contractSize * lotSize) * 0.0001
  }
}

/**
 * Format price based on pair type
 * @param {string} pair - Currency pair
 * @param {number} price - Price to format
 * @returns {string} - Formatted price
 */
export function formatPrice(pair, price) {
  const pairUpper = pair.toUpperCase().replace(/[^A-Z0-9]/g, '')
  const config = PAIR_CONFIG[pairUpper]
  
  if (!config) return price.toFixed(5)
  
  return price.toFixed(config.pipPosition)
}

export default {
  calculateForexPL,
  getPairInfo,
  calculatePipValue,
  formatPrice
}
