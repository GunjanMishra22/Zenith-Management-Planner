import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  LayoutDashboard, CheckCircle2, HeartPulse, Wallet, Calendar, 
  Download, Menu, X, Plus, Trash2, TrendingUp, TrendingDown, 
  ChevronLeft, ChevronRight, Moon, Droplets, Zap, Tag, BarChart3,
  CalendarDays, Target, PieChart, Circle
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { Habit, HealthMetric, WealthEntry, PlannerState, ViewType } from './types';

const INITIAL_STATE: PlannerState = {
  habits: [
    { id: '1', name: 'Morning Meditation', completedDays: [], category: 'Mindset' },
    { id: '2', name: 'Strategic Planning', completedDays: [], category: 'Work' },
  ],
  health: [],
  wealth: [],
  lastSaved: new Date().toISOString(),
};

const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

const App = () => {
  const [state, setState] = useState<PlannerState>(() => {
    const saved = localStorage.getItem('zenith_planner_final');
    try {
      return saved ? JSON.parse(saved) : INITIAL_STATE;
    } catch {
      return INITIAL_STATE;
    }
  });
  
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  const today = useMemo(() => new Date().toISOString().split('T')[0], [activeView]);

  useEffect(() => {
    localStorage.setItem('zenith_planner_final', JSON.stringify({ ...state, lastSaved: new Date().toISOString() }));
  }, [state]);

  const updateState = useCallback((updater: (prev: PlannerState) => PlannerState) => {
    setState(prev => updater(prev));
  }, []);

  // Stats Calculations for Reports
  const stats = useMemo(() => {
    const month = currentCalendarDate.getMonth();
    const year = currentCalendarDate.getFullYear();
    
    const monthWealth = state.wealth.filter(w => {
      const d = new Date(w.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    const income = monthWealth.filter(w => w.type === 'income').reduce((acc, c) => acc + c.amount, 0);
    const expense = monthWealth.filter(w => w.type === 'expense').reduce((acc, c) => acc + c.amount, 0);
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let totalPossibleHabits = state.habits.length * daysInMonth;
    let totalCompletedHabits = 0;
    
    state.habits.forEach(h => {
      h.completedDays.forEach(d => {
        const dateObj = new Date(d);
        if (dateObj.getMonth() === month && dateObj.getFullYear() === year) {
          totalCompletedHabits++;
        }
      });
    });

    const monthHealth = state.health.filter(h => {
      const d = new Date(h.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    const avgSleep = monthHealth.length ? (monthHealth.reduce((acc, c) => acc + (c.sleepHours || 0), 0) / monthHealth.length).toFixed(1) : 0;
    const avgSteps = monthHealth.length ? Math.round(monthHealth.reduce((acc, c) => acc + (c.steps || 0), 0) / monthHealth.length) : 0;

    return {
      income,
      expense,
      net: income - expense,
      habitCompletion: totalPossibleHabits ? Math.round((totalCompletedHabits / totalPossibleHabits) * 100) : 0,
      avgSleep,
      avgSteps
    };
  }, [state, currentCalendarDate]);

  const Dashboard = () => {
    const habitsDoneToday = state.habits.filter(h => h.completedDays.includes(today)).length;
    const habitRate = state.habits.length ? (habitsDoneToday / state.habits.length) * 100 : 0;
    const currentMonth = new Date().getMonth();
    const monthWealth = state.wealth.filter(w => new Date(w.date).getMonth() === currentMonth);
    const netFlow = monthWealth.reduce((acc, curr) => acc + (curr.type === 'income' ? curr.amount : -curr.amount), 0);
    const todayHealth = state.health.find(h => h.date === today);

    return (
      <div className="space-y-8 animate-slide-up pb-20">
        <header className="flex flex-col gap-2">
          <h2 className="text-4xl font-black tracking-tight text-slate-900">Dashboard</h2>
          <p className="text-slate-500 font-medium">Daily overview for {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bento-card p-8 rounded-[2.5rem] shadow-sm cursor-pointer border-l-4 border-l-emerald-500" onClick={() => setActiveView('habits')}>
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><CheckCircle2 size={24} /></div>
              <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg uppercase">Habits</span>
            </div>
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Daily Completion</p>
            <p className="text-3xl font-black">{Math.round(habitRate)}%</p>
            <div className="mt-4 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full transition-all duration-700" style={{ width: `${habitRate}%` }} />
            </div>
          </div>

          <div className="bento-card p-8 rounded-[2.5rem] shadow-sm cursor-pointer border-l-4 border-l-blue-500" onClick={() => setActiveView('wealth')}>
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Wallet size={24} /></div>
              <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded-lg uppercase">Wealth</span>
            </div>
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Monthly Balance</p>
            <p className="text-3xl font-black">{formatCurrency(netFlow)}</p>
            <p className={`text-[10px] mt-2 font-black uppercase ${netFlow >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {netFlow >= 0 ? 'Surplus' : 'Deficit'}
            </p>
          </div>

          <div className="bento-card p-8 rounded-[2.5rem] shadow-sm cursor-pointer border-l-4 border-l-rose-500" onClick={() => setActiveView('health')}>
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><HeartPulse size={24} /></div>
              <span className="text-[10px] font-black bg-rose-50 text-rose-600 px-2 py-1 rounded-lg uppercase">Health</span>
            </div>
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Stats</p>
            <p className="text-3xl font-black">{todayHealth?.sleepHours || '0'}h Sleep</p>
            <div className="flex gap-2 mt-4">
              <span className="px-3 py-1 bg-slate-50 rounded-xl text-[10px] font-bold text-slate-500 uppercase">{todayHealth?.waterIntake || 0}L Water</span>
              <span className="px-3 py-1 bg-slate-50 rounded-xl text-[10px] font-bold text-slate-500 uppercase">{todayHealth?.steps || 0} Steps</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold flex items-center gap-2"><Zap size={20} className="text-amber-500" /> Daily Habits</h3>
                <button onClick={() => setActiveView('habits')} className="text-xs font-black text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors uppercase tracking-widest">Edit</button>
              </div>
              <div className="space-y-3">
                {state.habits.slice(0, 6).map(habit => {
                  const done = habit.completedDays.includes(today);
                  return (
                    <div 
                      key={habit.id}
                      onClick={() => updateState(prev => ({
                        ...prev,
                        habits: prev.habits.map(h => h.id === habit.id ? {
                          ...h,
                          completedDays: done ? h.completedDays.filter(d => d !== today) : [...h.completedDays, today]
                        } : h)
                      }))}
                      className={`flex items-center gap-4 p-5 rounded-3xl border transition-all cursor-pointer ${done ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-50 hover:border-slate-200 hover:bg-white hover:scale-[1.01]'}`}
                    >
                      <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${done ? 'bg-indigo-600 border-indigo-600 text-white scale-110' : 'border-slate-300'}`}>
                        {done ? <CheckCircle2 size={18} /> : <Circle size={10} className="text-slate-300" />}
                      </div>
                      <div className="flex-1">
                        <p className={`font-bold text-sm ${done ? 'line-through text-slate-400' : 'text-slate-800'}`}>{habit.name}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{habit.category}</p>
                      </div>
                    </div>
                  );
                })}
                {state.habits.length === 0 && <p className="text-slate-400 text-center py-10 text-sm italic">No habits added yet.</p>}
              </div>
           </div>

           <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><PieChart size={20} className="text-blue-500" /> Recent Wealth</h3>
                <div className="space-y-4">
                  {state.wealth.slice(0, 4).map(w => (
                    <div key={w.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${w.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <div>
                          <p className="font-bold text-sm truncate max-w-[140px] text-slate-800">{w.description}</p>
                          <p className="text-[9px] font-black text-slate-400 uppercase">{w.category || 'General'}</p>
                        </div>
                      </div>
                      <span className={`font-black ${w.type === 'income' ? 'text-emerald-500' : 'text-slate-900'}`}>
                        {w.type === 'income' ? '+' : '-'}{formatCurrency(w.amount)}
                      </span>
                    </div>
                  ))}
                  {state.wealth.length === 0 && <p className="text-slate-400 text-center py-16 text-sm italic">No recent entries.</p>}
                </div>
              </div>
              <button onClick={() => setActiveView('wealth')} className="mt-8 bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-slate-800 transition-all active:scale-[0.98] shadow-lg shadow-slate-200 uppercase text-xs tracking-widest">
                Add Wealth Entry
              </button>
           </div>
        </div>
      </div>
    );
  };

  const CalendarView = () => {
    const calendarRef = useRef<HTMLDivElement>(null);
    const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
    const startDay = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), 1).getDay();

    const handleExport = async () => {
      if (!calendarRef.current) return;
      try {
        const dataUrl = await htmlToImage.toPng(calendarRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
        const link = document.createElement('a');
        link.download = `Zenith-Report-${currentCalendarDate.getFullYear()}-${currentCalendarDate.getMonth()+1}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error("Export failed:", err);
      }
    };

    return (
      <div className="space-y-8 animate-slide-up pb-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-slate-900">Calendar</h2>
            <p className="text-slate-500 font-medium">Monthly performance reports.</p>
          </div>
          <button onClick={handleExport} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-indigo-100 active:scale-95 transition-all">
            <Download size={18} /> Export Report
          </button>
        </div>

        <div ref={calendarRef} className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden p-6 md:p-10">
          <div className="flex items-center justify-between mb-10 px-4">
            <div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{currentCalendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1">Overview</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1))} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-500 transition-all"><ChevronLeft size={24} /></button>
              <button onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1))} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-500 transition-all"><ChevronRight size={24} /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-10">
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Habit Completion</p>
              <p className="text-3xl font-black text-emerald-600">{stats.habitCompletion}%</p>
              <p className="text-[9px] font-bold text-slate-500 mt-1 italic">Success Rate</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Monthly Net</p>
              <p className={`text-2xl font-black ${stats.net >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>{formatCurrency(stats.net)}</p>
              <p className="text-[9px] font-bold text-slate-500 mt-1 italic">Income vs Expenses</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Avg Sleep</p>
              <p className="text-2xl font-black text-indigo-600">{stats.avgSleep}h</p>
              <p className="text-[9px] font-bold text-slate-500 mt-1 italic">Monthly average</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Avg Steps</p>
              <p className="text-2xl font-black text-slate-900">{stats.avgSteps.toLocaleString()}</p>
              <p className="text-[9px] font-bold text-slate-500 mt-1 italic">Daily average</p>
            </div>
          </div>

          <div className="grid grid-cols-7 border-t border-l border-slate-50 bg-white">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="py-5 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest border-b border-r border-slate-50">{d}</div>)}
            {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} className="h-24 md:h-36 border-b border-r border-slate-50 bg-slate-50/10" />)}
            {Array.from({ length: daysInMonth(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth()) }).map((_, i) => {
              const d = i + 1;
              const dateStr = `${currentCalendarDate.getFullYear()}-${String(currentCalendarDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const doneCount = state.habits.filter(h => h.completedDays.includes(dateStr)).length;
              const isToday = today === dateStr;
              return (
                <div key={d} className={`h-24 md:h-36 border-b border-r border-slate-50 p-3 flex flex-col transition-colors hover:bg-slate-50/50 group ${isToday ? 'bg-indigo-50/30' : ''}`}>
                  <span className={`text-[11px] font-black w-7 h-7 flex items-center justify-center rounded-xl transition-all ${isToday ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-110' : 'text-slate-400 group-hover:text-slate-900'}`}>{d}</span>
                  <div className="mt-auto space-y-1.5">
                    {doneCount > 0 && <div className="flex flex-wrap gap-1 mb-1">{Array.from({length: Math.min(doneCount, 6)}).map((_, j) => <div key={j} className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />)}</div>}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full transition-all duration-700" style={{ width: `${(doneCount / (state.habits.length || 1)) * 100}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-8 pt-8 border-t border-slate-100 flex justify-between items-center text-slate-300">
            <span className="text-[10px] font-black uppercase tracking-widest">Zenith Planner</span>
            <span className="text-[10px] font-bold italic">Generated on {new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    );
  };

  const HabitModal = () => {
    const [name, setName] = useState('');
    const [cat, setCat] = useState('');
    const [error, setError] = useState('');

    const save = () => {
      if (!name.trim()) {
        setError('Habit name is required');
        return;
      }
      updateState(prev => ({ ...prev, habits: [...prev.habits, { id: Math.random().toString(36).substr(2,9), name, completedDays: [], category: cat || 'General' }] }));
      setShowHabitModal(false);
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md transition-all">
        <div className="bg-white w-full max-w-md rounded-[3rem] p-12 shadow-2xl animate-slide-up relative border border-slate-100">
          <button onClick={() => setShowHabitModal(false)} className="absolute top-8 right-8 p-2 text-slate-300 hover:text-slate-600 transition-colors"><X size={24} /></button>
          <h3 className="text-3xl font-black mb-8 text-slate-900 tracking-tight">New Habit</h3>
          <div className="space-y-6 mb-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Habit Name</label>
              <input value={name} onChange={e => { setName(e.target.value); setError(''); }} placeholder="e.g. Read for 30 mins" className={`w-full bg-slate-50 px-6 py-5 rounded-[1.5rem] outline-none font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all border ${error ? 'border-rose-300 bg-rose-50' : 'border-slate-100 hover:border-slate-200'}`} autoFocus />
              {error && <p className="text-rose-500 text-[10px] mt-1 font-bold uppercase ml-1">{error}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Category</label>
              <input value={cat} onChange={e => setCat(e.target.value)} placeholder="e.g. Health" className="w-full bg-slate-50 px-6 py-5 rounded-[1.5rem] outline-none font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all border border-slate-100 hover:border-slate-200" />
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setShowHabitModal(false)} className="flex-1 py-5 font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
            <button onClick={save} className="flex-[2] bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 text-xs uppercase tracking-widest">Add Habit</button>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch(activeView) {
      case 'dashboard': return <Dashboard />;
      case 'calendar': return <CalendarView />;
      case 'habits': return (
        <div className="space-y-8 animate-slide-up pb-20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <h2 className="text-4xl font-black tracking-tight text-slate-900">Habits</h2>
              <p className="text-slate-500 font-medium">Track your daily habits and routines.</p>
            </div>
            <button onClick={() => setShowHabitModal(true)} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center gap-2 active:scale-95 transition-all">
              <Plus size={20} /> Add Habit
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {state.habits.map(h => {
              const done = h.completedDays.includes(today);
              return (
                <div key={h.id} className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-100 hover:shadow-md transition-all">
                  <div className="flex items-center gap-5">
                    <div onClick={() => updateState(prev => ({
                        ...prev,
                        habits: prev.habits.map(hab => hab.id === h.id ? {
                          ...hab,
                          completedDays: done ? hab.completedDays.filter(d => d !== today) : [...hab.completedDays, today]
                        } : hab)
                      }))} className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center font-black text-xl transition-all cursor-pointer ${done ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-300 hover:bg-slate-100'}`}>
                      {h.name[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className={`font-black text-slate-900 leading-tight ${done ? 'line-through text-slate-300' : ''}`}>{h.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Tag size={10} className="text-slate-400" />
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{h.category}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => updateState(prev => ({ ...prev, habits: prev.habits.filter(i => i.id !== h.id) }))} className="p-3 text-slate-100 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={20} /></button>
                </div>
              );
            })}
            {state.habits.length === 0 && <div className="col-span-full py-24 text-center text-slate-300 font-bold italic border-4 border-dashed border-slate-50 rounded-[3.5rem]">No habits yet. Click "Add Habit" to begin.</div>}
          </div>
        </div>
      );
      case 'health': return (
        <div className="space-y-8 animate-slide-up pb-20">
          <h2 className="text-4xl font-black tracking-tight text-slate-900">Health</h2>
          <p className="text-slate-500 font-medium">Log your sleep, hydration, and activity.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { label: 'Sleep Quality', icon: Moon, field: 'sleepHours', color: 'text-indigo-600', bg: 'bg-indigo-50', max: 12, unit: 'h' },
              { label: 'Water Intake', icon: Droplets, field: 'waterIntake', color: 'text-cyan-600', bg: 'bg-cyan-50', max: 8, unit: 'L' },
              { label: 'Steps', icon: Zap, field: 'steps', color: 'text-rose-600', bg: 'bg-rose-50', max: 20000, unit: ' steps' }
            ].map(m => {
              const val = state.health.find(h => h.date === today)?.[m.field as keyof HealthMetric] || 0;
              return (
                <div key={m.label} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-5 mb-10">
                    <div className={`p-5 ${m.bg} ${m.color} rounded-3xl`}><m.icon size={32} /></div>
                    <div>
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{m.label}</p>
                      <p className="text-4xl font-black text-slate-900">{val}{m.unit}</p>
                    </div>
                  </div>
                  <input 
                    type="range" min="0" max={m.max} step={m.field === 'steps' ? 500 : 0.5} value={val as number}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      updateState(prev => {
                        const existing = prev.health.find(h => h.date === today);
                        return { ...prev, health: existing 
                          ? prev.health.map(h => h.date === today ? { ...h, [m.field]: v } : h)
                          : [...prev.health, { date: today, [m.field]: v }] };
                      });
                    }}
                    className="w-full h-2.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-600 mb-4"
                  />
                  <div className="flex justify-between text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    <span>Low</span>
                    <span>High ({m.max}{m.unit})</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
      case 'wealth': return (
        <div className="space-y-8 animate-slide-up pb-20">
          <h2 className="text-4xl font-black tracking-tight text-slate-900">Wealth</h2>
          <p className="text-slate-500 font-medium">Track your income and expenses.</p>
          <div className="bg-white p-8 md:p-12 rounded-[3.5rem] border border-slate-100 shadow-xl">
            <h3 className="text-xl font-bold mb-10 text-slate-900 flex items-center gap-3"><TrendingUp size={24} className="text-emerald-500" /> Wealth Entry</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Label</label>
                <input id="w-desc" type="text" placeholder="e.g. Salary, Rent" className="w-full bg-slate-50 px-6 py-5 rounded-2xl outline-none font-bold border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                <input id="w-cat" type="text" placeholder="e.g. Food, Work" className="w-full bg-slate-50 px-6 py-5 rounded-2xl outline-none font-bold border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount ($)</label>
                <input id="w-amt" type="number" placeholder="0.00" className="w-full bg-slate-50 px-6 py-5 rounded-2xl outline-none font-bold border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
              </div>
              <div className="flex items-end">
                <button 
                  onClick={() => {
                    const d = (document.getElementById('w-desc') as HTMLInputElement).value;
                    const c = (document.getElementById('w-cat') as HTMLInputElement).value;
                    const aStr = (document.getElementById('w-amt') as HTMLInputElement).value;
                    const a = parseFloat(aStr);
                    if (d.trim() && !isNaN(a) && a !== 0) {
                      updateState(prev => ({ ...prev, wealth: [{ id: Math.random().toString(36).substr(2,9), date: new Date().toISOString(), type: a > 0 ? 'income' : 'expense', amount: Math.abs(a), description: d, category: c || 'General' }, ...prev.wealth] }));
                      (document.getElementById('w-desc') as HTMLInputElement).value = '';
                      (document.getElementById('w-cat') as HTMLInputElement).value = '';
                      (document.getElementById('w-amt') as HTMLInputElement).value = '';
                    }
                  }}
                  className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200 text-xs uppercase tracking-widest"
                >Save Entry</button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden">
             <div className="px-10 py-6 border-b border-slate-50 flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction Log</span>
                <span className="text-[10px] font-bold text-slate-300 italic">{state.wealth.length} Entries Recorded</span>
             </div>
             <div className="divide-y divide-slate-50">
               {state.wealth.map(w => (
                 <div key={w.id} className="px-10 py-8 flex items-center justify-between hover:bg-slate-50 transition-all group">
                   <div className="flex items-center gap-6">
                      <div className={`p-4 rounded-2xl transition-all ${w.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {w.type === 'income' ? <TrendingUp size={22} /> : <TrendingDown size={22} />}
                      </div>
                      <div>
                        <p className="font-black text-lg text-slate-800 tracking-tight">{w.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Tag size={10} className="text-slate-400" />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{w.category}</p>
                        </div>
                      </div>
                   </div>
                   <div className="flex items-center gap-10">
                      <div className="text-right">
                        <p className={`text-2xl font-black ${w.type === 'income' ? 'text-emerald-500' : 'text-slate-900'}`}>{w.type === 'income' ? '+' : '-'}{formatCurrency(w.amount)}</p>
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                      <button onClick={() => updateState(prev => ({ ...prev, wealth: prev.wealth.filter(i => i.id !== w.id) }))} className="p-3 text-slate-100 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 size={20} />
                      </button>
                   </div>
                 </div>
               ))}
               {state.wealth.length === 0 && <div className="p-32 text-center text-slate-200 font-bold italic text-sm tracking-widest">No entries logged yet.</div>}
             </div>
          </div>
        </div>
      );
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc] text-slate-900 overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      {showHabitModal && <HabitModal />}
      
      {/* Mobile Bar */}
      <nav className="md:hidden glass-nav sticky top-0 z-50 flex items-center justify-between p-5 px-8 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-100">Z</div>
          <span className="font-black text-xl tracking-tighter uppercase">Zenith</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-3 text-slate-500 bg-slate-50 rounded-2xl active:scale-90 transition-transform"><Menu size={24} /></button>
      </nav>

      {/* Sidebar Overlay */}
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden animate-fade-in" onClick={() => setIsSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-slate-100 transition-all duration-500 ease-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-10 flex flex-col h-full">
          <div className="hidden md:flex items-center gap-4 mb-20">
            <div className="w-12 h-12 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center text-white font-black text-2xl shadow-2xl shadow-indigo-100">Z</div>
            <div>
              <span className="font-black text-2xl tracking-tighter uppercase block">Zenith</span>
              <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.3em] -mt-1 block">Planner</span>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
              { id: 'habits', icon: Target, label: 'Habits' },
              { id: 'health', icon: HeartPulse, label: 'Health' },
              { id: 'wealth', icon: Wallet, label: 'Wealth' },
              { id: 'calendar', icon: CalendarDays, label: 'Calendar' },
            ].map(item => (
              <button 
                key={item.id}
                onClick={() => { setActiveView(item.id as ViewType); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-5 px-8 py-5 rounded-[1.5rem] transition-all font-black text-sm uppercase tracking-widest group ${activeView === item.id ? 'bg-slate-900 text-white shadow-2xl shadow-slate-300 scale-105' : 'text-slate-300 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <item.icon size={22} className={activeView === item.id ? 'text-white' : 'text-slate-200 group-hover:text-slate-900 transition-colors'} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-10">
            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 transition-opacity group-hover:opacity-10">
                <Zap size={60} className="text-indigo-600" />
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Auto Synced</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-xs font-bold text-slate-600">Local Save Active</p>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">Synced: {new Date(state.lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        </div>
        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden absolute top-8 right-8 p-4 text-slate-400 hover:text-slate-900 transition-colors"><X size={32} /></button>
      </aside>

      {/* Main Surface */}
      <main className="flex-1 p-6 md:p-16 xl:p-24 overflow-y-auto h-screen no-scrollbar relative bg-[#f8fafc]">
        <div className="max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
