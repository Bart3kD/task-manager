CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'completed', 'cancelled');

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL CHECK (length(title) > 0 AND length(title) <= 255),
  description TEXT CHECK (length(description) <= 1000),
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  priority priority_level DEFAULT 'medium' NOT NULL,
  status task_status DEFAULT 'todo' NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL
);

CREATE TABLE IF NOT EXISTS public.task_attachments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON public.tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON public.task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_user_id ON public.task_attachments(user_id);

CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON public.tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_user_completed ON public.tasks(user_id, completed);
CREATE INDEX IF NOT EXISTS idx_tasks_user_due_date ON public.tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_priority ON public.tasks(user_id, priority);
CREATE INDEX IF NOT EXISTS idx_tasks_status_due_date ON public.tasks(status, due_date);

CREATE INDEX IF NOT EXISTS idx_incomplete_tasks ON public.tasks(due_date, priority) 
WHERE completed = false;

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = '';

CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at 
  BEFORE UPDATE ON public.tasks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_attachments_updated_at 
  BEFORE UPDATE ON public.task_attachments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Handle new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = '';

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ownership functions
CREATE OR REPLACE FUNCTION public.user_owns_task(task_uuid UUID, user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE id = task_uuid AND user_id = user_uuid
  );
END;
$$ 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = '';

-- Task summary
CREATE OR REPLACE FUNCTION public.get_user_task_summary(target_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  total_tasks BIGINT,
  completed_tasks BIGINT,
  pending_tasks BIGINT,
  todo_tasks BIGINT,
  in_progress_tasks BIGINT,
  urgent_tasks BIGINT,
  overdue_tasks BIGINT,
  completion_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF target_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: Users can only access their own task summary';
  END IF;

  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.email,
    COALESCE(COUNT(t.id), 0) as total_tasks,
    COALESCE(COUNT(t.id) FILTER (WHERE t.completed = true), 0) as completed_tasks,
    COALESCE(COUNT(t.id) FILTER (WHERE t.completed = false), 0) as pending_tasks,
    COALESCE(COUNT(t.id) FILTER (WHERE t.status = 'todo'), 0) as todo_tasks,
    COALESCE(COUNT(t.id) FILTER (WHERE t.status = 'in_progress'), 0) as in_progress_tasks,
    COALESCE(COUNT(t.id) FILTER (WHERE t.priority = 'urgent'), 0) as urgent_tasks,
    COALESCE(COUNT(t.id) FILTER (WHERE t.due_date < NOW() AND t.completed = false), 0) as overdue_tasks,
    CASE 
      WHEN COUNT(t.id) > 0 THEN 
        ROUND((COUNT(t.id) FILTER (WHERE t.completed = true)::NUMERIC / COUNT(t.id)) * 100, 1)
      ELSE 0
    END as completion_rate
  FROM public.profiles p
  LEFT JOIN public.tasks t ON p.id = t.user_id
  WHERE p.id = target_user_id
  GROUP BY p.id, p.email;
END;
$$;

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id AND auth.role() = 'authenticated');

CREATE POLICY "Users can view their own tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view attachments of their own tasks" ON public.task_attachments
  FOR SELECT USING (
    auth.uid() = user_id AND 
    public.user_owns_task(task_id)
  );

CREATE POLICY "Users can create attachments for their own tasks" ON public.task_attachments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    public.user_owns_task(task_id)
  );

CREATE POLICY "Users can update attachments of their own tasks" ON public.task_attachments
  FOR UPDATE USING (
    auth.uid() = user_id AND 
    public.user_owns_task(task_id)
  );

CREATE POLICY "Users can delete attachments of their own tasks" ON public.task_attachments
  FOR DELETE USING (
    auth.uid() = user_id AND 
    public.user_owns_task(task_id)
  );

-- Grants
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

GRANT EXECUTE ON FUNCTION public.user_owns_task(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_task_summary(UUID) TO authenticated;
