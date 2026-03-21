function getBarColor(score, max) {
  const pct = (score / max) * 100;
  if (pct >= 80) return 'bg-green-500';
  if (pct >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

export default function ScoreCriteria({ criteria = [] }) {
  return (
    <div className="space-y-3">
      {criteria.map((c) => {
        const pct = Math.round((c.score / c.max_points) * 100);
        return (
          <div key={c.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm text-text-primary">{c.criterion}</span>
              <span className="text-sm font-semibold text-text-primary">
                {c.score}/{c.max_points}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full transition-all duration-1000 ${getBarColor(c.score, c.max_points)}`}
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Feedback */}
            {c.feedback && (
              <p className="text-xs text-text-secondary italic">{c.feedback}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
