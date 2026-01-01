import React, { useState, useEffect } from 'react';
import { Clock, RotateCcw, Monitor, ChevronRight, Calendar } from 'lucide-react';

// --- Types ---
interface MetricTime {
  yy: number;
  ddd: number;
  hh: number;
  mmm: number;
}

interface MetricWeekDay {
  day: number;
  date: Date;
  metric: MetricTime;
}

const App: React.FC = () => {
  // --- Constants ---
  const SECONDS_IN_HH = 1000;
  const SECONDS_IN_DDD = 100000;
  const SECONDS_IN_YY = 100000000;

  // --- State ---
  const [metric, setMetric] = useState<MetricTime>({ yy: 0, ddd: 0, hh: 0, mmm: 0 });
  const [dateObj, setDateObj] = useState<Date>(new Date());
  // Track which field is focused to add a glow effect
  const [activeField, setActiveField] = useState<keyof MetricTime | null>(null);

  // --- Logic ---

  const metricToDate = (y: number, d: number, h: number, m: number): Date => {
    const totalSeconds = (y * SECONDS_IN_YY) + (d * SECONDS_IN_DDD) + (h * SECONDS_IN_HH) + m;
    return new Date(totalSeconds * 1000);
  };

  const dateToMetric = (date: Date): MetricTime => {
    const totalSeconds = Math.floor(date.getTime() / 1000);
    const yy = Math.floor(totalSeconds / SECONDS_IN_YY);
    let rem = totalSeconds % SECONDS_IN_YY;
    const ddd = Math.floor(rem / SECONDS_IN_DDD);
    rem %= SECONDS_IN_DDD;
    const hh = Math.floor(rem / SECONDS_IN_HH);
    const mmm = rem % SECONDS_IN_HH;
    return { yy, ddd, hh, mmm };
  };

  const handleInputChange = (field: keyof MetricTime, value: string) => {
    // strict parsing to prevent NaN
    let val = parseInt(value);
    if (isNaN(val)) val = 0;

    // basic clamping
    if (field === 'ddd' && val > 999) val = 999;
    if (field === 'hh' && val > 99) val = 99;
    if (field === 'mmm' && val > 999) val = 999;

    const newMetric = { ...metric, [field]: val };
    setMetric(newMetric);
    setDateObj(metricToDate(newMetric.yy, newMetric.ddd, newMetric.hh, newMetric.mmm));
  };

  const setNow = () => {
    const now = new Date();
    setMetric(dateToMetric(now));
    setDateObj(now);
  };

  useEffect(() => { setNow(); }, []);

  // --- Helpers ---

  // Pads numbers with leading zeros (e.g. 7 -> "007")
  const pad = (num: number, size: number) => num.toString().padStart(size, '0');

  // Logic for the button labels: "17-672" if time is 0, else full string
  const formatMetricString = (y: number, d: number, h: number = 0, m: number = 0) => {
    const base = `${y}-${pad(d, 3)}`;
    if (h === 0 && m === 0) return base;
    return `${base}-${pad(h, 2)}-${pad(m, 3)}`;
  };

  // --- Navigation Logic ---

  const navigateMetric = (deltaYY: number, deltaDDD: number) => {
    let newYY = metric.yy + deltaYY;
    let newDDD = metric.ddd + deltaDDD;

    if (newDDD >= 1000) {
      newYY += Math.floor(newDDD / 1000);
      newDDD = newDDD % 1000;
    } else if (newDDD < 0) {
      const yearsToBorrow = Math.ceil(Math.abs(newDDD) / 1000);
      newYY -= yearsToBorrow;
      newDDD = newDDD + (yearsToBorrow * 1000);
    }

    // When navigating by day/week, we usually reset hour/sec to 0 for cleanliness, 
    // unless you want to preserve the exact time. Let's reset for cleaner "jumps".
    const newMetric = { yy: newYY, ddd: newDDD, hh: 0, mmm: 0 };
    setMetric(newMetric);
    setDateObj(metricToDate(newYY, newDDD, 0, 0));
  };

  const getMetricWeek = (): MetricWeekDay[] => {
    const startDay = Math.floor(metric.ddd / 10) * 10;
    return Array.from({ length: 10 }, (_, i) => {
      const day = startDay + i;
      // create a temp metric object for this specific day
      const tempMetric = { ...metric, ddd: day, hh: 0, mmm: 0 };
      return {
        day,
        date: metricToDate(metric.yy, day, 0, 0),
        metric: tempMetric
      };
    });
  };

  // --- Components ---

  const Separator = () => <span className="text-slate-600 text-3xl md:text-5xl font-light select-none pb-2">-</span>;

  // Reusable Nav Button
  const NavButton = ({ label, subLabel, metricLabel, onClick, highlight = false }: any) => (
    <button
      onClick={onClick}
      className={`relative overflow-hidden group p-3 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center text-center h-full
        ${highlight
          ? 'bg-emerald-950/30 border-emerald-500/50 hover:bg-emerald-900/40 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]'
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-600 hover:bg-slate-800'
        }`}
    >
      <span className={`text-lg font-mono font-bold tracking-tight ${highlight ? 'text-emerald-400' : 'text-slate-200'}`}>
        {metricLabel}
      </span>
      {subLabel && <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-1 font-bold">{subLabel}</span>}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-mono selection:bg-emerald-500/30 flex flex-col items-center pt-12 md:pt-24 px-4 pb-12 relative overflow-x-hidden">

      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-emerald-900/10 to-transparent pointer-events-none" />

      {/* --- MAIN DISPLAY --- */}
      <main className="z-10 w-full max-w-3xl flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Header Label */}
        <div className="flex items-center gap-2 mb-4 opacity-70">
          <Monitor className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-bold tracking-[0.3em] text-emerald-500 uppercase">Unix Metric Interface</span>
        </div>

        {/* THE BIG INPUT BAR */}
        <div className="relative group w-full">
          {/* Glowing backdrop effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-slate-800 via-emerald-900/20 to-slate-800 rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-1000"></div>

          <div className="relative bg-slate-950 border border-slate-800 rounded-2xl p-6 md:p-10 shadow-2xl flex flex-col items-center justify-center">

            {/* The Input Row */}
            <div className="flex items-baseline justify-center gap-1 md:gap-2 w-full">

              {/* YY */}
              <input
                type="number"
                value={pad(metric.yy, 0)} // No padding on visual value for year to prevent "02026", but handled by formatter elsewhere
                onChange={(e) => handleInputChange('yy', e.target.value)}
                onFocus={() => setActiveField('yy')}
                onBlur={() => setActiveField(null)}
                className={`bg-transparent text-3xl md:text-6xl font-bold w-[1.5em] md:w-[1.2em] text-center outline-none transition-colors duration-300
                  ${activeField === 'yy' ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'text-slate-100'}`}
              />

              <Separator />

              {/* DDD */}
              <input
                type="number"
                value={pad(metric.ddd, 3)}
                onChange={(e) => handleInputChange('ddd', e.target.value)}
                onFocus={() => setActiveField('ddd')}
                onBlur={() => setActiveField(null)}
                className={`bg-transparent text-3xl md:text-6xl font-bold w-[1.8em] text-center outline-none transition-colors duration-300
                  ${activeField === 'ddd' ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'text-slate-100'}`}
              />

              <Separator />

              {/* HH */}
              <input
                type="number"
                value={pad(metric.hh, 2)}
                onChange={(e) => handleInputChange('hh', e.target.value)}
                onFocus={() => setActiveField('hh')}
                onBlur={() => setActiveField(null)}
                className={`bg-transparent text-3xl md:text-6xl font-bold w-[1.3em] text-center outline-none transition-colors duration-300
                  ${activeField === 'hh' ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'text-slate-100'}`}
              />

              <Separator />

              {/* mmm */}
              <input
                type="number"
                value={pad(metric.mmm, 3)}
                onChange={(e) => handleInputChange('mmm', e.target.value)}
                onFocus={() => setActiveField('mmm')}
                onBlur={() => setActiveField(null)}
                className={`bg-transparent text-3xl md:text-6xl font-bold w-[1.8em] text-center outline-none transition-colors duration-300
                  ${activeField === 'mmm' ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'text-slate-100'}`}
              />
            </div>

            {/* Field Labels below inputs */}
            <div className="flex w-full justify-center gap-1 md:gap-2 mt-2 md:mt-4 opacity-40 text-[10px] md:text-xs font-bold tracking-widest uppercase select-none">
              <span className="w-[1.5em] md:w-[1.2em] text-center">YY</span>
              <span className="w-[1em] text-center"></span>
              <span className="w-[1.8em] text-center">DDD</span>
              <span className="w-[1em] text-center"></span>
              <span className="w-[1.3em] text-center">HH</span>
              <span className="w-[1em] text-center"></span>
              <span className="w-[1.8em] text-center">mmm</span>
            </div>

            {/* Live Button (Floating absolute in desktop, relative in mobile) */}
            <button
              onClick={setNow}
              className="absolute top-4 right-4 md:top-auto md:bottom-10 md:right-10 p-2 rounded-full bg-slate-900 border border-slate-700 text-emerald-500 hover:bg-emerald-500 hover:text-slate-950 transition-all active:scale-95"
              title="Sync to Current Time"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Human Readable Output */}
        <div className="w-full mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex flex-col justify-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1 flex items-center gap-2">
              <Calendar className="w-3 h-3" /> Gregorian Local
            </div>
            <div className="text-xl text-slate-200 font-bold truncate">
              {dateObj.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <div className="text-sm text-emerald-500/80 font-mono">
              {dateObj.toLocaleTimeString('en-US', { hour12: false })}
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex flex-col justify-center text-right">
            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1 flex items-center justify-end gap-2">
              UTC / ISO <Clock className="w-3 h-3" />
            </div>
            <div className="text-sm text-indigo-300 font-mono break-all">
              {dateObj.toISOString().replace('T', ' ').split('.')[0]}
            </div>
            <div className="text-xs text-slate-600 mt-1">
              Unix: {Math.floor(dateObj.getTime() / 1000)}
            </div>
          </div>
        </div>
      </main>

      {/* --- NAVIGATION GRID --- */}
      <section className="w-full max-w-4xl mt-16 z-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-px bg-slate-800 flex-1"></div>
          <h3 className="text-slate-500 text-xs font-black uppercase tracking-[0.3em]">Temporal Navigation</h3>
          <div className="h-px bg-slate-800 flex-1"></div>
        </div>

        {/* Metric Week Strip */}
        <div className="mb-8">
          <div className="text-center text-[10px] text-slate-500 uppercase tracking-widest mb-3">
            Metric Week {Math.floor(metric.ddd / 10)} (Days {Math.floor(metric.ddd / 10) * 10} - {Math.floor(metric.ddd / 10) * 10 + 9})
          </div>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {getMetricWeek().map((item) => (
              <button
                key={item.day}
                onClick={() => handleInputChange('ddd', item.day.toString())}
                className={`py-3 rounded-lg border flex flex-col items-center justify-center transition-all duration-200
                  ${item.day === metric.ddd
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-110 z-10'
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'}`}
              >
                {/* Always use the short format for these small buttons */}
                <div className="font-bold text-sm">{formatMetricString(metric.yy, item.day)}</div>
                <div className="text-[9px] opacity-60 mt-1">{item.date.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Control Deck */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NavButton
            metricLabel={formatMetricString(metric.yy, metric.ddd - 10)}
            subLabel="Prev Week"
            onClick={() => navigateMetric(0, -10)}
          />
          <NavButton
            metricLabel={formatMetricString(metric.yy, metric.ddd + 10)}
            subLabel="Next Week"
            onClick={() => navigateMetric(0, 10)}
          />
          <NavButton
            metricLabel={formatMetricString(metric.yy, metric.ddd - 100)}
            subLabel="Prev Season"
            onClick={() => navigateMetric(0, -100)}
          />
          <NavButton
            metricLabel={formatMetricString(metric.yy, metric.ddd + 100)}
            subLabel="Next Season"
            onClick={() => navigateMetric(0, 100)}
          />
          <NavButton
            metricLabel={formatMetricString(metric.yy - 1, metric.ddd)}
            subLabel="Last Year"
            onClick={() => navigateMetric(-1, 0)}
          />
          <NavButton
            metricLabel={formatMetricString(metric.yy + 1, metric.ddd)}
            subLabel="Next Year"
            onClick={() => navigateMetric(1, 0)}
          />
          <NavButton
            metricLabel={`${metric.yy}-000`}
            subLabel="Year Start"
            highlight
            onClick={() => handleInputChange('ddd', '0')}
          />
          <NavButton
            metricLabel={`${metric.yy}-999`}
            subLabel="Year End"
            highlight
            onClick={() => handleInputChange('ddd', '999')}
          />
        </div>
      </section>
    </div>
  );
};

export default App;