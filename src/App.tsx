import React, { useState, useEffect } from 'react';
import { Clock, RotateCcw, Monitor, Calendar } from 'lucide-react';

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

  // --- URL Parameter Handling ---
  const parseUrlParams = (): MetricTime | null => {
    const urlParams = new URLSearchParams(window.location.search);
    const qParam = urlParams.get('q');

    if (!qParam) {
      return null;
    }

    // Split the q parameter by hyphens
    const parts = qParam.split('-');
    if (parts.length !== 4) {
      return null;
    }

    const [yyStr, dddStr, hhStr, mmmStr] = parts;
    const yy = parseInt(yyStr);
    const ddd = parseInt(dddStr);
    const hh = parseInt(hhStr);
    const mmm = parseInt(mmmStr);

    // Validate that all parameters are valid numbers
    if (isNaN(yy) || isNaN(ddd) || isNaN(hh) || isNaN(mmm)) {
      return null;
    }

    return { yy, ddd, hh, mmm };
  };

  const updateUrlParams = (time: MetricTime) => {
    const urlParams = new URLSearchParams(window.location.search);
    const qValue = `${time.yy}-${String(time.ddd).padStart(3, '0')}-${String(time.hh).padStart(2, '0')}-${String(time.mmm).padStart(3, '0')}`;
    urlParams.set('q', qValue);

    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.history.replaceState({}, '', newUrl);
  };

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
    updateUrlParams(newMetric);
  };

  const setNow = () => {
    const now = new Date();
    const newMetric = dateToMetric(now);
    setMetric(newMetric);
    setDateObj(now);
    updateUrlParams(newMetric);
  };

  useEffect(() => {
    // Check if URL parameters are present
    const urlParams = parseUrlParams();
    if (urlParams) {
      // Use URL parameters to set the initial time
      setMetric(urlParams);
      setDateObj(metricToDate(urlParams.yy, urlParams.ddd, urlParams.hh, urlParams.mmm));
    } else {
      // Default to current time if no URL parameters
      setNow();
    }
  }, []);

  // --- Helpers ---

  // Pads numbers with leading zeros (e.g. 7 -> "007")
  const pad = (num: number, size: number) => num.toString().padStart(size, '0');

  // Logic for the button labels: "17-672" if time is 0, else full string
  const formatMetricString = (y: number, d: number, h: number = 0, m: number = 0) => {
    const base = `${y}-${pad(d, 3)}`;
    if (h === 0 && m === 0) return base;
    return `${base}-${pad(h, 2)}-${pad(m, 3)}`;
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

  // Reusable Control Buttons for each field
  const ControlButtons = ({ field, value }: { field: keyof MetricTime, value: number }) => {
    const updateField = (newValue: number) => {
      // Apply clamping based on field type
      let clampedValue = newValue;
      if (field === 'ddd' && clampedValue > 999) clampedValue = 999;
      if (field === 'ddd' && clampedValue < 0) clampedValue = 0;
      if (field === 'hh' && clampedValue > 99) clampedValue = 99;
      if (field === 'hh' && clampedValue < 0) clampedValue = 0;
      if (field === 'mmm' && clampedValue > 999) clampedValue = 999;
      if (field === 'mmm' && clampedValue < 0) clampedValue = 0;

      const newMetric = { ...metric, [field]: clampedValue };
      setMetric(newMetric);
      setDateObj(metricToDate(newMetric.yy, newMetric.ddd, newMetric.hh, newMetric.mmm));
      updateUrlParams(newMetric);
    };

    const decreaseValue = () => {
      updateField(value - 1);
    };

    const increaseValue = () => {
      updateField(value + 1);
    };

    const zeroValue = () => {
      updateField(0);
    };

    return (
      <div className="flex gap-0.5 mt-1">
        <button
          onClick={decreaseValue}
          className="w-5 h-5 flex items-center justify-center text-[8px] bg-slate-800/50 hover:bg-slate-700/70 border border-slate-700 rounded-sm transition-colors text-slate-300 hover:text-slate-100"
          aria-label={`Decrease ${field}`}
        >
          -
        </button>
        <button
          onClick={zeroValue}
          className="w-5 h-5 flex items-center justify-center text-[8px] bg-slate-800/50 hover:bg-slate-700/70 border border-slate-700 rounded-sm transition-colors text-slate-300 hover:text-slate-100"
          aria-label={`Zero ${field}`}
        >
          z
        </button>
        <button
          onClick={increaseValue}
          className="w-5 h-5 flex items-center justify-center text-[8px] bg-slate-800/50 hover:bg-slate-700/70 border border-slate-700 rounded-sm transition-colors text-slate-300 hover:text-slate-100"
          aria-label={`Increase ${field}`}
        >
          +
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-mono selection:bg-emerald-500/30 flex flex-col items-center pt-12 md:pt-24 px-4 pb-12 relative overflow-x-hidden">

      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-emerald-900/10 to-transparent pointer-events-none" />

      {/* --- MAIN DISPLAY --- */}
      <main className="z-10 w-full max-w-3xl flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Header Label */}
        <div className="flex items-center gap-2 mb-4 opacity-70">
          <Monitor className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-bold tracking-[0.3em] text-emerald-500 uppercase">Unix Calendar</span>
        </div>

        {/* THE BIG INPUT BAR */}
        <div className="relative group w-full">
          {/* Glowing backdrop effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-slate-800 via-emerald-900/20 to-slate-800 rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-1000"></div>

          <div className="relative bg-slate-950 border border-slate-800 rounded-2xl p-6 md:p-10 shadow-2xl flex flex-col items-center justify-center">

            {/* The Input Row */}
            <div className="flex flex-col items-center justify-center w-full">
              <div className="flex items-baseline justify-center gap-1 md:gap-2 w-full">
                {/* YY */}
                <div className="flex flex-col items-center">
                  <div
                    // type="number"
                    //onChange={(e) => handleInputChange('yy', e.target.value)}
                    onFocus={() => setActiveField('yy')}
                    onBlur={() => setActiveField(null)}
                    className={`bg-transparent text-3xl md:text-6xl font-bold w-fit p-0 box-content text-center outline-none transition-colors duration-300
                      ${activeField === 'yy' ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'text-slate-100'}`}
                  >
                    {pad(metric.yy, 0)}
                  </div>
                  <div className="mt-1">
                    <ControlButtons field="yy" value={metric.yy} />
                  </div>
                </div>

                <Separator />

                {/* DDD */}
                <div className="flex flex-col items-center">
                  <input
                    type="number"
                    value={pad(metric.ddd, 3)}
                    onChange={(e) => handleInputChange('ddd', e.target.value)}
                    onFocus={() => setActiveField('ddd')}
                    onBlur={() => setActiveField(null)}
                    className={`bg-transparent text-3xl md:text-6xl font-bold w-[1.8em] text-center outline-none transition-colors duration-300
                      ${activeField === 'ddd' ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'text-slate-100'}`}
                  />
                  <div className="mt-1">
                    <ControlButtons field="ddd" value={metric.ddd} />
                  </div>
                </div>

                <Separator />

                {/* HH */}
                <div className="flex flex-col items-center">
                  <input
                    type="number"
                    value={pad(metric.hh, 2)}
                    onChange={(e) => handleInputChange('hh', e.target.value)}
                    onFocus={() => setActiveField('hh')}
                    onBlur={() => setActiveField(null)}
                    className={`bg-transparent text-3xl md:text-6xl font-bold w-[1.3em] text-center outline-none transition-colors duration-300
                      ${activeField === 'hh' ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'text-slate-100'}`}
                  />
                  <div className="mt-1">
                    <ControlButtons field="hh" value={metric.hh} />
                  </div>
                </div>

                <Separator />

                {/* mmm */}
                <div className="flex flex-col items-center">
                  <input
                    type="number"
                    value={pad(metric.mmm, 3)}
                    onChange={(e) => handleInputChange('mmm', e.target.value)}
                    onFocus={() => setActiveField('mmm')}
                    onBlur={() => setActiveField(null)}
                    className={`bg-transparent text-3xl md:text-6xl font-bold w-[1.8em] text-center outline-none transition-colors duration-300
                      ${activeField === 'mmm' ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'text-slate-100'}`}
                  />
                  <div className="mt-1">
                    <ControlButtons field="mmm" value={metric.mmm} />
                  </div>
                </div>
              </div>
            </div>

            {/* Field Labels below inputs */}
            <div className="flex w-full justify-center gap-1 md:gap-2 mt-6 md:mt-4 opacity-40 text-[10px] md:text-xs font-bold tracking-widest uppercase select-none">
              <div className="flex flex-col items-center">
                <span className="w-[1.5em] md:w-[1.2em] text-center">YY</span>
              </div>
              <span className="w-[1em] text-center"></span>
              <div className="flex flex-col items-center">
                <span className="w-[1.8em] text-center">DDD</span>
              </div>
              <span className="w-[1em] text-center"></span>
              <div className="flex flex-col items-center">
                <span className="w-[1.3em] text-center">HH</span>
              </div>
              <span className="w-[1em] text-center"></span>
              <div className="flex flex-col items-center">
                <span className="w-[1.8em] text-center">mmm</span>
              </div>
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
          <h3 className="text-slate-500 text-xs font-black uppercase tracking-[0.3em]">
            Metric Week {Math.floor(metric.ddd / 10)} (Days {Math.floor(metric.ddd / 10) * 10} - {Math.floor(metric.ddd / 10) * 10 + 9})
          </h3>
          <div className="h-px bg-slate-800 flex-1"></div>
        </div>

        {/* Metric Week Strip */}
        <div className="mb-8">
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
      </section>
    </div>
  );
};

export default App;