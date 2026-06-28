import React, { useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Mail, Github, Linkedin, MapPin, Briefcase, Calendar, Star, GitFork, Printer, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PortfolioGenerator = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!user) {
    return <div className="text-center p-10 text-white">Loading...</div>;
  }

  const { githubProfile, githubStats, githubLanguages, githubRepos } = user;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 print:bg-white print:text-black">
      
      {/* ── Screen Only Toolbar ── */}
      <div className="print:hidden sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 flex justify-between items-center shadow-lg">
        <button onClick={() => navigate('/profile')} className="flex items-center gap-2 text-slate-400 hover:text-white transition">
          <ArrowLeft size={16} /> Back to Profile
        </button>
        <button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-md shadow-indigo-900/20 transition">
          <Printer size={16} /> Save as PDF
        </button>
      </div>

      {/* ── A4 Page Container ── */}
      <div className="max-w-4xl mx-auto p-8 sm:p-12 print:p-0 bg-slate-900 print:bg-white shadow-2xl print:shadow-none min-h-[1122px] my-8 print:my-0 rounded-xl print:rounded-none">
        
        {/* Header section */}
        <header className="flex flex-col md:flex-row gap-8 items-center md:items-start border-b border-slate-800 print:border-gray-300 pb-8">
          <img 
            src={user.profilePicture} 
            alt={user.fullName} 
            className="w-32 h-32 rounded-full object-cover border-4 border-slate-800 print:border-gray-200" 
          />
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl font-black text-white print:text-black mb-2">{user.fullName}</h1>
            <h2 className="text-xl text-indigo-400 print:text-gray-600 font-bold mb-4">
              {user.experienceLevel} Developer
            </h2>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-slate-400 print:text-gray-600">
              {user.email && <span className="flex items-center gap-1.5"><Mail size={14}/> {user.email}</span>}
              {user.location && <span className="flex items-center gap-1.5"><MapPin size={14}/> {user.location}</span>}
              {user.githubLink && <span className="flex items-center gap-1.5"><Github size={14}/> {user.githubUsername}</span>}
              {user.linkedinLink && <span className="flex items-center gap-1.5"><Linkedin size={14}/> LinkedIn</span>}
            </div>
          </div>
        </header>

        {/* Two-column layout for body */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-10">
          
          {/* Left Column (Main content) */}
          <div className="md:col-span-2 space-y-10">
            
            <section>
              <h3 className="text-xl font-bold uppercase tracking-widest text-slate-500 print:text-gray-400 mb-4 border-b border-slate-800 print:border-gray-200 pb-2">About Me</h3>
              <p className="text-slate-300 print:text-gray-800 leading-relaxed">
                {user.bio || "Passionate developer building modern web applications."}
              </p>
            </section>

            {/* Top Repositories */}
            {githubRepos && githubRepos.length > 0 && (
              <section>
                <h3 className="text-xl font-bold uppercase tracking-widest text-slate-500 print:text-gray-400 mb-4 border-b border-slate-800 print:border-gray-200 pb-2">Featured Projects</h3>
                <div className="space-y-6">
                  {githubRepos.slice(0, 4).map((repo, i) => (
                    <div key={i} className="break-inside-avoid">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-lg font-bold text-white print:text-black">
                          <a href={repo.url} target="_blank" rel="noopener noreferrer">{repo.name}</a>
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-slate-400 print:text-gray-500">
                          {repo.language && <span className="font-semibold">{repo.language}</span>}
                          <span className="flex items-center gap-1"><Star size={12}/> {repo.stars}</span>
                          {repo.forks > 0 && <span className="flex items-center gap-1"><GitFork size={12}/> {repo.forks}</span>}
                        </div>
                      </div>
                      <p className="text-sm text-slate-400 print:text-gray-600 leading-relaxed">
                        {repo.description || "No description provided."}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>

          {/* Right Column (Sidebar) */}
          <div className="space-y-10">
            
            <section>
              <h3 className="text-lg font-bold uppercase tracking-widest text-slate-500 print:text-gray-400 mb-4 border-b border-slate-800 print:border-gray-200 pb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {user.skills?.map((skill, i) => (
                  <span key={i} className="bg-slate-800 print:bg-gray-100 border border-slate-700 print:border-gray-300 text-slate-300 print:text-gray-800 px-3 py-1 rounded-md text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </section>

            {githubLanguages && Object.keys(githubLanguages).length > 0 && (
              <section>
                <h3 className="text-lg font-bold uppercase tracking-widest text-slate-500 print:text-gray-400 mb-4 border-b border-slate-800 print:border-gray-200 pb-2">Languages</h3>
                <div className="space-y-3">
                  {Object.entries(githubLanguages).map(([lang, pct]) => (
                    <div key={lang}>
                      <div className="flex justify-between text-xs text-slate-400 print:text-gray-600 mb-1">
                        <span>{lang}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 print:bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 print:bg-gray-600" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {githubStats && (
              <section>
                <h3 className="text-lg font-bold uppercase tracking-widest text-slate-500 print:text-gray-400 mb-4 border-b border-slate-800 print:border-gray-200 pb-2">GitHub Stats</h3>
                <ul className="space-y-2 text-sm text-slate-300 print:text-gray-800">
                  <li className="flex justify-between">
                    <span>Total Stars</span>
                    <span className="font-bold">{githubStats.totalStars}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Followers</span>
                    <span className="font-bold">{githubProfile?.followers || 0}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Public Repos</span>
                    <span className="font-bold">{githubProfile?.publicRepos || 0}</span>
                  </li>
                </ul>
              </section>
            )}

          </div>
        </div>
        
      </div>
    </div>
  );
};

export default PortfolioGenerator;
