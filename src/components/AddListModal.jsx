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
          <h2 className="text-xl font-bold text-gray-900">Create New List</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl 
                     bg-gray-100 hover:bg-gray-200 text-gray-600 
                     transition-colors duration-200"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter list title"
              autoFocus
              className="w-full px-4 py-3 border border-gray-300 rounded-xl 
                       focus:outline-none focus:ring-2 focus:ring-purple-500 
                       focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description (optional)"
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl 
                       focus:outline-none focus:ring-2 focus:ring-purple-500 
                       focus:border-transparent transition-all duration-200 resize-none"
            />
          </div>

          {/* Info Badge */}
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
            isShared ? 'bg-purple-50' : 'bg-blue-50'
          }`}>
            {isShared ? (
              <>
                <PeopleIcon className="text-purple-600" />
                <span className="text-sm font-medium text-purple-900">
                  This will be a shared list
                </span>
              </>
            ) : (
              <>
                <LockIcon className="text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  This will be a private list
                </span>
              </>
            )}
          </div>

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
                       font-semibold rounded-xl transition-colors duration-200 
                       disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white 
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
