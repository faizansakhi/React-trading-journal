import { useState } from 'react'
import { LayoutDashboard, TrendingUp, BookOpen, NotebookPen, BookMarked, FileText, Zap, X, ChevronUp, ChevronDown, Plus, Diamond } from 'lucide-react'

const Sidebar = ({ 
  activeView, 
  setActiveView, 
  strategies, 
  currentStrategy, 
  onSwitchStrategy, 
  onAddStrategy,
  onDeleteStrategy,
  isOpen = false,
  onClose
}) => {
  const [showStrategies, setShowStrategies] = useState(false)
  const [deleteModal, setDeleteModal] = useState({ show: false, strategyId: null, strategyName: '' })

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'trades', label: 'Trades', icon: TrendingUp },
    { id: 'daily-journal', label: 'Daily Journal', icon: BookOpen },
    { id: 'notebook', label: 'Notebook', icon: NotebookPen },
    { id: 'playbook', label: 'Playbook', icon: BookMarked },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'insights', label: 'Insights', icon: Zap },
  ]

  const strategiesArray = Object.values(strategies || {})
  const currentStrategyData = strategies?.[currentStrategy]

  const handleNavClick = (viewId) => {
    setActiveView(viewId)
    if (onClose) onClose() // Close sidebar on mobile after navigation
  }

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h1 className="sidebar-logo">
          <span className="logo-icon"><Diamond size={20} /></span>
          <span className="logo-text">Trading Jouranl</span>
        </h1>
      </div>

      {/* Strategy Selector */}
      {strategiesArray.length > 0 && (
        <div className="strategy-selector">
          <button 
            className="current-strategy-btn"
            onClick={() => setShowStrategies(!showStrategies)}
          >
            <div className="strategy-info">
              <span className="strategy-label">Current Strategy</span>
              <span className="strategy-name-text">{currentStrategyData?.name || 'Select Strategy'}</span>
            </div>
            <span className="dropdown-arrow">{showStrategies ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
          </button>

          {showStrategies && (
            <div className="strategy-dropdown">
              <div className="strategy-list">
                {strategiesArray.map((strategy) => (
                  <div 
                    key={strategy.id}
                    className={`strategy-item ${currentStrategy === strategy.id ? 'active' : ''}`}
                  >
                    <button
                      className="strategy-select-btn"
                      onClick={() => {
                        onSwitchStrategy(strategy.id)
                        setShowStrategies(false)
                      }}
                    >
                      <span className="strategy-item-name">{strategy.name}</span>
                      <span className="strategy-trades-count">{strategy.trades?.length || 0} trades</span>
                    </button>
                    <button
                      className="strategy-delete-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteModal({
                            show: true,
                            strategyId: strategy.id,
                            strategyName: strategy.name
                          })
                        }}
                        title="Delete Strategy"
                      >
                        <X size={16} />
                      </button>
                  </div>
                ))}
              </div>
              <button 
                className="add-strategy-btn"
                onClick={() => {
                  onAddStrategy()
                  setShowStrategies(false)
                }}
              >
                <span className="add-icon"><Plus size={16} /></span>
                Add New Strategy
              </button>
            </div>
          )}
        </div>
      )}

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const IconComponent = item.icon
          return (
          <button
            key={item.id}
            className={`sidebar-nav-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => handleNavClick(item.id)}
          >
            <span className="nav-icon"><IconComponent size={20} /></span>
            <span className="nav-label">{item.label}</span>
          </button>
          )
        })}
      </nav>

      {/* Delete Strategy Confirmation Modal */}
      {deleteModal.show && (
        <div className="modal-overlay" onClick={() => setDeleteModal({ show: false, strategyId: null, strategyName: '' })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Strategy</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this strategy?</p>
              <div className="delete-trade-info">
                <strong>{deleteModal.strategyName}</strong>
              </div>
              <p className="warning-text">All trades in this strategy will be permanently deleted!</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-danger" 
                onClick={() => {
                  onDeleteStrategy(deleteModal.strategyId)
                  setDeleteModal({ show: false, strategyId: null, strategyName: '' })
                }}
              >
                Yes, Delete
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => setDeleteModal({ show: false, strategyId: null, strategyName: '' })}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sidebar
