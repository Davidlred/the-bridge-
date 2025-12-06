
import React, { useState, useEffect } from 'react';
import { UserState, AppStep, DailyTask, Goal } from './types';
import Dashboard from './components/Dashboard';
import GoalList from './components/GoalList';
import { generatePlan, generateFutureSelf, generateCurrentRoutineImage } from './services/geminiService';
import { authService } from './services/authService';
import { Camera, ArrowRight, Loader2, Upload, Lock, User, Mail, ChevronRight, Bell, Download, Calendar, RefreshCcw } from 'lucide-react';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.AUTH);
  const [loadingMsg, setLoadingMsg] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  
  // Auth Form
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // App Data Inputs
  const [inputRoutine, setInputRoutine] = useState("");
  const [inputGoal, setInputGoal] = useState("");
  const [inputDate, setInputDate] = useState(""); // YYYY-MM-DD
  const [inputImage, setInputImage] = useState<string | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);

  // App State
  const [appState, setAppState] = useState<UserState>({
    userImageBase64: null,
    goals: [],
  });
  
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);

  // 1. Check for active session on boot
  useEffect(() => {
    const savedUserEmail = authService.getCurrentUser();
    if (savedUserEmail) {
      setCurrentUserEmail(savedUserEmail);
      const savedData = authService.loadUserData(savedUserEmail);
      setAppState(savedData);
      
      if (savedData.goals.length > 0) {
        setStep(AppStep.GOALS_LIST);
      } else {
        setStep(AppStep.ONBOARDING_DETAILS);
      }
    }
  }, []);

  // 2. Auto-save data when it changes (if logged in)
  useEffect(() => {
    if (currentUserEmail) {
      authService.saveUserData(currentUserEmail, appState);
    }
  }, [appState, currentUserEmail]);

  // PWA Install Prompt
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  // Notification Logic
  useEffect(() => {
    if (step === AppStep.DASHBOARD && activeGoalId) {
      const activeGoal = appState.goals.find(g => g.id === activeGoalId);
      if (activeGoal) {
        const interval = setInterval(() => {
          const incomplete = activeGoal.tasks.filter(t => !t.completed).length;
          if (incomplete > 0 && Notification.permission === 'granted') {
             new Notification("The Bridge: Status Update", {
               body: `You have ${incomplete} directives remaining for ${activeGoal.title}. Stay focused.`,
             });
          }
        }, 3600000); // 1 Hour
        return () => clearInterval(interval);
      }
    }
  }, [appState.goals, step, activeGoalId]);

  // DAILY REFRESH LOGIC
  useEffect(() => {
    const checkAndRefresh = async () => {
      if (activeGoalId && !isRefreshing) {
        const goal = appState.goals.find(g => g.id === activeGoalId);
        if (goal) {
          const now = Date.now();
          const timeSince = now - goal.lastGeneratedAt;
          const twentyFourHours = 24 * 60 * 60 * 1000;
          
          if (timeSince > twentyFourHours) {
             setIsRefreshing(true);
             try {
                // Calculate streak & Drift update
                // If progress was > 80% yesterday, streak increases, drift decreases
                // If progress was < 60%, streak resets, drift increases
                
                let newStreak = goal.streak;
                let newDrift = goal.drift || 0;
                
                if (goal.progress >= 80) {
                  newStreak += 1;
                  newDrift = Math.max(0, newDrift - 10); // Correction
                } else if (goal.progress < 60) {
                  newStreak = 0;
                  newDrift = Math.min(100, newDrift + 15); // Deviation
                }
                
                const daysRemaining = Math.max(0, Math.ceil((goal.targetDate - now) / (1000 * 60 * 60 * 24)));

                // Generate new tasks for the next day
                const newPlan = await generatePlan(goal.routine, goal.title, newStreak + 1, daysRemaining);
                
                const updatedGoal: Goal = {
                  ...goal,
                  lastGeneratedAt: now,
                  streak: newStreak,
                  drift: newDrift,
                  progress: 0, // Reset progress for the new day
                  tasks: newPlan.tasks.map(t => ({
                    id: Math.random().toString(36).substr(2, 9),
                    title: t.title,
                    description: t.description,
                    impactScore: t.impactScore,
                    completed: false
                  })),
                  motivationalQuote: newPlan.quote
                };

                updateActiveGoal(updatedGoal);
             } catch (err) {
               console.error("Failed to refresh daily tasks", err);
             } finally {
               setIsRefreshing(false);
             }
          }
        }
      }
    };

    checkAndRefresh();
    // Check every minute if open
    const interval = setInterval(checkAndRefresh, 60000);
    return () => clearInterval(interval);

  }, [activeGoalId, appState.goals, isRefreshing]);

  const requestNotifications = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInputImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthLoading(true);

    try {
      if (authMode === 'signup') {
        await authService.signUp(email, password);
        alert(`Access granted. A verification email has been sent to ${email}.`);
      } else {
        await authService.signIn(email, password);
      }

      setCurrentUserEmail(email);
      // Load their data
      const savedData = authService.loadUserData(email);
      setAppState(savedData);

      if (savedData.goals.length > 0) {
        setStep(AppStep.GOALS_LIST);
      } else {
        setStep(AppStep.ONBOARDING_DETAILS);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = () => {
    authService.signOut();
    setCurrentUserEmail(null);
    setAppState({ userImageBase64: null, goals: [] });
    setEmail('');
    setPassword('');
    setStep(AppStep.AUTH);
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputRoutine && inputGoal && inputDate) {
      // If user image is already set (from previous goals), skip image step
      if (appState.userImageBase64) {
        // Reuse existing image for generation
        setInputImage(appState.userImageBase64);
        setStep(AppStep.PROCESSING);
        handleProcess(appState.userImageBase64); // Call directly
      } else {
        setStep(AppStep.ONBOARDING_IMAGE);
      }
    }
  };

  const startNewGoal = () => {
    setInputGoal("");
    setInputRoutine("");
    setInputDate("");
    setStep(AppStep.ONBOARDING_DETAILS);
  };

  // Separated process function to handle both immediate call and button click
  const handleProcess = async (imgData: string) => {
    if (!inputRoutine || !inputGoal || !inputDate) return;

    setStep(AppStep.PROCESSING);
    setProcessingError(null);
    
    const targetTs = new Date(inputDate).getTime();
    const now = Date.now();
    const daysRemaining = Math.max(1, Math.ceil((targetTs - now) / (1000 * 60 * 60 * 24)));

    try {
      setLoadingMsg("Analysing trajectories...");
      
      // Parallel execution: Plan + Future Self + ONE Reality Check (5 Years)
      const planPromise = generatePlan(inputRoutine, inputGoal, 1, daysRemaining);
      
      setLoadingMsg("Generating time projections...");
      const futureImagePromise = generateFutureSelf(imgData, inputGoal);
      
      // Generating just one "Reality Check" image (5 years stagnation) to save resources and prevent blank screen
      const realityPromise = generateCurrentRoutineImage(imgData, inputRoutine, 5);

      const [plan, futureImage, realityImage] = await Promise.all([
        planPromise,
        futureImagePromise,
        realityPromise
      ]);

      const newGoal: Goal = {
        id: Date.now().toString(),
        title: inputGoal,
        routine: inputRoutine,
        futureSelfImageBase64: futureImage,
        currentRoutineImageBase64: realityImage, 
        tasks: plan.tasks.map(t => ({
          id: Math.random().toString(36).substr(2, 9),
          title: t.title,
          description: t.description,
          impactScore: t.impactScore,
          completed: false
        })),
        journal: [],
        motivationalQuote: plan.quote,
        progress: 0,
        streak: 0,
        drift: 0,
        targetDate: targetTs,
        lastGeneratedAt: Date.now(),
        createdAt: Date.now()
      };

      setAppState(prev => ({
        ...prev,
        userImageBase64: imgData, // Update/Set the global user image
        goals: [...prev.goals, newGoal]
      }));

      setActiveGoalId(newGoal.id);
      requestNotifications();
      setStep(AppStep.DASHBOARD);
    } catch (error: any) {
      console.error(error);
      setProcessingError(error.message || "Processing failed. Please try again or use a smaller image.");
    }
  };

  const handleImageStepSubmit = () => {
    if(inputImage) {
      handleProcess(inputImage);
    }
  };

  // TASK MANAGERS (Operate on Active Goal)
  const updateActiveGoal = (updatedGoal: Goal) => {
    setAppState(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id === updatedGoal.id ? updatedGoal : g)
    }));
  };

  const calculateProgress = (tasks: DailyTask[]) => {
    const totalImpact = tasks.reduce((acc, t) => acc + t.impactScore, 0);
    const completedImpact = tasks.filter(t => t.completed).reduce((acc, t) => acc + t.impactScore, 0);
    return totalImpact === 0 ? 0 : (completedImpact / totalImpact) * 100;
  };

  const toggleTask = (taskId: string) => {
    const activeGoal = appState.goals.find(g => g.id === activeGoalId);
    if (!activeGoal) return;

    const updatedTasks = activeGoal.tasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    
    updateActiveGoal({
      ...activeGoal,
      tasks: updatedTasks,
      progress: calculateProgress(updatedTasks)
    });
  };

  const addTask = (title: string, desc: string) => {
    const activeGoal = appState.goals.find(g => g.id === activeGoalId);
    if (!activeGoal) return;

    const newTask: DailyTask = {
      id: Date.now().toString(),
      title,
      description: desc,
      completed: false,
      impactScore: 5
    };

    const updatedTasks = [...activeGoal.tasks, newTask];
    updateActiveGoal({
      ...activeGoal,
      tasks: updatedTasks,
      progress: calculateProgress(updatedTasks)
    });
  };

  const editTask = (id: string, title: string, desc: string) => {
    const activeGoal = appState.goals.find(g => g.id === activeGoalId);
    if (!activeGoal) return;

    const updatedTasks = activeGoal.tasks.map(t => 
      t.id === id ? { ...t, title, description: desc } : t
    );
    updateActiveGoal({ ...activeGoal, tasks: updatedTasks });
  };

  const deleteTask = (id: string) => {
    const activeGoal = appState.goals.find(g => g.id === activeGoalId);
    if (!activeGoal) return;

    const updatedTasks = activeGoal.tasks.filter(t => t.id !== id);
    updateActiveGoal({
      ...activeGoal,
      tasks: updatedTasks,
      progress: calculateProgress(updatedTasks)
    });
  };

  const addJournalEntry = (content: string) => {
    const activeGoal = appState.goals.find(g => g.id === activeGoalId);
    if (!activeGoal) return;

    const newEntry = {
      id: Date.now().toString(),
      date: Date.now(),
      content
    };

    updateActiveGoal({
      ...activeGoal,
      journal: [...(activeGoal.journal || []), newEntry]
    });
  };

  /* -------------------------------------------------------------------------- */
  /*                                    VIEWS                                   */
  /* -------------------------------------------------------------------------- */

  if (step === AppStep.AUTH) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black opacity-50 pointer-events-none" />
        
        <div className="w-full max-w-md bg-zinc-900/30 backdrop-blur-md border border-zinc-800 p-8 rounded-2xl shadow-2xl z-10 animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">The Bridge</h1>
            <p className="text-zinc-500 text-sm tracking-wide">Connect with your future self.</p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
             {authError && (
               <div className="bg-red-900/20 border border-red-900 text-red-500 text-xs p-3 rounded text-center font-bold uppercase">
                 {authError}
               </div>
             )}
             
             <div className="space-y-2">
               <label className="text-xs uppercase font-bold text-zinc-500 ml-1">Email</label>
               <div className="relative">
                 <Mail className="absolute left-3 top-3 text-zinc-600" size={16} />
                 <input 
                    type="email" 
                    required 
                    className="w-full bg-black border border-zinc-800 text-white rounded-lg py-3 pl-10 pr-4 focus:border-white focus:outline-none transition-colors"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                 />
               </div>
             </div>
             
             <div className="space-y-2">
               <label className="text-xs uppercase font-bold text-zinc-500 ml-1">Password</label>
               <div className="relative">
                 <Lock className="absolute left-3 top-3 text-zinc-600" size={16} />
                 <input 
                    type="password" 
                    required 
                    className="w-full bg-black border border-zinc-800 text-white rounded-lg py-3 pl-10 pr-4 focus:border-white focus:outline-none transition-colors"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                 />
               </div>
             </div>

             <button 
               type="submit" 
               disabled={isAuthLoading}
               className="w-full bg-white text-black font-bold uppercase tracking-widest py-3 rounded-lg hover:bg-zinc-200 transition-colors mt-6 flex items-center justify-center gap-2 group disabled:opacity-50"
             >
               {isAuthLoading ? <Loader2 className="animate-spin" size={16}/> : (authMode === 'signin' ? 'Enter' : 'Initialize')}
               {!isAuthLoading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
             </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => {
                setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                setAuthError('');
              }}
              className="text-xs text-zinc-500 hover:text-white transition-colors uppercase tracking-widest"
            >
              {authMode === 'signin' ? "Create Account" : "Access Existing Account"}
            </button>
          </div>
        </div>

        {deferredPrompt && (
          <button 
            onClick={handleInstallClick}
            className="absolute bottom-6 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs uppercase tracking-widest"
          >
            <Download size={14} /> Install Mobile App
          </button>
        )}
      </div>
    );
  }

  if (step === AppStep.GOALS_LIST) {
    return (
      <GoalList 
        goals={appState.goals}
        onSelectGoal={(id) => {
          setActiveGoalId(id);
          setStep(AppStep.DASHBOARD);
        }}
        onAddGoal={startNewGoal}
        onSignOut={handleSignOut}
      />
    );
  }

  if (step === AppStep.ONBOARDING_DETAILS) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center max-w-2xl mx-auto animate-in slide-in-from-right duration-500">
        <div className="flex justify-between w-full mb-8">
           <h2 className="text-2xl font-black uppercase tracking-tighter">Step 01: Calibration</h2>
           <div className="flex gap-4">
             {appState.goals.length > 0 && (
               <button onClick={() => setStep(AppStep.GOALS_LIST)} className="text-xs uppercase text-zinc-500 hover:text-white">Cancel</button>
             )}
             {/* Sign Out Removed */}
           </div>
        </div>
        
        <form onSubmit={handleDetailsSubmit} className="w-full space-y-8">
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-widest text-zinc-500">Current Routine</label>
            <textarea
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:border-white focus:outline-none min-h-[120px]"
              placeholder="Describe your typical day. Be honest. e.g., Wake up at 8, scroll social media for 30 mins, work 9-5..."
              value={inputRoutine}
              onChange={(e) => setInputRoutine(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-widest text-zinc-500">The Goal</label>
            <textarea
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:border-white focus:outline-none min-h-[120px]"
              placeholder="What is your ultimate objective? e.g., Become a senior software engineer, run a marathon..."
              value={inputGoal}
              onChange={(e) => setInputGoal(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-widest text-zinc-500">Target Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 text-zinc-600" size={16} />
              <input 
                type="date"
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-white focus:outline-none [color-scheme:dark]"
                value={inputDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setInputDate(e.target.value)}
              />
            </div>
            <p className="text-xs text-zinc-600">The deadline creates urgency. Choose wisely.</p>
          </div>

          <div className="flex justify-end pt-4">
             <button 
               type="submit" 
               disabled={!inputRoutine || !inputGoal || !inputDate}
               className="bg-white text-black px-8 py-3 rounded-lg font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
             >
               Next <ChevronRight size={16} />
             </button>
          </div>
        </form>
      </div>
    );
  }

  if (step === AppStep.ONBOARDING_IMAGE) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center max-w-2xl mx-auto animate-in slide-in-from-right duration-500">
        <h2 className="text-2xl font-black uppercase tracking-tighter mb-2 self-start">Step 02: Identity</h2>
        <p className="text-zinc-500 text-sm mb-8 self-start">Upload a clear photo of yourself to generate your future self visualization.</p>

        <div className="w-full flex flex-col items-center gap-6">
           <label className="relative cursor-pointer group w-full aspect-square max-w-sm rounded-2xl border-2 border-dashed border-zinc-700 hover:border-white transition-all overflow-hidden bg-zinc-900 flex flex-col items-center justify-center">
             {inputImage ? (
                <img src={inputImage} alt="Preview" className="w-full h-full object-cover" />
             ) : (
                <div className="flex flex-col items-center text-zinc-500 group-hover:text-white transition-colors">
                   <Camera size={48} className="mb-4" />
                   <span className="text-xs font-bold uppercase tracking-widest">Upload Identity</span>
                </div>
             )}
             <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
           </label>
           
           <div className="flex gap-4 w-full max-w-sm">
             {appState.userImageBase64 && (
                 <button 
                    onClick={() => handleProcess(appState.userImageBase64!)}
                    className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-400 py-3 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-zinc-800 hover:text-white transition-colors"
                 >
                    Use Existing ID
                 </button>
             )}
             <button 
               onClick={handleImageStepSubmit}
               disabled={!inputImage}
               className="flex-1 bg-white text-black py-3 rounded-lg font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
             >
               Initialize <ArrowRight size={16} />
             </button>
           </div>
        </div>
      </div>
    );
  }

  if (step === AppStep.PROCESSING) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        {processingError ? (
          <div className="max-w-md animate-in fade-in zoom-in">
            <h2 className="text-xl font-bold text-red-500 uppercase tracking-widest mb-4">Connection Failed</h2>
            <p className="text-zinc-400 mb-6 text-sm">{processingError}</p>
            <button 
              onClick={() => {
                setProcessingError(null);
                setStep(AppStep.ONBOARDING_DETAILS);
              }}
              className="bg-white text-black px-6 py-3 rounded font-bold uppercase tracking-widest hover:bg-zinc-200 flex items-center gap-2 mx-auto"
            >
              <RefreshCcw size={16}/> Retry
            </button>
          </div>
        ) : (
          <>
            <Loader2 size={64} className="animate-spin text-white mb-8" />
            <h2 className="text-2xl font-black uppercase tracking-tighter animate-pulse">{loadingMsg}</h2>
            <p className="text-zinc-500 text-sm mt-2 uppercase tracking-widest">Do not close the bridge.</p>
          </>
        )}
      </div>
    );
  }

  if (step === AppStep.DASHBOARD && activeGoalId) {
    const goal = appState.goals.find(g => g.id === activeGoalId);
    if (goal) {
        return (
            <>
                {/* Refresh Overlay */}
                {isRefreshing && (
                     <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center">
                         <Loader2 size={48} className="animate-spin text-white mb-4" />
                         <h2 className="text-xl font-bold uppercase tracking-widest">Refreshing Daily Protocol...</h2>
                     </div>
                )}
                <Dashboard 
                    goal={goal} 
                    onBack={() => setStep(AppStep.GOALS_LIST)}
                    onToggleTask={toggleTask}
                    onAddTask={addTask}
                    onEditTask={editTask}
                    onDeleteTask={deleteTask}
                    onAddJournalEntry={addJournalEntry}
                />
            </>
        );
    }
    // Fallback while state is updating
    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
             <Loader2 size={48} className="animate-spin text-white mb-4" />
        </div>
    );
  }

  return null;
};

export default App;
