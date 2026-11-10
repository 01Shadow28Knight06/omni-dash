'use client'
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Calendar as CalendarIcon, 
  BarChart3, 
  Plus, 
  LayoutDashboard, 
  Clock, 
  TrendingUp,
  Trash2,
  Loader2,
  LogOut,
  Lock,
  Mail
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { supabase } from '@/lib/supabase';

type Task = {
  id: number;
  title: string;
  completed: boolean;
  category: string;
  created_at: string;
};

const productivityData = [
  { day: 'Mon', completed: 4, hours: 3 },
  { day: 'Tue', completed: 7, hours: 6 },
  { day: 'Wed', completed: 3, hours: 2 },
  { day: 'Thu', completed: 8, hours: 7 },
  { day: 'Fri', completed: 6, hours: 5 },
  { day: 'Sat', completed: 2, hours: 1 },
  { day: 'Sun', completed: 5, hours: 4 },
];

export default function Dashboard() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState<string>(''); // ✨ Fixed: Added currentDate state
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // App State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [tasksLoading, setTasksLoading] = useState(false);

  // CHECK USER SESSION & SET DATE ON LOAD
  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    }));

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    // Listen for changes (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // FETCH TASKS WHEN USER LOGS IN
  useEffect(() => {
    if (session) {
      fetchTasks();
    }
  }, [session]);

  async function fetchTasks() {
    try {
      setTasksLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      if (data) setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setTasksLoading(false);
    }
  }

  // HANDLE AUTH (LOGIN / SIGNUP)
  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Check your email for confirmation or log in if confirmation is disabled!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      setAuthError(error.message);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  // ADD TASK
  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskText.trim() || !session) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ 
          title: newTaskText, 
          completed: false, 
          category: 'General',
          user_id: session.user.id 
        }])
        .select();

      if (error) throw error;
      if (data) {
        setTasks([data[0], ...tasks]);
        setNewTaskText('');
      }
    } catch (error) {
      console.error('Error adding task:', error);
    }
  }

  // TOGGLE TASK
  async function toggleTask(id: number, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      setTasks(tasks.map(t => t.id === id ? { ...t, completed: !currentStatus } : t));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  }

  // DELETE TASK
  async function deleteTask(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTasks(tasks.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  }

  // 1. LOADING SCREEN
  if (authLoading) {
    return (
      <div className="flex h-screen bg-slate-950 items-center justify-center text-slate-400 gap-3">
        <Loader2 className="animate-spin text-indigo-500" size={24} /> Loading Security Context...
      </div>
    );
  }

  // 2. LOGIN / SIGNUP SCREEN (If user is not logged in)
  if (!session) {
    return (
      <div className="flex h-screen bg-slate-950 items-center justify-center text-slate-100 p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white">
              <LayoutDashboard size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">OmniDash Secure</h1>
              <p className="text-xs text-slate-400">Sign in to access your private productivity hub</p>
            </div>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-500" size={16} />
                <input 
                  type="email" 
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-500" size={16} />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-xl text-sm transition mt-2"
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="text-center mt-6">
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-slate-400 hover:text-indigo-400 transition"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. MAIN PROTECTED DASHBOARD (If user IS logged in)
  const completedCount = tasks.filter(t => t.completed).length;
  const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-slate-800 p-6 hidden md:flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <LayoutDashboard size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              OmniDash
            </span>
          </div>

          <nav className="space-y-2">
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-indigo-600/10 text-indigo-400 font-medium">
              <LayoutDashboard size={18} /> Dashboard
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition">
              <CheckCircle2 size={18} /> Tasks & To-Do
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition">
              <CalendarIcon size={18} /> Calendar
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition">
              <BarChart3 size={18} /> Analytics
            </a>
          </nav>
        </div>

        <div className="border-t border-slate-800/80 pt-4">
          <p className="text-xs text-slate-400 truncate mb-3" title={session.user.email}>
            👤 {session.user.email}
          </p>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-red-500/10 hover:text-red-400 border border-slate-800 text-slate-300 py-2 rounded-xl text-xs font-medium transition"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-8">
        
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Secure Command Center 🛡️</h1>
            <p className="text-slate-400 text-sm">Protected by Supabase Row Level Security (RLS).</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-sm text-slate-300">
              📅 {currentDate || 'Loading...'}
            </div>
            <button 
              onClick={handleLogout}
              className="md:hidden bg-slate-900 border border-slate-800 p-2 rounded-xl text-red-400"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-sm font-medium">Task Completion Rate</p>
                <h3 className="text-3xl font-bold mt-2 text-white">{completionRate}%</h3>
              </div>
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><TrendingUp size={20} /></div>
            </div>
            <p className="text-xs text-emerald-400 mt-4">Personalized to your account</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-sm font-medium">Your Tasks Finished</p>
                <h3 className="text-3xl font-bold mt-2 text-white">{completedCount} / {tasks.length}</h3>
              </div>
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl"><CheckCircle2 size={20} /></div>
            </div>
            <p className="text-xs text-slate-400 mt-4">Encrypted & isolated</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-sm font-medium">Deep Work Hours</p>
                <h3 className="text-3xl font-bold mt-2 text-white">28.5 hrs</h3>
              </div>
              <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl"><Clock size={20} /></div>
            </div>
            <p className="text-xs text-cyan-400 mt-4">Target: 30 hrs / week</p>
          </div>
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl">
            <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <BarChart3 size={18} className="text-indigo-400" /> Weekly Output Trends
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productivityData}>
                  <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                  <Bar dataKey="completed" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl">
            <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <TrendingUp size={18} className="text-cyan-400" /> Focus Hours Tracked
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={productivityData}>
                  <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="hours" stroke="#22d3ee" strokeWidth={3} dot={{ fill: '#22d3ee' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* TO-DO LIST */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl">
          <h3 className="text-lg font-semibold mb-4 text-white">Your Private Backlog</h3>
          
          <form onSubmit={addTask} className="flex gap-3 mb-6">
            <input 
              type="text" 
              placeholder="Add a secure private task..." 
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition">
              <Plus size={16} /> Add Task
            </button>
          </form>

          {tasksLoading ? (
            <div className="flex justify-center items-center py-12 text-slate-500 gap-2">
              <Loader2 className="animate-spin" size={20} /> Loading secure data...
            </div>
          ) : tasks.length === 0 ? (
            <p className="text-slate-500 text-center py-8 text-sm">No tasks found. Create your first private task above!</p>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => (
                <div 
                  key={task.id} 
                  onClick={() => toggleTask(task.id, task.completed)}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:border-slate-700 cursor-pointer transition group"
                >
                  <div className="flex items-center gap-3">
                    {task.completed ? (
                      <CheckCircle2 className="text-emerald-400" size={20} />
                    ) : (
                      <Circle className="text-slate-600" size={20} />
                    )}
                    <span className={`text-sm ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {task.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      {task.category}
                    </span>
                    <button 
                      onClick={(e) => deleteTask(task.id, e)}
                      className="text-slate-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition"
                      title="Delete Task"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}