/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode, useState, useEffect, useRef, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI } from "@google/genai";
import { supabase } from "./lib/supabase";
import { 
  Clock, 
  CheckCircle2, 
  BarChart3, 
  Users, 
  ShieldCheck, 
  Zap, 
  ChevronRight, 
  LayoutDashboard,
  Timer,
  FileText,
  TrendingUp,
  DollarSign,
  Info,
  AlertCircle,
  Send,
  Loader2,
  ArrowLeft,
  Sparkles,
  Lock,
  User,
  LogOut,
  Play,
  Pause,
  UserPlus,
  Plus
} from "lucide-react";

const Section = ({ title, children, icon: Icon, id }: { title: string, children: ReactNode, icon?: any, id?: string }) => (
  <motion.section 
    id={id}
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className="mb-16"
  >
    <div className="flex items-center gap-3 mb-6">
      {Icon && <Icon className="w-8 h-8 text-blue-600" />}
      <h2 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h2>
    </div>
    <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
      {children}
    </div>
  </motion.section>
);

const FeatureCard = ({ title, description, icon: Icon }: { title: string, description: string, icon: any }) => (
  <div className="p-6 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <Icon className="w-10 h-10 text-blue-500 mb-4" />
    <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
    <p className="text-slate-600">{description}</p>
  </div>
);

