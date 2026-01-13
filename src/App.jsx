import { useState, useEffect } from 'react'
import PinLogin from './components/PinLogin'
import NavigationHub from './components/NavigationHub'
import TodoApp from './components/TodoApp'
import SpotifyShare from './components/SpotifyShare/SpotifyShare'
import Messages from './components/Messages'
import BoardSelector from './components/BoardSelector'
import CollaborativeBoard from './components/CollaborativeBoard'
import GamesPlaceholder from './components/GamesPlaceholder'
import { API_URL } from './config'
import { authFetch, clearAuthToken } from './utils/api'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState(() => {
    // Restore view from localStorage on initial load
    return localStorage.getItem('currentView') || 'hub'
  })
  const [selectedBoard, setSelectedBoard] = useState(() => {
    // Restore selected board from localStorage
    const saved = localStorage.getItem('selectedBoard')
    return saved ? JSON.parse(saved) : null
  })

  useEffect(() => {
    checkAuth()
  }, [])

  // Persist current view to localStorage
  useEffect(() => {
    localStorage.setItem('currentView', currentView)
  }, [currentView])

  // Persist selected board to localStorage
  useEffect(() => {
    if (selectedBoard) {
      localStorage.setItem('selectedBoard', JSON.stringify(selectedBoard))
    } else {
      localStorage.removeItem('selectedBoard')
    }
  }, [selectedBoard])

  const checkAuth = async () => {
    try {
      const response = await authFetch('/auth/me')
      if (response.ok) {
        const data = await response.json()
        if (data.user) {
          setUser(data.user)
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (userData) => {
    setUser(userData)
    setCurrentView('hub')
  }

  const handleLogout = async () => {
    try {
      await authFetch('/auth/logout', { method: 'POST' })
      setUser(null)
      setCurrentView('hub')
      setSelectedBoard(null)
      localStorage.removeItem('currentView')
      localStorage.removeItem('selectedBoard')
      clearAuthToken() // Clear the stored token
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleNavigate = (view) => {
    setCurrentView(view)
  }

  const handleBackToHub = () => {
    setCurrentView('hub')
    setSelectedBoard(null)
  }

  const handleSelectBoard = (board) => {
    setSelectedBoard(board)
    setCurrentView('board-edit')
  }

  const handleBackToBoards = () => {
    setSelectedBoard(null)
    setCurrentView('boards')
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-purple-900 pt-safe pb-safe">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <PinLogin onLogin={handleLogin} />
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'todo':
        return <TodoApp user={user} onLogout={handleLogout} onBack={handleBackToHub} />
      case 'spotify':
        return <SpotifyShare user={user} onBack={handleBackToHub} />
      case 'messages':
        return <Messages user={user} onBack={handleBackToHub} />
      case 'boards':
      case 'documents':
        return (
          <BoardSelector 
            user={user} 
            onBack={handleBackToHub} 
            onSelectBoard={handleSelectBoard}
          />
        )
      case 'board-edit':
        if (selectedBoard) {
          return (
            <CollaborativeBoard 
              user={user} 
              board={selectedBoard}
              onBack={handleBackToBoards} 
            />
          )
        }
        // If no board selected, go to board selector
        return (
          <BoardSelector 
            user={user} 
            onBack={handleBackToHub} 
            onSelectBoard={handleSelectBoard}
          />
        )
      case 'games':
        return <GamesPlaceholder onBack={handleBackToHub} />
      default:
        return (
          <NavigationHub 
            user={user} 
            onLogout={handleLogout} 
            onNavigate={handleNavigate} 
          />
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {renderCurrentView()}
    </div>
  )
}

export default App
