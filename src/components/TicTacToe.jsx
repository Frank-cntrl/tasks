import { useState, useEffect, useCallback } from 'react'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import GridOnIcon from '@mui/icons-material/GridOn'
import { authFetch } from '../utils/api'
import Confetti from './Confetti'

// Haptic feedback helper
const triggerHaptic = (type = 'medium') => {
  // Check if vibration API is available
  if ('vibrate' in navigator) {
    switch (type) {
      case 'light':
        navigator.vibrate(10)
        break
      case 'medium':
        navigator.vibrate(25)
        break
      case 'heavy':
        navigator.vibrate(50)
        break
      case 'success':
        navigator.vibrate([50, 50, 50, 50, 100])
        break
      case 'error':
        navigator.vibrate([100, 50, 100])
        break
      default:
        navigator.vibrate(25)
    }
  }
}

function TicTacToe({ user, onBack }) {
  const [game, setGame] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [gameResult, setGameResult] = useState(null) // { winner, isDraw }
  const [showConfetti, setShowConfetti] = useState(false)

  const fetchActiveGame = useCallback(async () => {
    try {
      const response = await authFetch('/api/games/tictactoe/active')
      if (response.ok) {
        const data = await response.json()
        if (data.game) {
          setGame(data.game)
          // Check if game just ended
          if (!data.game.isActive && !gameResult) {
            if (data.game.winner === 0) {
              setGameResult({ isDraw: true })
              triggerHaptic('medium')
            } else {
              setGameResult({ winner: data.game.winner })
              setShowConfetti(true)
              triggerHaptic('success')
            }
          }
        } else {
          setGame(null)
        }
      }
    } catch (err) {
      console.error('Failed to fetch game:', err)
      setError('Failed to load game')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchActiveGame()
    
    // Poll for updates every 2 seconds
    const interval = setInterval(fetchActiveGame, 2000)
    return () => clearInterval(interval)
  }, [fetchActiveGame])

  const startNewGame = async () => {
    setLoading(true)
    setGameResult(null)
    setShowConfetti(false)
    setError('')
    
    try {
      const response = await authFetch('/api/games/tictactoe/new', {
        method: 'POST',
        body: JSON.stringify({ 
          lastWinner: gameResult?.winner || null 
        }),
      })
      
      if (response.ok) {
        const newGame = await response.json()
        setGame(newGame)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to start game')
      }
    } catch (err) {
      console.error('Failed to start game:', err)
      setError('Failed to start game')
    } finally {
      setLoading(false)
    }
  }

  const makeMove = async (position) => {
    if (!game || game.currentTurn !== user.id || game.state.board[position] !== null) {
      return
    }

    try {
      const response = await authFetch(`/api/games/${game.id}/move`, {
        method: 'PUT',
        body: JSON.stringify({ position }),
      })

      if (response.ok) {
        const updatedGame = await response.json()
        setGame(updatedGame)
        triggerHaptic('light')
        
        // Check if game ended
        if (!updatedGame.isActive) {
          if (updatedGame.winner === 0) {
            setGameResult({ isDraw: true })
            triggerHaptic('medium')
          } else {
            setGameResult({ winner: updatedGame.winner })
            setShowConfetti(true)
            triggerHaptic('success')
          }
        }
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to make move')
      }
    } catch (err) {
      console.error('Failed to make move:', err)
      setError('Failed to make move')
    }
  }

  const getPlayerName = (playerId) => {
    if (!game) return ''
    if (game.player1.id === playerId) return game.player1.username
    if (game.player2.id === playerId) return game.player2.username
    return ''
  }

  const getPlayerSymbol = (playerId) => {
    if (!game) return ''
    return game.player1Id === playerId ? 'X' : 'O'
  }

  const isMyTurn = game && game.currentTurn === user.id

  const renderCell = (index) => {
    const value = game?.state?.board?.[index]
    const isClickable = isMyTurn && value === null && !gameResult

    return (
      <button
        key={index}
        onClick={() => makeMove(index)}
        disabled={!isClickable}
        className={`aspect-square flex items-center justify-center text-4xl md:text-5xl font-bold
                   rounded-xl transition-all duration-200 border-2
                   ${isClickable 
                     ? 'bg-white/20 hover:bg-white/30 border-white/30 hover:border-white/50 cursor-pointer' 
                     : 'bg-white/10 border-white/20'
                   }
                   ${value === 'X' ? 'text-blue-400' : value === 'O' ? 'text-pink-400' : 'text-transparent'}`}
      >
        {value || '·'}
      </button>
    )
  }

  if (loading && !game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700">
      {/* Confetti */}
      <Confetti isActive={showConfetti} duration={4000} />
      
      {/* Header */}
      <header className="px-5 py-4 pt-safe">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-xl 
                     bg-white/20 hover:bg-white/30 text-white transition-all duration-200"
          >
            <ArrowBackIcon />
          </button>
          <div className="flex items-center gap-2 text-white">
            <GridOnIcon />
            <h1 className="text-xl font-bold">Tic Tac Toe</h1>
          </div>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-4 p-3 bg-red-500/30 border border-red-400/50 rounded-xl text-white text-sm">
          {error}
        </div>
      )}

      {/* Game Content */}
      <div className="flex flex-col items-center px-4 py-6">
        {!game ? (
          /* No active game - show start button */
          <div className="text-center">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6 mx-auto">
              <GridOnIcon sx={{ fontSize: 48 }} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Ready to Play?</h2>
            <p className="text-white/80 mb-6">Start a new game of Tic Tac Toe!</p>
            <button
              onClick={startNewGame}
              className="bg-white text-purple-700 px-8 py-3 rounded-xl font-bold 
                       hover:bg-white/90 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Start Game
            </button>
          </div>
        ) : (
          <>
            {/* Player Info */}
            <div className="w-full max-w-sm mb-6">
              <div className="flex justify-between items-center bg-white/10 rounded-xl p-3">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all
                              ${game.player1Id === game.currentTurn && !gameResult ? 'bg-blue-500/50' : ''}`}>
                  <span className="text-2xl font-bold text-blue-400">X</span>
                  <span className="text-white font-medium">{game.player1.username}</span>
                </div>
                <span className="text-white/50 text-sm">vs</span>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all
                              ${game.player2Id === game.currentTurn && !gameResult ? 'bg-pink-500/50' : ''}`}>
                  <span className="text-white font-medium">{game.player2.username}</span>
                  <span className="text-2xl font-bold text-pink-400">O</span>
                </div>
              </div>
            </div>

            {/* Game Board */}
            <div className="w-full max-w-xs mx-auto aspect-square bg-white/10 rounded-2xl p-3 mb-6">
              <div className="grid grid-cols-3 gap-2 h-full">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(renderCell)}
              </div>
            </div>

            {/* Game Status */}
            <div className="text-center">
              {gameResult ? (
                <div className="space-y-4">
                  <div className={`rounded-2xl px-6 py-6 ${gameResult.isDraw ? 'bg-white/20' : 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border border-yellow-400/30'}`}>
                    {gameResult.isDraw ? (
                      <>
                        <p className="text-3xl mb-2">🤝</p>
                        <p className="text-2xl font-bold text-white">It's a Draw!</p>
                        <p className="text-white/70 mt-2">Good game! Want to play again?</p>
                      </>
                    ) : (
                      <>
                        <p className="text-3xl mb-2">🎉</p>
                        <p className="text-2xl font-bold text-white">
                          {getPlayerName(gameResult.winner)} Won!
                        </p>
                        <p className="text-white/70 mt-2">
                          {gameResult.winner === user.id 
                            ? "Congratulations! Want to play again?" 
                            : "Better luck next time! Want a rematch?"}
                        </p>
                      </>
                    )}
                  </div>
                  <button
                    onClick={startNewGame}
                    className="bg-white text-purple-700 px-8 py-3 rounded-xl font-bold 
                             hover:bg-white/90 transition-all duration-200 hover:scale-105 active:scale-95
                             shadow-lg"
                  >
                    Play Again
                  </button>
                  <p className="text-white/50 text-xs">
                    {gameResult.isDraw 
                      ? 'Same player starts next round'
                      : `${getPlayerName(gameResult.winner === user.id 
                          ? (game.player1Id === user.id ? game.player2Id : game.player1Id)
                          : user.id)} goes first next round`
                    }
                  </p>
                </div>
              ) : (
                <div className={`px-6 py-3 rounded-xl ${isMyTurn ? 'bg-green-500/30' : 'bg-white/10'}`}>
                  <p className="text-lg font-semibold text-white">
                    {isMyTurn ? (
                      <>Your turn! You are <span className={getPlayerSymbol(user.id) === 'X' ? 'text-blue-400' : 'text-pink-400'}>{getPlayerSymbol(user.id)}</span></>
                    ) : (
                      <>Waiting for {getPlayerName(game.currentTurn)}...</>
                    )}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default TicTacToe
