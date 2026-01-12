import { useState, useEffect, useRef, useCallback } from 'react'
import { Tldraw, useEditor, track } from 'tldraw'
import 'tldraw/tldraw.css'
import { io } from 'socket.io-client'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SaveIcon from '@mui/icons-material/Save'
import ImageIcon from '@mui/icons-material/Image'
import DownloadIcon from '@mui/icons-material/Download'
import ShareIcon from '@mui/icons-material/Share'
import CircleIcon from '@mui/icons-material/Circle'
import { API_URL } from '../config'
import { uploadImage, validateImage } from '../utils/upload'
import { authFetch } from '../utils/api'

const BOARD_ID = 'shared-board' // Single shared board for now

function CollaborativeBoard({ user, onBack }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [connected, setConnected] = useState(false)
  const [connectedUsers, setConnectedUsers] = useState([])
  const [connectionError, setConnectionError] = useState(null)
  const [lastSaved, setLastSaved] = useState(null)
  const [currentTool, setCurrentTool] = useState('select')
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(100)
  
  const socketRef = useRef(null)
  const editorRef = useRef(null)
  const fileInputRef = useRef(null)
  const saveTimeoutRef = useRef(null)
  const cursorThrottleRef = useRef(null)
  const changesThrottleRef = useRef(null)
  const pendingChanges = useRef([])

  useEffect(() => {
    initBoard()
    initSocket()

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_board', { boardId: BOARD_ID })
        socketRef.current.disconnect()
      }
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      if (cursorThrottleRef.current) clearTimeout(cursorThrottleRef.current)
      if (changesThrottleRef.current) clearTimeout(changesThrottleRef.current)
    }
  }, [])

  const initBoard = async () => {
    try {
      const response = await authFetch(`/api/boards/${BOARD_ID}/snapshot`)
      if (response.ok) {
        const data = await response.json()
        if (data.snapshot && editorRef.current) {
          // Load snapshot into tldraw
          editorRef.current.store.loadSnapshot(data.snapshot)
        }
        setLastSaved(data.updatedAt)
      }
    } catch (error) {
      console.error('Failed to load board:', error)
    } finally {
      setLoading(false)
    }
  }

  const initSocket = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setConnectionError('Not authenticated')
        return
      }

      const response = await authFetch('/auth/socket-token')
      if (response.ok) {
        const data = await response.json()
        connectSocket(data.token)
      } else {
        setConnectionError('Failed to get socket token')
      }
    } catch (error) {
      setConnectionError('Connection error: ' + error.message)
    }
  }

  const connectSocket = (token) => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    
    socketRef.current = io(API_URL, {
      auth: { token },
      withCredentials: true,
      transports: isMobile ? ['polling'] : ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
    })

    socketRef.current.on('connect', () => {
      setConnected(true)
      setConnectionError(null)
      socketRef.current.emit('join_board', { boardId: BOARD_ID })
    })

    socketRef.current.on('disconnect', () => {
      setConnected(false)
      setConnectionError('Disconnected')
    })

    socketRef.current.on('board_users', (data) => {
      setConnectedUsers(data.users || [])
    })

    socketRef.current.on('board_user_joined', (data) => {
      setConnectedUsers(prev => [...prev, { userId: data.userId, username: data.username }])
    })

    socketRef.current.on('board_user_left', (data) => {
      setConnectedUsers(prev => prev.filter(u => u.userId !== data.userId))
    })

    socketRef.current.on('board_changes', (data) => {
      if (editorRef.current && data.changes) {
        // Apply remote changes to local editor
        try {
          editorRef.current.store.mergeRemoteChanges(() => {
            // Apply the changes
            data.changes.forEach(change => {
              if (change.added) {
                Object.values(change.added).forEach(record => {
                  editorRef.current.store.put([record])
                })
              }
              if (change.updated) {
                Object.values(change.updated).forEach(record => {
                  editorRef.current.store.put([record])
                })
              }
              if (change.removed) {
                Object.keys(change.removed).forEach(id => {
                  editorRef.current.store.remove([id])
                })
              }
            })
          })
        } catch (error) {
          console.error('Error applying remote changes:', error)
        }
      }
    })
  }

  const handleEditorMount = (editor) => {
    editorRef.current = editor

    // Listen to store changes and broadcast
    editor.store.listen((entry) => {
      const { changes } = entry
      
      // Queue changes for throttled broadcast
      pendingChanges.current.push(changes)
      
      // Throttle broadcasts to avoid flooding
      if (!changesThrottleRef.current) {
        changesThrottleRef.current = setTimeout(() => {
          if (socketRef.current && connected && pendingChanges.current.length > 0) {
            socketRef.current.emit('board_changes', {
              boardId: BOARD_ID,
              changes: pendingChanges.current,
            })
            pendingChanges.current = []
          }
          changesThrottleRef.current = null
        }, 100) // Batch changes every 100ms
      }

      // Debounce auto-save
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => {
        saveBoard()
      }, 5000) // Auto-save after 5 seconds of inactivity
    })

    // Track cursor movement
    const handlePointerMove = (e) => {
      setCursorPos({ x: Math.round(e.clientX), y: Math.round(e.clientY) })
      
      // Throttle cursor broadcast
      if (!cursorThrottleRef.current && socketRef.current && connected) {
        cursorThrottleRef.current = setTimeout(() => {
          socketRef.current.emit('board_cursor', {
            boardId: BOARD_ID,
            x: e.clientX,
            y: e.clientY,
          })
          cursorThrottleRef.current = null
        }, 50)
      }
    }

    editor.getContainer().addEventListener('pointermove', handlePointerMove)

    // Track current tool
    const checkCurrentTool = () => {
      const tool = editor.getCurrentToolId()
      setCurrentTool(tool)
    }
    
    const interval = setInterval(checkCurrentTool, 500)

    return () => {
      editor.getContainer().removeEventListener('pointermove', handlePointerMove)
      clearInterval(interval)
    }
  }

  const saveBoard = async () => {
    if (!editorRef.current || saving) return

    setSaving(true)
    try {
      const snapshot = editorRef.current.store.getSnapshot()
      const response = await authFetch(`/api/boards/${BOARD_ID}/snapshot`, {
        method: 'POST',
        body: JSON.stringify({ snapshot }),
      })

      if (response.ok) {
        const data = await response.json()
        setLastSaved(data.updatedAt)
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      console.error('Save failed:', error)
      alert('Failed to save board')
    } finally {
      setSaving(false)
    }
  }

  const handleExportPNG = () => {
    if (!editorRef.current) return
    
    editorRef.current.exportAs(
      editorRef.current.getCurrentPageShapeIds(),
      'png',
      `board-${Date.now()}`
    )
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const validation = validateImage(file)
    if (!validation.valid) {
      alert(validation.error)
      return
    }

    try {
      const result = await uploadImage(file, 'board')
      
      if (editorRef.current) {
        // Insert image at viewport center
        const center = editorRef.current.getViewportPageCenter()
        editorRef.current.createShape({
          type: 'image',
          x: center.x - 150,
          y: center.y - 150,
          props: {
            w: 300,
            h: 300,
            url: result.url,
          },
        })
      }
    } catch (error) {
      console.error('Image upload failed:', error)
      alert('Failed to upload image: ' + error.message)
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleShareLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      alert('Board link copied to clipboard!')
    })
  }

  const formatTime = (dateString) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    return date.toLocaleTimeString()
  }

  return (
    <div className="h-screen flex flex-col bg-gray-400">
      {/* Top Toolbar - Retro Windows 98 Style */}
      <div className="flex-shrink-0 bg-gray-300 border-b-2 border-gray-600 shadow-sm">
        <div className="flex items-center justify-between px-2 py-1.5">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="px-2 py-1 bg-gray-300 border-2 border-t-white border-l-white 
                       border-r-gray-600 border-b-gray-600 hover:border-t-gray-600 
                       hover:border-l-gray-600 hover:border-r-white hover:border-b-white
                       active:bg-gray-400 text-xs font-bold flex items-center gap-1"
            >
              <ArrowBackIcon sx={{ fontSize: 16 }} />
              Back
            </button>
            
            <div className="h-6 w-px bg-gray-600" />
            
            <span className="text-sm font-bold text-gray-800 px-2">
              Collab Board - {user.username}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={saveBoard}
              disabled={saving}
              className="px-3 py-1 bg-gray-300 border-2 border-t-white border-l-white 
                       border-r-gray-600 border-b-gray-600 hover:border-t-gray-600 
                       hover:border-l-gray-600 hover:border-r-white hover:border-b-white
                       active:bg-gray-400 text-xs font-bold disabled:opacity-50
                       flex items-center gap-1"
            >
              <SaveIcon sx={{ fontSize: 14 }} />
              {saving ? 'Saving...' : 'Save'}
            </button>

            <button
              onClick={handleExportPNG}
              className="px-3 py-1 bg-gray-300 border-2 border-t-white border-l-white 
                       border-r-gray-600 border-b-gray-600 hover:border-t-gray-600 
                       hover:border-l-gray-600 hover:border-r-white hover:border-b-white
                       active:bg-gray-400 text-xs font-bold flex items-center gap-1"
            >
              <DownloadIcon sx={{ fontSize: 14 }} />
              Export PNG
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1 bg-gray-300 border-2 border-t-white border-l-white 
                       border-r-gray-600 border-b-gray-600 hover:border-t-gray-600 
                       hover:border-l-gray-600 hover:border-r-white hover:border-b-white
                       active:bg-gray-400 text-xs font-bold flex items-center gap-1"
            >
              <ImageIcon sx={{ fontSize: 14 }} />
              Upload Image
            </button>

            <button
              onClick={handleShareLink}
              className="px-3 py-1 bg-gray-300 border-2 border-t-white border-l-white 
                       border-r-gray-600 border-b-gray-600 hover:border-t-gray-600 
                       hover:border-l-gray-600 hover:border-r-white hover:border-b-white
                       active:bg-gray-400 text-xs font-bold flex items-center gap-1"
            >
              <ShareIcon sx={{ fontSize: 14 }} />
              Share
            </button>

            <div className="flex items-center gap-1 px-2">
              <CircleIcon 
                sx={{ fontSize: 12 }} 
                className={connected ? 'text-green-600' : 'text-red-600'} 
              />
              <span className="text-xs">
                {connected ? `${connectedUsers.length + 1} online` : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {connectionError && (
          <div className="px-2 py-1 bg-yellow-200 border-t border-yellow-600 text-xs">
            ⚠️ {connectionError}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-400">
            <div className="bg-gray-300 border-2 border-t-white border-l-white 
                         border-r-gray-600 border-b-gray-600 p-8">
              <p className="text-sm font-bold text-gray-800">Loading board...</p>
            </div>
          </div>
        ) : (
          <Tldraw
            onMount={handleEditorMount}
            className="tldraw-retro"
          />
        )}
      </div>

      {/* Bottom Status Bar - Retro Windows 98 Style */}
      <div className="flex-shrink-0 bg-gray-300 border-t-2 border-gray-600 px-2 py-1">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="px-2 py-0.5 bg-gray-400 border border-gray-600">
              Tool: <span className="font-bold">{currentTool}</span>
            </div>
            <div className="px-2 py-0.5 bg-gray-400 border border-gray-600">
              X:{cursorPos.x} Y:{cursorPos.y}
            </div>
            <div className="px-2 py-0.5 bg-gray-400 border border-gray-600">
              Zoom: {zoom}%
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {connectedUsers.length > 0 && (
              <div className="px-2 py-0.5 bg-gray-400 border border-gray-600">
                Online: {connectedUsers.map(u => u.username).join(', ')}
              </div>
            )}
            <div className="px-2 py-0.5 bg-gray-400 border border-gray-600">
              Last saved: {formatTime(lastSaved)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CollaborativeBoard
