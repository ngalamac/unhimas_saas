import React, { useEffect, useMemo, useState } from 'react';
import { getPrograms } from '../../api/programs';

interface ProgramSlice { name: string; count: number; color: string; }

// Basic color palette rotation
const palette = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#6366f1','#84cc16','#ec4899'];

export const BottomCharts: React.FC = () => {
  const [programs, setPrograms] = useState<ProgramSlice[]>([]);
  const [loading, setLoading] = useState(true);
  // (Future) could surface load errors; suppressed for now to keep UI minimal
  // const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
  const progRes = await getPrograms().catch(() => ({ data: [] as any[] }));
        if (cancelled) return;
        // We don't yet have counts per program directly; using length of enrollmentTrends isn't correct.
        // Future enhancement: backend endpoint to aggregate students by program (already partly in /students/stats/overview byProgram but limited to top 10)
        // For now derive from stats endpoint would be better; placeholder uses program list with dummy counts 0.
        const slices: ProgramSlice[] = (progRes.data || []).slice(0,9).map((p: any, idx: number) => ({ name: p.name, count: p.studentCount || 0, color: palette[idx % palette.length] }));
        setPrograms(slices);
      } catch (e: any) {
        // Optional: capture error state
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const donut = useMemo(() => {
    const total = programs.reduce((a,b) => a + b.count, 0) || 1;
    const circumference = 2 * Math.PI * 35;
    let offset = 0;
    return programs.map(p => {
      const frac = p.count / total;
      const stroke = `${frac * circumference} ${circumference}`;
      const data = { ...p, stroke, offset: -offset };
      offset += frac * circumference;
      return data;
    });
  }, [programs]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">Program Distribution</h3>
        <p className="text-xs text-gray-500 mb-4">Top programs (counts may be zero until enrollment captured)</p>
        <div className="flex items-center justify-center h-64">
          <div className="relative w-48 h-48">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="35" fill="none" stroke="#f3f4f6" strokeWidth="12" />
              {donut.map(slice => (
                <circle key={slice.name} cx="50" cy="50" r="35" fill="none" stroke={slice.color} strokeWidth="12" strokeDasharray={slice.stroke} strokeDashoffset={String(slice.offset)} strokeLinecap="round" />
              ))}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-semibold">{programs.length}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center space-x-4 mt-4 flex-wrap max-h-24 overflow-auto">
          {programs.map(p => (
            <div key={p.name} className="flex items-center space-x-2 mr-3 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ background: p.color }}></div>
              <span className="text-xs text-gray-600">{p.name} ({p.count})</span>
            </div>
          ))}
          {!loading && programs.length === 0 && <span className="text-xs text-gray-400">No program data</span>}
        </div>
      </div>

      {/* Academic Performance Analysis placeholder */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">Academic Performance Analysis</h3>
        <p className="text-xs text-gray-500 mb-4">Pending GPA / pass-rate analytics endpoint</p>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center text-gray-500 text-sm">
            <p>Academic performance analytics are not yet implemented.</p>
            <p className="mt-2 text-xs text-gray-400">TODO: Backend endpoint returning per-department avg GPA & pass rate.</p>
          </div>
        </div>
        <div className="flex items-center justify-center space-x-6 mt-4 opacity-50">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Average GPA</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Pass Rate</span>
          </div>
        </div>
      </div>
    </div>
  );
};