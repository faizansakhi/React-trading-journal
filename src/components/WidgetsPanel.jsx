const WidgetsPanel = ({ stats, formatCurrency, startingBalance }) => {
  const currentBalance = startingBalance + stats.netPL

  return (
    <div className="widgets-panel">
      <div className="widget-card">
        <div className="widget-header">
          <span className="widget-title">Account Balance & P&L</span>
        </div>
        <div className="widget-main-value">
          {formatCurrency(currentBalance)}
        </div>
        <div className="widget-subtitle">
          Starting: <span className="neutral">{formatCurrency(startingBalance)}</span>
        </div>
        <div className="widget-subtitle">
          P&L: <span className={stats.netPL >= 0 ? 'positive' : 'negative'}>
            {formatCurrency(stats.netPL)}
          </span>
        </div>
      </div>

      <div className="widget-card">
        <div className="widget-header">
          <span className="widget-title">Trade Win %</span>
        </div>
        <div className="widget-main-value large">
          {stats.tradeWinRate.toFixed(2)}%
        </div>
        <div className="widget-chart">
          <svg viewBox="0 0 100 100" className="donut-chart">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#2a2a3e"
              strokeWidth="20"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="20"
              strokeDasharray={`${stats.tradeWinRate * 2.51} 251`}
              strokeDashoffset="0"
              transform="rotate(-90 50 50)"
              className="donut-segment"
            />
          </svg>
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-color win"></span>
              <span className="legend-label">Won: {stats.winningTrades}</span>
            </div>
            <div className="legend-item">
              <span className="legend-color loss"></span>
              <span className="legend-label">Lost: {stats.totalTrades - stats.winningTrades}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="widget-card">
        <div className="widget-header">
          <span className="widget-title">Trade Expectancy</span>
        </div>
        <div className="widget-main-value">
          {formatCurrency(stats.tradeExpectancy)}
        </div>
        <div className="widget-subtitle">
          Average per trade
        </div>
      </div>
    </div>
  )
}

export default WidgetsPanel
