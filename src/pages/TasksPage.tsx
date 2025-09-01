import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { TaskForm } from '../components/tasks/TaskForm';
import { TaskList } from '../components/tasks/TaskList';
import { TaskFilters } from '@/types/task.types';
import { TaskFiltersSelect } from '../components/tasks/TaskFilters';

export default function TasksPage() {
  const location = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [filters, setFilters] = useState<TaskFilters>({
    sortBy: "created_at",
    sortOrder: "desc",
    limit: 10,
    offset: 0,
  });

  useEffect(() => {
    if (location.state?.showForm) {
      setShowForm(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleTaskCreated = async () => {
    setShowForm(false);
    setReloadKey(prev => prev + 1);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            {showForm ? 'Cancel' : 'Add Task'}
          </button>
        </div>

        <TaskFiltersSelect
          filters={filters}
          onChange={setFilters}
        />

        {/* Task creation form */}
        {showForm && (
          <TaskForm
            onTaskCreated={handleTaskCreated}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Task list */}
        <TaskList reloadKey={reloadKey} filters={filters} />
      </div>
    </Layout>
  );
}