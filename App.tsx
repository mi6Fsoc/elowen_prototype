
import React, { useState, useEffect } from 'react';
import { AppView, UserProfile, SkinAssessment, DailyRoutine, SkinAnalysis, RoutineStep } from './types';
import { Layout } from './components/Layout';
import { Button } from './components/Button';
import { generateRoutine, analyzeSkinPhoto } from './geminiService';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { SparklesIcon, CameraIcon, PlusIcon, InformationCircleIcon, MoonIcon, SunIcon, CalendarDaysIcon, ShoppingBagIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('onboarding');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isTipsOpen, setIsTipsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [user, setUser] = useState<UserProfile>({
    name: 'Melissa',
    analyses: [],
    isSubscribed: false,
  });
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: "Hello Melissa! I'm your Elowen Skin Coach. How are you feeling about your routine today?" }
  ]);
  const [newMsg, setNewMsg] = useState('');

  // Assessment state
  const [assessmentStep, setAssessmentStep] = useState(0);
  const [tempAssessment, setTempAssessment] = useState<SkinAssessment>({
    skinType: 'Normal',
    concerns: [],
    sensitivity: 3,
    lifestyle: [],
    currentRoutine: ''
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleAssessmentComplete = async () => {
    setLoading(true);
    try {
      const routine = await generateRoutine(tempAssessment);
      setUser(prev => ({ ...prev, assessment: tempAssessment, routine }));
      setLoading(false);
      setView('capture');
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const processImageFile = async (file: File) => {
    setLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const analysis = await analyzeSkinPhoto(base64);
        const newAnalysis: SkinAnalysis = {
          id: Math.random().toString(36).substr(2, 9),
          date: new Date().toLocaleDateString(),
          photoUrl: reader.result as string,
          metrics: analysis.metrics || { hydration: 60, clarity: 70, texture: 65, redness: 40 },
          summary: analysis.summary || "Healthy baseline captured.",
          coachNote: analysis.coachNote || "Great first photo! Consistency is key."
        };
        setUser(prev => ({ ...prev, analyses: [newAnalysis, ...prev.analyses] }));
        setLoading(false);
        setView('home');
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImageFile(file);
    }
  };

  const toggleStep = (period: 'am' | 'pm', id: string) => {
    if (!user.routine) return;
    const newRoutine = { ...user.routine };
    const steps = period === 'am' ? newRoutine.am : newRoutine.pm;
    const idx = steps.findIndex(s => s.id === id);
    if (idx !== -1) steps[idx].isCompleted = !steps[idx].isCompleted;
    setUser(prev => ({ ...prev, routine: newRoutine }));
  };

  const downloadCalendarFile = () => {
    if (!user.routine) return;

    const createEvent = (title: string, steps: RoutineStep[], time: string) => {
      const description = steps.map(s => `- ${s.name}: ${s.description}`).join('\\n');
      const now = new Date();
      const stamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      return `BEGIN:VEVENT
UID:${title.toLowerCase().replace(/\s/g, '')}-${Date.now()}@elowen.ai
DTSTAMP:${stamp}
DTSTART;VALUE=DATE-TIME:${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}T${time}00
RRULE:FREQ=DAILY
SUMMARY:Elowen ${title}
DESCRIPTION:${description}
END:VEVENT`;
    };

    const amEvent = createEvent('Morning Routine', user.routine.am, '0800');
    const pmEvent = createEvent('Evening Routine', user.routine.pm, '2100');

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Elowen Skincare//NONSGML v1.0//EN
${amEvent}
${pmEvent}
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'elowen-skincare-routine.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderOnboarding = () => {
    const steps = [
      {
        title: "Your Skin Type",
        desc: "Everyone's base is different. Let's find yours.",
        content: (
          <div className="grid grid-cols-2 gap-4 mt-8">
            {['Dry', 'Oily', 'Combination', 'Normal', 'Sensitive'].map(t => (
              <button
                key={t}
                onClick={() => setTempAssessment({ ...tempAssessment, skinType: t as any })}
                className={`p-6 rounded-3xl border-2 transition-all flex items-center justify-center min-h-[80px] text-base font-bold uppercase tracking-wider ${
                  tempAssessment.skinType === t ? 'border-sage bg-sage text-white shadow-md' : 'border-sage/20 text-gray-500 dark:border-white/10 dark:text-gray-400 hover:border-sage/40'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )
      },
      {
        title: "Primary Concerns",
        desc: "What would you like to focus on?",
        content: (
          <div className="grid grid-cols-2 gap-4 mt-8">
            {['Acne', 'Aging', 'Redness', 'Dark Spots', 'Dryness', 'Texture'].map(c => (
              <button
                key={c}
                onClick={() => {
                  const newConcerns = tempAssessment.concerns.includes(c)
                    ? tempAssessment.concerns.filter(i => i !== c)
                    : [...tempAssessment.concerns, c];
                  setTempAssessment({ ...tempAssessment, concerns: newConcerns });
                }}
                className={`p-6 rounded-3xl border-2 transition-all min-h-[80px] text-base font-bold uppercase tracking-wider ${
                  tempAssessment.concerns.includes(c) ? 'border-sage bg-sage text-white shadow-md' : 'border-sage/20 text-gray-500 dark:border-white/10 dark:text-gray-400 hover:border-sage/40'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )
      },
      {
        title: "Lifestyle Factors",
        desc: "Your environment affects your glow.",
        content: (
          <div className="space-y-8 mt-10">
            <div>
              <p className="text-xs uppercase text-gray-400 dark:text-gray-500 font-black tracking-[0.2em] mb-4">Sensitivity Scale</p>
              <input 
                type="range" min="1" max="5" value={tempAssessment.sensitivity}
                onChange={(e) => setTempAssessment({ ...tempAssessment, sensitivity: parseInt(e.target.value) })}
                className="w-full h-3 bg-sage/20 rounded-full appearance-none cursor-pointer accent-sage"
              />
              <div className="flex justify-between text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-3">
                <span>Resilient</span>
                <span>Sensitive</span>
              </div>
            </div>
          </div>
        )
      }
    ];

    const current = steps[assessmentStep];

    return (
      <div className="min-h-screen p-8 flex flex-col justify-center animate-in slide-in-from-bottom duration-700 max-w-lg mx-auto">
        <div className="w-full">
          <div className="mb-16">
            <div className="flex gap-2 mb-8">
              {[0, 1, 2].map(i => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= assessmentStep ? 'bg-sage' : 'bg-sage/10 dark:bg-white/5'}`} />
              ))}
            </div>
            <h2 className="text-5xl text-charcoal dark:text-white mb-4 serif italic">{current.title}</h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 font-light leading-relaxed">{current.desc}</p>
          </div>

          <section aria-live="polite">
            {current.content}
          </section>

          <div className="mt-16 flex flex-col gap-4">
            <Button 
              fullWidth 
              onClick={() => {
                if (assessmentStep < steps.length - 1) setAssessmentStep(assessmentStep + 1);
                else handleAssessmentComplete();
              }}
              disabled={loading}
            >
              {loading ? 'Designing...' : assessmentStep === steps.length - 1 ? 'Reveal My Routine' : 'Next Step'}
            </Button>
            {assessmentStep > 0 && (
              <button 
                className="text-gray-400 uppercase text-xs font-black tracking-widest py-3"
                onClick={() => setAssessmentStep(assessmentStep - 1)}
              >
                Back
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCapture = () => (
    <div className="min-h-screen p-10 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full aspect-[3/4] border-4 border-dashed rounded-[3.5rem] relative flex flex-col items-center justify-center bg-white/40 dark:bg-white/5 mb-12 overflow-hidden shadow-sm transition-all duration-300 ${
          isDragging ? 'border-sage bg-sage/10 scale-[1.02]' : 'border-sage/30'
        }`}
      >
        <div className={`absolute inset-0 bg-sage/5 transition-opacity ${isDragging ? 'opacity-20' : 'opacity-100'}`} />
        <CameraIcon className={`w-20 h-20 mb-6 transition-colors ${isDragging ? 'text-sage' : 'text-sage/40'}`} />
        <p className={`px-12 text-base font-light leading-relaxed transition-colors ${isDragging ? 'text-sage font-bold' : 'text-gray-400 dark:text-gray-500'}`}>
          {isDragging ? 'Release to analysis' : 'Position your face within the frame or drag & drop an image here.'}
        </p>
        <div className="absolute top-6 left-6 w-12 h-12 border-t-4 border-l-4 border-sage/50 rounded-tl-3xl" />
        <div className="absolute top-6 right-6 w-12 h-12 border-t-4 border-r-4 border-sage/50 rounded-tr-3xl" />
        <div className="absolute bottom-6 left-6 w-12 h-12 border-b-4 border-l-4 border-sage/50 rounded-bl-3xl" />
        <div className="absolute bottom-6 right-6 w-12 h-12 border-b-4 border-r-4 border-sage/50 rounded-br-3xl" />
      </div>
      
      <h2 className="text-4xl text-charcoal dark:text-white mb-4 serif italic">Baseline Analysis</h2>
      <p className="text-lg text-gray-500 dark:text-gray-400 mb-12 font-light leading-relaxed">Capture a visual starting point to track improvements and validate product efficacy.</p>
      
      <label className="w-full">
        <input type="file" accept="image/*" capture="user" className="hidden" onChange={handlePhotoUpload} />
        <Button fullWidth as="div" className="cursor-pointer">
          {loading ? 'Analyzing Skin Markers...' : 'Capture Photo'}
        </Button>
      </label>
      <button onClick={() => setView('home')} className="mt-6 text-xs text-gray-400 uppercase tracking-widest font-black">Skip Baseline</button>
    </div>
  );

  const renderHome = () => {
    const amProgress = user.routine?.am.filter(s => s.isCompleted).length || 0;
    const pmProgress = user.routine?.pm.filter(s => s.isCompleted).length || 0;
    const totalSteps = (user.routine?.am.length || 0) + (user.routine?.pm.length || 0);
    const completed = amProgress + pmProgress;

    return (
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <header className="flex justify-between items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-sage font-black mb-1">Morning Ritual</p>
            <h2 className="text-5xl text-charcoal dark:text-white serif italic">{user.name}</h2>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase font-black text-gray-400 dark:text-gray-500 tracking-widest mb-1">Ritual Streak</p>
            <div className="flex items-center text-sage justify-end">
              <SparklesIcon className="w-5 h-5 mr-1.5" />
              <span className="text-2xl serif italic">12 Days</span>
            </div>
          </div>
        </header>

        <section className="bg-white dark:bg-[#252525] p-8 rounded-[3rem] shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-sage/10 dark:border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blush/10 rounded-full -mr-20 -mt-20 blur-3xl transition-all group-hover:bg-blush/20" />
          <div className="relative">
            <div className="flex justify-between items-baseline mb-6">
              <h3 className="text-xl text-charcoal dark:text-white font-bold tracking-tight">Daily Ritual Progress</h3>
              <span className="text-3xl serif italic text-sage">{Math.round((completed / (totalSteps || 1)) * 100)}%</span>
            </div>
            <div className="space-y-4">
              <div className="h-2.5 bg-cream dark:bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-sage transition-all duration-1000 ease-out" style={{ width: `${(completed / (totalSteps || 1)) * 100}%` }} />
              </div>
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                <span>Beginning</span>
                <span>{completed} of {totalSteps} steps</span>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-6">
          <button 
            onClick={() => setView('routine')}
            className={`p-8 rounded-[3rem] text-left transition-all duration-500 hover:scale-[1.02] shadow-sm ${amProgress === user.routine?.am.length ? 'bg-sage text-white shadow-lg' : 'bg-white dark:bg-[#252525] border border-sage/10 dark:border-white/5 dark:text-white'}`}
          >
            <p className="text-[11px] uppercase font-black opacity-60 mb-2 tracking-[0.2em]">AM Ritual</p>
            <h4 className="text-2xl serif italic mb-6">Radiance</h4>
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${amProgress === user.routine?.am.length ? 'bg-white' : 'bg-sage'}`} />
                <p className="text-sm font-bold">{amProgress}/{user.routine?.am.length}</p>
            </div>
          </button>
          <button 
            onClick={() => setView('routine')}
            className={`p-8 rounded-[3rem] text-left transition-all duration-500 hover:scale-[1.02] shadow-sm ${pmProgress === user.routine?.pm.length ? 'bg-sage text-white shadow-lg' : 'bg-white dark:bg-[#252525] border border-sage/10 dark:border-white/5 dark:text-white'}`}
          >
            <p className="text-[11px] uppercase font-black opacity-60 mb-2 tracking-[0.2em]">PM Ritual</p>
            <h4 className="text-2xl serif italic mb-6">Recovery</h4>
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${pmProgress === user.routine?.pm.length ? 'bg-white' : 'bg-sage'}`} />
                <p className="text-sm font-bold">{pmProgress}/{user.routine?.pm.length}</p>
            </div>
          </button>
        </div>

        <section>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-serif italic text-charcoal dark:text-white">Recent Analysis</h3>
            <button className="text-xs font-black uppercase tracking-widest text-sage" onClick={() => setView('progress')}>View All</button>
          </div>
          {user.analyses.length > 0 ? (
            <div className="bg-white dark:bg-[#252525] border border-sage/10 dark:border-white/5 p-5 rounded-[2.5rem] flex gap-5 items-center shadow-sm">
              <div className="relative shrink-0">
                <img src={user.analyses[0].photoUrl} className="w-20 h-20 rounded-3xl object-cover shadow-sm" />
                <div className="absolute -bottom-1 -right-1 bg-sage text-white p-1 rounded-full border-2 border-white dark:border-[#252525]">
                  <SparklesIcon className="w-3 h-3" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-sage uppercase tracking-widest mb-1">{user.analyses[0].date}</p>
                <p className="text-base italic font-serif text-charcoal dark:text-gray-300 truncate pr-2">"{user.analyses[0].summary}"</p>
              </div>
              <Button variant="outline" className="px-4 py-2 min-h-0 text-[11px]" onClick={() => setView('progress')}>Detail</Button>
            </div>
          ) : (
            <div className="bg-white/40 dark:bg-white/5 border-2 border-dashed border-sage/20 dark:border-white/10 p-10 rounded-[3rem] text-center">
              <p className="text-base text-gray-500 dark:text-gray-400 mb-6 font-light">Validate your routine with a weekly analysis.</p>
              <Button variant="outline" onClick={() => setView('capture')}>Initialize Track</Button>
            </div>
          )}
        </section>
      </div>
    );
  };

  const renderRoutineStep = (step: RoutineStep, period: 'am' | 'pm') => (
    <div 
      key={step.id} 
      className={`bg-white dark:bg-[#252525] p-7 rounded-[2.5rem] border border-sage/10 dark:border-white/5 flex items-start gap-5 transition-all duration-500 shadow-sm group hover:shadow-md ${
        step.isCompleted ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'
      }`}
    >
      <button 
        onClick={() => toggleStep(period, step.id)}
        aria-label={`Mark ${step.name} as complete`}
        className={`mt-1.5 w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all shrink-0 ${
          step.isCompleted ? 'bg-sage border-sage text-white' : 'border-sage/30 dark:border-white/20 text-transparent hover:border-sage'
        }`}
      >
        <span className="text-xs">✓</span>
      </button>
      <div className="flex-1">
        <h4 className={`font-serif italic text-2xl dark:text-white transition-all mb-1 ${
          step.isCompleted ? 'line-through text-gray-400 dark:text-gray-600' : ''
        }`}>{step.name}</h4>
        <p className="text-[15px] text-gray-500 dark:text-gray-400 mb-4 leading-relaxed font-light">{step.description}</p>
        
        <div className="flex items-start gap-2 bg-cream dark:bg-[#2a2a2a] p-4 rounded-2xl mb-6">
          <InformationCircleIcon className="w-4 h-4 text-sage shrink-0 mt-0.5" />
          <p className="text-[12px] text-gray-600 dark:text-gray-400 italic leading-snug">
            <span className="font-black text-sage not-italic uppercase tracking-tighter mr-1">Rationale</span>{step.whyNeeded}
          </p>
        </div>

        {step.recommendations && step.recommendations.length > 0 && (
          <div className="mt-6 pt-6 border-t border-sage/10 dark:border-white/5">
            <div className="flex items-center gap-2 mb-5">
              <ShoppingBagIcon className="w-4 h-4 text-sage" />
              <h5 className="text-[11px] uppercase font-black tracking-[0.25em] text-gray-400 dark:text-gray-500">Curated Choice</h5>
            </div>
            <div className="space-y-6">
              {step.recommendations.map((rec, i) => (
                <div key={i} className="group">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-bold text-charcoal dark:text-white">{rec.productName}</p>
                    <span className="text-[9px] bg-sage/10 text-sage dark:bg-sage/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ml-2">
                      Hydrates: {rec.hydrationImpact}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{rec.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderRoutine = () => (
    <div className="space-y-16 pb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <header>
        <h2 className="text-5xl text-charcoal dark:text-white mb-4 serif italic">Your Ritual</h2>
        <p className="text-lg text-gray-400 font-light max-w-sm">A scientifically structured flow optimized for cellular health.</p>
      </header>
      
      <div className="space-y-16">
        <section aria-labelledby="am-heading">
          <div className="flex items-center gap-3 mb-8">
            <SunIcon className="w-5 h-5 text-sage" />
            <h3 id="am-heading" className="text-xs uppercase font-black tracking-[0.4em] text-gray-400 dark:text-gray-500">Morning Sequence</h3>
          </div>
          <div className="space-y-6">
            {user.routine?.am.map(step => renderRoutineStep(step, 'am'))}
          </div>
        </section>

        <section aria-labelledby="pm-heading">
          <div className="flex items-center gap-3 mb-8">
            <MoonIcon className="w-5 h-5 text-sage" />
            <h3 id="pm-heading" className="text-xs uppercase font-black tracking-[0.4em] text-gray-400 dark:text-gray-500">Evening Sequence</h3>
          </div>
          <div className="space-y-6">
            {user.routine?.pm.map(step => renderRoutineStep(step, 'pm'))}
          </div>
        </section>

        <section className="bg-white dark:bg-[#252525] rounded-[3rem] border border-sage/10 dark:border-white/5 overflow-hidden transition-all duration-300 shadow-sm">
          <button 
            onClick={() => setIsTipsOpen(!isTipsOpen)}
            className="w-full p-8 flex justify-between items-center text-charcoal dark:text-white hover:bg-sage/5 transition-colors"
            aria-expanded={isTipsOpen}
          >
            <div className="flex items-center gap-3">
              <SparklesIcon className="w-6 h-6 text-sage" />
              <h3 className="text-2xl font-serif italic">Expert Insights</h3>
            </div>
            {isTipsOpen ? <ChevronUpIcon className="w-6 h-6 text-sage/60" /> : <ChevronDownIcon className="w-6 h-6 text-sage/60" />}
          </button>
          
          {isTipsOpen && (
            <div className="px-8 pb-10 space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="space-y-3">
                <h4 className="text-[11px] uppercase font-black text-sage tracking-[0.25em]">Precision Patch Testing</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-light">
                  Prior to full integration, apply actives to a controlled zone for 48 hours to mitigate widespread inflammatory responses.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-[11px] uppercase font-black text-sage tracking-[0.25em]">Molecular Layering Order</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-light">
                  Follow a low-to-high viscosity path: start with aqueous solutions and end with occlusive barriers to maximize transdermal absorption.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-[11px] uppercase font-black text-sage tracking-[0.25em]">Photoprotection Compliance</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-light">
                  Broad-spectrum UV filters are critical even in indirect light settings to prevent oxidative stress and hyperpigmentation progression.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );

  const renderProgress = () => {
    const data = [...user.analyses].reverse().map(a => ({
      date: a.date,
      hydration: a.metrics.hydration,
      clarity: a.metrics.clarity,
      texture: a.metrics.texture,
      redness: a.metrics.redness,
    }));

    return (
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
        <header className="flex justify-between items-center">
          <h2 className="text-5xl text-charcoal dark:text-white serif italic">Progress</h2>
          <button 
            aria-label="New Analysis"
            className="p-3.5 rounded-full bg-sage text-white shadow-md hover:scale-110 transition-transform" 
            onClick={() => setView('capture')}
          >
            <PlusIcon className="w-6 h-6" />
          </button>
        </header>

        {user.analyses.length > 1 ? (
          <section className="bg-white dark:bg-[#252525] p-8 rounded-[3rem] border border-sage/10 dark:border-white/5 shadow-sm overflow-hidden h-72">
             <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorSage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B7C4B1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#B7C4B1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '1.5rem', 
                    border: 'none', 
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="clarity" stroke="#B7C4B1" strokeWidth={3} fillOpacity={1} fill="url(#colorSage)" />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-center text-gray-400 dark:text-gray-500 mt-6 uppercase font-black tracking-[0.3em]">Aggregate Clarity Trend</p>
          </section>
        ) : null}

        <div className="grid grid-cols-2 gap-6">
          {user.analyses.map((analysis, i) => (
            <div key={analysis.id} className="relative group transition-transform duration-500 hover:scale-[1.03]">
              <img src={analysis.photoUrl} className="w-full aspect-[4/5] rounded-[2.5rem] object-cover border-4 border-white dark:border-[#252525] shadow-md" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-[2.5rem]">
                <p className="text-white text-[11px] font-black tracking-widest uppercase mb-1">{analysis.date}</p>
                <p className="text-white text-base serif italic opacity-90">Analysis Record {user.analyses.length - i}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderChat = () => (
    <div className="flex flex-col h-[78vh] animate-in fade-in slide-in-from-bottom-6 duration-700">
      <header className="mb-8">
          <h2 className="text-5xl text-charcoal dark:text-white serif italic mb-2">Skin Coach</h2>
          <p className="text-base text-gray-400 font-light">Real-time guidance for your evolving needs.</p>
      </header>

      <div className="flex-1 overflow-y-auto space-y-6 pr-2 pb-6 scrollbar-hide">
        {chatMessages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-6 py-4 rounded-[2rem] text-base leading-relaxed ${
              msg.role === 'user' ? 'bg-sage text-white shadow-md rounded-br-none' : 'bg-white dark:bg-[#252525] border border-sage/10 dark:border-white/5 text-charcoal dark:text-gray-300 rounded-bl-none shadow-sm'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>
      
      <div className="pt-6 flex gap-3">
        <input 
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder="Breakout advice or ingredient queries..."
          className="flex-1 bg-white dark:bg-[#252525] border border-sage/10 dark:border-white/10 rounded-2xl px-6 text-base focus:outline-none focus:ring-2 focus:ring-sage dark:text-white shadow-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newMsg) {
              setChatMessages([...chatMessages, { role: 'user', text: newMsg }]);
              setNewMsg('');
              setTimeout(() => {
                setChatMessages(prev => [...prev, { role: 'ai', text: "Analyzing your concern. Based on your profile, it's likely a localized barrier disruption. Try stripping back to just your gentle cleanser and moisturizer for 48 hours." }]);
              }, 1200);
            }
          }}
        />
        <Button 
          className="aspect-square p-0 w-14 h-14"
          onClick={() => {
           if (newMsg) {
            setChatMessages([...chatMessages, { role: 'user', text: newMsg }]);
            setNewMsg('');
            setTimeout(() => {
              setChatMessages(prev => [...prev, { role: 'ai', text: "Noted. Your current hydration levels are trending lower—consider swapping the AM serum for a humectant-rich essence." }]);
            }, 1200);
          }
        }}>
          <SparklesIcon className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );

  const renderLibrary = () => (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <header>
        <h2 className="text-5xl text-charcoal dark:text-white serif italic mb-3">Knowledge Base</h2>
        <p className="text-lg text-gray-400 font-light">Evidence-based skincare education.</p>
      </header>
      <div className="space-y-8">
        {[
          { title: "Dermal Barrier Integrity", img: "https://picsum.photos/seed/skin1/400/200", tag: "Physiology" },
          { title: "Retinoid Synergies", img: "https://picsum.photos/seed/skin2/400/200", tag: "Active Compounds" },
          { title: "Photo-aging Pathways", img: "https://picsum.photos/seed/skin3/400/200", tag: "UV Protection" },
          { title: "Psychodermatology: Stress & Glow", img: "https://picsum.photos/seed/skin4/400/200", tag: "Neurological" },
        ].map((item, i) => (
          <div key={i} className="bg-white dark:bg-[#252525] rounded-[2.5rem] overflow-hidden border border-sage/10 dark:border-white/5 group cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500">
            <div className="overflow-hidden">
                <img src={item.img} className="w-full h-44 object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
            <div className="p-7">
              <p className="text-[10px] uppercase font-black text-sage mb-2 tracking-[0.3em]">{item.tag}</p>
              <h4 className="text-2xl serif italic text-charcoal dark:text-white group-hover:text-sage transition-colors">{item.title}</h4>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-12 animate-in fade-in duration-700 pb-24">
       <div className="text-center">
        <div className="w-32 h-32 rounded-full bg-blush mx-auto mb-6 flex items-center justify-center text-5xl serif italic text-charcoal shadow-[0_10px_30px_rgba(0,0,0,0.05)] border-4 border-white dark:border-[#1E1E1E]">
          M
        </div>
        <h2 className="text-4xl text-charcoal dark:text-white serif italic">Melissa Chen</h2>
        <p className="text-sm text-gray-400 font-bold uppercase tracking-[0.2em] mt-2">Member • Jan 2024</p>
      </div>

      <div className="space-y-6">
        <section className="bg-white dark:bg-[#252525] p-8 rounded-[2.5rem] border border-sage/10 dark:border-white/5 shadow-sm">
          <h3 className="text-xs uppercase font-black text-gray-400 dark:text-gray-500 mb-6 tracking-[0.3em]">Preferences</h3>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {isDarkMode ? <MoonIcon className="w-6 h-6 text-sage" /> : <SunIcon className="w-6 h-6 text-sage" />}
              <span className="text-base font-bold dark:text-white">Immersive Dark Mode</span>
            </div>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              aria-label="Toggle Dark Mode"
              className={`w-14 h-7 rounded-full relative transition-colors duration-500 flex items-center px-1 ${isDarkMode ? 'bg-sage' : 'bg-gray-200'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-500 ${isDarkMode ? 'translate-x-7' : 'translate-x-0'}`} />
            </button>
          </div>
        </section>

        <section className="bg-white dark:bg-[#252525] p-8 rounded-[2.5rem] border border-sage/10 dark:border-white/5 shadow-sm">
          <h3 className="text-xs uppercase font-black text-gray-400 dark:text-gray-500 mb-6 tracking-[0.3em]">Integrations</h3>
          <div className="flex items-start gap-5">
            <div className="bg-sage/10 p-4 rounded-2xl">
                <CalendarDaysIcon className="w-7 h-7 text-sage" />
            </div>
            <div className="flex-1">
              <p className="text-base font-bold dark:text-white mb-1">Calendar Sync</p>
              <p className="text-sm text-gray-400 font-light mb-6 leading-relaxed">Automate ritual reminders across your connected devices.</p>
              <Button variant="outline" fullWidth onClick={downloadCalendarFile} disabled={!user.routine}>
                Sync Schedule (.ics)
              </Button>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-[#252525] p-8 rounded-[2.5rem] border border-sage/10 dark:border-white/5 shadow-sm">
          <h3 className="text-xs uppercase font-black text-gray-400 dark:text-gray-500 mb-6 tracking-[0.3em]">Account</h3>
          <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-serif italic text-2xl dark:text-white">Premium Tier</p>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Next Billing: Feb 12</p>
                </div>
                <Button variant="outline" className="px-5 py-2.5 min-h-0 text-xs">Manage</Button>
              </div>
              
              <div className="flex justify-between items-center pt-8 border-t border-sage/10 dark:border-white/5">
                <span className="text-base font-bold dark:text-white">Push Notifications</span>
                <div className="w-12 h-6 bg-sage rounded-full relative px-1 flex items-center shadow-sm">
                  <div className="w-4 h-4 bg-white rounded-full absolute right-1" />
                </div>
              </div>
          </div>
        </section>
        
        <button 
            className="w-full py-6 text-red-400 font-black uppercase text-xs tracking-[0.3em] hover:opacity-70 transition-opacity mt-8" 
            onClick={() => window.location.reload()}
        >
            Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <Layout activeView={view} onViewChange={setView}>
      <div className="max-w-lg mx-auto">
          {view === 'onboarding' && renderOnboarding()}
          {view === 'capture' && renderCapture()}
          {view === 'home' && renderHome()}
          {view === 'routine' && renderRoutine()}
          {view === 'progress' && renderProgress()}
          {view === 'chat' && renderChat()}
          {view === 'library' && renderLibrary()}
          {view === 'profile' && renderProfile()}
      </div>
      
      {loading && (
        <div 
            className="fixed inset-0 bg-cream/90 dark:bg-[#1E1E1E]/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center animate-in fade-in duration-300"
            role="alert" 
            aria-busy="true"
        >
          <div className="relative mb-8">
            <div className="w-16 h-16 border-4 border-sage/20 border-t-sage rounded-full animate-spin" />
            <SparklesIcon className="w-6 h-6 text-sage absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-charcoal dark:text-white font-serif italic text-3xl animate-pulse">Designing your glow...</p>
        </div>
      )}
    </Layout>
  );
};

export default App;
