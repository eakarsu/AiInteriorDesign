import React, { useEffect, useState } from 'react';
import api from '../api';

/* Apply pass 5: 4-tab page covering project management (milestones + budget),
   designer marketplace, and integration status. */
export default function Pass5Tools() {
  const [tab, setTab] = useState('milestones');
  return (
    <div style={{ padding: 16 }}>
      <h2>Pass 5 Tools</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['milestones', 'budget', 'marketplace', 'integrations'].map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 12px', background: tab === t ? '#222' : '#fff', color: tab === t ? '#fff' : '#222', border: '1px solid #ccc' }}>{t}</button>
        ))}
      </div>
      {tab === 'milestones' && <Milestones />}
      {tab === 'budget' && <Budget />}
      {tab === 'marketplace' && <Marketplace />}
      {tab === 'integrations' && <Integrations />}
    </div>
  );
}

function Milestones() {
  const [designId, setDesignId] = useState('');
  const [list, setList] = useState([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState(null);
  async function load() {
    setError(null);
    try { const r = await api.get('/project-management/milestones', { params: { design_id: designId } }); setList(r.data.milestones || []); }
    catch (e) { setError(e.response?.data?.error || e.message); }
  }
  async function add() {
    if (!designId || !title) return;
    try { await api.post('/project-management/milestones', { design_id: designId, title, target_date: date || null }); setTitle(''); setDate(''); load(); }
    catch (e) { setError(e.response?.data?.error || e.message); }
  }
  return (
    <div>
      <h3>Project Milestones</h3>
      <input value={designId} onChange={e => setDesignId(e.target.value)} placeholder="design_id (UUID)" />
      <button onClick={load}>Load</button>
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="title" />
        <input value={date} onChange={e => setDate(e.target.value)} placeholder="YYYY-MM-DD" />
        <button onClick={add}>Add</button>
      </div>
      {error && <div style={{ color: 'crimson' }}>{error}</div>}
      <ul>{list.map(m => <li key={m.id}>{m.title} — {m.status} ({m.target_date || 'no date'})</li>)}</ul>
    </div>
  );
}

function Budget() {
  const [designId, setDesignId] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [line, setLine] = useState({ category: '', description: '', budget_amount: '', actual_amount: '' });
  async function load() {
    setError(null);
    try { const r = await api.get('/project-management/budget', { params: { design_id: designId } }); setData(r.data); }
    catch (e) { setError(e.response?.data?.error || e.message); }
  }
  async function add() {
    if (!designId) return;
    try { await api.post('/project-management/budget', { design_id: designId, ...line }); setLine({ category: '', description: '', budget_amount: '', actual_amount: '' }); load(); }
    catch (e) { setError(e.response?.data?.error || e.message); }
  }
  return (
    <div>
      <h3>Budget Tracker</h3>
      <input value={designId} onChange={e => setDesignId(e.target.value)} placeholder="design_id" />
      <button onClick={load}>Load</button>
      <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
        {Object.keys(line).map(k => <input key={k} value={line[k]} onChange={e => setLine({ ...line, [k]: e.target.value })} placeholder={k} />)}
        <button onClick={add}>Add line</button>
      </div>
      {error && <div style={{ color: 'crimson' }}>{error}</div>}
      {data && <pre style={{ background: '#f6f6f6', padding: 8 }}>{JSON.stringify(data.summary, null, 2)}</pre>}
      {data && <ul>{data.lines.map(l => <li key={l.id}>{l.category}: {l.description} — budget {l.budget_amount} / actual {l.actual_amount}</li>)}</ul>}
    </div>
  );
}

function Marketplace() {
  const [filters, setFilters] = useState({ style: '', region: '', max_rate: '', min_years: '' });
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  async function search() {
    setError(null);
    try { const r = await api.get('/marketplace/search', { params: filters }); setResults(r.data.designers || []); }
    catch (e) { setError(e.response?.data?.error || e.message); }
  }
  return (
    <div>
      <h3>Designer Marketplace</h3>
      <div style={{ display: 'flex', gap: 8 }}>
        {Object.keys(filters).map(k => <input key={k} value={filters[k]} onChange={e => setFilters({ ...filters, [k]: e.target.value })} placeholder={k} />)}
        <button onClick={search}>Search</button>
      </div>
      {error && <div style={{ color: 'crimson' }}>{error}</div>}
      <ul>{results.map(d => <li key={d.id}>{d.display_name} — {d.years_experience}y, ${d.hourly_rate}/hr {d.verified ? '✓' : ''}</li>)}</ul>
    </div>
  );
}

function Integrations() {
  const [status, setStatus] = useState(null);
  useEffect(() => { api.get('/integrations/status').then(r => setStatus(r.data)).catch(() => {}); }, []);
  if (!status) return <div>Loading...</div>;
  return (
    <div>
      <h3>Integration Status</h3>
      <ul>{Object.entries(status).map(([k, v]) => <li key={k}>{k}: {v ? 'configured' : 'NOT configured (returns 503)'}</li>)}</ul>
      <p>See <code>_BACKLOG_NEEDS_CREDS.md</code>.</p>
    </div>
  );
}
