import { useState } from 'react'
import { API_URL } from '../config'
import { saveAuthToken } from '../utils/api'
import BackspaceIcon from '@mui/icons-material/Backspace'
import FavoriteIcon from '@mui/icons-material/Favorite'
import { motion, AnimatePresence } from 'framer-motion'

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
    <motion.div 
      className="h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 flex flex-col items-center justify-center p-4 pt-safe pb-safe overflow-hidden touch-manipulation"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="w-full max-w-sm mx-auto space-y-6 md:space-y-8"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Logo/Header */}
        <motion.div 
          className="text-center space-y-3 md:space-y-4"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <motion.div 
            className="w-16 h-16 md:w-20 md:h-20 mx-auto bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm"
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <FavoriteIcon sx={{ fontSize: { xs: 32, md: 40 } }} className="text-white" />
            </motion.div>
          </motion.div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Welcome to Frella</h1>
          <p className="text-purple-200 text-sm md:text-base">Enter your PIN to continue</p>
        </motion.div>

        {/* PIN Display */}
        <motion.div 
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 md:p-6"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <div className="flex justify-center gap-3 md:gap-4 mb-4 md:mb-6">
            {[0, 1, 2, 3].map((index) => (
              <motion.div
                key={index}
                className={`w-12 h-12 md:w-14 md:h-14 rounded-xl border-2 flex items-center justify-center transition-all duration-200 ${
                  pin.length > index
                    ? 'border-white bg-white/20'
                    : 'border-white/30 bg-white/5'
                } ${
                  error ? 'border-red-400' : ''
                }`}
                animate={{
                  scale: pin.length > index ? 1.1 : 1,
                  borderColor: pin.length > index ? '#ffffff' : 'rgba(255,255,255,0.3)'
                }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <AnimatePresence>
                  {pin.length > index && (
                    <motion.div 
                      className="w-3 h-3 md:w-4 md:h-4 bg-white rounded-full"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                className="text-red-300 text-center text-sm mb-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {loading && (
              <motion.div 
                className="text-center mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div 
                  className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full mx-auto"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Number Pad */}
        <motion.div 
          className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num, index) => (
              <motion.button
                key={num}
                onClick={() => handleNumberClick(num.toString())}
                disabled={loading}
                className="aspect-square bg-white/10 hover:bg-white/20 active:bg-white/30 
                         rounded-xl md:rounded-2xl text-xl md:text-2xl font-semibold text-white 
                         transition-all duration-150 disabled:opacity-50 btn-mobile
                         touch-manipulation border border-white/10 hover:border-white/20"
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.2)" }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  duration: 0.3, 
                  delay: 0.6 + (index * 0.05),
                  type: "spring",
                  stiffness: 200
                }}
              >
                {num}
              </motion.button>
            ))}
            <div className="aspect-square" />
            <motion.button
              onClick={() => handleNumberClick('0')}
              disabled={loading}
              className="aspect-square bg-white/10 hover:bg-white/20 active:bg-white/30 
                       rounded-xl md:rounded-2xl text-xl md:text-2xl font-semibold text-white 
                       transition-all duration-150 disabled:opacity-50 btn-mobile
                       touch-manipulation border border-white/10 hover:border-white/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 1.05, type: "spring", stiffness: 200 }}
            >
              0
            </motion.button>
            <motion.button
              onClick={handleBackspace}
              disabled={loading || pin.length === 0}
              className="aspect-square bg-red-500/20 hover:bg-red-500/30 active:bg-red-500/40 
                       rounded-xl md:rounded-2xl text-red-300 transition-all duration-150 
                       disabled:opacity-30 btn-mobile
                       flex items-center justify-center touch-manipulation
                       border border-red-400/20 hover:border-red-400/40"
              whileHover={{ scale: 1.05, rotate: -5 }}
              whileTap={{ scale: 0.95, rotate: 0 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 1.1, type: "spring", stiffness: 200 }}
            >
              <BackspaceIcon sx={{ fontSize: { xs: 20, md: 24 } }} />
            </motion.button>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div 
          className="text-center text-purple-300/70 text-xs md:text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 1.2 }}
        >
          Made with <motion.span
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <FavoriteIcon sx={{ fontSize: 12 }} className="inline mx-1 text-red-400" />
          </motion.span> by Frella Team
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default PinLogin
