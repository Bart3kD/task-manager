import { z } from 'zod';

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  completed: boolean;
  priority: Priority;
  status: TaskStatus;
  due_date?: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface TaskDisplay extends Omit<Task, 'due_date' | 'created_at' | 'updated_at' | 'user_id' | 'category_id'> {
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters')
    .trim(),

  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .transform(val => val === '' ? null : val), // Convert empty string to null

  priority: z
    .enum(['low', 'medium', 'high', 'urgent'])
    .default('medium'),

  status: z
    .enum(['todo', 'in_progress', 'completed', 'cancelled'])
    .default('todo'),

  due_date: z
    .string()
    .optional()
    .nullable()
    .transform(val => val === '' ? null : val)
    .refine((date) => {
      if (!date) return true;
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime());
    }, 'Please enter a valid date')
    .refine((date) => {
      if (!date) return true;
      const parsedDate = new Date(date);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      return parsedDate >= now;
    }, 'Due date cannot be in the past'),

});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters')
    .trim()
    .optional(),
  
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .nullable()
    .transform(val => val === '' ? null : val),
  
  completed: z.boolean().optional(),
  
  priority: z
    .enum(['low', 'medium', 'high', 'urgent'])
    .optional(),

  status: z
    .enum(['todo', 'in_progress', 'completed', 'cancelled'])
    .optional(),
  
  due_date: z
    .string()
    .nullable()
    .optional()
    .transform(val => val === '' ? null : val)
    .refine((date) => {
      if (!date) return true;
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime());
    }, 'Please enter a valid date'),

});

export const taskFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters')
    .trim(),
  
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .default(''),
  
  priority: z
    .enum(['low', 'medium', 'high', 'urgent'])
    .default('medium'),
  
  status: z
    .enum(['todo', 'in_progress', 'completed', 'cancelled'])
    .default('todo'),
  
  dueDate: z
    .string()
    .default('')
    .refine((date) => {
      if (!date) return true;
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime());
    }, 'Please enter a valid date')
    .refine((date) => {
      if (!date) return true;
      const parsedDate = new Date(date);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      return parsedDate >= now;
    }, 'Due date cannot be in the past'),

});

export const taskFiltersSchema = z.object({
  completed: z.boolean().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['todo', 'in_progress', 'completed', 'cancelled']).optional(),
  search: z.string().max(255).optional(),
  dueBefore: z.string().optional(),
  dueAfter: z.string().optional(),
  sortBy: z
    .enum(['created_at', 'updated_at', 'due_date', 'priority', 'title'])
    .default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export type CreateTaskData = z.infer<typeof createTaskSchema>;
export type UpdateTaskData = z.infer<typeof updateTaskSchema>;
export type TaskFormData = z.infer<typeof taskFormSchema>;
export type TaskFiltersType = z.infer<typeof taskFiltersSchema>;

// Helper function to convert form data to database format
export const formToDbTask = (formData: TaskFormData): CreateTaskData => ({
  title: formData.title,
  description: formData.description || null,
  priority: formData.priority,
  status: formData.status,
  due_date: formData.dueDate || null,
});

// Helper function to convert database task to display format
export const dbToDisplayTask = (dbTask: Task): TaskDisplay => ({
  id: dbTask.id,
  title: dbTask.title,
  description: dbTask.description,
  completed: dbTask.completed,
  priority: dbTask.priority,
  status: dbTask.status,
  dueDate: dbTask.due_date,
  createdAt: dbTask.created_at,
  updatedAt: dbTask.updated_at,
  userId: dbTask.user_id,
});