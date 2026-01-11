import { useState, useMemo } from 'react'
import Calendar from './Calendar'
import WidgetsPanel from './WidgetsPanel'
import { TrendingUp, DollarSign, Calendar as CalendarIcon, BarChart3, Plus } from 'lucide-react'

const Dashboard = ({ trades, startingBalance, hasStrategy, onCreateStrategy }) => {
  // MUST call all hooks before ANY conditional returns
  const [dateRange, setDateRange] = useState('all')
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Calculate statistics with useMemo for performance - MUST be before conditional return
  const stats = useMemo(() => {
    if (!trades || trades.length === 0) {
      return {
        netPL: 0,
        profitFactor: 0,
        currentStreak: { type: 'none', count: 0 },
        monthlyStats: { profit: 0, days: 0 },
        tradeWinRate: 0,
        tradeExpectancy: 0,
        totalTrades: 0,
        winningTrades: 0,
      }
    }

    // Filter out No Trade entries
    const actualTrades = trades.filter(trade => !trade.isNoTrade && trade.symbol !== 'NO-TRADE')

    let netPL = 0
    let totalProfit = 0
    let totalLoss = 0
    let winningTrades = 0
    let currentStreakCount = 0
    let currentStreakType = 'none'

    actualTrades.forEach((trade, index) => {
      const pl = parseFloat(trade.profitLoss) || 0
      netPL += pl

      if (pl > 0) {
        totalProfit += pl
        winningTrades++
        if (currentStreakType === 'win' || currentStreakType === 'none') {
          currentStreakCount = currentStreakType === 'win' ? currentStreakCount + 1 : 1
          currentStreakType = 'win'
        } else {
          currentStreakCount = 1
          currentStreakType = 'win'
        }
      } else if (pl < 0) {
        totalLoss += Math.abs(pl)
        if (currentStreakType === 'loss' || currentStreakType === 'none') {
          currentStreakCount = currentStreakType === 'loss' ? currentStreakCount + 1 : 1
          currentStreakType = 'loss'
        } else {
          currentStreakCount = 1
          currentStreakType = 'loss'
        }
      }
    })

    const profitFactor = totalLoss === 0 ? totalProfit : totalProfit / totalLoss
    const tradeWinRate = actualTrades.length > 0 ? (winningTrades / actualTrades.length) * 100 : 0
    const tradeExpectancy = actualTrades.length > 0 ? netPL / actualTrades.length : 0

    // Calculate monthly stats (current month) - exclude No Trade days
    const currentMonthTrades = actualTrades.filter(trade => {
      const tradeDate = new Date(trade.date)
      return tradeDate.getMonth() === currentMonth.getMonth() &&
             tradeDate.getFullYear() === currentMonth.getFullYear()
    })

    const monthlyProfit = currentMonthTrades.reduce((sum, trade) => 
      sum + (parseFloat(trade.profitLoss) || 0), 0
    )

    const uniqueDays = new Set(currentMonthTrades.map(t => t.date)).size

    return {
      netPL,
      profitFactor,
      currentStreak: { type: currentStreakType, count: currentStreakCount },
      monthlyStats: { profit: monthlyProfit, days: uniqueDays },
      tradeWinRate,
      tradeExpectancy,
      totalTrades: actualTrades.length,
      winningTrades,
    }
  }, [trades, currentMonth])

  // NOW conditional return AFTER all hooks
  if (!hasStrategy) {
    return (
      <div className="dashboard-empty-state">
        <div className="empty-state-content">
          <div className="empty-state-icon">
            <BarChart3 size={64} strokeWidth={2} />
          </div>
          <h2>Welcome to Trading Journal!</h2>
          <p>Create your first strategy to start your trading journey</p>
          <button 
            className="btn btn-primary btn-large create-strategy-btn"
            onClick={onCreateStrategy}
            type="button"
          >
            <Plus size={20} strokeWidth={3} />
            Create Your First Strategy
          </button>
          <div className="empty-state-features">
            <div className="feature-item">
              <div className="feature-icon">
                <TrendingUp size={24} strokeWidth={2} />
              </div>
              <span>Track Multiple Strategies</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <DollarSign size={24} strokeWidth={2} />
              </div>
              <span>Monitor P&L in Real-time</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <CalendarIcon size={24} strokeWidth={2} />
              </div>
              <span>Calendar View of Trades</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <BarChart3 size={24} strokeWidth={2} />
              </div>
              <span>Detailed Analytics</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value)
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']

  const changeMonth = (direction) => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(currentMonth.getMonth() + direction)
    setCurrentMonth(newMonth)
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <div className="dashboard-filters">
          <div className="filter-group">
            <label>
              <CalendarIcon size={14} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
              Date range
            </label>
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-main">
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-label">
                Net P&L
              </div>
              <div className={`stat-value ${stats.netPL >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(stats.netPL)}
              </div>
              <div className="stat-change">
                {stats.totalTrades} trades
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-label">
                Profit Factor
              </div>
              <div className="stat-value">
                {stats.profitFactor.toFixed(2)}
              </div>
              <div className="stat-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${Math.min(stats.profitFactor * 33.33, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-label">
                Current Streak
              </div>
              <div className="stat-streak">
                <div className={`streak-badge ${stats.currentStreak.type}`}>
                  {stats.currentStreak.count}
                </div>
                <div className="streak-info">
                  <div className="streak-type">{stats.currentStreak.type === 'win' ? 'WIN' : stats.currentStreak.type === 'loss' ? 'LOSS' : 'NONE'}</div>
                  <div className="streak-label">{stats.currentStreak.type === 'win' ? `${stats.currentStreak.count} days` : stats.currentStreak.type === 'loss' ? `${stats.currentStreak.count} days` : '0 days'}</div>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Monthly stats:</div>
              <div className="monthly-stats">
                <div className="monthly-stat-item">
                  <span className="monthly-label">{formatCurrency(stats.monthlyStats.profit)}</span>
                  <span className="monthly-sublabel">{stats.monthlyStats.days} days</span>
                </div>
              </div>
            </div>
          </div>

          <div className="calendar-section">
            <div className="calendar-header">
              <button className="month-nav" onClick={() => changeMonth(-1)}>‹</button>
              <h3>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
              <button className="month-nav" onClick={() => changeMonth(1)}>›</button>
            </div>
            <Calendar trades={trades} currentMonth={currentMonth} />
          </div>
        </div>

        <WidgetsPanel stats={stats} formatCurrency={formatCurrency} startingBalance={startingBalance} />
      </div>
    </div>
  )
}

export default Dashboard
