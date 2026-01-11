import { useState, useEffect } from 'react'
import './App.css'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import { calculateForexPL, getPairInfo, calculatePipValue, formatPrice } from './forexCalculator'
import { Plus, X, Search, TrendingUp, TrendingDown, Zap, Plus as PlusCircle, Edit2, Trash2, FileX, XCircle, Menu } from 'lucide-react'

// Common Forex Pairs List
const FOREX_PAIRS = [
  { value: '', label: '-- Select a pair --', category: '' },
  // Major Pairs
  { value: 'EURUSD', label: 'EUR/USD - Euro vs US Dollar', category: 'Major' },
  { value: 'GBPUSD', label: 'GBP/USD - British Pound vs US Dollar', category: 'Major' },
  { value: 'USDJPY', label: 'USD/JPY - US Dollar vs Japanese Yen', category: 'Major' },
  { value: 'USDCHF', label: 'USD/CHF - US Dollar vs Swiss Franc', category: 'Major' },
  { value: 'AUDUSD', label: 'AUD/USD - Australian Dollar vs US Dollar', category: 'Major' },
  { value: 'USDCAD', label: 'USD/CAD - US Dollar vs Canadian Dollar', category: 'Major' },
  { value: 'NZDUSD', label: 'NZD/USD - New Zealand Dollar vs US Dollar', category: 'Major' },
  // Cross Pairs
  { value: 'EURGBP', label: 'EUR/GBP - Euro vs British Pound', category: 'Cross' },
  { value: 'EURJPY', label: 'EUR/JPY - Euro vs Japanese Yen', category: 'Cross' },
  { value: 'GBPJPY', label: 'GBP/JPY - British Pound vs Japanese Yen', category: 'Cross' },
  { value: 'EURCHF', label: 'EUR/CHF - Euro vs Swiss Franc', category: 'Cross' },
  { value: 'AUDJPY', label: 'AUD/JPY - Australian Dollar vs Japanese Yen', category: 'Cross' },
  { value: 'CADJPY', label: 'CAD/JPY - Canadian Dollar vs Japanese Yen', category: 'Cross' },
  // Metals
  { value: 'XAUUSD', label: 'XAU/USD - Gold vs US Dollar', category: 'Metal' },
  { value: 'XAGUSD', label: 'XAG/USD - Silver vs US Dollar', category: 'Metal' },
  // Indices
  { value: 'US30', label: 'US30 - Dow Jones Industrial Average', category: 'Index' },
  { value: 'NAS100', label: 'NAS100 - Nasdaq 100', category: 'Index' },
  { value: 'SPX500', label: 'SPX500 - S&P 500', category: 'Index' },
  { value: 'GER40', label: 'GER40 - DAX 40', category: 'Index' },
  // Crypto
  { value: 'BTCUSD', label: 'BTC/USD - Bitcoin vs US Dollar', category: 'Crypto' },
  { value: 'ETHUSD', label: 'ETH/USD - Ethereum vs US Dollar', category: 'Crypto' },
]

