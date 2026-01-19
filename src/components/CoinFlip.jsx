import { useState } from 'react'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import FavoriteIcon from '@mui/icons-material/Favorite'
import { motion } from 'framer-motion'

function CoinFlip({ onBack }) {
  const [isFlipping, setIsFlipping] = useState(false)
  const [result, setResult] = useState(null)
  const [flipCount, setFlipCount] = useState(0)
  const [history, setHistory] = useState([])

  const flipCoin = () => {
    if (isFlipping) return
    
    setIsFlipping(true)
    setResult(null)
    setFlipCount(prev => prev + 1)
    
    // Random result
    const coinResult = Math.random() < 0.5 ? 'heads' : 'tails'
    
    // Show result after animation
    setTimeout(() => {
      setResult(coinResult)
      setHistory(prev => [coinResult, ...prev].slice(0, 10))
      setIsFlipping(false)
    }, 2500)
  }

  const clearHistory = () => {
    setHistory([])
  }

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-yellow-600 via-amber-700 to-orange-800 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <header className="px-4 py-4 pt-safe flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-xl 
                     bg-white/20 hover:bg-white/30 transition-all duration-200 text-white"
          >
            <ArrowBackIcon />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Coin Flip</h1>
            <p className="text-white/70 text-sm">Make decisions together</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
        {/* Coin Container */}
        <div 
          onClick={flipCoin}
          className={`relative cursor-pointer touch-manipulation select-none mb-8
                     ${isFlipping ? '' : 'hover:scale-105 active:scale-95'} transition-transform`}
          style={{ perspective: '1000px' }}
        >
          <div
            key={flipCount}
            className={`w-40 h-40 md:w-48 md:h-48 relative
                       ${isFlipping ? 'animate-coin-flip' : ''}`}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Heads side */}
            <div 
              className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 
                        flex items-center justify-center shadow-2xl border-8 border-yellow-600"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="text-center">
                <span className="text-5xl md:text-6xl font-bold text-yellow-800">H</span>
                <p className="text-yellow-700 text-sm font-medium mt-1">HEADS</p>
              </div>
            </div>
            {/* Tails side */}
            <div 
              className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 
                        flex items-center justify-center shadow-2xl border-8 border-amber-600"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <div className="text-center">
                <span className="text-5xl md:text-6xl font-bold text-amber-900">T</span>
                <p className="text-amber-800 text-sm font-medium mt-1">TAILS</p>
              </div>
            </div>
          </div>
        </div>

        {/* Result Display */}
        <div className="text-center mb-8 h-20">
          {isFlipping ? (
            <motion.p 
              className="text-3xl font-bold text-white animate-pulse"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
            >
              Flipping...
            </motion.p>
          ) : result ? (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <p className="text-4xl md:text-5xl font-bold text-white capitalize mb-2">
                {result}!
              </p>
              <p className="text-white/60 text-sm">Tap the coin to flip again</p>
            </motion.div>
          ) : (
            <p className="text-xl text-white/70">Tap the coin to flip</p>
          )}
        </div>

        {/* Flip Button */}
        <button
          onClick={flipCoin}
          disabled={isFlipping}
          className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg
                     ${isFlipping 
                       ? 'bg-white/30 text-white/50 cursor-not-allowed' 
                       : 'bg-white hover:bg-yellow-50 active:scale-95 text-amber-700'}`}
        >
          {isFlipping ? 'Flipping...' : 'Flip Coin'}
        </button>
      </div>

      {/* History Section */}
      {history.length > 0 && (
        <div className="px-4 pb-safe">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">Recent Flips</h3>
              <button
                onClick={clearHistory}
                className="text-white/60 text-sm hover:text-white transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {history.map((flip, index) => (
                <motion.span
                  key={`${flip}-${index}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                            ${flip === 'heads' 
                              ? 'bg-yellow-400 text-yellow-800' 
                              : 'bg-amber-500 text-amber-900'}`}
                >
                  {flip === 'heads' ? 'H' : 'T'}
                </motion.span>
              ))}
            </div>
            <p className="text-white/50 text-xs mt-3">
              Heads: {history.filter(h => h === 'heads').length} | 
              Tails: {history.filter(h => h === 'tails').length}
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-4 pb-safe text-center flex-shrink-0">
        <p className="text-white/40 text-xs">
          Made with <FavoriteIcon sx={{ fontSize: 10 }} className="inline mx-1 text-red-400" /> for decisions
        </p>
      </div>
    </motion.div>
  )
}

export default CoinFlip