export default function App() {
  const [view, setView] = useState<"guide" | "ai" | "dashboard" | "login" | "signup">("guide");
  const [session, setSession] = useState<any>(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai", content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  
  const goToApp = () => {
    if (session) setView("dashboard");
    else setView("login");
  };

  const [tasks, setTasks] = useState<any[]>([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", project: "", description: "" });
  
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch tasks from Supabase
  useEffect(() => {
    if (!session?.user?.id) {
      // Default tasks for guide/preview mode
      setTasks([
        { id: "AD-101", title: "Implement Auth Flow", project: "Project Phoenix", seconds: 15600, status: "In Progress", description: "Setting up OAuth2 with Azure Active Directory integration." },
        { id: "AD-102", title: "Refactor Database Schema", project: "Project Phoenix", seconds: 8100, status: "Completed", description: "Optimizing query performance for large datasets." },
        { id: "AD-105", title: "UI Bug Fixes", project: "Mobile App", seconds: 6300, status: "In Progress", description: "Fixing layout issues on smaller screen devices." },
        { id: "AD-110", title: "API Documentation", project: "Core API", seconds: 10800, status: "Pending", description: "Updating Swagger docs for the new v2 endpoints." },
      ]);
      return;
    }

    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (data) {
        setTasks(data.map(t => ({
          ...t,
          id: t.task_code || t.id,
          real_id: t.id // Keep the UUID for updates
        })));
      }
    };

    fetchTasks();

    // Real-time subscription
    const channel = supabase
      .channel("tasks-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, fetchTasks)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) setView("dashboard");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session) {
        setView("dashboard");
      } else if (event === "SIGNED_OUT") {
        setView("guide");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (activeTaskId) {
      timerRef.current = setInterval(() => {
        setTasks(prev => prev.map(t => 
          t.id === activeTaskId ? { ...t, seconds: t.seconds + 1 } : t
        ));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeTaskId]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthMessage(null);
    setIsAuthLoading(true);

    try {
      // Fallback for demo if keys are missing
      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes("placeholder")) {
        setSession({ user: { email: loginForm.email } });
        setView("dashboard");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password,
      });

      if (error) {
        setAuthError(error.message);
      } else if (data.session) {
        setSession(data.session);
        setView("dashboard");
      }
    } catch (err: any) {
      setAuthError("An unexpected error occurred. Please try again.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthMessage(null);
    setIsAuthLoading(true);

    try {
      // Fallback for demo if keys are missing
      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes("placeholder")) {
        setSession({ user: { email: loginForm.email } });
        setView("dashboard");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: loginForm.email,
        password: loginForm.password,
      });

      if (error) {
        setAuthError(error.message);
      } else if (data.session) {
        // Signed in immediately (email confirmation disabled)
        setSession(data.session);
        setView("dashboard");
      } else {
        // Email confirmation required
        setAuthMessage("Success! Please check your email to confirm your account before logging in.");
      }
    } catch (err: any) {
      setAuthError("An unexpected error occurred. Please try again.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setActiveTaskId(null);
    setTasks([]); // Clear tasks on logout
    setView("guide");
  };

  const handleAddTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    const taskCode = `AD-${Math.floor(100 + Math.random() * 900)}`;
    const { data, error } = await supabase
      .from("tasks")
      .insert([{
        user_id: session.user.id,
        task_code: taskCode,
        title: newTask.title,
        project: newTask.project,
        description: newTask.description,
        seconds: 0,
        status: "Pending"
      }])
      .select();

    if (error) {
      console.error("Error adding task:", error);
    } else {
      setIsAddingTask(false);
      setNewTask({ title: "", project: "", description: "" });
    }
  };

  const toggleTimer = async (task: any) => {
    if (activeTaskId === task.id) {
      // Stopping timer - sync with Supabase
      const currentTask = tasks.find(t => t.id === task.id);
      if (currentTask && session?.user?.id && currentTask.real_id) {
        await supabase
          .from("tasks")
          .update({ seconds: currentTask.seconds })
          .eq("id", currentTask.real_id);
      }
      setActiveTaskId(null);
    } else {
      setActiveTaskId(task.id);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMessage,
        config: {
          systemInstruction: "You are a professional expert on 7pace Timetracker for Azure DevOps. Answer questions about time tracking, productivity, and project management using 7pace. Be concise, professional, and helpful.",
        }
      });

      const aiResponse = response.text || "I'm sorry, I couldn't process that request.";
      setMessages(prev => [...prev, { role: "ai", content: aiResponse }]);
    } catch (error) {
      console.error("Gemini API Error:", error);
      setMessages(prev => [...prev, { role: "ai", content: "An error occurred while connecting to the AI. Please check your configuration." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (view === "login" || view === "signup") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-10 rounded-3xl border border-slate-200 shadow-xl w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Clock className="text-white w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">{view === "login" ? "Welcome Back" : "Create Account"}</h2>
            <p className="text-slate-500 mt-2">{view === "login" ? "Log in to your 7pace account" : "Start tracking your time with 7pace"}</p>
          </div>
          
          {authError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {authError}
            </div>
          )}

          {authMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl text-green-600 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              {authMessage}
            </div>
          )}

          <form onSubmit={view === "login" ? handleLogin : handleSignUp} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="email" 
                  required
                  value={loginForm.email}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="name@company.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="password" 
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button 
              type="submit"
              disabled={isAuthLoading}
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 ${isAuthLoading ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {isAuthLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                view === "login" ? <Lock className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />
              )}
              {isAuthLoading ? "Processing..." : (view === "login" ? "Log In to Tracker" : "Create Account")}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <button 
              onClick={() => setView(view === "login" ? "signup" : "login")}
              className="text-blue-600 hover:underline font-medium text-sm"
            >
              {view === "login" ? "Don't have an account? Sign up" : "Already have an account? Log in"}
            </button>
          </div>

          <button 
            onClick={() => setView("guide")}
            className="w-full mt-4 text-slate-500 hover:text-blue-600 font-medium text-sm transition-colors"
          >
            Back to Documentation
          </button>
        </motion.div>
      </div>
    );
  }

  if (view === "dashboard") {
    const currentTask = tasks.find(t => t.id === selectedTask?.id) || selectedTask;
    const totalSecondsToday = tasks.reduce((acc, t) => acc + t.seconds, 0);

    return (
      <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
        {/* Dashboard Header */}
        <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <LayoutDashboard className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-bold text-slate-900">7pace Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-sm font-bold text-slate-900">{session?.user?.email}</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Active User</span>
              </div>
              <button 
                onClick={() => setView("ai")}
                className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Ask AI
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto p-6">
          {!import.meta.env.VITE_SUPABASE_URL && (
            <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 flex items-center gap-3">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <p className="text-sm">
                <strong>Supabase not configured:</strong> Please add your <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to the environment variables to enable real authentication and data persistence.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Stats Summary */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Total Tracked Today</p>
                <h3 className="text-3xl font-bold text-slate-900 font-mono">{formatTime(totalSecondsToday)}</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Active Projects</p>
                <h3 className="text-3xl font-bold text-slate-900">3</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Billable Efficiency</p>
                <h3 className="text-3xl font-bold text-blue-600">94%</h3>
              </div>
            </div>

            {/* Task List / Tracker */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Timer className="w-5 h-5 text-blue-600" />
                  Active Time Tracker
                </h2>
                {session && (
                  <button 
                    onClick={() => setIsAddingTask(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    New Task
                  </button>
                )}
              </div>

              {isAddingTask && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-2xl border border-blue-200 shadow-md mb-6"
                >
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Create New Task</h3>
                  <form onSubmit={handleAddTask} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <input 
                        type="text" 
                        placeholder="Task Title"
                        required
                        value={newTask.title}
                        onChange={e => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <input 
                        type="text" 
                        placeholder="Project Name"
                        required
                        value={newTask.project}
                        onChange={e => setNewTask(prev => ({ ...prev, project: e.target.value }))}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <textarea 
                      placeholder="Description"
                      value={newTask.description}
                      onChange={e => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none h-20"
                    />
                    <div className="flex gap-2">
                      <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold">Save Task</button>
                      <button type="button" onClick={() => setIsAddingTask(false)} className="text-slate-500 font-medium">Cancel</button>
                    </div>
                  </form>
                </motion.div>
              )}

              {tasks.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center">
                  <Clock className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">No tasks found. Create your first task to start tracking!</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <motion.div 
                    key={task.id}
                    whileHover={{ scale: 1.01 }}
                    className={`bg-white p-5 rounded-2xl border transition-all flex items-center justify-between group cursor-pointer ${
                      activeTaskId === task.id ? "border-blue-500 ring-2 ring-blue-100 shadow-md" : "border-slate-200 shadow-sm"
                    }`}
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        activeTaskId === task.id ? "bg-blue-600 text-white animate-pulse" : 
                        task.status === "Completed" ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                      }`}>
                        {activeTaskId === task.id ? <Play className="w-6 h-6 fill-current" /> : 
                         task.status === "Completed" ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">{task.id}</span>
                          <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{task.title}</h4>
                        </div>
                        <p className="text-sm text-slate-500">{task.project}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold font-mono ${activeTaskId === task.id ? "text-blue-600" : "text-slate-900"}`}>
                        {formatTime(task.seconds)}
                      </div>
                      <div className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block ${
                        task.status === "Completed" ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                      }`}>
                        {task.status}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Task Details / Info Panel */}
            <div className="lg:col-span-1">
              <AnimatePresence mode="wait">
                {currentTask ? (
                  <motion.div 
                    key={currentTask.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg sticky top-24"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                        <Info className="w-6 h-6" />
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedTask(null); }}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <Zap className="w-5 h-5 rotate-45" />
                      </button>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{currentTask.title}</h3>
                    <p className="text-blue-600 font-semibold mb-6">{currentTask.id} • {currentTask.project}</p>
                    
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Description</h4>
                        <p className="text-slate-600 leading-relaxed">{currentTask.description}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-3 rounded-xl">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Tracked Time</p>
                          <p className="text-lg font-bold text-slate-900 font-mono">{formatTime(currentTask.seconds)}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
                          <p className="text-lg font-bold text-slate-900">{currentTask.status}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => toggleTimer(currentTask)}
                        className={`w-full font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${
                          activeTaskId === currentTask.id 
                            ? "bg-red-500 hover:bg-red-600 text-white" 
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        {activeTaskId === currentTask.id ? (
                          <>
                            <Pause className="w-5 h-5 fill-current" />
                            Stop Timer
                          </>
                        ) : (
                          <>
                            <Play className="w-5 h-5 fill-current" />
                            Start Timer
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-slate-100 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center h-[400px]">
                    <Clock className="w-12 h-12 text-slate-300 mb-4" />
                    <p className="text-slate-500 font-medium">Select a task to view detailed 7pace information</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </main>

        <footer className="bg-white border-t border-slate-200 p-4 text-center text-slate-400 text-xs">
          7pace Dashboard Interface • Created by Sanjith Anumola
        </footer>
      </div>
    );
  }

  if (view === "ai") {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
        {/* AI Header */}
        <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <button 
              onClick={() => setView("guide")}
              className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Guide
            </button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-slate-900">7pace AI Assistant</span>
            </div>
            <div className="w-20"></div> {/* Spacer */}
          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 max-w-4xl w-full mx-auto p-6 overflow-y-auto">
          <div className="space-y-6">
            {messages.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">How can I help you with 7pace?</h2>
                <p className="text-slate-600">Ask me about features, setup, or best practices.</p>
              </motion.div>
            )}
            {messages.map((msg, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: msg.role === "user" ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[80%] p-4 rounded-2xl ${
                  msg.role === "user" 
                    ? "bg-blue-600 text-white rounded-tr-none" 
                    : "bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm"
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <span className="text-slate-500 text-sm">Thinking...</span>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Input Area */}
        <footer className="bg-white border-t border-slate-200 p-4">
          <div className="max-w-4xl mx-auto flex gap-3">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Ask a question about 7pace Timetracker..."
              className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            />
            <button 
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white p-3 rounded-xl transition-all shadow-md"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-3 uppercase tracking-widest font-bold">
            Powered by Gemini AI • Created by Sanjith Anumola
          </p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Header / Hero */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Clock className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-slate-900">7pace <span className="text-blue-600">AI</span></span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-600 items-center">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#workflow" className="hover:text-blue-600 transition-colors">Workflow</a>
            <a href="#benefits" className="hover:text-blue-600 transition-colors">Benefits</a>
            <button 
              onClick={() => setView("dashboard")}
              className="text-slate-600 hover:text-blue-600 font-medium transition-colors"
            >
              Dashboard
            </button>
            {!session && (
              <button 
                onClick={() => setView("login")}
                className="bg-blue-600 text-white px-5 py-2 rounded-full font-bold hover:bg-blue-700 transition-all shadow-md"
              >
                Log In
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 md:py-20">
        {/* Introduction */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <span className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold tracking-wide text-blue-700 uppercase bg-blue-50 rounded-full">
            Product Expert Guide
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
            7pace Timetracker for Azure DevOps
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            A comprehensive look at the industry-leading time management solution by <span className="font-semibold text-slate-900">Appfire</span>, 
            designed specifically for software development teams.
          </p>
        </motion.div>

        <Section title="Live Dashboard Preview" icon={LayoutDashboard}>
          <div className="bg-slate-100/50 p-4 md:p-8 rounded-3xl border border-slate-200 shadow-inner mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Live Demo Mode</span>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setView("login")}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Log in
                </button>
                <span className="text-slate-300 text-xs">|</span>
                <button 
                  onClick={() => setView("signup")}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Sign up to save your data →
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Tracked Today</p>
                <h3 className="text-2xl font-bold text-slate-900 font-mono">11h 20m 0s</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Active Projects</p>
                <h3 className="text-2xl font-bold text-slate-900">3</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Billable Efficiency</p>
                <h3 className="text-2xl font-bold text-blue-600">94%</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-3">
                <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Timer className="w-4 h-4 text-blue-600" />
                  Active Time Tracker
                </h4>
                {tasks.map((task) => (
                  <div 
                    key={task.id}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group cursor-default"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400">{task.id}</span>
                          <h5 className="text-sm font-bold text-slate-900">{task.title}</h5>
                        </div>
                        <p className="text-[11px] text-slate-500">{task.project}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold font-mono text-slate-900">
                        {formatTime(task.seconds)}
                      </div>
                      <div className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block ${
                        task.status === "Completed" ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                      }`}>
                        {task.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="lg:col-span-1">
                <div className="bg-white/50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center flex flex-col items-center justify-center h-full min-h-[200px]">
                  <Clock className="w-10 h-10 text-slate-300 mb-3" />
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Select a task to view detailed<br />7pace information
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section title="1. Introduction" icon={Info}>
          <p className="mb-4">
            <strong>7pace Timetracker</strong> is a professional time management solution built natively for Azure DevOps. 
            Unlike generic time tracking tools, it is deeply integrated into the developer workflow, allowing teams to log time 
            directly on work items without ever leaving their environment.
          </p>
          <p className="mb-4">
            Originally an independent success, 7pace was acquired by <strong>Appfire</strong>, a leading provider of enterprise-grade 
            apps for software development platforms. Its primary purpose is to bridge the gap between development effort and 
            business intelligence, providing accurate data for planning, billing, and productivity analysis.
          </p>
        </Section>

        <Section title="2. Key Features" icon={LayoutDashboard} id="features">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            <FeatureCard 
              icon={Timer}
              title="Integrated Timers"
              description="Start and stop timers directly within Azure DevOps work items for precise, real-time tracking."
            />
            <FeatureCard 
              icon={FileText}
              title="Timesheets"
              description="Comprehensive weekly and monthly views for manual entry and bulk time management."
            />
            <FeatureCard 
              icon={BarChart3}
              title="Reporting & Analytics"
              description="Powerful built-in reports to visualize team capacity, velocity, and effort distribution."
            />
            <FeatureCard 
              icon={ShieldCheck}
              title="Approval Workflows"
              description="Formal submission and approval process to ensure data integrity for billing and payroll."
            />
            <FeatureCard 
              icon={DollarSign}
              title="Budget & Billing"
              description="Track project costs against budgets and export data for client invoicing."
            />
            <FeatureCard 
              icon={Zap}
              title="API & Integration"
              description="Robust REST API and OData support for connecting with Power BI, Excel, or custom tools."
            />
          </div>
        </Section>

        <Section title="3. How It Works" icon={TrendingUp} id="workflow">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="space-y-8">
              {[
                { step: "01", title: "Start Tracking", text: "Open any Azure DevOps work item and click 'Start Tracking' or manually enter the duration." },
                { step: "02", title: "Log Effort", text: "Add comments and select activity types (e.g., Development, Testing, Meeting) to categorize your work." },
                { step: "03", title: "Submit Timesheet", text: "At the end of the week, review your logged hours and submit them for approval." },
                { step: "04", title: "Review & Approve", text: "Managers review the submitted time, ensuring accuracy before locking the period for reporting." }
              ].map((item, index) => (
                <div key={index} className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 mb-1">{item.title}</h4>
                    <p className="text-slate-600">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section title="4. Benefits" icon={CheckCircle2} id="benefits">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="mt-1"><CheckCircle2 className="text-green-500 w-6 h-6" /></div>
              <div>
                <h4 className="font-bold text-slate-900">Productivity Improvement</h4>
                <p className="text-slate-600">By understanding where time goes, teams can identify bottlenecks and optimize their sprints.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="mt-1"><CheckCircle2 className="text-green-500 w-6 h-6" /></div>
              <div>
                <h4 className="font-bold text-slate-900">Accurate Tracking</h4>
                <p className="text-slate-600">Eliminates the guesswork of "end-of-week" estimations by capturing time as it happens.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="mt-1"><CheckCircle2 className="text-green-500 w-6 h-6" /></div>
              <div>
                <h4 className="font-bold text-slate-900">Better Project Management</h4>
                <p className="text-slate-600">Provides real-time visibility into project health and budget consumption.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="mt-1"><CheckCircle2 className="text-green-500 w-6 h-6" /></div>
              <div>
                <h4 className="font-bold text-slate-900">Team Accountability</h4>
                <p className="text-slate-600">Encourages a culture of transparency and data-driven decision making.</p>
              </div>
            </div>
          </div>
        </Section>

        <Section title="5. Use Cases" icon={Users}>
          <div className="space-y-6">
            <div className="p-6 bg-slate-100 rounded-xl">
              <h4 className="font-bold text-slate-900 mb-2">Software Development Teams</h4>
              <p className="text-slate-600">Ideal for internal teams tracking R&D tax credits or measuring sprint velocity accurately.</p>
            </div>
            <div className="p-6 bg-slate-100 rounded-xl">
              <h4 className="font-bold text-slate-900 mb-2">Agile & Scrum Teams</h4>
              <p className="text-slate-600">Helps in refining story point estimations by comparing estimated vs. actual effort.</p>
            </div>
            <div className="p-6 bg-slate-100 rounded-xl">
              <h4 className="font-bold text-slate-900 mb-2">Freelancers & Agencies</h4>
              <p className="text-slate-600">Essential for billing clients based on precise work logs attached to specific deliverables.</p>
            </div>
          </div>
        </Section>

        <Section title="6. Pros and Cons" icon={AlertCircle}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-green-50 p-6 rounded-xl border border-green-100">
              <h4 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Pros
              </h4>
              <ul className="space-y-2 text-green-800 text-sm">
                <li>• Seamless Azure DevOps integration</li>
                <li>• Native feel (no context switching)</li>
                <li>• Powerful API for custom reporting</li>
                <li>• Enterprise-grade security</li>
              </ul>
            </div>
            <div className="bg-red-50 p-6 rounded-xl border border-red-100">
              <h4 className="font-bold text-red-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> Cons
              </h4>
              <ul className="space-y-2 text-red-800 text-sm">
                <li>• Slight learning curve for advanced features</li>
                <li>• Requires Azure DevOps environment</li>
                <li>• Cost can be high for very large teams</li>
              </ul>
            </div>
          </div>
        </Section>

        <Section title="7. Pricing Overview" icon={DollarSign}>
          <p className="mb-6">
            7pace Timetracker typically follows a subscription-based pricing model, often tiered based on the number of users. 
            While specific pricing can vary based on your Azure DevOps deployment (Cloud vs. Server), it generally offers:
          </p>
          <ul className="list-disc pl-6 space-y-3 mb-6">
            <li><strong>Free Trial:</strong> Usually a 30-day full-featured trial to test integration.</li>
            <li><strong>Tiered Pricing:</strong> Cost per user decreases as the team size grows.</li>
            <li><strong>Enterprise Plans:</strong> Custom quotes for very large organizations with specific support needs.</li>
          </ul>
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-blue-800 text-sm italic">
            Note: Always check the official Appfire or Azure Marketplace page for the most current pricing details.
          </div>
        </Section>

        <Section title="8. Conclusion" icon={ChevronRight}>
          <p className="text-lg font-medium text-slate-800 mb-4">
            Why should your team use it?
          </p>
          <p className="mb-6">
            In the modern software landscape, data is king. 7pace Timetracker transforms time from a "chore" into a 
            strategic asset. By integrating effort tracking directly into the development lifecycle, it provides 
            unmatched accuracy and insights that help teams ship better software, more predictably.
          </p>
          <div className="flex justify-center mt-12">
            <button 
              onClick={goToApp}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 group"
            >
              Open 7pace Dashboard
              <ChevronRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </Section>

        {/* Footer */}
        <footer className="mt-24 pt-12 border-t border-slate-200 text-center text-slate-500 text-sm">
          <p className="mb-2">Professional Technical Guide by Sanjith Anumola</p>
          <p>© 2026 Product Insights. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}
