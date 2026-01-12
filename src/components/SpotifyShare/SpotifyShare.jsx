import { useState, useEffect } from 'react'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import AddIcon from '@mui/icons-material/Add'
import { API_URL } from '../../config'
import SpotifyActivity from './SpotifyActivity'
import PostCard from './PostCard'
import CreatePostModal from './CreatePostModal'
import CommentsModal from './CommentsModal'

function SpotifyShare({ user, onBack }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCommentsModal, setShowCommentsModal] = useState(false)
  const [selectedPost, setSelectedPost] = useState(null)
  const [spotifyConnected, setSpotifyConnected] = useState(false)

  useEffect(() => {
    fetchPosts()
    checkSpotifyConnection()
  }, [])

  const checkSpotifyConnection = async () => {
    try {
      const response = await fetch(`${API_URL}/api/spotify/status`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setSpotifyConnected(data.connected)
      }
    } catch (error) {
      console.error('Failed to check Spotify status:', error)
    }
  }

  const fetchPosts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/posts`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setPosts(data)
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (postId) => {
    try {
      const post = posts.find(p => p.id === postId)
      const isLiked = post?.likes?.some(like => like.userId === user.id)
      
      const method = isLiked ? 'DELETE' : 'POST'
      await fetch(`${API_URL}/api/posts/${postId}/like`, {
        method,
        credentials: 'include',
      })
      fetchPosts()
    } catch (error) {
      console.error('Failed to toggle like:', error)
    }
  }

  const handleDelete = async (postId) => {
    if (window.confirm('Delete this post?')) {
      try {
        await fetch(`${API_URL}/api/posts/${postId}`, {
          method: 'DELETE',
          credentials: 'include',
        })
        fetchPosts()
      } catch (error) {
        console.error('Failed to delete post:', error)
      }
    }
  }

  const handleShowComments = (post) => {
    setSelectedPost(post)
    setShowCommentsModal(true)
  }

  const handlePostCreated = () => {
    setShowCreateModal(false)
    fetchPosts()
  }

  const handleConnectSpotify = () => {
    window.location.href = `${API_URL}/api/spotify/auth`
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-4 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-xl 
                     bg-white/20 hover:bg-white/30 transition-all duration-200"
          >
            <ArrowBackIcon />
          </button>
          <div className="flex items-center gap-2">
            <MusicNoteIcon />
            <h1 className="text-xl font-bold">Spotify Share</h1>
          </div>
        </div>
      </header>

      {/* Spotify Activity Section */}
      <SpotifyActivity 
        user={user} 
        connected={spotifyConnected} 
        onConnect={handleConnectSpotify} 
      />

      {/* Posts Feed */}
      <div className="px-4 py-4">
        <h2 className="text-lg font-bold text-white mb-4">Music Feed</h2>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-green-400/30 border-t-green-500 rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-2xl border border-gray-700">
            <MusicNoteIcon sx={{ fontSize: 48 }} className="text-gray-600 mb-4" />
            <p className="text-gray-400 mb-4">No posts yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 
                       text-white px-6 py-3 rounded-xl font-semibold transition-all"
            >
              <AddIcon />
              Share Music
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={user.id}
                onLike={handleLike}
                onDelete={handleDelete}
                onShowComments={handleShowComments}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 hover:bg-green-400 
                 text-white rounded-full shadow-xl hover:shadow-2xl 
                 transition-all duration-200 hover:scale-110 active:scale-95 
                 flex items-center justify-center z-50"
      >
        <AddIcon sx={{ fontSize: 28 }} />
      </button>

      {/* Modals */}
      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onPostCreated={handlePostCreated}
        />
      )}

      {showCommentsModal && selectedPost && (
        <CommentsModal
          post={selectedPost}
          currentUserId={user.id}
          onClose={() => {
            setShowCommentsModal(false)
            setSelectedPost(null)
          }}
          onUpdate={fetchPosts}
        />
      )}
    </div>
  )
}

export default SpotifyShare
