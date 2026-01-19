import { useState, useEffect, useRef } from 'react'
import { Tldraw, getSnapshot, loadSnapshot } from 'tldraw'
import 'tldraw/tldraw.css'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import TimerIcon from '@mui/icons-material/Timer'
import CheckIcon from '@mui/icons-material/Check'
import { motion, AnimatePresence } from 'framer-motion'
import io from 'socket.io-client'
import { API_URL } from '../config'
import { authFetch } from '../utils/api'

// Use lowercase to match backend phase values exactly
const GAME_PHASES = {
  WAITING: 'waiting',
  THINKING: 'thinking', 
  DRAWING: 'drawing',
  GUESSING: 'guessing',
  RESULT: 'result'
}

// Curated list of drawable nouns for the game
const DRAWABLE_NOUNS = [
  // Animals
  'cat', 'dog', 'elephant', 'giraffe', 'lion', 'tiger', 'bear', 'rabbit', 'mouse', 'fish',
  'bird', 'snake', 'frog', 'turtle', 'monkey', 'penguin', 'dolphin', 'whale', 'shark', 'octopus',
  'butterfly', 'bee', 'spider', 'ant', 'horse', 'cow', 'pig', 'sheep', 'chicken', 'duck',
  // Objects
  'house', 'car', 'tree', 'flower', 'book', 'chair', 'table', 'lamp', 'phone', 'computer',
  'clock', 'door', 'window', 'bed', 'couch', 'television', 'mirror', 'umbrella', 'bag', 'shoe',
  'hat', 'glasses', 'watch', 'key', 'bottle', 'cup', 'plate', 'fork', 'spoon', 'knife',
  // Food
  'apple', 'banana', 'orange', 'pizza', 'hamburger', 'hotdog', 'cake', 'cookie', 'donut',
  'bread', 'cheese', 'egg', 'carrot', 'broccoli', 'corn', 'grape', 'strawberry', 'watermelon', 'pineapple',
  // Nature
  'sun', 'moon', 'star', 'cloud', 'rain', 'rainbow', 'mountain', 'beach', 'ocean', 'river',
  'forest', 'desert', 'volcano', 'island', 'waterfall', 'lightning', 'snowflake', 'tornado', 'fire', 'leaf',
  // Transportation
  'airplane', 'helicopter', 'boat', 'ship', 'train', 'bus', 'bicycle', 'motorcycle', 'rocket', 'submarine',
  // Buildings & Places
  'castle', 'church', 'hospital', 'school', 'library', 'restaurant', 'hotel', 'bridge', 'lighthouse', 'tent',
  // Sports & Activities
  'ball', 'guitar', 'piano', 'drum', 'camera', 'paintbrush', 'scissors', 'hammer', 'ladder', 'balloon',
  // People & Body
  'baby', 'robot', 'ghost', 'pirate', 'ninja', 'wizard', 'princess', 'king', 'clown', 'angel',
  // Misc
  'heart', 'diamond', 'crown', 'sword', 'shield', 'arrow', 'candle', 'present', 'treasure', 'flag'
]

