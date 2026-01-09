import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import CloseIcon from '@mui/icons-material/Close'

function TodoList({ list, onAddTask, onTaskToggle, onTaskDelete, onListDelete, currentUserId }) {
  const canDelete = list.userId === currentUserId

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* List Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">{list.title}</h3>
            {list.description && (
              <p className="text-sm text-gray-500 mt-1">{list.description}</p>
            )}
          </div>
          <div className="flex gap-2 ml-3">
            <button
              onClick={() => onAddTask(list)}
              className="w-9 h-9 bg-purple-600 hover:bg-purple-700 text-white 
                       rounded-xl transition-all duration-200 hover:scale-105 
                       flex items-center justify-center shadow-sm"
            >
              <AddIcon fontSize="small" />
            </button>
            {canDelete && (
              <button
                onClick={() => onListDelete(list.id)}
                className="w-9 h-9 bg-red-50 hover:bg-red-100 text-red-600 
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
                className="flex items-start gap-3 p-3 bg-gray-50 hover:bg-gray-100 
                         rounded-xl transition-all duration-200 group"
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={task.isCompleted}
                  onChange={() => onTaskToggle(task.id, task.isCompleted)}
                  className="mt-0.5 w-5 h-5 rounded border-gray-300 text-purple-600 
                           focus:ring-purple-500 focus:ring-offset-0 cursor-pointer"
                />

                {/* Task Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-base leading-relaxed ${
                      task.isCompleted
                        ? 'line-through text-gray-400'
                        : 'text-gray-900'
                    }`}
                  >
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-sm text-gray-500 mt-1">
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
                                       ? 'bg-red-100 text-red-800'
                                       : task.priority === 'medium'
                                       ? 'bg-yellow-100 text-yellow-800'
                                       : 'bg-blue-100 text-blue-800'
                                   }`}
                        >
                          {task.priority}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md 
                                       text-xs bg-gray-200 text-gray-700">
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
                           hover:bg-red-50 text-gray-400 hover:text-red-600"
                >
                  <CloseIcon fontSize="small" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 py-8 text-sm">No tasks yet</p>
        )}
      </div>
    </div>
  )
}

export default TodoList
