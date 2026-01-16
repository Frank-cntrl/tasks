import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import GridOnIcon from '@mui/icons-material/GridOn'
import BrushIcon from '@mui/icons-material/Brush'
import CasinoIcon from '@mui/icons-material/Casino'

const games = [
  {
    id: 'tictactoe',
    name: 'Tic Tac Toe',
    icon: GridOnIcon,
    enabled: true,
    color: 'from-blue-500 to-blue-600',
    description: 'Classic X and O game',
  },
  {
    id: 'drawing',
    name: 'Guess My Drawing',
    icon: BrushIcon,
    enabled: false,
    color: 'from-yellow-500 to-orange-500',
    description: 'Draw and guess together',
  },
  {
    id: 'checkers',
    name: 'Checkers',
    icon: CasinoIcon,
    enabled: false,
    color: 'from-red-500 to-red-600',
    description: 'Classic board game',
  },
  {
    id: 'chess',
    name: 'Chess',
    icon: CasinoIcon,
    enabled: false,
    color: 'from-gray-600 to-gray-800',
    description: 'Strategic chess battles',
  },
  {
    id: 'backgammon',
    name: 'Backgammon',
    icon: CasinoIcon,
    enabled: false,
    color: 'from-amber-600 to-amber-800',
    description: 'Ancient strategy game',
  },
]

function GamesMenu({ onBack, onSelectGame }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-500 to-pink-600">
      {/* Header */}
      <header className="px-5 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-xl 
                     bg-white/20 hover:bg-white/30 text-white transition-all duration-200"
          >
            <ArrowBackIcon />
          </button>
          <div className="flex items-center gap-2 text-white">
            <SportsEsportsIcon />
            <h1 className="text-xl font-bold">Games</h1>
          </div>
        </div>
      </header>

      {/* Games Grid */}
      <div className="px-4 py-4">
        <h2 className="text-white/80 text-sm font-medium mb-4 uppercase tracking-wider">
          Choose a Game
        </h2>
        <div className="grid grid-cols-1 gap-3">
          {games.map((game) => {
            const IconComponent = game.icon
            return (
              <button
                key={game.id}
                onClick={() => game.enabled && onSelectGame(game.id)}
                disabled={!game.enabled}
                className={`relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-200
                         ${game.enabled 
                           ? `bg-gradient-to-r ${game.color} hover:scale-[1.02] active:scale-[0.98]` 
                           : 'bg-white/10 opacity-60 cursor-not-allowed'
                         }`}
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center
                              ${game.enabled ? 'bg-white/20' : 'bg-white/10'}`}>
                  <IconComponent 
                    sx={{ fontSize: 28 }} 
                    className={game.enabled ? 'text-white' : 'text-white/50'} 
                  />
                </div>
                <div className="flex-1 text-left">
                  <p className={`font-bold ${game.enabled ? 'text-white' : 'text-white/50'}`}>
                    {game.name}
                  </p>
                  <p className={`text-sm ${game.enabled ? 'text-white/80' : 'text-white/40'}`}>
                    {game.description}
                  </p>
                </div>
                {!game.enabled && (
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full text-white/70">
                    WIP
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default GamesMenu
