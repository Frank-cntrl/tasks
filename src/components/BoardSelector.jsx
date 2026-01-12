import { useState, useEffect } from 'react'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import BrushIcon from '@mui/icons-material/Brush'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { authFetch } from '../utils/api'

function BoardSelector({ user, onBack, onSelectBoard }) {
  const [boards, setBoards] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingBoard, setEditingBoard] = useState(null)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    fetchBoards()
  }, [])

  const fetchBoards = async () => {
    try {
      const response = await authFetch('/api/boards')
      if (response.ok) {
        const data = await response.json()
        setBoards(data)
      }
    } catch (error) {
      console.error('Failed to fetch boards:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBoard = async (e) => {
    e.preventDefault()
    if (!newBoardName.trim()) return

    setCreating(true)
    try {
      const response = await authFetch('/api/boards', {
        method: 'POST',
        body: JSON.stringify({ name: newBoardName.trim() }),
      })

      if (response.ok) {
        const newBoard = await response.json()
        setBoards(prev => [newBoard, ...prev])
        setNewBoardName('')
        setShowCreateModal(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create board')
      }
    } catch (error) {
      console.error('Failed to create board:', error)
      alert('Failed to create board')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteBoard = async (boardId, boardName) => {
    if (!window.confirm(`Delete "${boardName}"? This cannot be undone.`)) return

    try {
      const response = await authFetch(`/api/boards/${boardId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setBoards(prev => prev.filter(b => b.boardId !== boardId))
      } else {
        alert('Failed to delete board')
      }
    } catch (error) {
      console.error('Failed to delete board:', error)
      alert('Failed to delete board')
    }
  }

  const handleUpdateBoard = async (e) => {
    e.preventDefault()
    if (!editName.trim() || !editingBoard) return

    try {
      const response = await authFetch(`/api/boards/${editingBoard.boardId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editName.trim() }),
      })

      if (response.ok) {
        const updated = await response.json()
        setBoards(prev => prev.map(b => 
          b.boardId === editingBoard.boardId ? { ...b, name: updated.name } : b
        ))
        setEditingBoard(null)
        setEditName('')
      } else {
        alert('Failed to update board')
      }
    } catch (error) {
      console.error('Failed to update board:', error)
      alert('Failed to update board')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header - Retro Style */}
      <header className="bg-gray-300 border-b-2 border-gray-600 shadow-sm">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="px-2 py-1 bg-gray-300 border-2 border-t-white border-l-white 
                       border-r-gray-600 border-b-gray-600 hover:border-t-gray-600 
                       hover:border-l-gray-600 hover:border-r-white hover:border-b-white
                       active:bg-gray-400 text-xs font-bold flex items-center gap-1 text-gray-800"
            >
              <ArrowBackIcon sx={{ fontSize: 16 }} />
              Back
            </button>
            
            <div className="h-6 w-px bg-gray-600" />
            
            <div className="flex items-center gap-2">
              <BrushIcon sx={{ fontSize: 20 }} className="text-gray-700" />
              <span className="text-sm font-bold text-gray-800">Collab Boards</span>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-1 bg-gray-300 border-2 border-t-white border-l-white 
                     border-r-gray-600 border-b-gray-600 hover:border-t-gray-600 
                     hover:border-l-gray-600 hover:border-r-white hover:border-b-white
                     active:bg-gray-400 text-xs font-bold flex items-center gap-1 text-gray-800"
          >
            <AddIcon sx={{ fontSize: 14 }} />
            New Board
          </button>
        </div>
      </header>

      {/* Board List */}
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="bg-gray-300 border-2 border-t-white border-l-white 
                         border-r-gray-600 border-b-gray-600 p-8">
              <p className="text-sm font-bold text-gray-800">Loading boards...</p>
            </div>
          </div>
        ) : boards.length === 0 ? (
          <div className="bg-gray-300 border-2 border-t-white border-l-white 
                       border-r-gray-600 border-b-gray-600 p-8 text-center max-w-md mx-auto mt-8">
            <BrushIcon sx={{ fontSize: 48 }} className="text-gray-600 mb-4" />
            <p className="text-sm font-bold text-gray-800 mb-4">No boards yet</p>
            <p className="text-xs text-gray-600 mb-4">Create your first collaborative board!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-gray-300 border-2 border-t-white border-l-white 
                       border-r-gray-600 border-b-gray-600 hover:border-t-gray-600 
                       hover:border-l-gray-600 hover:border-r-white hover:border-b-white
                       active:bg-gray-400 text-xs font-bold flex items-center gap-1 
                       text-gray-800 mx-auto"
            >
              <AddIcon sx={{ fontSize: 14 }} />
              Create Board
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => (
              <div
                key={board.boardId}
                className="bg-gray-300 border-2 border-t-white border-l-white 
                         border-r-gray-600 border-b-gray-600 overflow-hidden"
              >
                {/* Board Header */}
                <div 
                  className="bg-gradient-to-r from-blue-800 to-blue-900 px-3 py-1.5 
                           flex items-center justify-between cursor-pointer"
                  onClick={() => onSelectBoard(board)}
                >
                  <span className="text-white text-sm font-bold truncate flex-1">
                    {board.name}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingBoard(board)
                        setEditName(board.name)
                      }}
                      className="w-5 h-5 flex items-center justify-center 
                               bg-gray-300 border border-gray-600 hover:bg-gray-200"
                    >
                      <span className="text-xs text-gray-800">_</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteBoard(board.boardId, board.name)
                      }}
                      className="w-5 h-5 flex items-center justify-center 
                               bg-gray-300 border border-gray-600 hover:bg-red-200"
                    >
                      <span className="text-xs text-gray-800 font-bold">×</span>
                    </button>
                  </div>
                </div>

                {/* Board Preview Area */}
                <div 
                  className="h-32 bg-white border-2 border-inset cursor-pointer
                           flex items-center justify-center hover:bg-gray-100"
                  onClick={() => onSelectBoard(board)}
                >
                  <BrushIcon sx={{ fontSize: 48 }} className="text-gray-400" />
                </div>

                {/* Board Footer */}
                <div className="px-3 py-2 bg-gray-200 border-t border-gray-400">
                  <p className="text-xs text-gray-600 truncate">
                    Last modified: {formatDate(board.updatedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Board Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div 
            className="bg-gray-300 border-2 border-t-white border-l-white 
                     border-r-gray-600 border-b-gray-600 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Title Bar */}
            <div className="bg-gradient-to-r from-blue-800 to-blue-900 px-3 py-1.5 
                         flex items-center justify-between">
              <span className="text-white text-sm font-bold">New Board</span>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-5 h-5 flex items-center justify-center 
                         bg-gray-300 border border-gray-600 hover:bg-red-200"
              >
                <span className="text-xs text-gray-800 font-bold">×</span>
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleCreateBoard} className="p-4">
              <label className="block text-xs font-bold text-gray-800 mb-2">
                Board Name:
              </label>
              <input
                type="text"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="Enter board name"
                autoFocus
                className="w-full px-2 py-1 border-2 border-inset bg-white text-gray-800 
                         text-sm focus:outline-none mb-4"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  className="px-4 py-1 bg-gray-300 border-2 border-t-white border-l-white 
                           border-r-gray-600 border-b-gray-600 hover:border-t-gray-600 
                           hover:border-l-gray-600 hover:border-r-white hover:border-b-white
                           text-xs font-bold text-gray-800 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newBoardName.trim()}
                  className="px-4 py-1 bg-gray-300 border-2 border-t-white border-l-white 
                           border-r-gray-600 border-b-gray-600 hover:border-t-gray-600 
                           hover:border-l-gray-600 hover:border-r-white hover:border-b-white
                           text-xs font-bold text-gray-800 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Board Modal */}
      {editingBoard && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setEditingBoard(null)}
        >
          <div 
            className="bg-gray-300 border-2 border-t-white border-l-white 
                     border-r-gray-600 border-b-gray-600 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Title Bar */}
            <div className="bg-gradient-to-r from-blue-800 to-blue-900 px-3 py-1.5 
                         flex items-center justify-between">
              <span className="text-white text-sm font-bold">Rename Board</span>
              <button
                onClick={() => setEditingBoard(null)}
                className="w-5 h-5 flex items-center justify-center 
                         bg-gray-300 border border-gray-600 hover:bg-red-200"
              >
                <span className="text-xs text-gray-800 font-bold">×</span>
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleUpdateBoard} className="p-4">
              <label className="block text-xs font-bold text-gray-800 mb-2">
                Board Name:
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter new name"
                autoFocus
                className="w-full px-2 py-1 border-2 border-inset bg-white text-gray-800 
                         text-sm focus:outline-none mb-4"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBoard(null)}
                  className="px-4 py-1 bg-gray-300 border-2 border-t-white border-l-white 
                           border-r-gray-600 border-b-gray-600 hover:border-t-gray-600 
                           hover:border-l-gray-600 hover:border-r-white hover:border-b-white
                           text-xs font-bold text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editName.trim()}
                  className="px-4 py-1 bg-gray-300 border-2 border-t-white border-l-white 
                           border-r-gray-600 border-b-gray-600 hover:border-t-gray-600 
                           hover:border-l-gray-600 hover:border-r-white hover:border-b-white
                           text-xs font-bold text-gray-800 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default BoardSelector
