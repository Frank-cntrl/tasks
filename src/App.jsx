import { useState, useEffect } from 'react'
import PinLogin from './components/PinLogin'
import NavigationHub from './components/NavigationHub'
import TodoApp from './components/TodoApp'
import SpotifyShare from './components/SpotifyShare/SpotifyShare'
import Messages from './components/Messages'
import SharedDocsPlaceholder from './components/SharedDocsPlaceholder'
import GamesPlaceholder from './components/GamesPlaceholder'
import { API_URL } from './config'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState('hub')

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        credentials: 'include',
      })
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
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
      setUser(null)
      setCurrentView('hub')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleNavigate = (view) => {
    setCurrentView(view)
  }

  const handleBackToHub = () => {
    setCurrentView('hub')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-purple-900">
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
      case 'documents':
        return <SharedDocsPlaceholder onBack={handleBackToHub} />
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
    <div className="min-h-screen bg-gray-50">
      {renderCurrentView()}
    </div>
  )
}

export default App
