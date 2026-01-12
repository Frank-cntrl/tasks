import { useState, useEffect } from 'react'
import TodoList from './TodoList'
import AddListModal from './AddListModal'
import AddTaskModal from './AddTaskModal'
import { API_URL } from '../config'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import ChecklistIcon from '@mui/icons-material/Checklist'

function TodoApp({ user, onLogout, onBack }) {
  const [activeTab, setActiveTab] = useState('my')
  const [todolists, setTodolists] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddListModal, setShowAddListModal] = useState(false)
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [selectedList, setSelectedList] = useState(null)

  useEffect(() => {
    fetchTodoLists()
  }, [])

  const fetchTodoLists = async () => {
    try {
      const response = await fetch(`${API_URL}/api/todolists`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setTodolists(data)
      }
    } catch (error) {
      console.error('Failed to fetch todolists:', error)
    } finally {
      setLoading(false)
    }
  }

  const myLists = todolists.filter(list => !list.isShared && list.userId === user.id)
  const sharedLists = todolists.filter(list => list.isShared)

  const handleAddList = () => {
    setShowAddListModal(true)
  }

  const handleAddTask = (list) => {
    setSelectedList(list)
    setShowAddTaskModal(true)
  }

  const handleListCreated = async (newList) => {
    await fetchTodoLists()
    setShowAddListModal(false)
  }

  const handleTaskCreated = async () => {
    await fetchTodoLists()
    setShowAddTaskModal(false)
    setSelectedList(null)
  }

  const handleTaskToggle = async (taskId, isCompleted) => {
    try {
      await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ isCompleted: !isCompleted }),
      })
      await fetchTodoLists()
    } catch (error) {
      console.error('Failed to toggle task:', error)
    }
  }

  const handleTaskDelete = async (taskId) => {
    try {
      await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      await fetchTodoLists()
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  const handleListDelete = async (listId) => {
    if (window.confirm('Delete this list and all its tasks?')) {
      try {
        await fetch(`${API_URL}/api/todolists/${listId}`, {
          method: 'DELETE',
          credentials: 'include',
        })
        await fetchTodoLists()
      } catch (error) {
        console.error('Failed to delete list:', error)
      }
    }
  }

  const currentLists = activeTab === 'my' ? myLists : sharedLists

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-5 py-4 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-xl 
                     bg-white/20 hover:bg-white/30 transition-all duration-200"
          >
            <ArrowBackIcon />
          </button>
          <div className="flex items-center gap-2">
            <ChecklistIcon />
            <h1 className="text-xl font-bold">To-Do Lists</h1>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10 shadow-sm">
        <div className="flex">
          <button
            onClick={() => setActiveTab('my')}
            className={`flex-1 py-4 text-sm font-semibold transition-all duration-200 
                     border-b-2 ${
                       activeTab === 'my'
                         ? 'text-purple-400 border-purple-500'
                         : 'text-gray-400 border-transparent hover:text-gray-300'
                     }`}
          >
            My Lists
          </button>
          <button
            onClick={() => setActiveTab('shared')}
            className={`flex-1 py-4 text-sm font-semibold transition-all duration-200 
                     border-b-2 ${
                       activeTab === 'shared'
                         ? 'text-purple-400 border-purple-500'
                         : 'text-gray-400 border-transparent hover:text-gray-300'
                     }`}
          >
            Shared Lists
          </button>
        </div>
      </div>

      {/* Lists Container */}
      <div className="px-4 py-5 space-y-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-purple-400/30 border-t-purple-500 
                         rounded-full animate-spin" />
          </div>
        ) : currentLists.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg mb-6">No lists yet</p>
            <button
              onClick={handleAddList}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 
                       text-white px-6 py-3 rounded-xl font-semibold 
                       transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <AddIcon />
              Create List
            </button>
          </div>
        ) : (
          <>
            {currentLists.map((list) => (
              <TodoList
                key={list.id}
                list={list}
                onAddTask={handleAddTask}
                onTaskToggle={handleTaskToggle}
                onTaskDelete={handleTaskDelete}
                onListDelete={handleListDelete}
                currentUserId={user.id}
              />
            ))}
          </>
        )}
      </div>

      {/* FAB */}
      {currentLists.length > 0 && (
        <button
          onClick={handleAddList}
          className="fixed bottom-6 right-6 w-14 h-14 bg-purple-600 hover:bg-purple-500 
                   text-white rounded-full shadow-xl hover:shadow-2xl 
                   transition-all duration-200 hover:scale-110 active:scale-95 
                   flex items-center justify-center z-50"
        >
          <AddIcon sx={{ fontSize: 28 }} />
        </button>
      )}

      {/* Modals */}
      {showAddListModal && (
        <AddListModal
          onClose={() => setShowAddListModal(false)}
          onListCreated={handleListCreated}
          isShared={activeTab === 'shared'}
        />
      )}

      {showAddTaskModal && selectedList && (
        <AddTaskModal
          list={selectedList}
          onClose={() => {
            setShowAddTaskModal(false)
            setSelectedList(null)
          }}
          onTaskCreated={handleTaskCreated}
        />
      )}
    </div>
  )
}

export default TodoApp
