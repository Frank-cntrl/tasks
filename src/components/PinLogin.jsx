import { useState } from 'react'
import { API_URL } from '../config'
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-2">
            <FavoriteIcon className="text-pink-300" sx={{ fontSize: 40 }} />
            <h1 className="text-6xl font-bold text-white">Frella</h1>
            <FavoriteIcon className="text-pink-300" sx={{ fontSize: 40 }} />
          </div>
          <p className="text-purple-100 text-lg font-light">For Frank & Ella</p>
        </div>

        {/* PIN Display */}
        <div className="mb-10">
          <div className="flex gap-5 justify-center mb-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                  i < pin.length
                    ? 'bg-white border-white scale-110'
                    : 'border-white/50'
                } ${error ? 'animate-shake border-red-300' : ''}`}
              />
            ))}
          </div>
          {error && (
            <p className="text-center text-red-200 text-sm font-medium">
              {error}
            </p>
          )}
        </div>

        {/* PIN Pad */}
        <div className="bg-white rounded-3xl p-6 shadow-2xl">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberClick(num.toString())}
                disabled={loading}
                className="aspect-square bg-gray-50 hover:bg-gray-100 active:bg-gray-200 
                         rounded-2xl text-2xl font-semibold text-gray-800 
                         transition-all duration-150 disabled:opacity-50
                         hover:scale-105 active:scale-95 shadow-sm"
              >
                {num}
              </button>
            ))}
            <div className="aspect-square" />
            <button
              onClick={() => handleNumberClick('0')}
              disabled={loading}
              className="aspect-square bg-gray-50 hover:bg-gray-100 active:bg-gray-200 
                       rounded-2xl text-2xl font-semibold text-gray-800 
                       transition-all duration-150 disabled:opacity-50
                       hover:scale-105 active:scale-95 shadow-sm"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              disabled={loading || pin.length === 0}
              className="aspect-square bg-red-50 hover:bg-red-100 active:bg-red-200 
                       rounded-2xl text-red-600 transition-all duration-150 
                       disabled:opacity-30 hover:scale-105 active:scale-95 
                       flex items-center justify-center shadow-sm"
            >
              <BackspaceIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PinLogin
