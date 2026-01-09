import { useState } from 'react'
import './PinLogin.css'

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
      const response = await fetch('http://localhost:8080/auth/pin', {
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
    <div className="pin-login">
      <div className="pin-login-container">
        <div className="app-header">
          <h1>Frella</h1>
          <p className="tagline">For Frank & Ella</p>
        </div>

        <div className="pin-display">
          <div className="pin-dots">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`pin-dot ${i < pin.length ? 'filled' : ''} ${
                  error ? 'error' : ''
                }`}
              />
            ))}
          </div>
          {error && <p className="error-message">{error}</p>}
        </div>

        <div className="pin-pad">
          <div className="pin-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                className="pin-button"
                onClick={() => handleNumberClick(num.toString())}
                disabled={loading}
              >
                {num}
              </button>
            ))}
            <button className="pin-button empty" disabled></button>
            <button
              className="pin-button"
              onClick={() => handleNumberClick('0')}
              disabled={loading}
            >
              0
            </button>
            <button
              className="pin-button backspace"
              onClick={handleBackspace}
              disabled={loading || pin.length === 0}
            >
              ⌫
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PinLogin
