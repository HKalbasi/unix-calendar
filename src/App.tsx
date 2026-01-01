import React, { useState, useEffect } from 'react';
import { Clock, Calendar, RotateCcw, Monitor } from 'lucide-react';

// --- Types & Interfaces ---

interface MetricTime {
  yy: number;
  ddd: number;
  hh: number;
  mmm: number;
}

interface MetricWeekDay {
  day: number;
  date: Date;
}

// --- Props Interfaces ---

interface InputBoxProps {
  label: string;
  value: number;
  onChange: (value: string) => void;
  max?: string;
}

interface NavCardProps {
  label: string;
  subLabel: string;
  onClick: () => void;
  highlight?: boolean;
}

const App: React.FC = () => {
  // --- Constants ---
  const SECONDS_IN_MMM = 1;
  const SECONDS_IN_HH = 1000;
  const SECONDS_IN_DDD = 100000;
  const SECONDS_IN_YY = 100000000;

  // --- State ---
  const [metric, setMetric] = useState<MetricTime>({ yy: 0, ddd: 0, hh: 0, mmm: 0 });
  const [dateObj, setDateObj] = useState<Date>(new Date());

  // --- Core Conversion Logic ---

  const metricToDate = (y: number, d: number, h: number, m: number): Date => {
    const totalSeconds =
      (y * SECONDS_IN_YY) +
      (d * SECONDS_IN_DDD) +
      (h * SECONDS_IN_HH) +
      (m * SECONDS_IN_MMM);

    // Unix Epoch is 1970-01-01. JS Date accepts milliseconds.
    return new Date(totalSeconds * 1000);
  };

  const dateToMetric = (date: Date): MetricTime => {
    const totalSeconds = Math.floor(date.getTime() / 1000);

    const yy = Math.floor(totalSeconds / SECONDS_IN_YY);
    let remainder = totalSeconds % SECONDS_IN_YY;

    const ddd = Math.floor(remainder / SECONDS_IN_DDD);
    remainder = remainder % SECONDS_IN_DDD;

    const hh = Math.floor(remainder / SECONDS_IN_HH);
    remainder = remainder % SECONDS_IN_HH;

    const mmm = remainder;

    return { yy, ddd, hh, mmm };
  };

  // --- Handlers ---

  const handleInputChange = (field: keyof MetricTime, value: string) => {
    const val = parseInt(value) || 0;
    const newMetric = { ...metric, [field]: val };
    setMetric(newMetric);
    setDateObj(metricToDate(newMetric.yy, newMetric.ddd, newMetric.hh, newMetric.mmm));
  };

  const setNow = () => {
    const now = new Date();
    const currentMetric = dateToMetric(now);
    setMetric(currentMetric);
    setDateObj(now);
  };

  // Initialize on load
  useEffect(() => {
    setNow();
    // eslint-disable-next-line
  }, []);

  const formatDate = (date: Date): string => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  // --- Navigation Helpers ---

  const navigateMetric = (deltaYY: number, deltaDDD: number) => {
    let newYY = metric.yy + deltaYY;
    let newDDD = metric.ddd + deltaDDD;

    // Handle DDD overflow/underflow logic for navigation
    if (newDDD >= 1000) {
      newYY += Math.floor(newDDD / 1000);
      newDDD = newDDD % 1000;
    } else if (newDDD < 0) {
      const yearsToBorrow = Math.ceil(Math.abs(newDDD) / 1000);
      newYY -= yearsToBorrow;
      newDDD = newDDD + (yearsToBorrow * 1000);
    }

    const newMetric = { ...metric, yy: newYY, ddd: newDDD };
    setMetric(newMetric);
    setDateObj(metricToDate(newMetric.yy, newMetric.ddd, newMetric.hh, newMetric.mmm));
  };

  const getMetricWeek = (): MetricWeekDay[] => {
    const startDay = Math.floor(metric.ddd / 10) * 10;
    const week: MetricWeekDay[] = [];
    for (let i = 0; i < 10; i++) {
      const day = startDay + i;
      if (day >= 1000) continue;

      const mDate = metricToDate(metric.yy, day, metric.hh, metric.mmm);
      week.push({ day, date: mDate });
    }
    return week;
  };

  // --- Sub-Components ---

  const InputBox: React.FC<InputBoxProps> = ({ label, value, onChange, max }) => (
    <div className="flex flex-col">
      <label className="text-xs text-slate-500 uppercase tracking-widest mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-slate-900 border border-slate-700 text-green-400 text-3xl p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono shadow-inner text-center"
      />
      <span className="text-xs text-slate-600 mt-1 text-right">Max: {max}</span>
    </div>
  );

  const NavCard: React.FC<NavCardProps> = ({ label, subLabel, onClick, highlight = false }) => (
    <button
      onClick={onClick}
      className={`p-3 rounded border text-left transition-all hover:scale-[1.02] flex flex-col justify-between h-full
        ${highlight
          ? 'bg-green-900/20 border-green-500/50 hover:bg-green-900/30'
          : 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-500'
        }`}
    >
      <span className="text-lg font-bold text-slate-200">{label}</span>
      <span className="text-xs text-slate-400 mt-1">{subLabel}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 flex flex-col items-center">

      {/* Header */}
      <header className="w-full max-w-4xl mb-8 flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Monitor className="text-green-500 w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">UNIX METRIC CONVERTER</h1>
            <p className="text-xs text-slate-500">Universal Time Base: 1970-01-01</p>
          </div>
        </div>
        <button
          onClick={setNow}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded shadow-lg transition-colors font-bold text-sm"
        >
          <RotateCcw className="w-4 h-4" /> LIVE NOW
        </button>
      </header>

      {/* Main Converter */}
      <main className="w-full max-w-4xl bg-slate-900/50 p-6 md:p-8 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-sm">

        {/* Metric Inputs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <InputBox label="Year (YY)" value={metric.yy} onChange={(v) => handleInputChange('yy', v)} />
          <InputBox label="Day (DDD)" value={metric.ddd} onChange={(v) => handleInputChange('ddd', v)} max="999" />
          <InputBox label="Hour (HH)" value={metric.hh} onChange={(v) => handleInputChange('hh', v)} max="99" />
          <InputBox label="Sec (mmm)" value={metric.mmm} onChange={(v) => handleInputChange('mmm', v)} max="999" />
        </div>

        {/* Gregorian Display */}
        <div className="bg-slate-950 rounded-xl p-6 border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-slate-500 text-xs uppercase mb-1 flex items-center gap-2 justify-center md:justify-start">
              <Calendar className="w-3 h-3" /> Gregorian Local
            </h2>
            <div className="text-2xl md:text-3xl text-slate-100 font-bold">
              {formatDate(dateObj)}
            </div>
          </div>

          <div className="h-px w-full md:w-px md:h-12 bg-slate-800"></div>

          <div className="text-center md:text-right">
            <h2 className="text-slate-500 text-xs uppercase mb-1 flex items-center gap-2 justify-center md:justify-end">
              <Clock className="w-3 h-3" /> UTC / ISO
            </h2>
            <div className="text-lg md:text-xl text-indigo-400 font-mono">
              {dateObj.toISOString().replace('T', ' ').split('.')[0]}
            </div>
          </div>
        </div>
      </main>

      {/* Navigation Grid */}
      <section className="w-full max-w-4xl mt-8">
        <h3 className="text-slate-400 text-sm font-bold mb-4 uppercase tracking-wider">Temporal Navigation</h3>

        {/* Metric Week */}
        <div className="mb-6">
          <div className="text-xs text-slate-500 mb-2">CURRENT METRIC WEEK (DAYS {Math.floor(metric.ddd / 10) * 10} - {Math.floor(metric.ddd / 10) * 10 + 9})</div>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {getMetricWeek().map((item) => (
              <button
                key={item.day}
                onClick={() => handleInputChange('ddd', item.day.toString())}
                className={`p-2 rounded text-center text-xs border transition-colors
                  ${item.day === metric.ddd
                    ? 'bg-green-600 text-white border-green-500 font-bold'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200'}`}
              >
                <div className="font-mono text-lg">{item.day}</div>
                <div className="text-[10px] opacity-70 truncate">{item.date.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Relative Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NavCard
            label="Previous Week"
            subLabel={`Day ${metric.ddd - 10}`}
            onClick={() => navigateMetric(0, -10)}
          />
          <NavCard
            label="Next Week"
            subLabel={`Day ${metric.ddd + 10}`}
            onClick={() => navigateMetric(0, 10)}
          />
          <NavCard
            label="Previous Season"
            subLabel={`Day ${metric.ddd - 100}`}
            onClick={() => navigateMetric(0, -100)}
          />
          <NavCard
            label="Next Season"
            subLabel={`Day ${metric.ddd + 100}`}
            onClick={() => navigateMetric(0, 100)}
          />
          <NavCard
            label="Last Year"
            subLabel={`YY ${metric.yy - 1}`}
            onClick={() => navigateMetric(-1, 0)}
          />
          <NavCard
            label="Next Year"
            subLabel={`YY ${metric.yy + 1}`}
            onClick={() => navigateMetric(1, 0)}
          />
          <NavCard
            highlight
            label="Reset Season"
            subLabel="Day 000"
            onClick={() => handleInputChange('ddd', '0')}
          />
          <NavCard
            highlight
            label="End of Year"
            subLabel="Day 999"
            onClick={() => handleInputChange('ddd', '999')}
          />
        </div>
      </section>
    </div>
  );
};

export default App;