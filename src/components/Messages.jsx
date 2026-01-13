import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ChatIcon from '@mui/icons-material/Chat'
import SendIcon from '@mui/icons-material/Send'
import ImageIcon from '@mui/icons-material/Image'
import DoneAllIcon from '@mui/icons-material/DoneAll'
import DoneIcon from '@mui/icons-material/Done'
import CloseIcon from '@mui/icons-material/Close'
import { API_URL } from '../config'
import { uploadImage, validateImage } from '../utils/upload'
import { authFetch } from '../utils/api'

function Messages({ user, onBack }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [partnerOnline, setPartnerOnline] = useState(false)
  const [partnerTyping, setPartnerTyping] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [connectionError, setConnectionError] = useState(null)
  
  const socketRef = useRef(null)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const fileInputRef = useRef(null)

  // Partner ID (since there are only 2 users)
  const partnerId = user.id === 1 ? 2 : 1

  useEffect(() => {
    fetchMessages()
    initSocket()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  const initSocket = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        setConnectionError('Not authenticated. Please log out and log back in.')
        return
      }
      
      setConnectionError('Connecting to chat server...')
      
      const response = await authFetch('/auth/socket-token')
      
      if (response.ok) {
        const data = await response.json()
        setConnectionError(null)
        connectSocket(data.token)
      } else if (response.status === 401 || response.status === 403) {
        setConnectionError('Session expired. Please log out and log back in.')
      } else {
        const errorData = await response.json().catch(() => ({}))
        setConnectionError(`Failed to connect: ${errorData.error || 'Server error'}`)
      }
    } catch (error) {
      setConnectionError(`Connection error: ${error.message}`)
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const response = await authFetch('/api/messages')
      
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      } else if (response.status === 401 || response.status === 403) {
        setConnectionError('Session expired. Please log out and log back in.')
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const connectSocket = (token) => {
    if (!token) return

    // Detect if on mobile for transport selection
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
      socketRef.current.emit('join_chat')
    })

    socketRef.current.on('disconnect', (reason) => {
      setConnected(false)
      if (reason === 'io server disconnect') {
        socketRef.current.connect()
      }
      setConnectionError(`Disconnected: ${reason}`)
    })

    socketRef.current.on('new_message', (message) => {
      setMessages(prev => [...prev, message])
      
      if (message.senderId === partnerId) {
        socketRef.current.emit('mark_read', [message.id])
      }
    })

    socketRef.current.on('user_online', ({ userId }) => {
      if (userId === partnerId) {
        setPartnerOnline(true)
      }
    })

    socketRef.current.on('user_offline', ({ userId }) => {
      if (userId === partnerId) {
        setPartnerOnline(false)
      }
    })

    socketRef.current.on('user_typing', ({ userId }) => {
      if (userId === partnerId) {
        setPartnerTyping(true)
      }
    })

    socketRef.current.on('user_stop_typing', ({ userId }) => {
      if (userId === partnerId) {
        setPartnerTyping(false)
      }
    })

    socketRef.current.on('messages_read', ({ messageIds }) => {
      setMessages(prev => prev.map(msg => 
        messageIds.includes(msg.id) ? { ...msg, read: true } : msg
      ))
    })

    socketRef.current.on('error', (error) => {
      setConnectionError(`Socket error: ${error.message || 'Unknown error'}`)
    })

    socketRef.current.on('connect_error', (error) => {
      setConnected(false)
      setConnectionError(`Connection failed: ${error.message}`)
    })
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async () => {
    if (!newMessage.trim() && !imagePreview) return
    if (uploading) return
    
    if (!socketRef.current || !connected) {
      alert('Not connected to chat server. Check your connection and try refreshing the page.')
      return
    }

    let imageUrl = null

    if (imageFile) {
      const validation = validateImage(imageFile)
      if (!validation.valid) {
        alert(validation.error)
        return
      }

      setUploading(true)
      try {
        const result = await uploadImage(imageFile, 'messages')
        imageUrl = result.url
      } catch (error) {
        alert('Failed to upload image: ' + error.message)
        setUploading(false)
        return
      }
      setUploading(false)
    }

    socketRef.current.emit('send_message', {
      content: newMessage.trim() || null,
      imageUrl,
      receiverId: partnerId,
    })

    setNewMessage('')
    setImagePreview(null)
    setImageFile(null)
    
    if (socketRef.current) {
      socketRef.current.emit('stop_typing')
    }
  }

  const handleTyping = (e) => {
    setNewMessage(e.target.value)

    socketRef.current.emit('typing')

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit('stop_typing')
    }, 2000)
  }

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImagePreview(null)
    setImageFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return date.toLocaleDateString()
  }

  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.createdAt)
    if (!groups[date]) groups[date] = []
    groups[date].push(message)
    return groups
  }, {})

  const partnerName = user.id === 1 ? 'Ella' : 'Frank'

  return (
    <div className="h-screen bg-gray-900 flex flex-col keyboard-avoid">
      {/* Header with safe area */}
      <header className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-4 md:px-5 py-3 md:py-4 shadow-lg pt-safe flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="btn-mobile w-10 h-10 flex items-center justify-center rounded-xl 
                     bg-white/20 hover:bg-white/30 transition-all duration-200 touch-manipulation"
          >
            <ArrowBackIcon />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <ChatIcon className="flex-shrink-0" />
              <h1 className="text-lg md:text-xl font-bold truncate">Messages</h1>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${partnerOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
              <span className="text-xs md:text-sm text-purple-200 truncate">
                {partnerTyping ? `${partnerName} is typing...` : 
                 partnerOnline ? `${partnerName} is online` : `${partnerName} is offline`}
              </span>
            </div>
          </div>
          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${connected ? 'bg-green-400' : 'bg-red-400'}`} 
               title={connected ? 'Connected' : 'Disconnected'} />
        </div>
      </header>

      {/* Connection Error Banner */}
      {connectionError && (
        <div className="bg-yellow-900/50 border-l-4 border-yellow-500 px-4 py-3 text-sm flex items-center justify-between flex-shrink-0">
          <p className="text-yellow-200 font-medium text-xs md:text-sm flex-1 pr-2">⚠️ {connectionError}</p>
          {!connected && (
            <button
              onClick={initSocket}
              className="btn-mobile px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-xs font-medium touch-manipulation flex-shrink-0"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Messages - Scrollable area */}
      <div className="flex-1 overflow-y-auto overscroll-behavior-contain px-3 md:px-4 py-3 md:py-4 space-y-3 md:space-y-4 min-h-0">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 md:w-10 md:h-10 border-4 border-purple-400/30 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 md:py-20">
            <ChatIcon sx={{ fontSize: { xs: 48, md: 64 } }} className="text-gray-700 mb-4" />
            <p className="text-gray-400 text-sm md:text-base">No messages yet</p>
            <p className="text-gray-500 text-xs md:text-sm">Start the conversation!</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-4">
                <span className="bg-gray-800 px-3 py-1 rounded-full text-xs text-gray-400">
                  {date}
                </span>
              </div>
              
              {/* Messages for this date */}
              {msgs.map((message) => {
                const isOwn = message.senderId === user.id
                return (
                  <div
                    key={message.id}
                    className={`flex mb-3 ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 
                                ${isOwn 
                                  ? 'bg-purple-600 text-white rounded-br-sm' 
                                  : 'bg-gray-800 text-gray-100 rounded-bl-sm'}`}
                    >
                      {message.imageUrl && (
                        <img 
                          src={message.imageUrl} 
                          alt="Shared" 
                          className="rounded-lg mb-2 max-w-full max-h-64 w-auto object-contain cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(message.imageUrl, '_blank')}
                        />
                      )}
                      {message.content && (
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      )}
                      <div className={`flex items-center gap-1 mt-1 
                                    ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <span className={`text-xs ${isOwn ? 'text-purple-200' : 'text-gray-500'}`}>
                          {formatTime(message.createdAt)}
                        </span>
                        {isOwn && (
                          message.read 
                            ? <DoneAllIcon sx={{ fontSize: 14 }} className="text-purple-200" />
                            : <DoneIcon sx={{ fontSize: 14 }} className="text-purple-300" />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="px-4 pb-2">
          <div className="relative inline-block">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="h-20 rounded-lg"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white 
                       rounded-full flex items-center justify-center"
            >
              <CloseIcon sx={{ fontSize: 16 }} />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-10 h-10 flex items-center justify-center rounded-xl 
                     bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors
                     disabled:opacity-50"
          >
            <ImageIcon />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && !uploading && handleSend()}
            placeholder="Type a message..."
            disabled={uploading}
            className="flex-1 px-4 py-3 bg-gray-700 text-white placeholder-gray-400 rounded-xl 
                     focus:outline-none focus:ring-2 focus:ring-purple-500
                     disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={uploading || (!newMessage.trim() && !imagePreview)}
            className="w-10 h-10 flex items-center justify-center rounded-xl 
                     bg-purple-600 hover:bg-purple-500 text-white transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <SendIcon />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Messages
