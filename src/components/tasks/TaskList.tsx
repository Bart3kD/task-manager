import { useState, useEffect } from 'react';
import { TaskService } from '../../services/task.service';
import { TaskCard } from './TaskCard';
import type { Task, TaskFiltersType } from '../../types';

interface TaskListProps {
  reloadKey: number; // just a number that changes when we want to reload
  filters?: TaskFiltersType;
}

export const TaskList = ({ reloadKey, filters }: TaskListProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedTasks = await TaskService.getTasks(filters);
      setTasks(fetchedTasks);
    } catch (err: any) {
      setError(err.message || 'Failed to load tasks');
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  // reload when mounted OR when reloadKey changes
  useEffect(() => {
    loadTasks();
  }, [reloadKey, filters]);

  const handleToggleTask = async (taskId: string) => {
    try {
      const updatedTask = await TaskService.toggleCompletion(taskId);
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? updatedTask : task
        )
      );
    } catch (err: any) {
      setError(err.message || 'Failed to update task');
    }
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === updatedTask.id ? updatedTask : task
      )
    );
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await TaskService.deleteTask(taskId);
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete task');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-center items-center py-8">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">
            Error: {error}
            <button
              onClick={loadTasks}
              className="ml-2 text-red-600 hover:text-red-800 underline"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {tasks.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">No tasks yet</div>
          <p className="text-sm text-gray-400">Create your first task to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Your Tasks ({tasks.length})
            </h2>
            <button
              onClick={loadTasks}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Refresh
            </button>
          </div>

          <div className="space-y-3">
            {tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={handleToggleTask}
                onDelete={handleDeleteTask}
                onUpdate={handleUpdateTask}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
