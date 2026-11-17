import { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowDownToLine, CalendarDays, Check, ChevronDown, ChevronLeft,
  ChevronRight, Flame, Plus, Sparkles, Trash2, X
} from "lucide-react";
import { getHabits, saveHabits, type Habit } from "./db";

const COLORS = ["#a3e635", "#67e8f9", "#c4b5fd", "#f9a8d4", "#fdba74"];
const EMOJIS = ["📚", "🏃", "🧘", "💧", "💻", "✍️", "🌙", "🎯"];
const today = () => keyOf(new Date());
const keyOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const fromKey = (key: string) => { const [y,m,d] = key.split("-").map(Number); return new Date(y,m-1,d); };
const shift = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };
const startOfWeek = (d: Date) => shift(d, -((d.getDay()+6)%7));
const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString("en", opts);

function streak(h: Habit) {
  let d = new Date();
  if (!h.completions.includes(keyOf(d))) d = shift(d, -1);
  let n = 0;
  while (h.completions.includes(keyOf(d))) { n++; d = shift(d, -1); }
  return n;
}

function Heatmap({ habits, selected, onSelect }: {
  habits: Habit[]; selected: string; onSelect: (id: string) => void;
}) {
  const [year, setYear] = useState(new Date().getFullYear());
  const dates = useMemo(() => {
    const first = new Date(year,0,1);
    const last = new Date(year,11,31);
    const start = startOfWeek(first);
    const end = shift(startOfWeek(last), 6);
    const result: Date[] = [];
    for (let d = start; d <= end; d = shift(d,1)) result.push(d);
    return result;
  }, [year]);
  const activeHabits = selected === "all" ? habits : habits.filter(h => h.id === selected);
  const count = (key: string) => activeHabits.filter(h => h.completions.includes(key)).length;
  const max = Math.max(1, activeHabits.length);
  const monthLabels = Array.from({length:12}, (_,m) => {
    const d = new Date(year,m,1);
    const index = dates.findIndex(x => keyOf(x) === keyOf(d));
    return {name:fmt(d,{month:"short"}), index:Math.floor(index/7)};
  });
  return <section className="panel heat-panel">
    <div className="panel-heading">
      <div><p className="eyebrow">THE LONG VIEW</p><h2>Consistency map</h2></div>
      <div className="year-control">
        <button className="icon-button" aria-label="Previous year" onClick={()=>setYear(y=>y-1)}><ChevronLeft size={16}/></button>
        <span>{year}</span>
        <button className="icon-button" aria-label="Next year" disabled={year>=new Date().getFullYear()} onClick={()=>setYear(y=>y+1)}><ChevronRight size={16}/></button>
      </div>
    </div>
    <div className="filter-row">
      <label htmlFor="heat-filter">Showing</label>
      <div className="select-wrap"><select id="heat-filter" value={selected} onChange={e=>onSelect(e.target.value)}>
        <option value="all">All habits</option>
        {habits.map(h=><option value={h.id} key={h.id}>{h.emoji} {h.name}</option>)}
      </select><ChevronDown size={14}/></div>
    </div>
    <div className="heat-scroll">
      <div className="heat-chart">
        <div className="month-labels">{monthLabels.map((m,i)=><span key={i} style={{gridColumn:m.index+1}}>{m.name}</span>)}</div>
        <div className="heat-body">
          <div className="weekday-labels"><span>Mon</span><span></span><span>Wed</span><span></span><span>Fri</span><span></span><span>Sun</span></div>
          <div className="heat-grid">
            {dates.map((d,i)=>{
              const key=keyOf(d); const n=count(key);
              const level=n===0?0:Math.min(4,Math.ceil(n/max*4));
              const inYear=d.getFullYear()===year;
              return <button key={key} title={`${fmt(d,{month:"short",day:"numeric",year:"numeric"})}: ${n} completed`}
                aria-label={`${key}: ${n} completed`}
                className={`heat-cell level-${level} ${inYear?"":"outside"}`}
                onClick={()=>inYear && onSelect(selected)}
              />;
            })}
          </div>
        </div>
      </div>
    </div>
    <div className="heat-legend"><span>Less</span>{[0,1,2,3,4].map(n=><i key={n} className={`heat-cell level-${n}`}/>)}<span>More</span></div>
    <p className="heat-caption">{activeHabits.reduce((sum,h)=>sum+h.completions.filter(k=>fromKey(k).getFullYear()===year).length,0)} check-ins in {year}. Each square represents one day.</p>
  </section>;
}

