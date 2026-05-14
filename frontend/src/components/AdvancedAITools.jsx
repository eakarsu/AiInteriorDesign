import React, { useState } from 'react';
import api from '../api';

const TOOLS = [
  {
    id: 'trend-forecaster',
    title: 'Trend Forecaster',
    icon: '🔮',
    endpoint: '/ai/trend-forecaster',
    desc: 'Region- and room-specific design trend forecast over a configurable horizon.',
    fields: [
      { name: 'region', label: 'Region', type: 'text', placeholder: 'e.g., Pacific Northwest, US' },
      { name: 'roomType', label: 'Room Type', type: 'select', options: ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Dining Room', 'Home Office', 'Outdoor', 'Whole Home'] },
      { name: 'horizon_months', label: 'Horizon (months)', type: 'number', placeholder: '12' },
      { name: 'audience', label: 'Audience', type: 'select', options: ['Young professionals', 'Families', 'Empty nesters', 'Luxury buyers', 'Renters', 'Investors'] },
    ],
  },
  {
    id: 'room-optimizer',
    title: 'Room Optimizer',
    icon: '📐',
    endpoint: '/ai/room-optimizer',
    desc: 'Layout/flow optimizer accepting dimensions, doorways, windows, focal points, and traffic priorities.',
    fields: [
      { name: 'roomType', label: 'Room Type', type: 'select', options: ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Dining Room', 'Home Office'] },
      { name: 'dimensions', label: 'Dimensions (e.g. 14x18 ft)', type: 'text' },
      { name: 'doorways', label: 'Doorways', type: 'textarea', placeholder: 'Locations and sizes of doorways' },
      { name: 'windows', label: 'Windows', type: 'textarea', placeholder: 'Locations, sizes, light direction' },
      { name: 'focal_points', label: 'Focal Points', type: 'textarea', placeholder: 'Fireplace, TV, view, art piece' },
      { name: 'current_furniture', label: 'Current Furniture', type: 'textarea' },
      { name: 'priorities', label: 'Traffic / Use Priorities', type: 'textarea', placeholder: 'Conversation seating, work area, kid play, accessibility' },
    ],
  },
  {
    id: 'accessibility-recommender',
    title: 'Accessibility Recommender',
    icon: '♿',
    endpoint: '/ai/accessibility-recommender',
    desc: 'Inclusive design recommendations across structural, furniture, fixtures, lighting, color, sensory, and wayfinding.',
    fields: [
      { name: 'roomType', label: 'Room / Space', type: 'select', options: ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Dining Room', 'Home Office', 'Hallway / Entry', 'Whole Home'] },
      { name: 'mobility_needs', label: 'Mobility Needs', type: 'select', options: ['None specific', 'Wheelchair', 'Walker', 'Limited mobility', 'Aging-in-place'] },
      { name: 'sensory_needs', label: 'Sensory Needs', type: 'textarea', placeholder: 'Low vision, hard of hearing, autism-friendly, low light' },
      { name: 'cognitive_needs', label: 'Cognitive Needs', type: 'textarea', placeholder: 'Memory care, dementia-friendly cues' },
      { name: 'budget', label: 'Budget ($)', type: 'number', placeholder: '15000' },
      { name: 'constraints', label: 'Constraints', type: 'textarea', placeholder: 'Renting, historic home, structural limits' },
    ],
  },
  {
    id: 'sustainability-score',
    title: 'Sustainability Score',
    icon: '🌱',
    endpoint: '/ai/sustainability-score',
    desc: 'Score sustainability of materials, furniture, and finishes; get lower-impact swap suggestions.',
    fields: [
      { name: 'roomType', label: 'Room', type: 'select', options: ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Dining Room', 'Home Office', 'Outdoor', 'Whole Home'] },
      { name: 'region', label: 'Region', type: 'text', placeholder: 'e.g., Pacific Northwest, US' },
      { name: 'materials', label: 'Materials', type: 'textarea', placeholder: 'Oak hardwood floors, granite countertops, drywall...' },
      { name: 'furniture', label: 'Furniture', type: 'textarea', placeholder: 'Leather sofa, glass coffee table, MDF shelving...' },
      { name: 'finishes', label: 'Finishes / paints / coatings', type: 'textarea', placeholder: 'Latex paint, polyurethane, etc.' },
      { name: 'lifespan_years_target', label: 'Target lifespan (years)', type: 'number', placeholder: '15' },
    ],
  },
  {
    id: 'cost-prediction',
    title: 'Design Cost Predictor',
    icon: '💰',
    endpoint: '/ai/cost-prediction',
    desc: 'Heuristic cost prediction with itemized bands, labor/material split, and savings opportunities.',
    fields: [
      { name: 'roomType', label: 'Room', type: 'select', options: ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Dining Room', 'Home Office', 'Whole Home'] },
      { name: 'square_footage', label: 'Square footage', type: 'number', placeholder: '300' },
      { name: 'style', label: 'Style', type: 'text', placeholder: 'modern minimalist, mid-century, traditional...' },
      { name: 'quality_tier', label: 'Quality tier', type: 'select', options: ['budget', 'mid-range', 'high-end', 'luxury'] },
      { name: 'location', label: 'Location / labor market', type: 'text', placeholder: 'e.g., Seattle, US' },
      { name: 'materials', label: 'Materials', type: 'textarea' },
      { name: 'furniture', label: 'Furniture', type: 'textarea' },
      { name: 'finishes', label: 'Finishes', type: 'textarea' },
    ],
  },
  {
    id: 'design-consultant-turn',
    title: 'Agentic Design Consultant',
    icon: '🤝',
    endpoint: '/ai/design-consultant-turn',
    desc: 'Multi-turn iteration loop: critique current design and produce a revised plan plus clarifying questions.',
    fields: [
      { name: 'roomContext', label: 'Room context', type: 'textarea', placeholder: 'Room type, dimensions, lighting, occupants, intended uses...' },
      { name: 'currentDesign', label: 'Current accepted design (optional)', type: 'textarea', placeholder: 'Latest design state to iterate on. Leave empty for first turn.' },
      { name: 'userTurn', label: 'Your latest message to the consultant', type: 'textarea', placeholder: 'I want a calmer palette, but the kids still need a play zone...' },
    ],
  },
];

export default function AdvancedAITools() {
  const [tab, setTab] = useState(TOOLS[0].id);
  const [forms, setForms] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const tool = TOOLS.find((t) => t.id === tab);
  const formData = forms[tab] || {};

  const setField = (name, value) => {
    setForms((p) => ({ ...p, [tab]: { ...(p[tab] || {}), [name]: value } }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const body = {};
      tool.fields.forEach((f) => {
        const v = formData[f.name];
        if (v === '' || v === undefined || v === null) return;
        if (f.type === 'number') body[f.name] = Number(v);
        else body[f.name] = v;
      });
      const res = await api.post(tool.endpoint, body);
      setResult(res.data);
    } catch (err) {
      if (err.response?.status === 503) {
        setError('AI service unavailable: OPENROUTER_API_KEY is not configured.');
      } else {
        setError(err.response?.data?.message || err.response?.data?.error || err.message || 'Request failed');
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 4px' }}>✨ Advanced AI Tools</h1>
        <p style={{ color: '#64748b' }}>Trend forecasting, room layout optimization, and accessibility recommendations.</p>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setTab(t.id); setError(null); setResult(null); }}
            style={{
              padding: '10px 16px', borderRadius: 8, border: '1px solid #cbd5e1',
              background: tab === t.id ? '#6366f1' : 'white',
              color: tab === t.id ? 'white' : '#0f172a',
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            <span style={{ marginRight: 6 }}>{t.icon}</span>{t.title}
          </button>
        ))}
      </div>

      <div style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <h3 style={{ marginTop: 0 }}>{tool.icon} {tool.title}</h3>
        <p style={{ color: '#64748b' }}>{tool.desc}</p>

        <form onSubmit={submit}>
          {tool.fields.map((f) => (
            <div key={f.name} style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{f.label}</label>
              {f.type === 'select' ? (
                <select
                  value={formData[f.name] || ''}
                  onChange={(e) => setField(f.name, e.target.value)}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}
                >
                  <option value="">-- Select --</option>
                  {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea
                  rows={3}
                  value={formData[f.name] || ''}
                  placeholder={f.placeholder || ''}
                  onChange={(e) => setField(f.name, e.target.value)}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit' }}
                />
              ) : (
                <input
                  type={f.type || 'text'}
                  value={formData[f.name] || ''}
                  placeholder={f.placeholder || ''}
                  onChange={(e) => setField(f.name, e.target.value)}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}
                />
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 20px', borderRadius: 8, border: 'none',
              background: loading ? '#94a3b8' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Generating...' : 'Run Analysis'}
          </button>
        </form>

        {error && (
          <div style={{ marginTop: 16, padding: 12, background: '#fee2e2', color: '#991b1b', borderRadius: 8, border: '1px solid #fecaca' }}>{error}</div>
        )}

        {result && (
          <div style={{ marginTop: 16, padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <h4 style={{ marginTop: 0 }}>Result</h4>
            <pre style={{ background: '#0f172a', color: '#e2e8f0', padding: 14, borderRadius: 8, overflow: 'auto', fontSize: 12, maxHeight: 520 }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
