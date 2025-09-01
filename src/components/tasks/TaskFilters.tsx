import React from "react";
import { TaskFiltersType } from "../../types";

interface TaskFiltersProps {
  filters: TaskFiltersType;
  onChange: (updatedFilters: TaskFiltersType) => void;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({ filters, onChange }) => {

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Normalize empty string to undefined
    const newValue = value === "" ? undefined : value;

    onChange({
      ...filters,
      [name]: newValue,
    });
  };

  return (
    <div className="flex flex-wrap gap-4 mb-4">
      {/* Search */}
      <div className="flex-1 min-w-[150px]">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Search
        </label>
        <input
          type="text"
          name="search"
          placeholder="Search tasks..."
          value={filters.search || ""}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      {/* Status Filter */}
      <div className="flex-1 min-w-[120px]">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          name="status"
          value={filters.status || ""}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Priority Filter */}
      <div className="flex-1 min-w-[120px]">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Priority
        </label>
        <select
          name="priority"
          value={filters.priority || ""}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

    </div>
  );
};
