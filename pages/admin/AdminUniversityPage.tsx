import React, { useEffect, useState } from 'react';
import { Building2, Globe, Save, Loader2, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import { universityService } from '../../services/universityService';

interface University {
  _id: string;
  name: string;
  code: string;
  description?: string;
  website?: string;
}

const inputCls =
  'w-full bg-[#0f1624] border border-[#263248] rounded-lg px-3.5 py-2.5 text-sm text-[#f3f6ff] placeholder-[#6e7a94] focus:outline-none focus:border-[#00a859]/60 transition-colors';
const labelCls = 'block text-xs font-bold uppercase tracking-wider text-[#8390ac] mb-2';

const AdminUniversityPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [university, setUniversity] = useState<University | null>(null);
  const [form, setForm] = useState({ name: '', description: '', website: '' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = (await universityService.getMyUniversity()) as University;
        if (cancelled) return;
        setUniversity(data);
        setForm({
          name: data.name || '',
          description: data.description || '',
          website: data.website || '',
        });
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Could not load your university');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.name.trim()) {
      setError('University name is required');
      return;
    }
    setSaving(true);
    try {
      const res = (await universityService.updateMyUniversity({
        name: form.name.trim(),
        description: form.description.trim(),
        website: form.website.trim(),
      })) as { university: University };
      setUniversity(res.university);
      setForm({
        name: res.university.name || '',
        description: res.university.description || '',
        website: res.university.website || '',
      });
      setSuccess('University details saved.');
    } catch (err: any) {
      setError(err?.message || 'Could not save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#00a859]" size={26} />
      </div>
    );
  }

  if (!university) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
        {error || 'No university is associated with this account.'}
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-[#00a859]/12 border border-[#00a859]/25 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-[#00a859]" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#f3f6ff]">Your University</h1>
          <p className="text-sm text-[#9aa5bf]">Edit the details students see for your institution.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5 rounded-2xl border border-[#263248] bg-[#121a2a] p-6">
        {/* Code — immutable */}
        <div>
          <label className={labelCls}>University Code</label>
          <div className="flex items-center gap-2">
            <input value={university.code} readOnly disabled className={`${inputCls} opacity-60 cursor-not-allowed`} />
            <span className="inline-flex items-center gap-1 text-[11px] text-[#6e7a94] whitespace-nowrap">
              <Lock size={12} /> Locked
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-[#6e7a94]">
            The code links your students, challenges and competitions, so it can&apos;t be changed here.
          </p>
        </div>

        {/* Name */}
        <div>
          <label className={labelCls}>Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            maxLength={120}
            placeholder="e.g., Middle Technical University"
            className={inputCls}
            required
          />
        </div>

        {/* Website */}
        <div>
          <label className={labelCls}>Website</label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6e7a94]" />
            <input
              value={form.website}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
              maxLength={200}
              placeholder="https://example.edu"
              type="url"
              className={`${inputCls} pl-9`}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className={labelCls}>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            maxLength={1000}
            rows={4}
            placeholder="A short description of your university or program."
            className={`${inputCls} resize-none`}
          />
          <p className="mt-1.5 text-[11px] text-[#6e7a94] text-right">{form.description.length}/1000</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
            <AlertCircle size={15} /> {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-lg border border-[#00a859]/30 bg-[#00a859]/10 px-3 py-2.5 text-sm text-[#9fef00]">
            <CheckCircle2 size={15} /> {success}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-[#00a859] px-5 py-2.5 text-sm font-bold text-[#04150c] hover:bg-[#00c267] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </div>
  );
};

export default AdminUniversityPage;
