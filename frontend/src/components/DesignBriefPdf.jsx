import React, { useState } from 'react';
import api from '../api';
import { Download, FileText } from 'lucide-react';

const DesignBriefPdf = () => {
  const [form, setForm] = useState({
    projectName: 'Modern Loft Refresh',
    clientName: 'A. Karsu',
    roomType: 'Living Room',
    style: 'Modern',
    palette: 'Warm Neutrals',
    budget: 8500,
    requirements: 'Open-concept living room with reading nook. Pet-friendly fabrics. Statement lighting.',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastFile, setLastFile] = useState('');

  const onChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/custom-views/design-brief-pdf', form, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safe = (form.projectName || 'design-brief').replace(/[^a-z0-9-_]+/gi, '_');
      a.download = `design-brief-${safe}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setLastFile(a.download);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  const field = (label, key, type = 'text') => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={onChange(key)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      />
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm" data-testid="design-brief-pdf">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-emerald-600" />
        <h3 className="text-lg font-semibold text-gray-800">Design Brief PDF</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {field('Project Name', 'projectName')}
        {field('Client Name', 'clientName')}
        {field('Room Type', 'roomType')}
        {field('Style', 'style')}
        {field('Palette', 'palette')}
        {field('Budget (USD)', 'budget', 'number')}
      </div>
      <div className="mt-3">
        <label className="block text-xs font-medium text-gray-600 mb-1">Requirements</label>
        <textarea
          rows={4}
          value={form.requirements}
          onChange={onChange('requirements')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>
      {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
      {lastFile && !error && (
        <div className="mt-3 text-sm text-emerald-600">Downloaded {lastFile}</div>
      )}
      <button
        onClick={generate}
        disabled={loading}
        className="mt-4 inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
      >
        <Download className="w-4 h-4" />
        {loading ? 'Generating…' : 'Download PDF Brief'}
      </button>
    </div>
  );
};

export default DesignBriefPdf;
