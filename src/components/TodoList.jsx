import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import CloseIcon from '@mui/icons-material/Close'

function TodoList({ list, onAddTask, onTaskToggle, onTaskDelete, onListDelete, currentUserId }) {
  const canDelete = list.userId === currentUserId

  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden border border-gray-700">
      {/* List Header */}
      <div className="px-5 py-4 border-b border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">{list.title}</h3>
            {list.description && (
              <p className="text-sm text-gray-400 mt-1">{list.description}</p>
            )}
          </div>
          <div className="flex gap-2 ml-3">
            <button
              onClick={() => onAddTask(list)}
              className="w-9 h-9 bg-purple-600 hover:bg-purple-500 text-white 
                       rounded-xl transition-all duration-200 hover:scale-105 
                       flex items-center justify-center shadow-sm"
            >
              <AddIcon fontSize="small" />
            </button>
            {canDelete && (
              <button
                onClick={() => onListDelete(list.id)}
                className="w-9 h-9 bg-red-900/50 hover:bg-red-800/50 text-red-400 
                         rounded-xl transition-all duration-200 hover:scale-105 
                         flex items-center justify-center"
              >
                <DeleteIcon fontSize="small" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="p-4">
        {list.tasks && list.tasks.length > 0 ? (
          <div className="space-y-2">
            {list.tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-3 p-3 bg-gray-700/50 hover:bg-gray-700 
                         rounded-xl transition-all duration-200 group"
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={task.isCompleted}
                  onChange={() => onTaskToggle(task.id, task.isCompleted)}
                  className="mt-0.5 w-5 h-5 rounded border-gray-600 bg-gray-700 text-purple-500 
                           focus:ring-purple-500 focus:ring-offset-0 focus:ring-offset-gray-800 cursor-pointer"
                />

                {/* Task Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-base leading-relaxed ${
                      task.isCompleted
                        ? 'line-through text-gray-500'
                        : 'text-gray-100'
                    }`}
                  >
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-sm text-gray-400 mt-1">
                      {task.description}
                    </p>
                  )}
                  {(task.priority || task.dueDate) && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {task.priority && (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md 
                                   text-xs font-semibold uppercase ${
                                     task.priority === 'high'
                                       ? 'bg-red-900/50 text-red-400'
                                       : task.priority === 'medium'
                                       ? 'bg-yellow-900/50 text-yellow-400'
                                       : 'bg-blue-900/50 text-blue-400'
                                   }`}
                        >
                          {task.priority}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md 
                                       text-xs bg-gray-600 text-gray-300">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => onTaskDelete(task.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200
                           w-7 h-7 flex items-center justify-center rounded-lg
                           hover:bg-red-900/50 text-gray-500 hover:text-red-400"
                >
                  <CloseIcon fontSize="small" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8 text-sm">No tasks yet</p>
        )}
      </div>
    </div>
  )
}

export default TodoList
