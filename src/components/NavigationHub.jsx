import ChecklistIcon from '@mui/icons-material/Checklist'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import ChatIcon from '@mui/icons-material/Chat'
import BrushIcon from '@mui/icons-material/Brush'
import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import LogoutIcon from '@mui/icons-material/Logout'
import FavoriteIcon from '@mui/icons-material/Favorite'

const navigationItems = [
  {
    id: 'todo',
    name: 'To-Do List',
    icon: ChecklistIcon,
    enabled: true,
    color: 'from-green-500 to-green-600',
  },
  {
    id: 'spotify',
    name: 'Spotify Share',
    icon: MusicNoteIcon,
    enabled: true,
    color: 'from-green-400 to-green-600',
  },
  {
    id: 'messages',
    name: 'Messages',
    icon: ChatIcon,
    enabled: true,
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 'documents',
    name: 'Collab Board',
    icon: BrushIcon,
    enabled: true,
    color: 'from-yellow-500 to-yellow-600',
  },
  {
    id: 'games',
    name: 'Games',
    icon: SportsEsportsIcon,
    enabled: false,
    color: 'from-pink-500 to-pink-600',
  },
]

function NavigationHub({ user, onLogout, onNavigate }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900">
      {/* Header */}
      <header className="px-5 py-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FavoriteIcon className="text-pink-300" />
            <h1 className="text-3xl font-bold text-white">Frella</h1>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 
                     rounded-xl text-sm font-medium text-white transition-all duration-200"
          >
            <LogoutIcon fontSize="small" />
            <span>Logout</span>
          </button>
        </div>
        <p className="text-purple-100 text-sm">Welcome back, {user.username}!</p>
      </header>

      {/* Navigation Grid */}
      <div className="px-5 py-4">
        <h2 className="text-white/80 text-sm font-medium mb-4 uppercase tracking-wider">
          Choose an App
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {navigationItems.map((item) => {
            const IconComponent = item.icon
            return (
              <button
                key={item.id}
                onClick={() => item.enabled && onNavigate(item.id)}
                disabled={!item.enabled}
                className={`relative p-6 rounded-2xl transition-all duration-200 
                         ${item.enabled 
                           ? `bg-gradient-to-br ${item.color} hover:scale-105 hover:shadow-xl active:scale-95 cursor-pointer` 
                           : 'bg-white/10 cursor-not-allowed opacity-60'
                         }`}
              >
                <IconComponent 
                  sx={{ fontSize: 40 }} 
                  className={item.enabled ? 'text-white' : 'text-white/50'} 
                />
                <p className={`mt-3 text-sm font-semibold ${item.enabled ? 'text-white' : 'text-white/50'}`}>
                  {item.name}
                </p>
                {!item.enabled && (
                  <span className="absolute top-2 right-2 text-xs bg-white/20 px-2 py-1 rounded-full text-white/70">
                    Soon
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 px-5 py-4 text-center">
        <p className="text-white/50 text-xs">
          Made with 💜 for Frank & Ella
        </p>
      </div>
    </div>
  )
}

export default NavigationHub