function App() {
  const [habits,setHabits]=useState<Habit[]>([]);
  const [ready,setReady]=useState(false);
  const [showForm,setShowForm]=useState(false);
  const [name,setName]=useState("");
  const [emoji,setEmoji]=useState(EMOJIS[0]);
  const [color,setColor]=useState(COLORS[0]);
  const [filter,setFilter]=useState("all");
  const [installPrompt,setInstallPrompt]=useState<BeforeInstallPromptEvent|null>(null);
  const [toast,setToast]=useState("");

  useEffect(()=>{ getHabits().then(setHabits).catch(()=>setToast("Could not load local habit data.")).finally(()=>setReady(true)); },[]);
  useEffect(()=>{ if(ready) saveHabits(habits).catch(()=>setToast("Could not save your changes.")); },[habits,ready]);
  useEffect(()=>{
    const handler=(e:Event)=>{
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt",handler);
    return ()=>window.removeEventListener("beforeinstallprompt",handler);
  },[]);
  useEffect(()=>{ if(!toast)return; const t=window.setTimeout(()=>setToast(""),2600); return ()=>window.clearTimeout(t); },[toast]);

  const done=habits.filter(h=>h.completions.includes(today())).length;
  const pct=habits.length?Math.round(done/habits.length*100):0;
  const total=habits.reduce((n,h)=>n+h.completions.length,0);
  const addHabit=()=>{
    if(!name.trim()){setToast("Give your habit a name first.");return;}
    setHabits(prev=>[...prev,{id:crypto.randomUUID(),name:name.trim(),emoji,color,createdAt:today(),completions:[]}]);
    setName("");setShowForm(false);setToast("Habit created. Start today.");
  };
  const toggle=(id:string)=>{
    const key=today();
    setHabits(prev=>prev.map(h=>h.id!==id?h:{...h,completions:h.completions.includes(key)?h.completions.filter(x=>x!==key):[...h.completions,key].sort()}));
  };
  const remove=(h:Habit)=>{
    if(window.confirm(`Delete "${h.name}" and its check-in history?`)){
      setHabits(prev=>prev.filter(x=>x.id!==h.id));
      if(filter===h.id)setFilter("all");
    }
  };
  const install=async()=>{
    if(!installPrompt){setToast("In Chrome, open the menu and choose Install app.");return;}
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return <main className="app-shell">
    <header className="topbar">
      <a className="brand" href="#"><span className="brand-mark">◒</span> ritual<span className="brand-dot">.</span></a>
      <div className="top-actions">
        <span className="today-pill"><i/> {fmt(new Date(),{weekday:"short",day:"numeric",month:"short"}).toUpperCase()}</span>
        <button className="install-button" onClick={install}><ArrowDownToLine size={15}/><span>INSTALL</span></button>
      </div>
    </header>

    <section className="intro">
      <div>
        <p className="eyebrow">YOUR DAILY PRACTICE</p>
        <h1>Small actions.<br/><em>Lasting change.</em></h1>
        <p className="intro-copy">Build a life by keeping the promises you make to yourself.</p>
      </div>
      <div className="sparkle"><Sparkles size={30}/></div>
    </section>

    <section className="summary-grid">
      <div className="summary-card main-stat">
        <p className="eyebrow">TODAY'S PROGRESS</p>
        <div className="stat-line"><strong>{done}<small> / {habits.length}</small></strong><span>habits done</span></div>
        <div className="progress-track"><div style={{width:`${pct}%`}}/></div>
        <p className="summary-note">{habits.length===0?"Add a habit to begin.":pct===100?"You kept every promise today.":`${pct}% complete · Keep going at your own pace.`}</p>
      </div>
      <div className="summary-card">
        <div className="stat-icon"><Flame size={17}/></div><p className="eyebrow">TOTAL CHECK-INS</p><strong className="small-stat">{total}</strong><span className="stat-foot">Across all habits</span>
      </div>
      <div className="summary-card">
        <div className="stat-icon"><Activity size={17}/></div><p className="eyebrow">ACTIVE HABITS</p><strong className="small-stat">{habits.length}</strong><span className="stat-foot">Intentions you're tracking</span>
      </div>
    </section>

    <section className="habits-section">
      <div className="section-heading">
        <div><p className="eyebrow">SHOW UP FOR YOURSELF</p><h2>Daily habits</h2><p className="section-sub">Consistency over intensity.</p></div>
        <button className="primary-button" onClick={()=>setShowForm(true)}><Plus size={16}/> NEW HABIT</button>
      </div>
      {habits.length===0?<div className="empty-state"><div className="empty-symbol">＋</div><h3>Begin with one thing.</h3><p>Choose a small habit you'd like to make part of your everyday life.</p><button className="text-button" onClick={()=>setShowForm(true)}>Create your first habit <ChevronRight size={15}/></button></div>:
        <div className="habit-list">{habits.map(h=>{
          const isDone=h.completions.includes(today());
          return <article className={`habit-row ${isDone?"is-done":""}`} key={h.id}>
            <div className="habit-emoji" style={{background:`${h.color}18`}}>{h.emoji}</div>
            <div className="habit-details"><h3>{h.name}</h3><p><Flame size={12}/> {streak(h)} day streak <span>·</span> {h.completions.length} check-ins</p></div>
            <button className={`check-button ${isDone?"checked":""}`} onClick={()=>toggle(h.id)} aria-label={isDone?"Undo today's check-in":"Complete habit"}>{isDone?<Check size={19}/>:<span/>}</button>
            <button className="delete-button" onClick={()=>remove(h)} aria-label={`Delete ${h.name}`}><Trash2 size={15}/></button>
          </article>;
        })}</div>}
    </section>

    <Heatmap habits={habits} selected={filter} onSelect={setFilter}/>

    <section className="bottom-note"><CalendarDays size={17}/><p><strong>Progress, not perfection.</strong><br/>Missed a day? The next square is a fresh start.</p></section>
    <footer>RITUAL · YOUR DATA LIVES ON THIS DEVICE</footer>

    {showForm&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setShowForm(false);}}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-head"><div><p className="eyebrow">MAKE IT A PRACTICE</p><h2 id="modal-title">New habit</h2></div><button className="icon-button" onClick={()=>setShowForm(false)} aria-label="Close"><X size={18}/></button></div>
        <label className="field-label" htmlFor="habit-name">HABIT NAME</label>
        <input id="habit-name" autoFocus maxLength={48} placeholder="e.g. Read 20 pages" value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addHabit()}/>
        <label className="field-label">CHOOSE AN ICON</label>
        <div className="choice-row">{EMOJIS.map(x=><button key={x} className={`emoji-choice ${emoji===x?"selected":""}`} onClick={()=>setEmoji(x)}>{x}</button>)}</div>
        <label className="field-label">CHOOSE A COLOR</label>
        <div className="choice-row">{COLORS.map(x=><button key={x} aria-label={`Choose ${x}`} className={`color-choice ${color===x?"selected":""}`} style={{background:x}} onClick={()=>setColor(x)}/>)}</div>
        <button className="primary-button create-button" onClick={addHabit}>CREATE HABIT <ChevronRight size={16}/></button>
      </div>
    </div>}
    {toast&&<div className="toast">{toast}</div>}
    {!ready&&<div className="loading">Preparing your space…</div>}
  </main>;
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{outcome:"accepted"|"dismissed";platform:string}>;
};

export default App;