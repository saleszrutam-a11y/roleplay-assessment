import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AvatarCard from '../components/AvatarCard';
import useSession from '../hooks/useSession';

export default function HomePage() {
  const navigate = useNavigate();
  const { startSession } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleStart = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await startSession();
      navigate(`/roleplay?session=${data.session_id}`);
    } catch (err) {
      console.error('Failed to start session:', err);
      setError('Failed to connect to server. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-8 md:py-16">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">AI Roleplay Assessment</h1>
        <p className="text-text-secondary text-sm md:text-base">Practice customer service skills with AI-powered scenarios</p>
      </div>

      {/* Scenario Card */}
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        {/* Scenario header */}
        <div className="bg-gradient-to-r from-primary to-customer px-6 py-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full">In-Store</span>
            <span className="bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full">5 min</span>
            <span className="bg-amber-400/90 text-white text-xs font-medium px-3 py-1 rounded-full">Intermediate</span>
          </div>
          <h2 className="text-white text-lg md:text-xl font-bold mt-3">
            Walk-In SIM Replacement — Stolen Phone
          </h2>
        </div>

        {/* Scenario brief */}
        <div className="px-6 py-5">
          <p className="text-text-secondary text-sm leading-relaxed">
            A male customer walks into your ConnectIndia Telecom store. His phone was stolen this morning
            at a metro station. He&apos;s anxious about his banking apps and needs a SIM replacement.
            Handle his request following proper store protocol.
          </p>
        </div>

        {/* Participant cards */}
        <div className="px-6 pb-6">
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-background rounded-xl p-5 flex flex-col items-center">
              <AvatarCard
                name="Rahul Mehta"
                role="Customer (AI)"
                initials="RM"
                color="purple"
              />
            </div>
            <div className="bg-background rounded-xl p-5 flex flex-col items-center">
              <AvatarCard
                name="You"
                role="Store Executive"
                color="teal"
                isUser
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl text-center">
              {error}
            </div>
          )}

          {/* Start button */}
          <button
            onClick={handleStart}
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3.5 rounded-full
              transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] text-base
              disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Connecting...' : 'Start Assessment'}
          </button>
        </div>
      </div>

      {/* Footer note */}
      <p className="mt-6 text-text-secondary text-xs text-center">
        Your microphone will be used for speech recognition during the assessment.
      </p>
    </div>
  );
}
