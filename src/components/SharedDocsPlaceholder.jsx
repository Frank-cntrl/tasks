import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import FolderSharedIcon from '@mui/icons-material/FolderShared'

function SharedDocsPlaceholder({ onBack }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-500 to-yellow-600">
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
            <FolderSharedIcon />
            <h1 className="text-xl font-bold">Shared Documents</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex flex-col items-center justify-center px-8 py-20">
        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6">
          <FolderSharedIcon sx={{ fontSize: 48 }} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Coming Soon</h2>
        <p className="text-white/80 text-center">
          Shared document storage and collaboration is on its way!
        </p>
      </div>
    </div>
  )
}

export default SharedDocsPlaceholder
