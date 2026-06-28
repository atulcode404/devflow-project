import React from 'react';
import { Sparkles, CheckCircle2, XCircle, ChevronRight, User } from 'lucide-react';

const RecommendationCard = ({ recommendation }) => {
  const { project, score, matchedSkills, missingSkills, explanation, metrics } = recommendation;
  
  // Color code based on score
  let scoreColor = "text-indigo-400";
  let bgScoreColor = "bg-indigo-400";
  let ringScoreColor = "ring-indigo-400/30";
  
  if (score >= 80) {
    scoreColor = "text-emerald-400";
    bgScoreColor = "bg-emerald-400";
    ringScoreColor = "ring-emerald-400/30";
  } else if (score < 50) {
    scoreColor = "text-yellow-400";
    bgScoreColor = "bg-yellow-400";
    ringScoreColor = "ring-yellow-400/30";
  }

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition duration-300 shadow-xl group">
      
      {/* Header with Title and Match Score */}
      <div className="flex justify-between items-start gap-4 mb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-100 group-hover:text-indigo-400 transition">{project.title}</h3>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1.5">
            <span className="flex items-center gap-1"><User size={12}/> {project.author?.fullName || 'Unknown'}</span>
            <span>•</span>
            <span className="capitalize">{project.projectType || 'Project'}</span>
            <span>•</span>
            <span className="text-slate-300 font-medium">{project.experienceLevel}</span>
          </div>
        </div>
        
        {/* Match Circle */}
        <div className={`relative flex items-center justify-center w-14 h-14 rounded-full ring-4 ${ringScoreColor} bg-slate-950 shrink-0`}>
          <span className={`text-sm font-black ${scoreColor}`}>{score}%</span>
        </div>
      </div>

      <p className="text-sm text-slate-300 line-clamp-2 mb-5">{project.description}</p>

      {/* AI Explanation Box */}
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 mb-5 flex gap-3 items-start">
        <Sparkles size={16} className="text-indigo-400 shrink-0 mt-0.5" />
        <p className="text-xs text-indigo-300 leading-relaxed font-medium">
          {explanation}
        </p>
      </div>

      {/* Skills Match Section */}
      <div className="space-y-3">
        {matchedSkills?.length > 0 && (
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1.5 block">Matched Skills</span>
            <div className="flex flex-wrap gap-1.5">
              {matchedSkills.map((skill, idx) => (
                <span key={idx} className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-1 rounded-md">
                  <CheckCircle2 size={10} /> {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {missingSkills?.length > 0 && (
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1.5 block">Missing Skills</span>
            <div className="flex flex-wrap gap-1.5">
              {missingSkills.map((skill, idx) => (
                <span key={idx} className="flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-800 border border-slate-700 px-2 py-1 rounded-md">
                  <XCircle size={10} className="text-red-400" /> {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Metrics breakdown (Optional visual) */}
      <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden flex">
            <div className={`h-full ${bgScoreColor}`} style={{ width: `${score}%` }}></div>
          </div>
          <span className="text-[10px] font-bold text-slate-500">COMPATIBILITY</span>
        </div>
        <button className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20">
          View Project <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default RecommendationCard;
