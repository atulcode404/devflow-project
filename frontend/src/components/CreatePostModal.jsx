import React, { useState } from 'react';
import { X, Sparkles, Loader2, Code, HelpCircle } from 'lucide-react';
import api from '../services/api';

const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requiredSkills: '',
    projectType: 'Side Project',
    experienceLevel: 'Intermediate',
    contactMethod: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const skillsArray = formData.requiredSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await api.post('/posts', {
        ...formData,
        requiredSkills: skillsArray,
      });

      onPostCreated(res.data);
      setFormData({
        title: '',
        description: '',
        requiredSkills: '',
        projectType: 'Side Project',
        experienceLevel: 'Intermediate',
        contactMethod: '',
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Sparkles size={16} />
            </div>
            <h3 className="font-extrabold text-slate-100 text-base">New Collaboration Post</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-200 hover:bg-slate-850 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Project Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Project Title</label>
            <input 
              type="text" 
              name="title"
              placeholder="e.g. Co-founder for SaaS Startup Idea"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-sm transition placeholder-slate-650"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Project Details</label>
            <textarea 
              name="description"
              rows="3"
              placeholder="Explain the idea, what you've built so far, and who you are looking for..."
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-sm transition resize-none placeholder-slate-655"
              value={formData.description}
              onChange={handleChange}
              required
            ></textarea>
          </div>

          {/* Comma-separated Skills */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
              <Code size={13} className="text-slate-500" /> Required Skills (comma separated)
            </label>
            <input 
              type="text" 
              name="requiredSkills"
              placeholder="e.g. React, Node.js, Tailwind, MongoDB"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-sm transition placeholder-slate-655"
              value={formData.requiredSkills}
              onChange={handleChange}
            />
          </div>

          {/* Project Type & Experience Level */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Project Type</label>
              <select
                name="projectType"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-sm transition"
                value={formData.projectType}
                onChange={handleChange}
              >
                <option value="Side Project">Side Project</option>
                <option value="Startup">Startup Idea</option>
                <option value="Hackathon">Hackathon</option>
                <option value="Open Source">Open Source</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Experience Level</label>
              <select
                name="experienceLevel"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-sm transition"
                value={formData.experienceLevel}
                onChange={handleChange}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Contact Method */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
              <HelpCircle size={13} className="text-slate-500" /> How to Contact You
            </label>
            <input 
              type="text" 
              name="contactMethod"
              placeholder="e.g. Email (dev@example.com), Discord ID, or PM"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-sm transition placeholder-slate-655"
              value={formData.contactMethod}
              onChange={handleChange}
              required
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-850">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-6 rounded-xl transition duration-200 flex items-center justify-center gap-2 text-xs shadow-md shadow-indigo-950/20 disabled:opacity-75 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-3.5 w-3.5" /> Posting...
                </>
              ) : (
                'Publish Post'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default CreatePostModal;
