import { useEffect, useState } from 'react';

function getScoreColor(score) {
  if (score >= 90) return '#4B3F8F'; // purple
  if (score >= 75) return '#22c55e'; // green
  if (score >= 50) return '#f59e0b'; // amber
  return '#ef4444'; // red
}

function getPerformanceLabel(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 50) return 'Satisfactory';
  return 'Needs Improvement';
}

export default function ScoreRing({ score = 0, maxScore = 100 }) {
  const [animatedOffset, setAnimatedOffset] = useState(283); // full circumference
  const percentage = Math.round((score / maxScore) * 100);
  const color = getScoreColor(percentage);
  const label = getPerformanceLabel(percentage);

  const radius = 45;
  const circumference = 2 * Math.PI * radius; // ~283

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => {
      const offset = circumference - (percentage / 100) * circumference;
      setAnimatedOffset(offset);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage, circumference]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-44 h-44 md:w-52 md:h-52">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          {/* Score circle */}
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animatedOffset}
            className="score-ring-circle"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl md:text-5xl font-bold" style={{ color }}>{score}</span>
          <span className="text-text-secondary text-sm">/ {maxScore}</span>
        </div>
      </div>

      {/* Performance label */}
      <span
        className="px-4 py-1.5 rounded-full text-white text-sm font-semibold"
        style={{ backgroundColor: color }}
      >
        {label}
      </span>
    </div>
  );
}
