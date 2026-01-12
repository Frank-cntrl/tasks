import { useState } from 'react'
import { API_URL } from '../config'
import CloseIcon from '@mui/icons-material/Close'
import LockIcon from '@mui/icons-material/Lock'
import PeopleIcon from '@mui/icons-material/People'

function AddListModal({ onClose, onListCreated, isShared }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/todolists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          isShared,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        onListCreated(data)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create list')
      }
    } catch (error) {
      console.error('Failed to create list:', error)
      setError('Failed to create list')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] 
                   overflow-y-auto animate-slide-up border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Create New List</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl 
                     bg-gray-700 hover:bg-gray-600 text-gray-300 
                     transition-colors duration-200"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-300 mb-2">
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter list title"
              autoFocus
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl 
                       text-white placeholder-gray-400
                       focus:outline-none focus:ring-2 focus:ring-purple-500 
                       focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description (optional)"
              rows="3"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl 
                       text-white placeholder-gray-400
                       focus:outline-none focus:ring-2 focus:ring-purple-500 
                       focus:border-transparent transition-all duration-200 resize-none"
            />
          </div>

          {/* Info Badge */}
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
            isShared ? 'bg-purple-900/50 border border-purple-700' : 'bg-blue-900/50 border border-blue-700'
          }`}>
            {isShared ? (
              <>
                <PeopleIcon className="text-purple-400" />
                <span className="text-sm font-medium text-purple-200">
                  This will be a shared list
                </span>
              </>
            ) : (
              <>
                <LockIcon className="text-blue-400" />
                <span className="text-sm font-medium text-blue-200">
                  This will be a private list
                </span>
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-3 bg-red-900/50 border border-red-700 rounded-xl">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 
                       font-semibold rounded-xl transition-colors duration-200 
                       disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white 
                       font-semibold rounded-xl transition-all duration-200 
                       disabled:opacity-50 shadow-md hover:shadow-lg"
            >
              {loading ? 'Creating...' : 'Create List'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddListModal
