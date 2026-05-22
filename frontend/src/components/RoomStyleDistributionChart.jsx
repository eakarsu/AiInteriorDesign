import React, { useEffect, useState } from 'react';
import api from '../api';
import { BarChart2 } from 'lucide-react';

const RoomStyleDistributionChart = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.get('/custom-views/room-style-distribution')
      .then((res) => { if (!cancelled) setData(res.data); })
      .catch((err) => { if (!cancelled) setError(err.response?.data?.error || err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="p-6 text-gray-500">Loading style distribution…</div>;
  if (error)   return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!data)   return null;

  const max = Math.max(1, ...data.distribution.map((d) => d.designCount));
  const palette = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444', '#84cc16', '#a855f7', '#0ea5e9'];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <BarChart2 className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-800">Room Style Distribution</h3>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Aggregated design counts across {data.rooms} room types • total {data.total} designs
      </p>
      <div className="space-y-3" data-testid="style-distribution">
        {data.distribution.map((row, i) => {
          const pct = Math.round((row.designCount / max) * 100);
          return (
            <div key={row.style} className="flex items-center gap-3">
              <div className="w-32 text-sm text-gray-700 truncate">{row.style}</div>
              <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                <div
                  className="h-6 rounded-full flex items-center justify-end pr-2 text-xs text-white font-medium transition-all"
                  style={{ width: `${pct}%`, background: palette[i % palette.length] }}
                >
                  {row.designCount}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RoomStyleDistributionChart;
