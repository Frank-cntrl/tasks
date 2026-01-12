import { useState, useEffect } from 'react'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import LinkIcon from '@mui/icons-material/Link'
import HistoryIcon from '@mui/icons-material/History'
import { API_URL } from '../../config'

function SpotifyActivity({ user, connected, onConnect }) {
  const [currentlyPlaying, setCurrentlyPlaying] = useState({})
  const [recentlyPlayed, setRecentlyPlayed] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (connected) {
      fetchActivity()
      // Poll for currently playing every 30 seconds
      const interval = setInterval(fetchCurrentlyPlaying, 30000)
      return () => clearInterval(interval)
    } else {
      setLoading(false)
    }
  }, [connected])

  const fetchActivity = async () => {
    await Promise.all([fetchCurrentlyPlaying(), fetchRecentlyPlayed()])
    setLoading(false)
  }

  const fetchCurrentlyPlaying = async () => {
    try {
      // Fetch for both users (1 = Frank, 2 = Ella typically)
      const [frankRes, ellaRes] = await Promise.all([
        fetch(`${API_URL}/api/spotify/currently-playing/1`, { credentials: 'include' }),
        fetch(`${API_URL}/api/spotify/currently-playing/2`, { credentials: 'include' }),
      ])
      
      const frankData = frankRes.ok ? await frankRes.json() : null
      const ellaData = ellaRes.ok ? await ellaRes.json() : null
      
      setCurrentlyPlaying({
        Frank: frankData,
        Ella: ellaData,
      })
    } catch (error) {
      console.error('Failed to fetch currently playing:', error)
    }
  }

  const fetchRecentlyPlayed = async () => {
    try {
      const [frankRes, ellaRes] = await Promise.all([
        fetch(`${API_URL}/api/spotify/recently-played/1`, { credentials: 'include' }),
        fetch(`${API_URL}/api/spotify/recently-played/2`, { credentials: 'include' }),
      ])
      
      const frankData = frankRes.ok ? await frankRes.json() : null
      const ellaData = ellaRes.ok ? await ellaRes.json() : null
      
      setRecentlyPlayed({
        Frank: frankData?.items || [],
        Ella: ellaData?.items || [],
      })
    } catch (error) {
      console.error('Failed to fetch recently played:', error)
    }
  }

  if (!connected) {
    return (
      <div className="mx-4 mt-4 p-6 bg-gray-800 rounded-2xl border border-gray-700">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <LinkIcon sx={{ fontSize: 32 }} className="text-green-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Connect Spotify</h3>
          <p className="text-gray-400 text-sm mb-4">
            Connect your Spotify account!
          </p>
          <button
            onClick={onConnect}
            className="bg-green-500 hover:bg-green-400 text-white px-6 py-3 
                     rounded-xl font-semibold transition-all"
          >
            Connect Spotify
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-4 mt-4 p-6 bg-gray-800 rounded-2xl border border-gray-700">
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-green-400/30 border-t-green-500 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-4 mt-4 space-y-4">
      {/* Currently Playing Section */}
      <div className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700">
        <div className="px-4 py-3 bg-green-900/30 border-b border-gray-700 flex items-center gap-2">
          <PlayArrowIcon className="text-green-400" />
          <h3 className="font-semibold text-green-300">Now Playing</h3>
        </div>
        <div className="p-4 grid grid-cols-2 gap-4">
          {['Frank', 'Ella'].map((name) => (
            <div key={name} className="text-center">
              <p className="text-xs text-gray-500 mb-2">{name}</p>
              {currentlyPlaying[name]?.item ? (
                <div className="space-y-2">
                  <img
                    src={currentlyPlaying[name].item.album?.images?.[0]?.url || '/placeholder.png'}
                    alt="Album art"
                    className="w-16 h-16 rounded-lg mx-auto shadow-md"
                  />
                  <p className="text-sm font-medium text-white truncate">
                    {currentlyPlaying[name].item.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {currentlyPlaying[name].item.artists?.map(a => a.name).join(', ')}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-gray-500">Not playing</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recently Played Section */}
      <div className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700">
        <div className="px-4 py-3 bg-gray-700/50 border-b border-gray-700 flex items-center gap-2">
          <HistoryIcon className="text-gray-400" />
          <h3 className="font-semibold text-gray-300">Recently Played</h3>
        </div>
        <div className="p-4">
          {['Frank', 'Ella'].map((name) => (
            <div key={name} className="mb-4 last:mb-0">
              <p className="text-xs text-gray-500 mb-2">{name}'s Recent</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {(recentlyPlayed[name] || []).slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex-shrink-0 w-16">
                    <img
                      src={item.track?.album?.images?.[0]?.url || '/placeholder.png'}
                      alt="Album art"
                      className="w-16 h-16 rounded-lg shadow-sm"
                    />
                    <p className="text-xs text-gray-300 mt-1 truncate">{item.track?.name}</p>
                  </div>
                ))}
                {(!recentlyPlayed[name] || recentlyPlayed[name].length === 0) && (
                  <p className="text-xs text-gray-500">No recent tracks</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SpotifyActivity
