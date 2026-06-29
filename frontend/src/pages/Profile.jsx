import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Save, Github, Linkedin, Mail, User, Image, FileText, Code, Loader2, Sparkles, LayoutTemplate } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GithubCard from '../components/GithubCard';

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    headline: '',
    location: '',
    experienceLevel: 'Intermediate',
    availability: 'Open to Work',
    bio: '',
    skills: '',
    githubUsername: '',
    linkedinLink: '',
    portfolio: '',
    website: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [backgroundFile, setBackgroundFile] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        headline: user.headline || '',
        location: user.location || '',
        experienceLevel: user.experienceLevel || 'Intermediate',
        availability: user.availability || 'Open to Work',
        bio: user.bio || '',
        skills: user.skills ? user.skills.join(', ') : '',
        githubUsername: user.githubUsername || '',
        linkedinLink: user.linkedinLink || '',
        portfolio: user.portfolio || '',
        website: user.website || ''
      });
      setPhotoPreview(user.profilePicture || null);
      setBackgroundPreview(user.backgroundPicture || null);
    }
  }, [user]);

  const handleSyncGithub = async () => {
    if (!formData.githubUsername.trim()) {
      setError('Please enter your GitHub Username first to sync.');
      return;
    }
    
    setSyncing(true);
    setError('');
    setSuccess('');
    
    try {
      const res = await api.post('/github/sync', { 
        githubUsername: formData.githubUsername.trim() 
      });
      
      setUser(res.data.user);
      setSuccess('GitHub profile synced successfully!');
      
      setFormData({
        ...formData,
        fullName: res.data.user.fullName || formData.fullName,
        bio: res.data.user.bio || formData.bio,
        skills: res.data.user.skills ? res.data.user.skills.join(', ') : formData.skills,
        githubUsername: res.data.user.githubUsername || formData.githubUsername
      });
      if (res.data.user.profilePicture) {
        setPhotoPreview(res.data.user.profilePicture);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to sync GitHub profile');
    } finally {
      setSyncing(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleBackgroundChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image must be less than 2MB');
        return;
      }
      setBackgroundFile(file);
      setBackgroundPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const skillsArray = formData.skills
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      if (skillsArray.length > 10) {
        setError('You can add up to 10 skills only.');
        setSaving(false);
        return;
      }

      const invalidSkill = skillsArray.find(s => s.length > 25);
      if (invalidSkill) {
        setError(`Skill "${invalidSkill}" is too long. Max 25 characters per skill.`);
        setSaving(false);
        return;
      }

      // Check for duplicates
      const uniqueSkills = [...new Set(skillsArray.map(s => s.toLowerCase()))];
      if (uniqueSkills.length !== skillsArray.length) {
        setError('Duplicate skills are not allowed.');
        setSaving(false);
        return;
      }

      if (photoFile) {
        const uploadData = new FormData();
        uploadData.append('photo', photoFile);
        await api.post('/users/profile/photo', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (backgroundFile) {
        const bgUploadData = new FormData();
        bgUploadData.append('photo', backgroundFile);
        await api.post('/users/profile/background-photo', bgUploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      const res = await api.put('/users/profile', {
        ...formData,
        skills: [...new Set(skillsArray)] // ensure exact case is saved but duplicates removed
      });
      
      setUser(res.data);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Header Background Gradient Banner */}
        <div 
          className="h-40 relative"
          style={{
            backgroundImage: backgroundPreview ? `url(${backgroundPreview})` : 'linear-gradient(to right, #4f46e5, #6d28d9, #7c3aed)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}>
          <div className="absolute inset-0 bg-black/10"></div>
        </div>
        
        <div className="px-6 sm:px-10 pb-10 relative">
          
          {/* Overlapping Profile Picture */}
          <div className="-mt-16 mb-8 flex justify-between items-end">
            <div className="relative group">
              <img 
                src={photoPreview || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'} 
                alt="Profile" 
                className="w-32 h-32 rounded-full border-4 border-slate-900 object-cover shadow-lg bg-slate-900"
              />
              <label className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-full cursor-pointer shadow-lg transition">
                <Image size={16} />
                <input 
                  type="file" 
                  accept="image/jpeg, image/png, image/webp, image/jpg" 
                  className="hidden" 
                  onChange={handlePhotoChange} 
                />
              </label>
            </div>
            <label className="mb-2 bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-full cursor-pointer shadow-lg transition">
              <Image size={16} />
              <input
                type="file"
                accept="image/jpeg, image/png, image/webp, image/jpg"
                className="hidden"
                onChange={handleBackgroundChange}
              />
            </label>
          </div>

          <div className="flex justify-between items-start mb-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100">{user?.fullName || 'Developer'}</h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">Maintain your professional information so other developers can find and match with you.</p>
            </div>
            <button 
              onClick={() => navigate('/portfolio')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition shadow-lg shadow-indigo-950/40"
            >
              <LayoutTemplate size={16} /> View Auto-Portfolio
            </button>
          </div>

          {/* Profile Completion */}
          <div className="mb-8 bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
              <span>Profile Completion</span>
              <span className="text-indigo-400">
                {Math.round(
                  [formData.fullName, formData.headline, formData.bio, formData.skills, formData.location, formData.githubUsername, formData.linkedinLink].filter(Boolean).length / 7 * 100
                )}%
              </span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 transition-all duration-500"
                style={{ width: `${Math.round([formData.fullName, formData.headline, formData.bio, formData.skills, formData.location, formData.githubUsername, formData.linkedinLink].filter(Boolean).length / 7 * 100)}%` }}
              ></div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-xs font-semibold leading-relaxed">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl mb-6 text-xs font-semibold leading-relaxed">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Full Name & Email Row */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                  <User size={14} className="text-slate-500" /> Full Name
                </label>
                <input 
                  type="text" 
                  name="fullName"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-sm transition"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                  <Mail size={14} className="text-slate-500" /> Email Address
                </label>
                <input 
                  type="email" 
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-500 cursor-not-allowed text-sm"
                  value={user?.email || ''}
                  disabled
                />
              </div>
            </div>

            {/* Profile Picture URL removed */}

            {/* Bio Area */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <FileText size={14} className="text-slate-500" /> Professional Bio
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (!formData.fullName.trim()) {
                      alert('Please enter your Full Name first.');
                      return;
                    }
                    if (!formData.skills.trim()) {
                      alert('Please enter some Skills first.');
                      return;
                    }
                    const firstName = formData.fullName.trim().split(' ')[0];
                    const skillsList = formData.skills
                      .split(',')
                      .map(s => s.trim())
                      .filter(Boolean);
                    
                    const lowerSkills = skillsList.map(s => s.toLowerCase());
                    const hasReact = lowerSkills.includes('react');
                    const hasNode = lowerSkills.includes('node') || lowerSkills.includes('node.js');
                    const hasExpress = lowerSkills.includes('express') || lowerSkills.includes('express.js');
                    const hasMongo = lowerSkills.includes('mongodb');
                    
                    let devType = 'full-stack';
                    if (hasReact && (hasNode || hasExpress) && hasMongo) {
                      devType = 'MERN';
                    } else if (hasReact && (hasNode || hasExpress)) {
                      devType = 'full-stack';
                    } else if (hasReact) {
                      devType = 'frontend';
                    } else if (hasNode || hasExpress) {
                      devType = 'backend';
                    }

                    const bioText = `${firstName} is a ${devType} developer skilled in APIs and full-stack apps.`;
                    setFormData({ ...formData, bio: bioText });
                  }}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles size={10} /> Auto-generate Bio
                </button>
              </div>
              <textarea 
                name="bio"
                rows="4"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-sm transition resize-none placeholder-slate-600"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell other developers about your projects, stack, and interests..."
              ></textarea>
            </div>

            {/* Skills Inputs */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Code size={14} className="text-slate-500" /> Skills (comma separated)
                </label>
                <span className={`text-[10px] font-bold ${formData.skills.split(',').filter(s => s.trim()).length > 10 ? 'text-red-400' : 'text-slate-500'}`}>
                  {formData.skills.split(',').filter(s => s.trim()).length}/10 skills added
                </span>
              </div>
              <input 
                type="text" 
                name="skills"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-sm transition"
                value={formData.skills}
                onChange={handleChange}
                placeholder="e.g. JavaScript, React, Node.js"
              />
            </div>

            {/* Social Links Section */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 border-t border-slate-800/60 pt-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Github size={14} className="text-indigo-400" /> GitHub Username
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    name="githubUsername"
                    className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-sm transition placeholder-slate-600"
                    value={formData.githubUsername}
                    onChange={handleChange}
                    placeholder="e.g. torvalds"
                  />
                  <button
                    type="button"
                    disabled={syncing}
                    onClick={handleSyncGithub}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {syncing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    Sync
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Linkedin size={14} className="text-blue-400" /> LinkedIn Profile URL
                </label>
                <input 
                  type="url" 
                  name="linkedinLink"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-sm transition placeholder-slate-600"
                  value={formData.linkedinLink}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <LayoutTemplate size={14} className="text-green-400" /> Portfolio URL
                </label>
                <input 
                  type="url" 
                  name="portfolio"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-sm transition placeholder-slate-600"
                  value={formData.portfolio}
                  onChange={handleChange}
                  placeholder="https://yourportfolio.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <LayoutTemplate size={14} className="text-purple-400" /> Personal Website
                </label>
                <input 
                  type="url" 
                  name="website"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-sm transition placeholder-slate-600"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>

            {/* Social Links Section */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 border-t border-slate-800/60 pt-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Github size={14} className="text-indigo-400" /> GitHub Username
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    name="githubUsername"
                    className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-sm transition placeholder-slate-600"
                    value={formData.githubUsername}
                    onChange={handleChange}
                    placeholder="e.g. torvalds"
                  />
                  <button
                    type="button"
                    disabled={syncing}
                    onClick={handleSyncGithub}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {syncing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    Sync
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Linkedin size={14} className="text-blue-400" /> LinkedIn Profile URL
                </label>
                <input 
                  type="url" 
                  name="linkedinLink"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-sm transition placeholder-slate-600"
                  value={formData.linkedinLink}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <LayoutTemplate size={14} className="text-green-400" /> Portfolio URL
                </label>
                <input 
                  type="url" 
                  name="portfolio"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-sm transition placeholder-slate-600"
                  value={formData.portfolio}
                  onChange={handleChange}
                  placeholder="https://yourportfolio.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <LayoutTemplate size={14} className="text-purple-400" /> Personal Website
                </label>
                <input 
                  type="url" 
                  name="website"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-sm transition placeholder-slate-600"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 flex justify-end border-t border-slate-850 mt-6">
              <button 
                type="submit" 
                disabled={saving}
                className="bg-indigo-650 hover:bg-indigo-550 border border-indigo-500/20 text-white font-bold py-2.5 px-6 rounded-xl transition duration-200 flex items-center justify-center gap-2 text-sm shadow-md shadow-indigo-950/20 disabled:opacity-75"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" /> Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} /> Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* GitHub Card Preview */}
      {user?.githubProfile && (
        <div className="max-w-3xl mx-auto mt-8 mb-10">
          <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2 px-4">
            <Github size={18} className="text-indigo-400" /> Connected GitHub Profile
          </h3>
          <GithubCard user={user} />
        </div>
      )}
    </div>
  );
};

export default Profile;
