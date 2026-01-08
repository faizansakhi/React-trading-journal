import { useState, useEffect } from 'react'
import './App.css'
import { calculateForexPL, getPairInfo, calculatePipValue, formatPrice } from './forexCalculator'

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

function App() {
  // State Management
  const [trades, setTrades] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [filterType, setFilterType] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  
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
    riskRewardRatio: '' // e.g., '1:2', '1:3'
  })

  // Live P/L calculation state
  const [livePL, setLivePL] = useState(0)
  const [pairInfo, setPairInfo] = useState(null)

  // Load trades from localStorage on mount
  useEffect(() => {
    const savedTrades = localStorage.getItem('tradingJournal')
    if (savedTrades) {
      setTrades(JSON.parse(savedTrades))
    }
  }, [])

  // Save trades to localStorage whenever they change
  useEffect(() => {
    if (trades.length > 0) {
      localStorage.setItem('tradingJournal', JSON.stringify(trades))
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
  const stats = {
    totalTrades: trades.length,
    totalProfit: trades.reduce((sum, trade) => sum + (trade.profitLoss > 0 ? trade.profitLoss : 0), 0),
    totalLoss: trades.reduce((sum, trade) => sum + (trade.profitLoss < 0 ? Math.abs(trade.profitLoss) : 0), 0),
    netPL: trades.reduce((sum, trade) => sum + trade.profitLoss, 0),
    winningTrades: trades.filter(t => t.profitLoss > 0).length,
    losingTrades: trades.filter(t => t.profitLoss < 0).length,
  }
  stats.winRate = stats.totalTrades > 0 ? ((stats.winningTrades / stats.totalTrades) * 100).toFixed(1) : 0

  // Filter and Search Trades
  const filteredTrades = trades.filter(trade => {
    const matchesType = filterType === 'ALL' || trade.type === filterType
    const matchesSearch = trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trade.notes.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesType && matchesSearch
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
        {/* Statistics Dashboard */}
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

        {/* Action Buttons */}
        <div className="action-bar">
          <button className="btn btn-primary" onClick={() => {
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
            {showForm ? '❌ Close' : '➕ Add Trade'}
          </button>
          
          <div className="filters">
            <input 
              type="text" 
              placeholder="Search pair or notes (EURUSD, GOLD, etc.)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">All Trades</option>
              <option value="BUY">Buy Only</option>
              <option value="SELL">Sell Only</option>
            </select>
          </div>
        </div>

        {/* Add/Edit Trade Form */}
        {showForm && (
          <div className="form-card">
            <h2>{editingId ? '✏️ Edit Trade' : '➕ Add New Trade'}</h2>
            <form onSubmit={handleSubmit}>
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
                        ✅ <strong>{formData.symbol}</strong>
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
              </div>

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
                    <option value="1:1.5">1:1.5</option>
                    <option value="1:2">1:2</option>
                    <option value="1:2.5">1:2.5</option>
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

              <div className="form-group">
                <label>Notes</label>
                <textarea 
                  name="notes" 
                  placeholder="Market condition, strategy, technical analysis, news impact."
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>

              {/* Screenshot Upload */}
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
                      📷 Upload Screenshot
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

              <div className="form-actions">
                <button type="submit" className="btn btn-success">
                  {editingId ? '💾 Update ' : '✅ Save'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Trades List */}
        <div className="trades-section">
          <h2>📋 All Trades ({filteredTrades.length})</h2>
          
          {filteredTrades.length === 0 ? (
            <div className="empty-state">
              <p>😔 No trades found!</p>
              <p className="hint">
                {trades.length === 0 
                  ? 'Add your first forex trade using the "Add Trade" button above' 
                  : 'Try changing your filter or search terms'}
              </p>
            </div>
          ) : (
            <div className="trades-list">
              {filteredTrades.map(trade => (
                <div key={trade.id} className="trade-card">
                  <div className="trade-header">
                    <div className="trade-symbol">
                      <span className={`badge ${trade.type === 'BUY' ? 'badge-buy' : 'badge-sell'}`}>
                        {trade.type}
                      </span>
                      <h3>{trade.symbol}</h3>
                    </div>
                    <div className={`trade-pl ${trade.profitLoss >= 0 ? 'profit' : 'loss'}`}>
                      {trade.profitLoss >= 0 ? '📈' : '📉'} ${Math.abs(trade.profitLoss).toFixed(2)}
                    </div>
                  </div>

                  <div className="trade-details">
                    <div className="detail-item">
                      <span className="label">Date:</span>
                      <span className="value">{new Date(trade.date).toLocaleDateString('en-US')}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Lot Size:</span>
                      <span className="value">{trade.quantity}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Open Price:</span>
                      <span className="value">${trade.entryPrice}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Close Price:</span>
                      <span className="value">{trade.exitPrice > 0 ? `$${trade.exitPrice}` : 'Pending'}</span>
                    </div>
                    {trade.riskRewardRatio && (
                      <div className="detail-item">
                        <span className="label">Risk:Reward:</span>
                        <span className="value badge-rr">{trade.riskRewardRatio}</span>
                      </div>
                    )}
                  </div>

                  {trade.notes && (
                    <div className="trade-notes">
                      <strong>Notes:</strong> {trade.notes}
                    </div>
                  )}

                  {trade.screenshot && (
                    <div className="trade-screenshot">
                      <img src={trade.screenshot} alt="Trade screenshot" />
                    </div>
                  )}

                  <div className="trade-actions">
                    <button className="btn-icon btn-edit" onClick={() => handleEdit(trade)} title="Edit">
                      Edit
                    </button>
                    <button className="btn-icon btn-delete" onClick={() => handleDelete(trade.id)} title="Delete">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      

      {/* Custom Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🗑️ Delete Trade</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this trade?</p>
              <div className="delete-trade-info">
                <strong>{deleteModal.tradeName}</strong>
              </div>
              <p className="warning-text">⚠️ This action cannot be undone!</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={confirmDelete}>
                🗑️ Yes, Delete
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

export default App