function GuessMyThing({ user, onBack }) {
  const [socket, setSocket] = useState(null)
  const [gameState, setGameState] = useState({
    phase: GAME_PHASES.WAITING,
    myWord: '',
    opponentWord: '',
    timeLeft: 0,
    myScore: 0,
    opponentScore: 0
  })
  const [guess, setGuess] = useState('')
  const [guessHistory, setGuessHistory] = useState([])
  const [gameResult, setGameResult] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [opponentConnected, setOpponentConnected] = useState(false)
  const [opponentDrawing, setOpponentDrawing] = useState(null)
  const [imReady, setImReady] = useState(false)
  const [opponentReady, setOpponentReady] = useState(false)
  const [waitingForRematch, setWaitingForRematch] = useState(false)
  const [rematchReady, setRematchReady] = useState({ me: false, opponent: false })
  
  const editorRef = useRef(null)
  const opponentEditorRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    const initSocket = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        
        if (!token) {
          console.error('No auth token found')
          return
        }

        // Get socket token from backend (like other components do)
        const response = await authFetch('/auth/socket-token')
        
        if (response.ok) {
          const data = await response.json()
          console.log('🔑 Got socket token, connecting to game server...')
          
          const socketUrl = API_URL.replace(/^http/, 'ws')
          const newSocket = io(socketUrl, {
            auth: { 
              token: data.token, // Use the socket token from backend
              userId: user.id 
            }
          })

          newSocket.on('connect', () => {
            console.log('Connected to game server')
            setIsConnected(true)
            // Join the game room
            newSocket.emit('join_guessmything')
            console.log('Joining Guess My Thing room')
          })

          newSocket.on('disconnect', () => {
            console.log('Disconnected from game server')
            setIsConnected(false)
            setOpponentConnected(false)
            
            // Reset game state on disconnect
            setGameState(prev => ({
              ...prev,
              phase: GAME_PHASES.WAITING,
              timeLeft: 0
            }))
          })
          
          newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error)
            setIsConnected(false)
          })
          
          newSocket.on('error', (error) => {
            console.error('Socket error:', error)
            // You could show this error to the user if needed
          })

          newSocket.on('player-joined', ({ playerCount, canStart, players }) => {
            console.log('Player joined:', { playerCount, canStart, players })
            setOpponentConnected(canStart)
            
            // If we have 2 players and game is in waiting phase, both players are ready
            if (canStart && gameState.phase === GAME_PHASES.WAITING) {
              console.log('Both players ready, game can start')
            }
          })
          
          newSocket.on('opponent-connected', () => {
            setOpponentConnected(true)
          })

          newSocket.on('opponent-disconnected', () => {
            console.log('Opponent disconnected')
            setOpponentConnected(false)
            
            // Reset to waiting phase if we were in a game
            if (gameState.phase !== GAME_PHASES.WAITING) {
              setGameState(prev => ({
                ...prev,
                phase: GAME_PHASES.WAITING,
                timeLeft: 0
              }))
              setGuessHistory([])
              setGameResult(null)
            }
          })

          newSocket.on('game-started', ({ word, phase, timeLeft }) => {
            console.log('🎮 Game started:', { word, phase, timeLeft })
            setGameState(prev => ({
              ...prev,
              myWord: word,
              phase,
              timeLeft
            }))
            setGuessHistory([])
            setGuess('')
            setGameResult(null)
            setWaitingForRematch(false)
            setRematchReady({ me: false, opponent: false })
            setOpponentDrawing(null)
            startTimer(timeLeft)
          })

          newSocket.on('phase-changed', ({ phase, timeLeft }) => {
            console.log('🎮 Phase changed to:', phase, 'timeLeft:', timeLeft)
            setGameState(prev => ({ ...prev, phase, timeLeft }))
            // Reset ready states when phase changes
            setImReady(false)
            setOpponentReady(false)
            if (phase === GAME_PHASES.GUESSING) {
              setGuessHistory([])
              setGuess('')
            }
            startTimer(timeLeft)
          })

          newSocket.on('drawing-updated', (drawingData) => {
            console.log('Received live drawing update:', drawingData)
            // This is for live updates during drawing phase
            setOpponentDrawing(drawingData)
          })

          newSocket.on('opponent-drawing', (drawingData) => {
            console.log('🎨 Received opponent final drawing for guessing:', drawingData)
            // This is the final drawing sent when guessing phase starts
            setOpponentDrawing(drawingData)
          })

          newSocket.on('player-ready', ({ playerId, readyCount, totalPlayers }) => {
            console.log('🎮 Player ready:', playerId, readyCount, '/', totalPlayers)
            // Track if opponent is ready
            if (playerId !== user.id) {
              setOpponentReady(true)
            }
          })

          newSocket.on('player-ready-rematch', ({ playerId, readyCount, totalPlayers }) => {
            console.log('🎮 Player ready for rematch:', playerId, readyCount, '/', totalPlayers)
            if (playerId === user.id) {
              setRematchReady(prev => ({ ...prev, me: true }))
            } else {
              setRematchReady(prev => ({ ...prev, opponent: true }))
            }
          })

          newSocket.on('guess-result', ({ correct, guess: guessText, winner }) => {
            if (correct && winner === user.id) {
              setGameResult('You guessed it!')
            } else if (correct && winner !== user.id) {
              setGameResult('Opponent guessed it!')
            } else {
              setGuessHistory(prev => [...prev, { text: guessText, correct: false }])
            }
          })

          newSocket.on('timer-update', ({ timeLeft }) => {
            setGameState(prev => ({ ...prev, timeLeft }))
          })

          setSocket(newSocket)
        } else {
          console.error('Failed to get socket token:', response.status)
        }
      } catch (error) {
        console.error('Socket initialization error:', error)
      }
    }

    initSocket()

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (window.drawingUpdateTimeout) clearTimeout(window.drawingUpdateTimeout)
      if (socket) {
        socket.emit('leave_guessmything')
        socket.disconnect()
      }
      // Clean up Tldraw editor listener
      if (editorRef.current && editorRef.current.cleanup) {
        editorRef.current.cleanup()
      }
    }
  }, [user.id])

  const startTimer = (duration) => {
    if (timerRef.current) clearInterval(timerRef.current)
    
    timerRef.current = setInterval(() => {
      setGameState(prev => {
        const newTimeLeft = prev.timeLeft - 1
        if (newTimeLeft <= 0) {
          clearInterval(timerRef.current)
          return { ...prev, timeLeft: 0 }
        }
        return { ...prev, timeLeft: newTimeLeft }
      })
    }, 1000)
  }

  const startGame = () => {
    if (!opponentConnected) {
      console.log('Cannot start game - opponent not connected')
      return
    }
    
    console.log('Starting game with drawable nouns...')
    
    // Use curated drawable nouns - much more reliable than API
    const randomWord = DRAWABLE_NOUNS[Math.floor(Math.random() * DRAWABLE_NOUNS.length)]
    console.log('Selected word for drawing:', randomWord)
    socket?.emit('start-game', { word: randomWord })
  }

  // Update opponent's drawing when new data arrives
  useEffect(() => {
    if (opponentEditorRef.current && opponentDrawing && gameState.phase === GAME_PHASES.GUESSING) {
      try {
        loadSnapshot(opponentEditorRef.current.store, opponentDrawing)
      } catch (error) {
        console.error('Error updating opponent drawing:', error)
      }
    }
  }, [opponentDrawing, gameState.phase])

  const finishEarly = () => {
    // If in drawing phase, send the final drawing first
    if (gameState.phase === GAME_PHASES.DRAWING && editorRef.current) {
      try {
        const snapshot = getSnapshot(editorRef.current.store)
        socket?.emit('drawing-update', snapshot)
        console.log('🎨 Sent final drawing before finishing early')
      } catch (error) {
        console.error('Error sending final drawing:', error)
      }
    }
    
    setImReady(true)
    socket?.emit('finish-phase-early')
  }

  const submitGuess = (e) => {
    e.preventDefault()
    if (!guess.trim()) return
    
    socket?.emit('submit-guess', { guess: guess.trim().toLowerCase() })
    setGuess('')
  }

  // Handle drawing changes with proper Tldraw v2 syntax
  const handleEditorMount = (editor) => {
    console.log('🎨 Tldraw editor mounted')
    editorRef.current = editor
    
    // Set the editor to draw mode
    editor.setCurrentTool('draw')
    
    // Listen to store changes for live drawing updates
    const cleanup = editor.store.listen(() => {
      if (socket && gameState.phase === GAME_PHASES.DRAWING) {
        // Throttle drawing updates
        if (window.drawingUpdateTimeout) {
          clearTimeout(window.drawingUpdateTimeout)
        }
        
        window.drawingUpdateTimeout = setTimeout(() => {
          try {
            const snapshot = getSnapshot(editor.store)
            socket.emit('drawing-update', snapshot)
            console.log('🎨 Sent drawing update')
          } catch (error) {
            console.error('Error sending drawing update:', error)
          }
        }, 100)
      }
    })
    
    editorRef.current.cleanup = cleanup
    console.log('🎨 Editor configured, draw tool selected')
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-yellow-600 to-orange-700 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <header className="px-4 py-4 pt-safe flex-shrink-0 bg-black/20">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-xl 
                     bg-white/20 hover:bg-white/30 transition-all duration-200 text-white"
          >
            <ArrowBackIcon />
          </button>
          
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">Guess My Thing</h1>
            <div className="flex items-center gap-2 text-sm text-white/80">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
              <span>{opponentConnected ? 'Both Connected' : 'Waiting for opponent...'}</span>
              {/* Debug info */}
              <span className="ml-2 text-yellow-300">Phase: {gameState.phase}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-white">
            <TimerIcon fontSize="small" />
            <span className="font-mono text-lg">{formatTime(gameState.timeLeft)}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-hidden">
        <AnimatePresence mode="wait">
          {gameState.phase === GAME_PHASES.WAITING && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="h-full flex flex-col items-center justify-center text-center"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-4">Ready to Play?</h2>
                <p className="text-white/80 mb-6">
                  You'll each get a word to draw, then try to guess each other's drawings!
                </p>
                <div className="flex flex-col gap-4">
                  <button
                    onClick={startGame}
                    disabled={!opponentConnected}
                    className="bg-white hover:bg-yellow-50 disabled:bg-white/30 disabled:text-white/50
                             text-orange-700 font-bold py-3 px-8 rounded-xl transition-all
                             disabled:cursor-not-allowed"
                  >
                    {opponentConnected ? 'Start Game!' : 'Waiting for opponent...'}
                  </button>
                  
                  {opponentConnected && (
                    <p className="text-white/60 text-sm">
                      Both players connected! Click "Start Game!" to begin.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {gameState.phase === GAME_PHASES.THINKING && (
            <motion.div
              key="thinking"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full flex flex-col items-center justify-center text-center"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                <h2 className="text-3xl font-bold text-white mb-4">Your Word:</h2>
                <div className="bg-white text-orange-700 text-4xl font-bold py-6 px-8 rounded-xl mb-6 uppercase">
                  {gameState.myWord}
                </div>
                <p className="text-white/80">Think about how you'll draw this...</p>
              </div>
            </motion.div>
          )}

          {gameState.phase === GAME_PHASES.DRAWING && (
            <motion.div
              key="drawing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col"
              style={{ height: 'calc(100vh - 200px)' }}
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-t-2xl p-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold">Draw: {gameState.myWord}</h3>
                    {(imReady || opponentReady) && (
                      <p className="text-xs text-white/70 mt-1">
                        {imReady && opponentReady ? '✓ Both ready!' : 
                         imReady ? '✓ You\'re ready, waiting for opponent...' : 
                         '✓ Opponent is ready!'}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={finishEarly}
                    disabled={imReady}
                    className={`${imReady ? 'bg-gray-500' : 'bg-green-500 hover:bg-green-400'} 
                             text-white px-4 py-2 rounded-lg transition-all flex items-center gap-2
                             disabled:cursor-not-allowed`}
                  >
                    <CheckIcon fontSize="small" />
                    {imReady ? 'Waiting...' : 'Done Early'}
                  </button>
                </div>
              </div>
              <div className="flex-1 relative overflow-hidden bg-white rounded-b-2xl">
                <Tldraw onMount={handleEditorMount} />
              </div>
            </motion.div>
          )}

          {gameState.phase === GAME_PHASES.GUESSING && (
            <motion.div
              key="guessing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">Guess the opponent's drawing!</h3>
                  <button
                    onClick={finishEarly}
                    className="bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded-lg
                             transition-all"
                  >
                    Give Up
                  </button>
                </div>
                
                <form onSubmit={submitGuess} className="flex gap-2">
                  <input
                    type="text"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    placeholder="Type your guess..."
                    className="flex-1 px-4 py-2 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                  <button
                    type="submit"
                    className="bg-green-500 hover:bg-green-400 text-white px-6 py-2 rounded-lg
                             transition-all font-semibold"
                  >
                    Guess!
                  </button>
                </form>

                {guessHistory.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-white/80 text-sm mb-2">Previous guesses:</h4>
                    <div className="flex flex-wrap gap-2">
                      {guessHistory.map((item, index) => (
                        <span
                          key={index}
                          className="bg-red-900/50 text-red-200 px-3 py-1 rounded-full text-sm"
                        >
                          {item.text} ✗
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl overflow-hidden relative" style={{ height: '400px', width: '100%' }}>
                {opponentDrawing ? (
                  <Tldraw
                    hideUi={true}
                    onMount={(editor) => {
                      console.log('🎨 Guessing phase Tldraw mounted, loading opponent drawing:', opponentDrawing)
                      // Set to read-only mode
                      editor.updateInstanceState({ isReadonly: true })
                      
                      // Load the opponent's drawing
                      try {
                        loadSnapshot(editor.store, opponentDrawing)
                        console.log('🎨 Successfully loaded opponent drawing')
                        
                        // Zoom to fit the content
                        setTimeout(() => {
                          editor.zoomToFit()
                        }, 100)
                      } catch (error) {
                        console.error('Error loading opponent drawing:', error)
                      }
                      
                      // Store ref to update later
                      opponentEditorRef.current = editor
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    <p>Waiting for opponent's drawing...</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {gameResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <div className="bg-white rounded-2xl p-8 text-center mx-4" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold mb-4">{gameResult}</h2>
              
              {!waitingForRematch ? (
                <button
                  onClick={() => {
                    setWaitingForRematch(true)
                    setRematchReady(prev => ({ ...prev, me: true }))
                    socket?.emit('ready-to-play-again')
                  }}
                  className="bg-yellow-500 hover:bg-yellow-400 text-white px-6 py-2 rounded-lg"
                >
                  Play Again
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <span className={rematchReady.me ? 'text-green-500' : 'text-gray-400'}>
                      {rematchReady.me ? '✓' : '○'} You
                    </span>
                    <span className="text-gray-300">|</span>
                    <span className={rematchReady.opponent ? 'text-green-500' : 'text-gray-400'}>
                      {rematchReady.opponent ? '✓' : '○'} Opponent
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {rematchReady.opponent ? 'Starting soon...' : 'Waiting for opponent...'}
                  </p>
                </div>
              )}
              
              <button
                onClick={() => {
                  setGameResult(null)
                  setWaitingForRematch(false)
                  setRematchReady({ me: false, opponent: false })
                }}
                className="mt-4 text-gray-500 hover:text-gray-700 text-sm underline block mx-auto"
              >
                Back to Lobby
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default GuessMyThing