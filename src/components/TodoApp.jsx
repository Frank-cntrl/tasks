import { useState, useEffect } from 'react'
import TodoList from './TodoList'
import AddListModal from './AddListModal'
import AddTaskModal from './AddTaskModal'
import { authFetch } from '../utils/api'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import ChecklistIcon from '@mui/icons-material/Checklist'
import { motion } from 'framer-motion'

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
      const response = await authFetch('/api/todolists')
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
      await authFetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ isCompleted: !isCompleted }),
      })
      await fetchTodoLists()
    } catch (error) {
      console.error('Failed to toggle task:', error)
    }
  }

  const handleTaskDelete = async (taskId) => {
    try {
      await authFetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      })
      await fetchTodoLists()
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  const handleListDelete = async (listId) => {
    if (window.confirm('Delete this list and all its tasks?')) {
      try {
        await authFetch(`/api/todolists/${listId}`, {
          method: 'DELETE',
        })
        await fetchTodoLists()
      } catch (error) {
        console.error('Failed to delete list:', error)
      }
    }
  }

  const currentLists = activeTab === 'my' ? myLists : sharedLists

  return (
    <motion.div 
      className="min-h-screen bg-gray-900 pb-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <motion.header 
        className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-5 py-4 shadow-lg"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3">
          <motion.button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-xl 
                     bg-white/20 hover:bg-white/30 transition-all duration-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowBackIcon />
          </motion.button>
          <motion.div 
            className="flex items-center gap-2"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <ChecklistIcon />
            </motion.div>
            <h1 className="text-xl font-bold">To-Do Lists</h1>
          </motion.div>
        </div>
      </motion.header>

      {/* Tabs */}
      <motion.div 
        className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10 shadow-sm"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="flex">
          <motion.button
            onClick={() => setActiveTab('my')}
            className={`flex-1 py-4 text-sm font-semibold transition-all duration-200 
                     border-b-2 ${
                       activeTab === 'my'
                         ? 'text-purple-400 border-purple-500'
                         : 'text-gray-400 border-transparent hover:text-gray-300'
                     }`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            My Lists
          </motion.button>
          <motion.button
            onClick={() => setActiveTab('shared')}
            className={`flex-1 py-4 text-sm font-semibold transition-all duration-200 
                     border-b-2 ${
                       activeTab === 'shared'
                         ? 'text-purple-400 border-purple-500'
                         : 'text-gray-400 border-transparent hover:text-gray-300'
                     }`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            Shared Lists
          </motion.button>
        </div>
      </motion.div>

      {/* Lists Container */}
      <div className="px-4 py-5">
        {loading ? (
          <div className="flex justify-center py-16">
            <div 
              className="w-10 h-10 border-4 border-purple-400/30 border-t-purple-500 
                         rounded-full animate-spin"
            />
          </div>
        ) : currentLists.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg mb-6">
              No lists yet
            </p>
            <button
              onClick={handleAddList}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 
                       text-white px-6 py-3 rounded-xl font-semibold 
                       transition-all duration-200 shadow-md hover:shadow-lg
                       hover:scale-105 active:scale-95"
            >
              <AddIcon />
              Create List
            </button>
          </div>
        ) : (
          <div className="space-y-4">
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
          </div>
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
    </motion.div>
  )
}

export default TodoApp