function App({ existingTrades = [], onTradesUpdate }) {
  // View State - removed as it's now in MainApp
  
  // State Management
  const [trades, setTrades] = useState(existingTrades)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [filterType, setFilterType] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('date-desc') // 'date-desc', 'date-asc', 'pl-desc', 'pl-asc'
  const [expandedTrade, setExpandedTrade] = useState(null)
  
  // Searchable dropdown state
  const [pairSearch, setPairSearch] = useState('')
  const [showPairDropdown, setShowPairDropdown] = useState(false)
  
  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState({ show: false, tradeId: null, tradeName: '' })
  
  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    symbol: '',
    type: 'BUY',
    quantity: '',
    entryPrice: '',
    exitPrice: '',
    notes: '',
    screenshot: null,
    riskRewardRatio: '', // e.g., '1:2', '1:3'
    isNoTrade: false // New field for No Trade days
  })

  // Live P/L calculation state
  const [livePL, setLivePL] = useState(0)
  const [pairInfo, setPairInfo] = useState(null)

  // Update trades when existingTrades prop changes
  useEffect(() => {
    setTrades(existingTrades)
  }, [existingTrades])

  // Notify parent component when trades change
  useEffect(() => {
    if (onTradesUpdate && trades !== existingTrades) {
      onTradesUpdate(trades)
    }
  }, [trades])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPairDropdown && !event.target.closest('.searchable-dropdown')) {
        setShowPairDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPairDropdown])

  // Prevent scroll on price inputs only (not lot size)
  useEffect(() => {
    const preventScroll = (e) => {
      if (e.target.type === 'number' && e.target.classList.contains('price-input')) {
        e.preventDefault()
      }
    }

    document.addEventListener('wheel', preventScroll, { passive: false })
    return () => {
      document.removeEventListener('wheel', preventScroll)
    }
  }, [])

  // Handle form input changes
  const handleInputChange = (e) => {
    const updatedFormData = {
      ...formData,
      [e.target.name]: e.target.value
    }
    setFormData(updatedFormData)
    
    // Calculate live P/L when symbol or prices change
    if (updatedFormData.symbol) {
      const info = getPairInfo(updatedFormData.symbol)
      setPairInfo(info)
      
      if (updatedFormData.entryPrice && updatedFormData.exitPrice && updatedFormData.quantity) {
        const pl = calculateForexPL(
          updatedFormData.symbol,
          parseFloat(updatedFormData.quantity),
          parseFloat(updatedFormData.entryPrice),
          parseFloat(updatedFormData.exitPrice),
          updatedFormData.type
        )
        setLivePL(pl)
      }
    }
  }

  // Handle screenshot upload
  const handleScreenshotUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({ ...formData, screenshot: reader.result })
      }
      reader.readAsDataURL(file)
    }
  }

  // Remove screenshot
  const removeScreenshot = () => {
    setFormData({ ...formData, screenshot: null })
  }

  // Handle pair selection from searchable dropdown
  const handlePairSelect = (pairValue) => {
    setFormData({ ...formData, symbol: pairValue })
    setPairSearch(pairValue)  // Show selected pair in search field
    setShowPairDropdown(false)
    
    // Update pair info
    const info = getPairInfo(pairValue)
    setPairInfo(info)
  }

  // Filter pairs based on search
  const filteredPairs = FOREX_PAIRS.filter(pair => {
    if (!pair.value) return false
    // If search is empty or matches selected pair, show all pairs
    if (!pairSearch || pairSearch === formData.symbol) return true
    // Otherwise filter by search term
    return pair.value.toLowerCase().includes(pairSearch.toLowerCase()) ||
           pair.label.toLowerCase().includes(pairSearch.toLowerCase())
  })

  // Add or Update Trade
  const handleSubmit = (e) => {
    e.preventDefault()
    
    const quantity = parseFloat(formData.quantity)
    const entryPrice = parseFloat(formData.entryPrice)
    const exitPrice = parseFloat(formData.exitPrice) || 0
    
    // Use intelligent Forex calculator
    const profitLoss = calculateForexPL(
      formData.symbol,
      quantity,
      entryPrice,
      exitPrice,
      formData.type
    )

    const newTrade = {
      id: editingId || Date.now().toString(),
      ...formData,
      quantity,
      entryPrice,
      exitPrice,
      profitLoss,
      createdAt: editingId ? trades.find(t => t.id === editingId).createdAt : new Date().toISOString()
    }

    if (editingId) {
      setTrades(trades.map(trade => trade.id === editingId ? newTrade : trade))
      setEditingId(null)
    } else {
      setTrades([newTrade, ...trades])
    }

    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      symbol: '',
      type: 'BUY',
      quantity: '',
      entryPrice: '',
      exitPrice: '',
      notes: '',
      screenshot: null,
      riskRewardRatio: ''
    })
    setShowForm(false)
    setLivePL(0)
    setPairInfo(null)
  }

  // Edit Trade
  const handleEdit = (trade) => {
    setFormData({
      date: trade.date,
      symbol: trade.symbol,
      type: trade.type,
      quantity: trade.quantity.toString(),
      entryPrice: trade.entryPrice.toString(),
      exitPrice: trade.exitPrice.toString(),
      notes: trade.notes || '',
      screenshot: trade.screenshot || null,
      riskRewardRatio: trade.riskRewardRatio || ''
    })
    setPairSearch(trade.symbol)
    setEditingId(trade.id)
    setShowForm(true)
    
    // Scroll to form after a short delay to ensure form is rendered
    setTimeout(() => {
      const formElement = document.querySelector('.form-card')
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  // Delete Trade
  const handleDelete = (id) => {
    const trade = trades.find(t => t.id === id)
    setDeleteModal({ 
      show: true, 
      tradeId: id, 
      tradeName: `${trade.symbol} - ${trade.type}` 
    })
  }

  // Confirm Delete
  const confirmDelete = () => {
    const updatedTrades = trades.filter(trade => trade.id !== deleteModal.tradeId)
    setTrades(updatedTrades)
    localStorage.setItem('tradingJournal', JSON.stringify(updatedTrades))
    setDeleteModal({ show: false, tradeId: null, tradeName: '' })
  }

  // Cancel Delete
  const cancelDelete = () => {
    setDeleteModal({ show: false, tradeId: null, tradeName: '' })
  }

  // Cancel Form
  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setLivePL(0)
    setPairInfo(null)
    setPairSearch('')
    setShowPairDropdown(false)
    
    // Complete form reset
    setFormData({
      date: new Date().toISOString().split('T')[0],
      symbol: '',
      type: 'BUY',
      quantity: '',
      entryPrice: '',
      exitPrice: '',
      notes: '',
      screenshot: null,
      riskRewardRatio: ''
    })
  }

  // Calculate Statistics
  const actualTrades = trades.filter(trade => !trade.isNoTrade && trade.symbol !== 'NO-TRADE')
  const stats = {
    totalTrades: actualTrades.length,
    totalProfit: actualTrades.reduce((sum, trade) => sum + (trade.profitLoss > 0 ? trade.profitLoss : 0), 0),
    totalLoss: actualTrades.reduce((sum, trade) => sum + (trade.profitLoss < 0 ? Math.abs(trade.profitLoss) : 0), 0),
    netPL: actualTrades.reduce((sum, trade) => sum + trade.profitLoss, 0),
    winningTrades: actualTrades.filter(t => t.profitLoss > 0).length,
    losingTrades: actualTrades.filter(t => t.profitLoss < 0).length,
  }
  stats.winRate = stats.totalTrades > 0 ? ((stats.winningTrades / stats.totalTrades) * 100).toFixed(1) : 0

  // Filter and Search Trades
  let filteredTrades = trades.filter(trade => {
    const matchesType = filterType === 'ALL' || trade.type === filterType
    const matchesSearch = trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trade.notes.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesType && matchesSearch
  })

  // Sort Trades
  filteredTrades = [...filteredTrades].sort((a, b) => {
    switch(sortBy) {
      case 'date-desc':
        return new Date(b.date) - new Date(a.date)
      case 'date-asc':
        return new Date(a.date) - new Date(b.date)
      case 'pl-desc':
        return b.profitLoss - a.profitLoss
      case 'pl-asc':
        return a.profitLoss - b.profitLoss
      default:
        return new Date(b.date) - new Date(a.date)
    }
  })

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="container">
          <h1>Forex Trading Journal</h1>
          <p className="subtitle">Track your forex trades and improve your strategy</p>
        </div>
      </header>

      <div className="container">
        {/* Add Trade Button - Top */}
        <div className="top-action-bar">
          <button className="btn btn-primary add-trade-btn" onClick={() => {
            if (showForm) {
              handleCancel()  // Use handleCancel to properly clear form
            } else {
              // Reset form before showing
              setFormData({
                date: new Date().toISOString().split('T')[0],
                symbol: '',
                type: 'BUY',
                quantity: '',
                entryPrice: '',
                exitPrice: '',
                notes: '',
                screenshot: null,
                riskRewardRatio: ''
              })
              setPairSearch('')
              setLivePL(0)
              setPairInfo(null)
              setEditingId(null)
              setShowForm(true)
            }
          }}>
            {showForm ? <><X size={16} /> Close</> : <><Plus size={16} /> Add Trade</>}
          </button>
        </div>

        {/* Add/Edit Trade Form */}
        {showForm && (
          <div className="form-card">
            <h2>{editingId ? <><Zap size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} /> Edit Trade</> : <><Plus size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} /> Add New Trade</>}</h2>
            <form onSubmit={handleSubmit}>
              <div className="no-trade-checkbox-wrapper">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isNoTrade}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        isNoTrade: e.target.checked,
                        symbol: e.target.checked ? 'NO-TRADE' : '',
                        type: 'BUY',
                        quantity: e.target.checked ? '0' : '',
                        entryPrice: e.target.checked ? '0' : '',
                        exitPrice: e.target.checked ? '0' : '',
                        profitLoss: 0
                      })
                      if (e.target.checked) {
                        setPairSearch('')
                      }
                    }}
                  />
                  <span className="checkbox-text">No trade found today</span>
                </label>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date </label>
                  <input 
                    type="date" 
                    name="date" 
                    value={formData.date}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
                {!formData.isNoTrade && (
                <div className="form-group">
                  <label>Currency Pair </label>
                  <div className="searchable-dropdown">
                    <input 
                      type="text" 
                      name="pairSearch"
                      placeholder="Search pair (type GOLD, EUR, BTC...)"
                      value={pairSearch}
                      onChange={(e) => {
                        setPairSearch(e.target.value)
                        setShowPairDropdown(true)
                      }}
                      onFocus={() => {
                        if (pairSearch === formData.symbol) {
                          setPairSearch('')  // Clear only if showing selected pair
                        }
                        setShowPairDropdown(true)
                      }}
                      autoComplete="off"
                      className="pair-search-input"
                    />
                    {showPairDropdown && filteredPairs.length > 0 && (
                      <div className="dropdown-list">
                        {filteredPairs.map((pair) => (
                          <div
                            key={pair.value}
                            className={`dropdown-item ${formData.symbol === pair.value ? 'selected' : ''}`}
                            onClick={() => handlePairSelect(pair.value)}
                          >
                            <span className="pair-value">{pair.value}</span>
                            <span className="pair-desc">{pair.label.split(' - ')[1]}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {formData.symbol && (
                      <div className="selected-pair">
                        ✓ <strong>{formData.symbol}</strong>
                      </div>
                    )}
                    <input 
                      type="hidden" 
                      name="symbol" 
                      value={formData.symbol} 
                      required 
                    />
                  </div>
                </div>
                )}
              </div>

              {!formData.isNoTrade && (
              <div className="form-row">
                <div className="form-group">
                  <label>Type </label>
                  <select 
                    name="type" 
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="BUY">Buy</option>
                    <option value="SELL">Sell</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Lot Size </label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0.01"
                    name="quantity" 
                    placeholder="0.01"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="lot-size-input"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Risk To Reward Ratio</label>
                  <select 
                    name="riskRewardRatio" 
                    value={formData.riskRewardRatio}
                    onChange={handleInputChange}
                  >
                    <option value="">-- Select --</option>
                    <option value="1:1">1:1</option>
                    <option value="1:2">1:2</option>    
                    <option value="1:3">1:3</option>
                    <option value="1:4">1:4</option>
                    <option value="1:5">1:5</option>
                    <option value="1:3">1:6</option>
                    <option value="1:3">1:7</option>
                    <option value="1:3">1:8</option>
                    <option value="1:3">1:9</option>
                    <option value="1:3">1:10</option>
                  </select>
                </div>
              </div>
              )}

              {!formData.isNoTrade && (
              <div className="form-row">
                <div className="form-group">
                  <label>Open Price </label>
                  <input 
                    type="number" 
                    name="entryPrice"
                    value={formData.entryPrice}
                    onChange={handleInputChange}
                    onWheel={(e) => e.target.blur()}
                    className="price-input"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Close Price</label>
                  <input 
                    type="number"
                    name="exitPrice"
                    value={formData.exitPrice}
                    onChange={handleInputChange}
                    onWheel={(e) => e.target.blur()}
                    className="price-input"
                  />
                </div>
              </div>
              )}

              <div className="form-group">
                <label>{formData.isNoTrade ? 'Reason for No Trade' : 'Notes'}</label>
                <textarea 
                  name="notes" 
                  placeholder={formData.isNoTrade ? 'Why no trade today? (No setup, bad market, news event, etc.)' : 'Market condition, strategy, technical analysis, news impact.'}
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  required={formData.isNoTrade}
                />
              </div>

              {!formData.isNoTrade && (
              <div className="form-group">
                {!formData.screenshot ? (
                  <div className="screenshot-upload">
                    <p className="screenshot-label">Trade Screenshot (Optional)</p>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleScreenshotUpload}
                      id="screenshot-input"
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="screenshot-input" className="upload-btn">
                      ⬆ Upload Screenshot
                    </label>
                    <p className="upload-hint">Click to upload chart screenshot or trade confirmation</p>
                  </div>
                ) : (
                  <div className="screenshot-preview">
                    <img src={formData.screenshot} alt="Trade screenshot" />
                    <button type="button" className="remove-screenshot" onClick={removeScreenshot}>
                      Remove
                    </button>
                  </div>
                )}
              </div>
              )}

              <div className="form-actions">
                <button type="submit" className="btn btn-success">
                  {editingId ? '⟳ Update ' : '✓ Save'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Statistics Dashboard */}
        {!showForm && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Trades</div>
              <div className="stat-value">{stats.totalTrades}</div>
            </div>
            <div className="stat-card profit">
              <div className="stat-label">Total Profit</div>
              <div className="stat-value">${stats.totalProfit.toFixed(2)}</div>
            </div>
            <div className="stat-card loss">
              <div className="stat-label">Total Loss</div>
              <div className="stat-value">${stats.totalLoss.toFixed(2)}</div>
            </div>
            <div className={`stat-card ${stats.netPL >= 0 ? 'profit' : 'loss'}`}>
              <div className="stat-label">Net P/L</div>
              <div className="stat-value">${stats.netPL.toFixed(2)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Win Rate</div>
              <div className="stat-value">{stats.winRate}%</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Win / Loss</div>
              <div className="stat-value">{stats.winningTrades} / {stats.losingTrades}</div>
            </div>
          </div>
        )}

        {/* Filters Bar */}
        <div className="action-bar">
          <div className="filters-advanced">
            <input 
              type="text" 
              placeholder="Search by pair or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">All Types</option>
              <option value="BUY">Buy Only</option>
              <option value="SELL">Sell Only</option>
            </select>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="date-desc">Latest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="pl-desc">Highest P/L</option>
              <option value="pl-asc">Lowest P/L</option>
            </select>
          </div>
        </div>

        {/* Trades List */}
        <div className="trades-section">
          <div className="trades-header">
            <h2>All Trades</h2>
            <div className="trades-count">{filteredTrades.length} {filteredTrades.length === 1 ? 'trade' : 'trades'}</div>
          </div>
          
          {filteredTrades.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><FileX size={48} strokeWidth={1.5} /></div>
              <h3>No trades found</h3>
              <p className="hint">
                {trades.length === 0 
                  ? 'Start by adding your first trade using the "Add Trade" button above' 
                  : 'Try adjusting your filters or search terms'}
              </p>
            </div>
          ) : (
            <div className={`trades-grid ${viewMode}`}>
              {filteredTrades.map(trade => {
                const isExpanded = expandedTrade === trade.id
                const isNoTrade = trade.isNoTrade || trade.symbol === 'NO-TRADE'
                const isWin = trade.profitLoss >= 0
                const pipValue = trade.pipValue || 0
                const pips = pipValue !== 0 ? (trade.profitLoss / pipValue).toFixed(1) : 0
                
                if (isNoTrade) {
                  return (
                    <div key={trade.id} className="trade-card-advanced no-trade-card">
                      <div className="card-header-advanced">
                        <div className="header-left">
                          <div className="trade-pair">
                            <span className="pair-symbol"><XCircle size={30} style={{ marginRight: '8px', verticalAlign: 'middle' }} />NO TRADE</span>
                            <span className="trade-badge no-trade-badge">No Setup</span>
                          </div>
                          <div className="trade-date">
                            {new Date(trade.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="card-body-advanced">
                        {trade.notes && (
                          <div className="notes-section">
                            <div className="notes-label">Reason:</div>
                            <div className="notes-text">{trade.notes}</div>
                          </div>
                        )}
                      </div>
                      <div className="card-footer-advanced">
                        <div className="action-buttons">
                          <button 
                            className="action-btn delete-btn" 
                            onClick={() => handleDelete(trade.id)}
                            title="Delete Entry"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                }
                
                return (
                  <div key={trade.id} className={`trade-card-advanced ${isWin ? 'win' : 'loss'} ${isExpanded ? 'expanded' : ''}`}>
                    {/* Card Header */}
                    <div className="card-header-advanced">
                      <div className="header-left">
                        <div className="trade-pair">
                          <span className="pair-symbol">{trade.symbol}</span>
                          <span className={`trade-badge ${trade.type.toLowerCase()}`}>
                            {trade.type === 'BUY' ? '▲ LONG' : '▼ SHORT'}
                          </span>
                        </div>
                        <div className="trade-date">
                          ◷ {new Date(trade.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </div>
                      </div>
                      <div className="header-right">
                        <div className={`pl-amount ${isWin ? 'win' : 'loss'}`}>
                          {isWin ? '+' : ''}{trade.profitLoss >= 0 ? '$' : '-$'}{Math.abs(trade.profitLoss).toFixed(2)}
                        </div>
                        {pips !== 0 && (
                          <div className="pips-display">
                            {isWin ? '+' : ''}{pips} pips
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="card-body-advanced">
                      <div className="trade-metrics">
                        <div className="metric">
                          <span className="metric-label">Entry</span>
                          <span className="metric-value">${trade.entryPrice}</span>
                        </div>
                        <div className="metric">
                          <span className="metric-label">Exit</span>
                          <span className="metric-value">${trade.exitPrice || 'Pending'}</span>
                        </div>
                        <div className="metric">
                          <span className="metric-label">Lot Size</span>
                          <span className="metric-value">{trade.quantity}</span>
                        </div>
                        {trade.riskRewardRatio && (
                          <div className="metric">
                            <span className="metric-label">R:R</span>
                            <span className="metric-value rr-badge">{trade.riskRewardRatio}</span>
                          </div>
                        )}
                      </div>

                      {/* Always Show Notes and Screenshot */}
                      {(trade.notes || trade.screenshot) && (
                        <div className="expanded-content">
                          {trade.notes && (
                            <div className="notes-section">
                              <div className="notes-label">⌘ Trade Notes:</div>
                              <div className="notes-text">{trade.notes}</div>
                            </div>
                          )}
                          {trade.screenshot && (
                            <div className="screenshot-section">
                              <img src={trade.screenshot} alt="Trade chart" className="trade-screenshot-img" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="card-footer-advanced">
                      <div className="action-buttons">
                        <button 
                          className="action-btn edit-btn" 
                          onClick={() => handleEdit(trade)}
                          title="Edit Trade"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="action-btn delete-btn" 
                          onClick={() => handleDelete(trade.id)}
                          title="Delete Trade"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      

      {/* Custom Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Trade</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this trade?</p>
              <div className="delete-trade-info">
                <strong>{deleteModal.tradeName}</strong>
              </div>
              <p className="warning-text">This action cannot be undone!</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={confirmDelete}>
                Yes, Delete
              </button>
              <button className="btn btn-secondary" onClick={cancelDelete}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// New Main App Component with Layout
function MainApp() {
  const [activeView, setActiveView] = useState(() => {
    return localStorage.getItem('activeView') || 'dashboard'
  })
  const [strategies, setStrategies] = useState({})
  const [currentStrategy, setCurrentStrategy] = useState(null)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [showStrategyModal, setShowStrategyModal] = useState(false)
  const [newStrategyName, setNewStrategyName] = useState('')
  const [tempBalance, setTempBalance] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect window resize for mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    // Check on mount
    checkMobile()
    
    const handleResize = () => {
      checkMobile()
      if (window.innerWidth > 768) {
        setSidebarOpen(false) // Close sidebar when switching to desktop
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Save active view to localStorage
  useEffect(() => {
    localStorage.setItem('activeView', activeView)
  }, [activeView])

  // Load strategies from localStorage on mount
  useEffect(() => {
    const savedStrategies = localStorage.getItem('tradingStrategies')
    if (savedStrategies) {
      const parsedStrategies = JSON.parse(savedStrategies)
      setStrategies(parsedStrategies)
      
      const lastStrategy = localStorage.getItem('currentStrategy')
      if (lastStrategy && parsedStrategies[lastStrategy]) {
        setCurrentStrategy(lastStrategy)
      } else {
        const firstStrategy = Object.keys(parsedStrategies)[0]
        if (firstStrategy) {
          setCurrentStrategy(firstStrategy)
        }
      }
    }
  }, [])

  // Save strategies to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(strategies).length > 0) {
      localStorage.setItem('tradingStrategies', JSON.stringify(strategies))
    } else {
      localStorage.removeItem('tradingStrategies')
      localStorage.removeItem('currentStrategy')
    }
  }, [strategies])

  // Save current strategy selection
  useEffect(() => {
    if (currentStrategy) {
      localStorage.setItem('currentStrategy', currentStrategy)
    }
  }, [currentStrategy])

  const handleCreateStrategy = () => {
    if (!newStrategyName.trim()) return
    
    const balance = parseFloat(tempBalance) || 10000
    const strategyId = Date.now().toString()
    
    const newStrategy = {
      id: strategyId,
      name: newStrategyName.trim(),
      startingBalance: balance,
      trades: [],
      createdAt: new Date().toISOString()
    }
    
    // Update strategies first
    setStrategies(prev => ({
      ...prev,
      [strategyId]: newStrategy
    }))
    
    // Set current strategy
    setCurrentStrategy(strategyId)
    
    // Close modals
    setShowWelcomeModal(false)
    setShowStrategyModal(false)
    
    // Reset form
    setNewStrategyName('')
    setTempBalance('10000')
    
    // Switch to dashboard view
    setActiveView('dashboard')
  }

  const handleAddNewStrategy = () => {
    setNewStrategyName('')
    setTempBalance('10000') // Set a default value
    setShowStrategyModal(true)
  }

  const handleSwitchStrategy = (strategyId) => {
    setCurrentStrategy(strategyId)
  }

  const handleDeleteStrategy = (strategyId) => {
    const newStrategies = { ...strategies }
    delete newStrategies[strategyId]
    setStrategies(newStrategies)
    
    if (currentStrategy === strategyId) {
      const firstStrategy = Object.keys(newStrategies)[0]
      setCurrentStrategy(firstStrategy || null)
    }
  }

  const updateStrategyTrades = (trades) => {
    if (!currentStrategy) return
    
    setStrategies(prev => ({
      ...prev,
      [currentStrategy]: {
        ...prev[currentStrategy],
        trades: trades
      }
    }))
  }

  const getCurrentStrategyData = () => {
    if (!currentStrategy || !strategies[currentStrategy]) {
      return { trades: [], startingBalance: 10000, name: '' }
    }
    return strategies[currentStrategy]
  }

  const currentStrategyData = getCurrentStrategyData()

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard 
          trades={currentStrategyData.trades} 
          startingBalance={currentStrategyData.startingBalance}
          hasStrategy={!!currentStrategy}
          onCreateStrategy={handleAddNewStrategy}
        />
      case 'trades':
        if (!currentStrategy) {
          return (
            <div className="trades-empty-state">
              <div className="empty-state-content">
                <div className="empty-state-icon">
                  <TrendingUp size={64} strokeWidth={2} />
                </div>
                <h2>No Strategy Selected</h2>
                <p>Create your first startegy and track your trades</p>
                <button 
                  className="btn btn-primary btn-large create-strategy-btn"
                  onClick={handleAddNewStrategy}
                >
                  <Plus size={20} strokeWidth={3} />
                  Create Your First Strategy
                </button>
              </div>
            </div>
          )
        }
        return <App 
          existingTrades={currentStrategyData.trades}
          onTradesUpdate={updateStrategyTrades}
        />
      case 'daily-journal':
        return <div className="coming-soon"><h2>Daily Journal</h2><p>Coming soon...</p></div>
      case 'notebook':
        return <div className="coming-soon"><h2>Notebook</h2><p>Coming soon...</p></div>
      case 'playbook':
        return <div className="coming-soon"><h2>Playbook</h2><p>Coming soon...</p></div>
      case 'reports':
        return <div className="coming-soon"><h2>Reports</h2><p>Coming soon...</p></div>
      case 'insights':
        return <div className="coming-soon"><h2>Insights</h2><p>Coming soon...</p></div>
      default:
        return <Dashboard 
          trades={currentStrategyData.trades} 
          startingBalance={currentStrategyData.startingBalance}
          hasStrategy={!!currentStrategy}
          onCreateStrategy={handleAddNewStrategy}
        />
    }
  }

  return (
    <>
      <div className="app-container">
        {/* Sidebar overlay for mobile only */}
        {isMobile && sidebarOpen && (
          <div 
            className="sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        <Sidebar 
          activeView={activeView} 
          setActiveView={setActiveView}
          strategies={strategies}
          currentStrategy={currentStrategy}
          onSwitchStrategy={handleSwitchStrategy}
          onAddStrategy={handleAddNewStrategy}
          onDeleteStrategy={handleDeleteStrategy}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        
        {/* Mobile hamburger menu - only show on mobile when sidebar is closed */}
        {isMobile && !sidebarOpen && (
          <button 
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
        )}
        
        <main className="main-content">
          {renderView()}
        </main>
      </div>



      {/* Add New Strategy Modal */}
      {showStrategyModal && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowStrategyModal(false)}
        >
          <div 
            className="modal-content welcome-modal" 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="modal-close-btn"
              onClick={() => setShowStrategyModal(false)}
              aria-label="Close"
              type="button"
            >
              <X size={24} />
            </button>
            <div className="modal-header">
              <h2><PlusCircle size={24} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} /> New Trading Strategy</h2>
            </div>
            <div className="modal-body">
              <div className="welcome-balance-input">
                <label>Strategy Name *</label>
                <input
                  type="text"
                  value={newStrategyName}
                  onChange={(e) => setNewStrategyName(e.target.value)}
                  placeholder="e.g., Day Trading, Options Strategy"
                  autoFocus
                />
              </div>

              <div className="welcome-balance-input">
                <label>Starting Balance ($) *</label>
                <input
                  type="number"
                  value={tempBalance}
                  onChange={(e) => setTempBalance(e.target.value)}
                  placeholder="e.g., 10000"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newStrategyName.trim()) {
                      handleCreateStrategy()
                    }
                  }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowStrategyModal(false)}
                type="button"
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleCreateStrategy}
                disabled={!newStrategyName.trim()}
                type="button"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default MainApp
