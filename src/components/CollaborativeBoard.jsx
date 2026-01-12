import { useState, useEffect, useRef, useCallback } from 'react'
import { Tldraw, getSnapshot, loadSnapshot } from 'tldraw'
import 'tldraw/tldraw.css'
import { io } from 'socket.io-client'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SaveIcon from '@mui/icons-material/Save'
import ImageIcon from '@mui/icons-material/Image'
import ShareIcon from '@mui/icons-material/Share'
import CircleIcon from '@mui/icons-material/Circle'
import { API_URL } from '../config'
import { uploadImage, validateImage } from '../utils/upload'
import { authFetch } from '../utils/api'

// Debug logging helper
const DEBUG = true
const log = (...args) => DEBUG && console.log('[Board]', ...args)
const logError = (...args) => console.error('[Board]', ...args)

// Cursor colors for different users
const CURSOR_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']

function CollaborativeBoard({ user, board, onBack }) {
  const boardId = board?.boardId
  const boardName = board?.name || 'Untitled Board'

  const [saving, setSaving] = useState(false)
  const [connected, setConnected] = useState(false)
  const [connectedUsers, setConnectedUsers] = useState([])
  const [connectionError, setConnectionError] = useState(null)
  const [lastSaved, setLastSaved] = useState(null)
  const [currentTool, setCurrentTool] = useState('select')
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(100)
  const [remoteCursors, setRemoteCursors] = useState({})
  const [editorReady, setEditorReady] = useState(false)
  
  const socketRef = useRef(null)
  const socketIdRef = useRef(null) // Track our own socket ID
  const editorRef = useRef(null)
  const fileInputRef = useRef(null)
  const saveTimeoutRef = useRef(null)
  const cursorThrottleRef = useRef(null)
  const isApplyingRemote = useRef(false)
  const pendingSnapshotRef = useRef(null)
  const mountedRef = useRef(true)
  const storeCleanupRef = useRef(null)

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Load initial snapshot from database
  useEffect(() => {
    if (!boardId) return

    log('📥 Loading board snapshot for:', boardId)

    const loadBoard = async () => {
      try {
        const response = await authFetch(`/api/boards/${boardId}/snapshot`)
        if (!mountedRef.current) return
        
        if (response.ok) {
          const data = await response.json()
          log('📥 Snapshot received:', {
            hasSnapshot: !!data.snapshot,
            updatedAt: data.updatedAt
          })
          
          if (data.snapshot) {
            pendingSnapshotRef.current = data.snapshot
            // If editor is already mounted, load it now
            if (editorRef.current) {
              loadSnapshotIntoEditor(data.snapshot)
            }
          }
          setLastSaved(data.updatedAt)
        }
      } catch (error) {
        logError('Failed to load board:', error)
      }
    }

    loadBoard()
  }, [boardId])

  // Helper to load snapshot without triggering broadcasts
  const loadSnapshotIntoEditor = useCallback((snapshot) => {
    if (!editorRef.current || !snapshot) return
    
    log('📥 Loading snapshot into editor...')
    isApplyingRemote.current = true
    try {
      loadSnapshot(editorRef.current.store, snapshot)
      log('📥 ✅ Snapshot loaded')
    } catch (error) {
      logError('Failed to load snapshot:', error)
    } finally {
      // Delay resetting flag to ensure all change events are ignored
      setTimeout(() => {
        isApplyingRemote.current = false
      }, 100)
    }
  }, [])

  // Initialize Socket.IO
  useEffect(() => {
    if (!boardId) return

    log('🔌 Initializing socket for board:', boardId)

    // Disconnect any existing socket first (handles React Strict Mode double-mounting)
    if (socketRef.current) {
      log('🔌 Disconnecting existing socket before creating new one...')
      socketRef.current.emit('leave_board', { boardId })
      socketRef.current.disconnect()
      socketRef.current = null
      socketIdRef.current = null
    }

    let socket = null

    const initSocket = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        if (!token) {
          setConnectionError('Not authenticated')
          return
        }

        const response = await authFetch('/auth/socket-token')
        if (!mountedRef.current) return
        
        if (response.ok) {
          const data = await response.json()
          log('🔑 Got socket token, connecting...')
          socket = connectSocket(data.token)
          socketRef.current = socket
        } else {
          setConnectionError('Failed to get socket token')
        }
      } catch (error) {
        if (mountedRef.current) {
          setConnectionError('Connection error: ' + error.message)
        }
      }
    }

    initSocket()

    return () => {
      log('🔌 Cleanup: disconnecting socket...')
      if (socketRef.current) {
        socketRef.current.emit('leave_board', { boardId })
        socketRef.current.disconnect()
        socketRef.current = null
        socketIdRef.current = null
      }
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      if (cursorThrottleRef.current) clearTimeout(cursorThrottleRef.current)
    }
  }, [boardId])

  const connectSocket = (token) => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    
    const socket = io(API_URL, {
      auth: { token },
      withCredentials: true,
      transports: isMobile ? ['polling'] : ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
    })

    socket.on('connect', () => {
      if (!mountedRef.current) return
      socketIdRef.current = socket.id // Store our socket ID
      log('✅ Socket connected, ID:', socket.id)
      setConnected(true)
      setConnectionError(null)
      socket.emit('join_board', { boardId })
    })

    socket.on('disconnect', (reason) => {
      log('❌ Socket disconnected:', reason)
      if (mountedRef.current) {
        setConnected(false)
      }
    })

    socket.on('connect_error', (error) => {
      logError('Socket connection error:', error.message)
      if (mountedRef.current) {
        setConnectionError('Connection error: ' + error.message)
      }
    })

    socket.on('board_users', (data) => {
      log('👥 Board users:', data.users?.map(u => u.username))
      if (mountedRef.current) {
        setConnectedUsers(data.users || [])
      }
    })

    socket.on('board_user_joined', (data) => {
      log('👤 User joined:', data.username)
      if (mountedRef.current) {
        setConnectedUsers(prev => {
          if (prev.some(u => u.userId === data.userId)) return prev
          return [...prev, { userId: data.userId, username: data.username }]
        })
      }
    })

    socket.on('board_user_left', (data) => {
      log('👤 User left:', data.userId, 'socketId:', data.socketId)
      if (mountedRef.current) {
        // Remove from connected users only if no other sockets from same user
        // (for now, just filter by userId)
        setConnectedUsers(prev => prev.filter(u => u.userId !== data.userId))
        // Remove cursor by socketId
        setRemoteCursors(prev => {
          const next = { ...prev }
          delete next[data.socketId]
          return next
        })
      }
    })

    socket.on('board_cursor', (data) => {
      if (!mountedRef.current || data.socketId === socketIdRef.current) return
      
      // Use socketId as key to track individual connections
      setRemoteCursors(prev => ({
        ...prev,
        [data.socketId]: {
          x: data.x,
          y: data.y,
          username: data.username,
          color: CURSOR_COLORS[data.userId % CURSOR_COLORS.length]
        }
      }))
    })

    socket.on('board_changes', (data) => {
      log('📥 RECEIVED changes from:', data.username, '| socketId:', data.socketId, '| count:', data.changes?.length)
      
      // Check against socket ID to prevent echo (handles multiple tabs/connections)
      if (data.socketId === socketIdRef.current) {
        log('📥 Ignoring own changes (same socket)')
        return
      }

      if (!editorRef.current) {
        log('📥 ⚠️ Editor not ready')
        return
      }
      
      if (!data.changes?.length) {
        return
      }

      isApplyingRemote.current = true
      
      try {
        const editor = editorRef.current
        
        data.changes.forEach((changeSet) => {
          // Added records
          if (changeSet.added) {
            const records = Object.values(changeSet.added)
            if (records.length > 0) {
              log('📥 Adding', records.length, 'records')
              editor.store.put(records)
            }
          }
          
          // Updated records - handle [from, to] tuple format
          if (changeSet.updated) {
            const records = Object.values(changeSet.updated).map(update => 
              Array.isArray(update) ? update[1] : update
            )
            if (records.length > 0) {
              log('📥 Updating', records.length, 'records')
              editor.store.put(records)
            }
          }
          
          // Removed records
          if (changeSet.removed) {
            const ids = Object.keys(changeSet.removed)
            if (ids.length > 0) {
              log('📥 Removing', ids.length, 'records')
              editor.store.remove(ids)
            }
          }
        })
        
        log('📥 ✅ Changes applied')
      } catch (error) {
        logError('Error applying changes:', error)
      } finally {
        isApplyingRemote.current = false
      }
    })

    return socket
  }

  // Handle editor mount
  const handleEditorMount = useCallback((editor) => {
    log('🎨 Editor mounted')
    editorRef.current = editor
    setEditorReady(true)

    // Load pending snapshot if available
    if (pendingSnapshotRef.current) {
      loadSnapshotIntoEditor(pendingSnapshotRef.current)
      pendingSnapshotRef.current = null
    }

    // Set up store listener for changes
    const cleanup = editor.store.listen((entry) => {
      // Skip if applying remote changes or loading snapshot
      if (isApplyingRemote.current) return
      
      const { changes, source } = entry
      
      // Only handle user-initiated changes
      if (source !== 'user') return
      
      const hasAdded = changes.added && Object.keys(changes.added).length > 0
      const hasUpdated = changes.updated && Object.keys(changes.updated).length > 0
      const hasRemoved = changes.removed && Object.keys(changes.removed).length > 0
      
      if (!hasAdded && !hasUpdated && !hasRemoved) return
      
      log('📤 Local change:', {
        added: hasAdded ? Object.keys(changes.added).length : 0,
        updated: hasUpdated ? Object.keys(changes.updated).length : 0,
        removed: hasRemoved ? Object.keys(changes.removed).length : 0,
      })
      
      // Send changes via socket
      if (socketRef.current?.connected) {
        log('📤 Sending via socket...')
        socketRef.current.emit('board_changes', {
          boardId,
          changes: [changes],
        })
        log('📤 ✅ Sent')
      } else {
        log('📤 ⚠️ Socket not connected, skipping broadcast')
      }

      // Debounce auto-save
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => {
        saveBoard()
      }, 2000)
    }, { source: 'all', scope: 'document' })

    storeCleanupRef.current = cleanup

    // Track cursor for broadcasting
    const container = editor.getContainer()
    const handlePointerMove = (e) => {
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      setCursorPos({ x: Math.round(e.clientX), y: Math.round(e.clientY) })
      
      if (!cursorThrottleRef.current && socketRef.current?.connected) {
        cursorThrottleRef.current = setTimeout(() => {
          socketRef.current?.emit('board_cursor', { boardId, x, y })
          cursorThrottleRef.current = null
        }, 50)
      }
    }
    container.addEventListener('pointermove', handlePointerMove)

    // Track tool and zoom
    const sessionCleanup = editor.store.listen(() => {
      if (mountedRef.current) {
        setCurrentTool(editor.getCurrentToolId())
        setZoom(Math.round(editor.getZoomLevel() * 100))
      }
    }, { source: 'all', scope: 'session' })

    return () => {
      container.removeEventListener('pointermove', handlePointerMove)
      sessionCleanup()
      cleanup()
    }
  }, [boardId, loadSnapshotIntoEditor])

  // Save board function
  const saveBoard = useCallback(async () => {
    if (!editorRef.current || saving || !boardId) return

    // Check if there are shapes to save
    const shapeIds = editorRef.current.getCurrentPageShapeIds()
    log('💾 Saving board... shapes:', shapeIds.size)

    setSaving(true)
    try {
      const snapshot = getSnapshot(editorRef.current.store)
      
      // Debug: Log snapshot structure
      log('💾 Snapshot structure:', {
        hasStore: 'store' in snapshot,
        hasSchema: 'schema' in snapshot,
        storeKeys: snapshot.store ? Object.keys(snapshot.store).slice(0, 5) : 'N/A',
      })
      
      const response = await authFetch(`/api/boards/${boardId}/snapshot`, {
        method: 'POST',
        body: JSON.stringify({ snapshot }),
      })

      if (response.ok) {
        const data = await response.json()
        log('💾 ✅ Saved at:', data.updatedAt)
        if (mountedRef.current) {
          setLastSaved(data.updatedAt)
        }
      } else {
        logError('Save failed:', response.status)
      }
    } catch (error) {
      logError('Save error:', error)
    } finally {
      if (mountedRef.current) {
        setSaving(false)
      }
    }
  }, [boardId, saving])

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validateImage(file)
    if (!validation.valid) {
      alert(validation.error)
      return
    }

    try {
      const result = await uploadImage(file, 'board')
      
      if (editorRef.current) {
        const center = editorRef.current.getViewportPageCenter()
        editorRef.current.createShape({
          type: 'image',
          x: center.x - 150,
          y: center.y - 150,
          props: { w: 300, h: 300, src: result.url, name: file.name },
        })
      }
    } catch (error) {
      logError('Image upload failed:', error)
      alert('Failed to upload image')
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert('Board link copied!')
    })
  }

  const formatTime = (dateString) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleTimeString()
  }

  const totalOnline = connectedUsers.length + 1

  if (!boardId) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-400">
        <div className="bg-gray-300 border-2 border-t-white border-l-white border-r-gray-600 border-b-gray-600 p-8">
          <p className="text-sm font-bold text-gray-800">No board selected</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-400">
      {/* Toolbar */}
      <div className="flex-shrink-0 bg-gray-300 border-b-2 border-gray-600">
        <div className="flex items-center justify-between px-2 py-1.5 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="px-2 py-1 bg-gray-300 border-2 border-t-white border-l-white border-r-gray-600 border-b-gray-600 hover:border-t-gray-600 hover:border-l-gray-600 hover:border-r-white hover:border-b-white text-xs font-bold flex items-center gap-1"
            >
              <ArrowBackIcon sx={{ fontSize: 16 }} />
              Back
            </button>
            <div className="h-6 w-px bg-gray-600 hidden sm:block" />
            <span className="text-sm font-bold text-gray-800 px-2 truncate max-w-[150px] sm:max-w-none">
              {boardName}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={saveBoard}
              disabled={saving}
              className="px-3 py-1 bg-gray-300 border-2 border-t-white border-l-white border-r-gray-600 border-b-gray-600 hover:border-t-gray-600 hover:border-l-gray-600 hover:border-r-white hover:border-b-white text-xs font-bold disabled:opacity-50 flex items-center gap-1"
            >
              <SaveIcon sx={{ fontSize: 14 }} />
              <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save'}</span>
            </button>

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1 bg-gray-300 border-2 border-t-white border-l-white border-r-gray-600 border-b-gray-600 hover:border-t-gray-600 hover:border-l-gray-600 hover:border-r-white hover:border-b-white text-xs font-bold flex items-center gap-1"
            >
              <ImageIcon sx={{ fontSize: 14 }} />
              <span className="hidden sm:inline">Image</span>
            </button>

            <button
              onClick={handleShareLink}
              className="px-3 py-1 bg-gray-300 border-2 border-t-white border-l-white border-r-gray-600 border-b-gray-600 hover:border-t-gray-600 hover:border-l-gray-600 hover:border-r-white hover:border-b-white text-xs font-bold flex items-center gap-1"
            >
              <ShareIcon sx={{ fontSize: 14 }} />
              <span className="hidden sm:inline">Share</span>
            </button>

            <div className="flex items-center gap-1 px-2">
              <CircleIcon sx={{ fontSize: 12 }} className={connected ? 'text-green-600' : 'text-red-600'} />
              <span className="text-xs">{connected ? `${totalOnline} online` : 'Offline'}</span>
            </div>
          </div>
        </div>

        {connectionError && (
          <div className="px-2 py-1 bg-yellow-200 border-t border-yellow-600 text-xs">⚠️ {connectionError}</div>
        )}
      </div>

      {/* Canvas with Remote Cursors */}
      <div className="flex-1 relative overflow-hidden">
        <Tldraw onMount={handleEditorMount} />
        
        {/* Remote Cursors */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Object.entries(remoteCursors).map(([socketId, cursor]) => (
            <div
              key={socketId}
              className="absolute transition-all duration-75"
              style={{ left: cursor.x, top: cursor.y, transform: 'translate(-2px, -2px)' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill={cursor.color} style={{ filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.3))' }}>
                <path d="M5.65 3.15l12.6 10.5a1 1 0 0 1-.65 1.75H12.4l-2.3 5.75a1 1 0 0 1-1.85 0L5.95 15.4l-3.3 1.1a1 1 0 0 1-1.25-1.25l4.25-12.1z" />
              </svg>
              <div
                className="absolute left-5 top-4 px-1.5 py-0.5 text-xs font-bold text-white rounded whitespace-nowrap"
                style={{ backgroundColor: cursor.color, boxShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
              >
                {cursor.username}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex-shrink-0 bg-gray-300 border-t-2 border-gray-600 px-2 py-1">
        <div className="flex items-center justify-between text-xs flex-wrap gap-1">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="px-2 py-0.5 bg-gray-400 border border-gray-600">
              <span className="font-bold">{currentTool}</span>
            </div>
            <div className="px-2 py-0.5 bg-gray-400 border border-gray-600 hidden sm:block">
              X:{cursorPos.x} Y:{cursorPos.y}
            </div>
            <div className="px-2 py-0.5 bg-gray-400 border border-gray-600">{zoom}%</div>
          </div>
          
          <div className="flex items-center gap-2">
            {connectedUsers.length > 0 && (
              <div className="px-2 py-0.5 bg-gray-400 border border-gray-600 hidden sm:block">
                Also here: {connectedUsers.map(u => u.username).join(', ')}
              </div>
            )}
            <div className="px-2 py-0.5 bg-gray-400 border border-gray-600">
              Saved: {formatTime(lastSaved)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CollaborativeBoard
