import { useState } from 'react'
import { API_URL } from '../config'
import { saveAuthToken } from '../utils/api'
import BackspaceIcon from '@mui/icons-material/Backspace'
import FavoriteIcon from '@mui/icons-material/Favorite'

function PinLogin({ onLogin }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleNumberClick = (num) => {
    if (pin.length < 4) {
      const newPin = pin + num
      setPin(newPin)
      
      // Auto-submit when 4 digits entered
      if (newPin.length === 4) {
        submitPin(newPin)
      }
    }
  }

  const handleBackspace = () => {
    setPin(pin.slice(0, -1))
    setError('')
  }

  const submitPin = async (pinToSubmit) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/auth/pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ pin: pinToSubmit }),
      })

      const data = await response.json()

      if (response.ok) {
        // Save token to localStorage for mobile compatibility
        if (data.token) {
          saveAuthToken(data.token)
        }
        onLogin(data.user)
      } else {
        setError(data.error || 'Invalid PIN')
        setPin('')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Login failed. Please try again.')
      setPin('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 flex flex-col items-center justify-center p-4 pt-safe pb-safe overflow-hidden touch-manipulation">
      <div className="w-full max-w-sm mx-auto space-y-6 md:space-y-8 animate-fade-in">
        {/* Logo/Header */}
        <div className="text-center space-y-3 md:space-y-4">
          <div className="w-16 h-16 md:w-20 md:h-20 mx-auto bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm">
            <FavoriteIcon sx={{ fontSize: { xs: 32, md: 40 } }} className="text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Welcome to Frella</h1>
          <p className="text-purple-200 text-sm md:text-base">Enter your PIN to continue</p>
        </div>

        {/* PIN Display */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 md:p-6">
          <div className="flex justify-center gap-3 md:gap-4 mb-4 md:mb-6">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`w-12 h-12 md:w-14 md:h-14 rounded-xl border-2 flex items-center justify-center transition-all duration-200 ${
                  pin.length > index
                    ? 'border-white bg-white/20 scale-110'
                    : 'border-white/30 bg-white/5'
                } ${
                  error ? 'animate-shake border-red-400' : ''
                }`}
              >
                {pin.length > index && (
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-white rounded-full" />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="text-red-300 text-center text-sm mb-4 animate-fade-in">
              {error}
            </div>
          )}

          {loading && (
            <div className="text-center mb-4">
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
            </div>
          )}
        </div>

        {/* Number Pad */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6">
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberClick(num.toString())}
                disabled={loading}
                className="aspect-square bg-white/10 hover:bg-white/20 active:bg-white/30 
                         rounded-xl md:rounded-2xl text-xl md:text-2xl font-semibold text-white 
                         transition-all duration-150 disabled:opacity-50 btn-mobile
                         hover:scale-105 active:scale-95 shadow-sm touch-manipulation
                         border border-white/10 hover:border-white/20"
              >
                {num}
              </button>
            ))}
            <div className="aspect-square" />
            <button
              onClick={() => handleNumberClick('0')}
              disabled={loading}
              className="aspect-square bg-white/10 hover:bg-white/20 active:bg-white/30 
                       rounded-xl md:rounded-2xl text-xl md:text-2xl font-semibold text-white 
                       transition-all duration-150 disabled:opacity-50 btn-mobile
                       hover:scale-105 active:scale-95 shadow-sm touch-manipulation
                       border border-white/10 hover:border-white/20"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              disabled={loading || pin.length === 0}
              className="aspect-square bg-red-500/20 hover:bg-red-500/30 active:bg-red-500/40 
                       rounded-xl md:rounded-2xl text-red-300 transition-all duration-150 
                       disabled:opacity-30 hover:scale-105 active:scale-95 btn-mobile
                       flex items-center justify-center shadow-sm touch-manipulation
                       border border-red-400/20 hover:border-red-400/40"
            >
              <BackspaceIcon sx={{ fontSize: { xs: 20, md: 24 } }} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-purple-300/70 text-xs md:text-sm">
          Made with <FavoriteIcon sx={{ fontSize: 12 }} className="inline mx-1 text-red-400" /> by Frella Team
        </div>
      </div>
    </div>
  )
}

export default PinLogin
