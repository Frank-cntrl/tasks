import { useState, useEffect } from 'react'
import TodoList from './TodoList'
import AddListModal from './AddListModal'
import AddTaskModal from './AddTaskModal'
import './TodoApp.css'

function TodoApp({ user, onLogout }) {
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
      const response = await fetch('http://localhost:8080/api/todolists', {
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
      await fetch(`http://localhost:8080/api/tasks/${taskId}`, {
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
      await fetch(`http://localhost:8080/api/tasks/${taskId}`, {
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
        await fetch(`http://localhost:8080/api/todolists/${listId}`, {
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
    <div className="todo-app">
      <header className="app-header-main">
        <div className="header-top">
          <h1>Frella</h1>
          <button className="logout-button" onClick={onLogout}>
            Logout
          </button>
        </div>
        <p className="welcome">Welcome, {user.username}!</p>
      </header>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'my' ? 'active' : ''}`}
          onClick={() => setActiveTab('my')}
        >
          My Lists
        </button>
        <button
          className={`tab ${activeTab === 'shared' ? 'active' : ''}`}
          onClick={() => setActiveTab('shared')}
        >
          Shared Lists
        </button>
      </div>

      <div className="lists-container">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : currentLists.length === 0 ? (
          <div className="empty-state">
            <p>No lists yet</p>
            <button className="add-button" onClick={handleAddList}>
              + Create List
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

      {currentLists.length > 0 && (
        <button className="fab" onClick={handleAddList}>
          +
        </button>
      )}

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
