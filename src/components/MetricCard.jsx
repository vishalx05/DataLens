export default function MetricCard({ label, value, hint, icon, tone = 'violet' }) {
  const tones = { violet: 'bg-violet-50 text-violet-600', blue: 'bg-blue-50 text-blue-600', green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600' };
  return <article className="metric-card">
    <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p></div><span className={`grid h-11 w-11 place-items-center rounded-2xl text-xl ${tones[tone] || tones.violet}`}><i className={icon} /></span></div>
    {hint && <p className="mt-3 text-xs text-slate-500">{hint}</p>}
  </article>;
}
