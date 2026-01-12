import { useState, useEffect, useRef, useCallback } from 'react'
import { Tldraw, getSnapshot, loadSnapshot } from 'tldraw'
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
  const [initialSnapshot, setInitialSnapshot] = useState(null)
  const [snapshotLoaded, setSnapshotLoaded] = useState(false)
  
  const socketRef = useRef(null)
  const editorRef = useRef(null)
  const fileInputRef = useRef(null)
  const saveTimeoutRef = useRef(null)
  const cursorThrottleRef = useRef(null)
  const changesThrottleRef = useRef(null)
  const pendingChanges = useRef([])
  const isApplyingRemote = useRef(false)
  const storeListenerCleanup = useRef(null)

  // Load initial snapshot from database
  useEffect(() => {
    if (!boardId) return

    const loadBoard = async () => {
      try {
        const response = await authFetch(`/api/boards/${boardId}/snapshot`)
        if (response.ok) {
          const data = await response.json()
          if (data.snapshot) {
            setInitialSnapshot(data.snapshot)
          }
          setLastSaved(data.updatedAt)
        }
      } catch (error) {
        console.error('Failed to load board:', error)
      }
    }

    loadBoard()
  }, [boardId])

  // Initialize Socket.IO
  useEffect(() => {
    if (!boardId) return

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

    initSocket()

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_board', { boardId })
        socketRef.current.disconnect()
      }
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      if (cursorThrottleRef.current) clearTimeout(cursorThrottleRef.current)
      if (changesThrottleRef.current) clearTimeout(changesThrottleRef.current)
      if (storeListenerCleanup.current) storeListenerCleanup.current()
    }
  }, [boardId])

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
      socketRef.current.emit('join_board', { boardId })
    })

    socketRef.current.on('disconnect', () => {
      setConnected(false)
      setConnectionError('Disconnected')
    })

    socketRef.current.on('board_users', (data) => {
      // This is the initial list of OTHER users in the room
      setConnectedUsers(data.users || [])
    })

    socketRef.current.on('board_user_joined', (data) => {
      // Add new user, avoid duplicates
      setConnectedUsers(prev => {
        const exists = prev.some(u => u.userId === data.userId)
        if (exists) return prev
        return [...prev, { userId: data.userId, username: data.username }]
      })
    })

    socketRef.current.on('board_user_left', (data) => {
      setConnectedUsers(prev => prev.filter(u => u.userId !== data.userId))
    })

    socketRef.current.on('board_changes', (data) => {
      if (!editorRef.current || !data.changes) return
      
      // Avoid echo (don't apply our own changes)
      if (data.userId === user.id) return

      isApplyingRemote.current = true
      
      try {
        const editor = editorRef.current
        
        // Apply each change set
        data.changes.forEach(changeSet => {
          // Handle added records
          if (changeSet.added) {
            const records = Object.values(changeSet.added)
            if (records.length > 0) {
              editor.store.put(records)
            }
          }
          
          // Handle updated records
          if (changeSet.updated) {
            Object.entries(changeSet.updated).forEach(([id, [from, to]]) => {
              editor.store.put([to])
            })
          }
          
          // Handle removed records
          if (changeSet.removed) {
            const ids = Object.keys(changeSet.removed)
            if (ids.length > 0) {
              editor.store.remove(ids)
            }
          }
        })
      } catch (error) {
        console.error('Error applying remote changes:', error)
      } finally {
        isApplyingRemote.current = false
      }
    })
  }

  const handleEditorMount = useCallback((editor) => {
    editorRef.current = editor

    // Load initial snapshot if available
    if (initialSnapshot && !snapshotLoaded) {
      try {
        loadSnapshot(editor.store, initialSnapshot)
        setSnapshotLoaded(true)
      } catch (error) {
        console.error('Failed to load snapshot:', error)
      }
    }

    // Listen to store changes for collaboration
    const cleanup = editor.store.listen((entry) => {
      // Don't broadcast if we're applying remote changes
      if (isApplyingRemote.current) return
      
      const { changes, source } = entry
      
      // Only broadcast user changes
      if (source !== 'user') return
      
      // Queue changes for throttled broadcast
      pendingChanges.current.push(changes)
      
      // Throttle broadcasts to avoid flooding
      if (!changesThrottleRef.current) {
        changesThrottleRef.current = setTimeout(() => {
          if (socketRef.current && connected && pendingChanges.current.length > 0) {
            socketRef.current.emit('board_changes', {
              boardId,
              changes: pendingChanges.current,
            })
            pendingChanges.current = []
          }
          changesThrottleRef.current = null
        }, 50) // Batch changes every 50ms for smoother sync
      }

      // Debounce auto-save
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => {
        saveBoard()
      }, 3000) // Auto-save after 3 seconds of inactivity
    }, { source: 'all', scope: 'document' })

    storeListenerCleanup.current = cleanup

    // Track cursor movement
    const container = editor.getContainer()
    const handlePointerMove = (e) => {
      setCursorPos({ x: Math.round(e.clientX), y: Math.round(e.clientY) })
      
      // Throttle cursor broadcast
      if (!cursorThrottleRef.current && socketRef.current && connected) {
        cursorThrottleRef.current = setTimeout(() => {
          socketRef.current.emit('board_cursor', {
            boardId,
            x: e.clientX,
            y: e.clientY,
          })
          cursorThrottleRef.current = null
        }, 100)
      }
    }

    container.addEventListener('pointermove', handlePointerMove)

    // Track current tool and zoom
    const unsubscribe = editor.store.listen(() => {
      setCurrentTool(editor.getCurrentToolId())
      setZoom(Math.round(editor.getZoomLevel() * 100))
    }, { source: 'all', scope: 'session' })

    return () => {
      container.removeEventListener('pointermove', handlePointerMove)
      unsubscribe()
      cleanup()
    }
  }, [initialSnapshot, snapshotLoaded, boardId, connected, user.id])

  // Effect to load snapshot when editor is ready and snapshot is fetched
  useEffect(() => {
    if (editorRef.current && initialSnapshot && !snapshotLoaded) {
      try {
        loadSnapshot(editorRef.current.store, initialSnapshot)
        setSnapshotLoaded(true)
      } catch (error) {
        console.error('Failed to load snapshot:', error)
      }
    }
  }, [initialSnapshot, snapshotLoaded])

  const saveBoard = async () => {
    if (!editorRef.current || saving || !boardId) return

    setSaving(true)
    try {
      const snapshot = getSnapshot(editorRef.current.store)
      const response = await authFetch(`/api/boards/${boardId}/snapshot`, {
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
    } finally {
      setSaving(false)
    }
  }

  const handleExportPNG = async () => {
    if (!editorRef.current) return
    
    const shapeIds = editorRef.current.getCurrentPageShapeIds()
    if (shapeIds.size === 0) {
      alert('No shapes to export')
      return
    }

    try {
      const blob = await editorRef.current.getSvg(shapeIds)
      // Fallback: just alert that export is available
      alert('Use the tldraw menu (top-left hamburger) to export as PNG')
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Use the tldraw menu (top-left hamburger) to export.')
    }
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
            src: result.url,
            name: file.name,
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

  // Calculate total online users (other users + self)
  const totalOnline = connectedUsers.length + 1

  if (!boardId) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-400">
        <div className="bg-gray-300 border-2 border-t-white border-l-white 
                     border-r-gray-600 border-b-gray-600 p-8">
          <p className="text-sm font-bold text-gray-800">No board selected</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-400">
      {/* Top Toolbar - Retro Windows 98 Style */}
      <div className="flex-shrink-0 bg-gray-300 border-b-2 border-gray-600 shadow-sm">
        <div className="flex items-center justify-between px-2 py-1.5 flex-wrap gap-2">
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
            
            <div className="h-6 w-px bg-gray-600 hidden sm:block" />
            
            <span className="text-sm font-bold text-gray-800 px-2 truncate max-w-[150px] sm:max-w-none">
              {boardName}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
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
              <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save'}</span>
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
              <span className="hidden sm:inline">Image</span>
            </button>

            <button
              onClick={handleShareLink}
              className="px-3 py-1 bg-gray-300 border-2 border-t-white border-l-white 
                       border-r-gray-600 border-b-gray-600 hover:border-t-gray-600 
                       hover:border-l-gray-600 hover:border-r-white hover:border-b-white
                       active:bg-gray-400 text-xs font-bold flex items-center gap-1"
            >
              <ShareIcon sx={{ fontSize: 14 }} />
              <span className="hidden sm:inline">Share</span>
            </button>

            <div className="flex items-center gap-1 px-2">
              <CircleIcon 
                sx={{ fontSize: 12 }} 
                className={connected ? 'text-green-600' : 'text-red-600'} 
              />
              <span className="text-xs">
                {connected ? `${totalOnline} online` : 'Offline'}
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
        <Tldraw
          onMount={handleEditorMount}
        />
      </div>

      {/* Bottom Status Bar - Retro Windows 98 Style */}
      <div className="flex-shrink-0 bg-gray-300 border-t-2 border-gray-600 px-2 py-1">
        <div className="flex items-center justify-between text-xs flex-wrap gap-1">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="px-2 py-0.5 bg-gray-400 border border-gray-600">
              <span className="font-bold">{currentTool}</span>
            </div>
            <div className="px-2 py-0.5 bg-gray-400 border border-gray-600 hidden sm:block">
              X:{cursorPos.x} Y:{cursorPos.y}
            </div>
            <div className="px-2 py-0.5 bg-gray-400 border border-gray-600">
              {zoom}%
            </div>
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
