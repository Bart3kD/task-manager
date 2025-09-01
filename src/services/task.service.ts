import { supabase } from './supabase';
import type { Task, CreateTaskData, UpdateTaskData, TaskFilters } from '../types/task.types';

export class TaskService {
  static async getTasks(filters?: Partial<TaskFilters>): Promise<Task[]> {
    let query = supabase
      .from('tasks')
      .select('*')
      .order(filters?.sortBy || 'created_at', { 
        ascending: filters?.sortOrder === 'asc' 
      });

    if (filters?.completed !== undefined) {
      query = query.eq('completed', filters.completed);
    }
    
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    
    if (filters?.status) {
      if (filters.status === 'completed') {
        // Treat 'completed' status as completed = true
        query = query.eq('completed', true);
      } else {
        query = query.eq('status', filters.status);
      }
    }
    
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    
    if (filters?.dueBefore) {
      query = query.lte('due_date', filters.dueBefore);
    }
    
    if (filters?.dueAfter) {
      query = query.gte('due_date', filters.dueAfter);
    }

    // Pagination
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters?.offset) {
      query = query.range(filters.offset, (filters.offset + (filters.limit || 20)) - 1);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  }

  static async getTask(id: string): Promise<Task | null> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    return data;
  }

  static async createTask(taskData: CreateTaskData): Promise<Task> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...taskData,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateTask(id: string, updates: Partial<UpdateTaskData>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteTask(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async toggleCompletion(id: string): Promise<Task> {
    const task = await this.getTask(id);
    if (!task) throw new Error('Task not found');

    const updates: Partial<UpdateTaskData> = {
      completed: !task.completed,
    };

    return this.updateTask(id, updates);
  }

  static async getTaskStats() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('tasks')
      .select('completed, status, priority, due_date')
      .eq('user_id', user.id);

    if (error) throw error;

    const tasks = data || [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return {
      total: tasks.length,
      completed: tasks.filter(t => t.completed).length,
      pending: tasks.filter(t => !t.completed).length,
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      urgent: tasks.filter(t => t.priority === 'urgent').length,
      overdue: tasks.filter(t =>
        !t.completed &&
        t.due_date &&
        new Date(t.due_date) < today
      ).length,
      dueToday: tasks.filter(t =>
        !t.completed &&
        t.due_date &&
        new Date(t.due_date).toDateString() === today.toDateString()
      ).length
    };
  }
}