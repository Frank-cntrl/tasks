import './TodoList.css'

function TodoList({ list, onAddTask, onTaskToggle, onTaskDelete, onListDelete, currentUserId }) {
  const canDelete = list.userId === currentUserId

  return (
    <div className="todo-list-card">
      <div className="list-header">
        <div>
          <h3>{list.title}</h3>
          {list.description && <p className="list-description">{list.description}</p>}
        </div>
        <div className="list-actions">
          <button className="icon-button add" onClick={() => onAddTask(list)}>
            +
          </button>
          {canDelete && (
            <button className="icon-button delete" onClick={() => onListDelete(list.id)}>
              🗑️
            </button>
          )}
        </div>
      </div>

      <div className="tasks">
        {list.tasks && list.tasks.length > 0 ? (
          list.tasks.map((task) => (
            <div key={task.id} className="task-item">
              <div className="task-content">
                <input
                  type="checkbox"
                  checked={task.isCompleted}
                  onChange={() => onTaskToggle(task.id, task.isCompleted)}
                  className="task-checkbox"
                />
                <div className="task-text">
                  <p className={task.isCompleted ? 'completed' : ''}>{task.title}</p>
                  {task.description && (
                    <p className="task-description">{task.description}</p>
                  )}
                  <div className="task-meta">
                    {task.priority && (
                      <span className={`priority ${task.priority}`}>
                        {task.priority}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className="due-date">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                className="task-delete"
                onClick={() => onTaskDelete(task.id)}
              >
                ✕
              </button>
            </div>
          ))
        ) : (
          <p className="no-tasks">No tasks yet</p>
        )}
      </div>
    </div>
  )
}

export default TodoList
