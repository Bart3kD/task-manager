// src/pages/TasksPage.tsx
import { useState, useRef } from 'react';
import { Layout } from '../components/layout/Layout';
import { TaskForm } from '../components/tasks/TaskForm';
import { TaskList } from '../components/tasks/TaskList';

// Define the ref interface
interface TaskListRef {
  refresh: () => Promise<void>;
}

export default function TasksPage() {
  const [showForm, setShowForm] = useState(false);
  const taskListRef = useRef<TaskListRef>(null);

  const handleTaskCreated = async () => {
    setShowForm(false);
    // Refresh the task list
    await taskListRef.current?.refresh();
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

        {/* Task creation form */}
        {showForm && (
          <TaskForm
            onTaskCreated={handleTaskCreated}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Task list */}
        <TaskList ref={taskListRef} />
      </div>
    </Layout>
  );
}