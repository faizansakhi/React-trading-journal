import { useMemo } from 'react'

const Calendar = ({ trades, currentMonth }) => {
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  // Memoize month data calculation
  const monthData = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek, year, month }
  }, [currentMonth])

  // Memoize calendar days calculation
  const calendarDays = useMemo(() => {
    const days = []
    
    // Add empty cells for days before month starts
    for (let i = 0; i < monthData.startingDayOfWeek; i++) {
      days.push({ isEmpty: true, key: `empty-${i}` })
    }

    // Add days of the month
    for (let day = 1; day <= monthData.daysInMonth; day++) {
      const date = new Date(monthData.year, monthData.month, day)
      
      // Filter trades for this date
      const dayTrades = trades.filter(trade => {
        const tradeDate = new Date(trade.date)
        return tradeDate.getDate() === date.getDate() &&
               tradeDate.getMonth() === date.getMonth() &&
               tradeDate.getFullYear() === date.getFullYear()
      })

      // Calculate day P&L
      const dayPL = dayTrades.reduce((sum, trade) => 
        sum + (parseFloat(trade.profitLoss) || 0), 0)

      days.push({
        day,
        date,
        trades: dayTrades,
        pl: dayPL,
        key: `day-${day}`,
      })
    }

    return days
  }, [trades, monthData])

  return (
    <div className="calendar">
      <div className="calendar-weekdays">
        {weekDays.map(day => (
          <div key={day} className="calendar-weekday">{day}</div>
        ))}
      </div>

      <div className="calendar-days">
        {calendarDays.map((dayData) => {
          if (dayData.isEmpty) {
            return <div key={dayData.key} className="calendar-day empty"></div>
          }

          const hasPositive = dayData.pl > 0
          const hasNegative = dayData.pl < 0
          const hasTrades = dayData.trades.length > 0
          
          // Check if this is today's date
          const today = new Date()
          const isToday = dayData.date.getDate() === today.getDate() &&
                         dayData.date.getMonth() === today.getMonth() &&
                         dayData.date.getFullYear() === today.getFullYear()

          return (
            <div 
              key={dayData.key} 
              className={`calendar-day ${hasTrades ? 'has-trades' : ''} ${hasPositive ? 'positive' : ''} ${hasNegative ? 'negative' : ''} ${isToday ? 'today' : ''}`}
            >
              <div className="day-number">{dayData.day}</div>
              {hasTrades && (
                <div className="day-info">
                  <div className="day-pl">{formatCurrency(dayData.pl)}</div>
                  <div className="day-trades">{dayData.trades.length} trade{dayData.trades.length > 1 ? 's' : ''}</div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Calendar
