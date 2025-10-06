import React, { useEffect, useState } from 'react';
import fetchClient from '../../lib/fetchClient';

interface Props {
  studentId?: string;
}

const SemesterGpa: React.FC<Props> = ({ studentId }) => {
  const [semester, setSemester] = useState<number | ''>('');
  const [academicYear, setAcademicYear] = useState<string>('');
  const [data, setData] = useState<{ gpa: number; totalCredits: number; totalGradePoints: number; count: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!studentId) return;
      if (semester === '' && !academicYear) return;
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (semester !== '') params.set('semester', String(semester));
        if (academicYear) params.set('academicYear', academicYear);
        const res = await fetchClient.get(`/api/students/${encodeURIComponent(String(studentId))}/gpa/semester?${params.toString()}`);
        if (res.ok) {
          const body = await res.json();
          setData(body?.data || null);
        } else {
          setData(null);
        }
      } finally { setLoading(false); }
    };
    run();
  }, [studentId, semester, academicYear]);

  return (
    <div className="text-xs text-gray-600">
      <div className="flex items-center gap-2">
        <select value={semester} onChange={e=>setSemester(e.target.value ? Number(e.target.value) : '')} className="px-2 py-1 border rounded">
          <option value="">Sem</option>
          {Array.from({ length: 12 }, (_,i)=>i+1).map(s=> <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={academicYear} onChange={e=>setAcademicYear(e.target.value)} className="px-2 py-1 border rounded">
          <option value="">Year</option>
          {(() => { const y = new Date().getFullYear(); return [ `${y-1}-${y}`, `${y}-${y+1}`, `${y+1}-${y+2}` ]; })().map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        {loading ? <span>Loading…</span> : data ? <span>Sem GPA: {data.gpa.toFixed(2)}</span> : null}
      </div>
    </div>
  );
};

export default SemesterGpa;
