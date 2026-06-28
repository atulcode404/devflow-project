import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Lock, Code, FileText, Loader2, Sparkles } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    skills: '',
    bio: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Client-side validations
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      // Convert comma separated skills to array
      const skillsArray = formData.skills
        .split(',')
        .map(skill => skill.trim())
        .filter(s => s);

      await register({ ...formData, skills: skillsArray });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 relative overflow-hidden py-12 px-4">
      {/* Decorative blurred background shapes */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl"></div>

      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 sm:p-10 rounded-2xl shadow-2xl w-full max-w-md relative z-10">
        
        {/* Brand Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-2xl shadow-lg shadow-indigo-500/30 mb-3 animate-pulse">
            D
          </div>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 tracking-tight">
            Join DevFlow
          </h2>
          <p className="text-slate-400 text-xs mt-1.5 flex items-center justify-center gap-1">
            <Sparkles size={12} className="text-indigo-400" />
            Build your portfolio & match with peers
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl mb-6 text-xs font-semibold leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Full Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <User size={16} />
              </span>
              <input 
                type="text" 
                name="fullName"
                placeholder="John Doe"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-sm transition placeholder-slate-600"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Mail size={16} />
              </span>
              <input 
                type="email" 
                name="email"
                placeholder="developer@devflow.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-sm transition placeholder-slate-600"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Lock size={16} />
              </span>
              <input 
                type={showPassword ? 'text' : 'password'} 
                name="password"
                placeholder="Min. 6 characters"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-sm transition placeholder-slate-600"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Skills (comma separated)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Code size={16} />
              </span>
              <input 
                type="text" 
                name="skills"
                placeholder="e.g. React, Node.js, Python, CSS"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-sm transition placeholder-slate-600"
                value={formData.skills}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Short Bio */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Short Bio</label>
              <button
                type="button"
                onClick={() => {
                  if (!formData.fullName.trim()) {
                    alert('Please enter your Full Name first to generate a bio.');
                    return;
                  }
                  if (!formData.skills.trim()) {
                    alert('Please enter some Skills first to generate a bio.');
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
            <div className="relative">
              <span className="absolute top-3 left-3.5 text-slate-500">
                <FileText size={16} />
              </span>
              <textarea 
                name="bio"
                placeholder="Tell others about your background..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-sm transition resize-none h-20 placeholder-slate-600"
                value={formData.bio}
                onChange={handleChange}
              ></textarea>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl transition duration-250 flex items-center justify-center gap-2 text-sm shadow-lg shadow-indigo-950/45 mt-2 disabled:opacity-55"
          >
            {loading ? (
              <Loader2 className="animate-spin h-4 w-4" />
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:underline font-bold transition hover:text-indigo-300">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
