import FavoriteIcon from '@mui/icons-material/Favorite'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import DeleteIcon from '@mui/icons-material/Delete'
import PersonIcon from '@mui/icons-material/Person'

function PostCard({ post, currentUserId, onLike, onDelete, onShowComments }) {
  const isLiked = post.likes?.some(like => like.userId === currentUserId)
  const isOwner = post.userId === currentUserId
  const likeCount = post.likes?.length || 0
  const commentCount = post.comments?.length || 0

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
    <div className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700">
      {/* Post Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-900/50 rounded-full flex items-center justify-center">
            <PersonIcon className="text-purple-400" />
          </div>
          <div>
            <p className="font-semibold text-white">{post.user?.username || 'User'}</p>
            <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
          </div>
        </div>
        {isOwner && (
          <button
            onClick={() => onDelete(post.id)}
            className="w-8 h-8 flex items-center justify-center rounded-lg 
                     hover:bg-red-900/50 text-gray-500 hover:text-red-400 transition-colors"
          >
            <DeleteIcon fontSize="small" />
          </button>
        )}
      </div>

      {/* Post Content */}
      {post.content && (
        <div className="px-4 py-3">
          <p className="text-gray-200 whitespace-pre-wrap">{post.content}</p>
        </div>
      )}

      {/* Spotify Embed */}
      {post.spotifyTrackId && (
        <div className="px-4 pb-3">
          <iframe
            src={`https://open.spotify.com/embed/${post.spotifyType || 'track'}/${post.spotifyTrackId}?utm_source=generator&theme=0`}
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-xl"
          />
        </div>
      )}

      {/* Post Actions */}
      <div className="px-4 py-3 border-t border-gray-700 flex items-center gap-6">
        <button
          onClick={() => onLike(post.id)}
          className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors"
        >
          {isLiked ? (
            <FavoriteIcon className="text-red-500" fontSize="small" />
          ) : (
            <FavoriteBorderIcon fontSize="small" />
          )}
          <span className={`text-sm font-medium ${isLiked ? 'text-red-500' : ''}`}>
            {likeCount}
          </span>
        </button>

        <button
          onClick={() => onShowComments(post)}
          className="flex items-center gap-2 text-gray-400 hover:text-purple-400 transition-colors"
        >
          <ChatBubbleOutlineIcon fontSize="small" />
          <span className="text-sm font-medium">{commentCount}</span>
        </button>
      </div>
    </div>
  )
}

export default PostCard
