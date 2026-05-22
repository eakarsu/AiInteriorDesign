import React, { useEffect, useState } from 'react';
import api from '../api';
import { Plus, Save, Trash2, Sofa, Pencil, X } from 'lucide-react';

const empty = { style: '', furniture: '', notes: '' };

const DesignStyleRulesEditor = () => {
  const [rules, setRules] = useState([]);
  const [styles, setStyles] = useState([]);
  const [draft, setDraft] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/custom-views/style-rules');
      setRules(res.data.rules || []);
      setStyles(res.data.styles || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!draft.style.trim()) { setError('Style is required'); return; }
    try {
      await api.post('/custom-views/style-rules', {
        style: draft.style.trim(),
        furniture: draft.furniture,
        notes: draft.notes,
      });
      setDraft(empty);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const startEdit = (rule) => {
    setEditingId(rule.id);
    setEditDraft({
      style: rule.style,
      furniture: Array.isArray(rule.furniture) ? rule.furniture.join(', ') : (rule.furniture || ''),
      notes: rule.notes || '',
    });
  };

  const saveEdit = async () => {
    try {
      await api.put(`/custom-views/style-rules/${editingId}`, {
        style: editDraft.style,
        furniture: editDraft.furniture,
        notes: editDraft.notes,
      });
      setEditingId(null);
      setEditDraft(empty);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/custom-views/style-rules/${id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm" data-testid="style-rules-editor">
      <div className="flex items-center gap-2 mb-1">
        <Sofa className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-800">Design Style Rules</h3>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Map each style to recommended furniture. {styles.length > 0 && `Known styles: ${styles.length}.`}
      </p>

      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

      {/* Create */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Style</label>
          <input
            value={draft.style}
            onChange={(e) => setDraft({ ...draft, style: e.target.value })}
            placeholder="e.g. Coastal"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Furniture (comma-separated)</label>
          <input
            value={draft.furniture}
            onChange={(e) => setDraft({ ...draft, furniture: e.target.value })}
            placeholder="Rattan Chair, Linen Sofa, Driftwood Table"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <button
          onClick={create}
          className="inline-flex items-center justify-center gap-2 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700"
        >
          <Plus className="w-4 h-4" /> Add Rule
        </button>
      </div>
      <div className="mb-6">
        <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
        <input
          value={draft.notes}
          onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
          placeholder="Short guidance for this style"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="text-gray-500 text-sm">Loading rules…</div>
      ) : (
        <div className="space-y-2">
          {rules.length === 0 && (
            <div className="text-sm text-gray-500">No rules yet — add one above.</div>
          )}
          {rules.map((rule) => (
            <div key={rule.id} className="border border-gray-200 rounded-lg p-3">
              {editingId === rule.id ? (
                <div className="space-y-2">
                  <input
                    value={editDraft.style}
                    onChange={(e) => setEditDraft({ ...editDraft, style: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    value={editDraft.furniture}
                    onChange={(e) => setEditDraft({ ...editDraft, furniture: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    value={editDraft.notes}
                    onChange={(e) => setEditDraft({ ...editDraft, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveEdit}
                      className="inline-flex items-center gap-1 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-emerald-700"
                    >
                      <Save className="w-4 h-4" /> Save
                    </button>
                    <button
                      onClick={() => { setEditingId(null); setEditDraft(empty); }}
                      className="inline-flex items-center gap-1 bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-300"
                    >
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{rule.style}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(rule.furniture || []).map((f) => (
                        <span key={f} className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full text-xs">{f}</span>
                      ))}
                    </div>
                    {rule.notes && <div className="text-xs text-gray-500 mt-1">{rule.notes}</div>}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEdit(rule)}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => remove(rule.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DesignStyleRulesEditor;
