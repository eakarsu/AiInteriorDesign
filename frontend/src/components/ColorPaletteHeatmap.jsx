import React, { useEffect, useState } from 'react';
import api from '../api';
import { Grid3x3 } from 'lucide-react';

const ColorPaletteHeatmap = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.get('/custom-views/color-palette-heatmap')
      .then((res) => { if (!cancelled) setData(res.data); })
      .catch((err) => { if (!cancelled) setError(err.response?.data?.error || err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="p-6 text-gray-500">Loading palette heatmap…</div>;
  if (error)   return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!data)   return null;

  // intensity 0..100 -> hsl ramp (cool blue -> warm magenta)
  const colorFor = (v) => {
    const hue = 250 - Math.round((v / 100) * 220); // 250 -> 30
    const light = 92 - Math.round((v / 100) * 50); // 92 -> 42
    return `hsl(${hue}, 75%, ${light}%)`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Grid3x3 className="w-5 h-5 text-pink-600" />
        <h3 className="text-lg font-semibold text-gray-800">Color Palette Heatmap</h3>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Room × palette usage score (0–100) — darker = more frequent
      </p>
      <div className="overflow-x-auto" data-testid="palette-heatmap">
        <table className="text-xs border-collapse">
          <thead>
            <tr>
              <th className="text-left p-2 text-gray-600 sticky left-0 bg-white">Room \ Palette</th>
              {data.palettes.map((p) => (
                <th key={p} className="p-2 font-medium text-gray-600 whitespace-nowrap">{p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.matrix.map((row) => (
              <tr key={row.room}>
                <td className="p-2 font-medium text-gray-700 sticky left-0 bg-white whitespace-nowrap">{row.room}</td>
                {row.cells.map((c) => (
                  <td
                    key={c.palette}
                    title={`${row.room} × ${c.palette}: ${c.intensity}`}
                    className="p-2 text-center text-gray-800 border border-white"
                    style={{ background: colorFor(c.intensity), minWidth: 64 }}
                  >
                    {c.intensity}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ColorPaletteHeatmap;
