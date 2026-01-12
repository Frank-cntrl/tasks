import { useState, useEffect } from 'react'
import CloseIcon from '@mui/icons-material/Close'
import SendIcon from '@mui/icons-material/Send'
import DeleteIcon from '@mui/icons-material/Delete'
import PersonIcon from '@mui/icons-material/Person'
import { API_URL } from '../../config'

function CommentsModal({ post, currentUserId, onClose, onUpdate }) {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [post.id])

  const fetchComments = async () => {
    try {
      const response = await fetch(`${API_URL}/api/posts/${post.id}/comments`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setSubmitting(true)

    try {
      const response = await fetch(`${API_URL}/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: newComment.trim() }),
      })

      if (response.ok) {
        setNewComment('')
        fetchComments()
        onUpdate()
      }
    } catch (error) {
      console.error('Failed to add comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId) => {
    try {
      await fetch(`${API_URL}/api/posts/${post.id}/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      fetchComments()
      onUpdate()
    } catch (error) {
      console.error('Failed to delete comment:', error)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[80vh] 
                   flex flex-col animate-slide-up border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Comments</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl 
                     bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-purple-400/30 border-t-purple-500 rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No comments yet</p>
              <p className="text-gray-500 text-sm">Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-8 h-8 bg-purple-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                  <PersonIcon fontSize="small" className="text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white text-sm">
                      {comment.user?.username || 'User'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm">{comment.content}</p>
                </div>
                {comment.userId === currentUserId && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg 
                             hover:bg-red-900/50 text-gray-500 hover:text-red-400 
                             transition-colors flex-shrink-0"
                  >
                    <DeleteIcon fontSize="small" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add Comment */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl 
                       text-white placeholder-gray-400
                       focus:outline-none focus:ring-2 focus:ring-purple-500 
                       focus:border-transparent"
            />
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white 
                       rounded-xl transition-colors disabled:opacity-50"
            >
              <SendIcon />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CommentsModal
