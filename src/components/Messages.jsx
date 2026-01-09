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

function Messages({ user, onBack }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [partnerOnline, setPartnerOnline] = useState(false)
  const [partnerTyping, setPartnerTyping] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  
  const socketRef = useRef(null)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const fileInputRef = useRef(null)

  // Partner ID (since there are only 2 users)
  const partnerId = user.id === 1 ? 2 : 1

  useEffect(() => {
    fetchMessages()
    connectSocket()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API_URL}/api/messages`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const connectSocket = () => {
    // Get auth token from cookie or generate one
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1]

    socketRef.current = io(API_URL, {
      auth: { token },
      withCredentials: true,
    })

    socketRef.current.on('connect', () => {
      setConnected(true)
      socketRef.current.emit('join_chat')
    })

    socketRef.current.on('disconnect', () => {
      setConnected(false)
    })

    socketRef.current.on('new_message', (message) => {
      setMessages(prev => [...prev, message])
      
      // Mark as read if from partner
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
      console.error('Socket error:', error)
    })
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async () => {
    if (!newMessage.trim() && !imagePreview) return

    let imageUrl = null

    // If there's an image, upload it first (placeholder for Cloudinary)
    if (imageFile) {
      // For now, convert to base64 (in production, use Cloudinary)
      imageUrl = imagePreview
    }

    socketRef.current.emit('send_message', {
      content: newMessage.trim() || null,
      imageUrl,
      receiverId: partnerId,
    })

    setNewMessage('')
    setImagePreview(null)
    setImageFile(null)
    
    // Stop typing indicator
    socketRef.current.emit('stop_typing')
  }

  const handleTyping = (e) => {
    setNewMessage(e.target.value)

    // Send typing indicator
    socketRef.current.emit('typing')

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Stop typing after 2 seconds of inactivity
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

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.createdAt)
    if (!groups[date]) groups[date] = []
    groups[date].push(message)
    return groups
  }, {})

  const partnerName = user.id === 1 ? 'Ella' : 'Frank'

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-4 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-xl 
                     bg-white/20 hover:bg-white/30 transition-all duration-200"
          >
            <ArrowBackIcon />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <ChatIcon />
              <h1 className="text-xl font-bold">Messages</h1>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${partnerOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
              <span className="text-sm text-white/80">
                {partnerTyping ? `${partnerName} is typing...` : 
                 partnerOnline ? `${partnerName} is online` : `${partnerName} is offline`}
              </span>
            </div>
          </div>
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} 
               title={connected ? 'Connected' : 'Disconnected'} />
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20">
            <ChatIcon sx={{ fontSize: 64 }} className="text-gray-300 mb-4" />
            <p className="text-gray-500">No messages yet</p>
            <p className="text-gray-400 text-sm">Start the conversation!</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-4">
                <span className="bg-gray-200 px-3 py-1 rounded-full text-xs text-gray-600">
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
                                  ? 'bg-blue-500 text-white rounded-br-sm' 
                                  : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'}`}
                    >
                      {message.imageUrl && (
                        <img 
                          src={message.imageUrl} 
                          alt="Shared" 
                          className="rounded-lg mb-2 max-w-full"
                        />
                      )}
                      {message.content && (
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      )}
                      <div className={`flex items-center gap-1 mt-1 
                                    ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <span className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
                          {formatTime(message.createdAt)}
                        </span>
                        {isOwn && (
                          message.read 
                            ? <DoneAllIcon sx={{ fontSize: 14 }} className="text-blue-100" />
                            : <DoneIcon sx={{ fontSize: 14 }} className="text-blue-200" />
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
      <div className="bg-white border-t border-gray-200 px-4 py-3">
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
            className="w-10 h-10 flex items-center justify-center rounded-xl 
                     bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
          >
            <ImageIcon />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 bg-gray-100 rounded-xl 
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() && !imagePreview}
            className="w-10 h-10 flex items-center justify-center rounded-xl 
                     bg-blue-500 hover:bg-blue-600 text-white transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Messages
