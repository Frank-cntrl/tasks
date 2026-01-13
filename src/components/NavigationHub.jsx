import ChecklistIcon from '@mui/icons-material/Checklist'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import ChatIcon from '@mui/icons-material/Chat'
import BrushIcon from '@mui/icons-material/Brush'
import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import LogoutIcon from '@mui/icons-material/Logout'
import FavoriteIcon from '@mui/icons-material/Favorite'
import { motion, AnimatePresence } from 'framer-motion'

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
    id: 'boards',
    name: 'Collab Boards',
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
    <motion.div 
      className="h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 keyboard-avoid"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header with safe area */}
      <motion.header 
        className="px-4 md:px-5 py-4 md:py-6 pt-safe"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            >
              <FavoriteIcon className="text-pink-300 flex-shrink-0" />
            </motion.div>
            <h1 className="text-2xl md:text-3xl font-bold text-white truncate">Frella</h1>
          </div>
          <motion.button
            onClick={onLogout}
            className="btn-mobile flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 md:px-4 py-2 
                     rounded-xl text-xs md:text-sm font-medium text-white transition-all duration-200 touch-manipulation flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <LogoutIcon fontSize="small" />
            <span className="hidden sm:inline">Logout</span>
          </motion.button>
        </div>
        <p className="text-purple-100 text-sm md:text-base">Welcome back, {user.username}!</p>
      </motion.header>

      {/* Navigation Grid */}
      <div className="flex-1 overflow-y-auto overscroll-behavior-contain px-4 md:px-5 py-2 md:py-4">
        <motion.h2 
          className="text-white/80 text-sm font-medium mb-4 uppercase tracking-wider"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          Choose an App
        </motion.h2>
        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
          {navigationItems.map((item, index) => {
            const IconComponent = item.icon
            return (
              <motion.button
                key={item.id}
                onClick={() => item.enabled && onNavigate(item.id)}
                disabled={!item.enabled}
                className={`relative p-4 md:p-6 rounded-xl md:rounded-2xl transition-all duration-200 btn-mobile touch-manipulation
                         ${item.enabled 
                           ? `bg-gradient-to-br ${item.color} cursor-pointer` 
                           : 'bg-white/10 cursor-not-allowed opacity-60'
                         }`}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.4, 
                  delay: 0.3 + (index * 0.1),
                  type: "spring",
                  stiffness: 200,
                  damping: 20
                }}
                whileHover={item.enabled ? { 
                  scale: 1.05,
                  rotateY: 5,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
                } : {}}
                whileTap={item.enabled ? { 
                  scale: 0.95,
                  rotateY: 0
                } : {}}
                layout
              >
                <motion.div
                  whileHover={item.enabled ? { scale: 1.1, rotate: 5 } : {}}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <IconComponent 
                    sx={{ fontSize: { xs: 32, md: 40 } }} 
                    className={`${item.enabled ? 'text-white' : 'text-white/50'} mb-2 md:mb-3`} 
                  />
                </motion.div>
                <p className={`text-xs md:text-sm font-semibold ${item.enabled ? 'text-white' : 'text-white/50'} leading-tight`}>
                  {item.name}
                </p>
                {!item.enabled && (
                  <motion.span 
                    className="absolute top-1 md:top-2 right-1 md:right-2 text-xs bg-white/20 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-white/70"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + (index * 0.1) }}
                  >
                    Soon
                  </motion.span>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Footer with safe area */}
      <motion.div 
        className="px-4 md:px-5 py-4 pb-safe text-center flex-shrink-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.8 }}
      >
        <p className="text-white/50 text-xs md:text-sm">
          Made with <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <FavoriteIcon sx={{ fontSize: 12 }} className="inline mx-1 text-red-400" />
          </motion.span> for Frank & Ella
        </p>
      </motion.div>
    </motion.div>
  )
}

export default NavigationHub
