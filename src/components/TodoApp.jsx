import { useState, useEffect } from 'react'
import TodoList from './TodoList'
import AddListModal from './AddListModal'
import AddTaskModal from './AddTaskModal'
import { API_URL } from '../config'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import ChecklistIcon from '@mui/icons-material/Checklist'
import { motion, AnimatePresence } from 'framer-motion'

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
      <motion.div 
        className="px-4 py-5 space-y-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {loading ? (
          <motion.div 
            className="flex justify-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div 
              className="w-10 h-10 border-4 border-purple-400/30 border-t-purple-500 
                         rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        ) : currentLists.length === 0 ? (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.p 
              className="text-gray-400 text-lg mb-6"
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2 }}
            >
              No lists yet
            </motion.p>
            <motion.button
              onClick={handleAddList}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 
                       text-white px-6 py-3 rounded-xl font-semibold 
                       transition-all duration-200 shadow-md hover:shadow-lg"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{ rotate: [0, 180, 360] }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <AddIcon />
              </motion.div>
              Create List
            </motion.button>
          </motion.div>
        ) : (
          <AnimatePresence>
            {currentLists.map((list, index) => (
              <motion.div
                key={list.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ 
                  duration: 0.4,
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 200
                }}
                layout
              >
                <TodoList
                  list={list}
                  onAddTask={handleAddTask}
                  onTaskToggle={handleTaskToggle}
                  onTaskDelete={handleTaskDelete}
                  onListDelete={handleListDelete}
                  currentUserId={user.id}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </motion.div>

      {/* FAB */}
      <AnimatePresence>
        {currentLists.length > 0 && (
          <motion.button
            onClick={handleAddList}
            className="fixed bottom-6 right-6 w-14 h-14 bg-purple-600 hover:bg-purple-500 
                     text-white rounded-full shadow-xl hover:shadow-2xl 
                     transition-all duration-200 hover:scale-110 active:scale-95 
                     flex items-center justify-center z-50"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            whileHover={{ 
              scale: 1.1,
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            }}
            whileTap={{ scale: 0.9 }}
          >
            <motion.div
              animate={{ rotate: [0, 90, 180, 270, 360] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <AddIcon sx={{ fontSize: 28 }} />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showAddListModal && (
          <AddListModal
            onClose={() => setShowAddListModal(false)}
            onListCreated={handleListCreated}
            isShared={activeTab === 'shared'}
          />
        )}

      <AnimatePresence>
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
      </AnimatePresence>
      </AnimatePresence>
    </motion.div>
  )
}

export default TodoApp
