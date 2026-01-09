import { useState } from 'react'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import { API_URL } from '../../config'

function CreatePostModal({ onClose, onPostCreated }) {
  const [content, setContent] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedTrack, setSelectedTrack] = useState(null)
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)
    setError('')

    try {
      const response = await fetch(
        `${API_URL}/api/spotify/search?q=${encodeURIComponent(searchQuery)}`,
        { credentials: 'include' }
      )
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.tracks?.items || [])
      } else {
        setError('Failed to search tracks')
      }
    } catch (error) {
      console.error('Search failed:', error)
      setError('Failed to search tracks')
    } finally {
      setSearching(false)
    }
  }

  const handleSelectTrack = (track) => {
    setSelectedTrack(track)
    setSearchResults([])
    setSearchQuery('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!content.trim() && !selectedTrack) {
      setError('Add some content or select a track')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          content: content.trim(),
          spotifyTrackId: selectedTrack?.id || null,
          spotifyType: 'track',
        }),
      })

      if (response.ok) {
        onPostCreated()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create post')
      }
    } catch (error) {
      console.error('Failed to create post:', error)
      setError('Failed to create post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] 
                   overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Share Music</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl 
                     bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Content */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              What's on your mind?
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts about this track..."
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl 
                       focus:outline-none focus:ring-2 focus:ring-green-500 
                       focus:border-transparent resize-none"
            />
          </div>

          {/* Track Search */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Add a Track
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                placeholder="Search for a song..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-green-500 
                         focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={searching}
                className="px-4 py-3 bg-green-500 hover:bg-green-600 text-white 
                         rounded-xl transition-colors disabled:opacity-50"
              >
                <SearchIcon />
              </button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl">
              {searchResults.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => handleSelectTrack(track)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 
                           border-b border-gray-100 last:border-b-0 text-left"
                >
                  <img
                    src={track.album?.images?.[2]?.url || '/placeholder.png'}
                    alt="Album"
                    className="w-12 h-12 rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{track.name}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {track.artists?.map(a => a.name).join(', ')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected Track */}
          {selectedTrack && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedTrack.album?.images?.[2]?.url || '/placeholder.png'}
                  alt="Album"
                  className="w-12 h-12 rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{selectedTrack.name}</p>
                  <p className="text-sm text-gray-500 truncate">
                    {selectedTrack.artists?.map(a => a.name).join(', ')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTrack(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <CloseIcon fontSize="small" />
                </button>
              </div>
            </div>
          )}

          {!selectedTrack && !searchResults.length && (
            <div className="text-center py-4 text-gray-400">
              <MusicNoteIcon sx={{ fontSize: 32 }} />
              <p className="text-sm mt-2">Search for a track to share</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 
                       font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (!content.trim() && !selectedTrack)}
              className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white 
                       font-semibold rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreatePostModal
