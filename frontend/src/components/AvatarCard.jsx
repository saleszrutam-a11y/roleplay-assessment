export default function AvatarCard({ name, role, initials, color = 'purple', isSpeaking = false, isUser = false }) {
  const colorMap = {
    purple: {
      bg: 'from-primary to-customer',
      ring: 'animate-pulse-purple',
      border: 'border-primary/20',
    },
    teal: {
      bg: 'from-secondary to-emerald-400',
      ring: 'animate-pulse-teal',
      border: 'border-secondary/20',
    },
  };

  const c = colorMap[color] || colorMap.purple;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar circle */}
      <div
        className={`relative w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br ${c.bg}
          flex items-center justify-center text-white text-2xl md:text-3xl font-bold
          shadow-lg ${isSpeaking ? c.ring : ''}`}
      >
        {isUser ? (
          <svg className="w-12 h-12 md:w-14 md:h-14 text-white/90" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
          </svg>
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {/* Name and role */}
      <div className="text-center">
        <p className="font-semibold text-text-primary text-sm md:text-base">{name}</p>
        <p className="text-text-secondary text-xs md:text-sm">{role}</p>
      </div>
    </div>
  );
}
