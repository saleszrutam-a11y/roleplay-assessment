import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import ScoreRing from '../components/ScoreRing';
import ScoreCriteria from '../components/ScoreCriteria';
import useSession from '../hooks/useSession';

export default function ScorePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const sessionId = searchParams.get('session');
  const { getResult } = useSession();

  const [scores, setScores] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [showTranscript, setShowTranscript] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to get scores from navigation state first (passed from RoleplayPage)
    if (location.state?.scores) {
      setScores(location.state.scores);
      setTranscript(location.state.transcript || []);
      setIsLoading(false);
      return;
    }

    // Otherwise fetch from API
    if (sessionId) {
      getResult(sessionId)
        .then((data) => {
          setScores(data.scores || data);
          setTranscript(data.transcript || []);
        })
        .catch((err) => {
          console.error('Error fetching results:', err);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [sessionId, location.state, getResult]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary text-sm">Generating your assessment scores...</p>
        </div>
      </div>
    );
  }

  if (!scores) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-text-secondary mb-4">No scores available.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-primary text-white px-6 py-2 rounded-full text-sm"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 md:py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-1">Assessment Complete</h1>
          <p className="text-text-secondary text-sm">Walk-In SIM Replacement — Stolen Phone</p>
        </div>

        {/* Score ring */}
        <div className="flex justify-center mb-8">
          <ScoreRing score={scores.total_score} maxScore={scores.max_score} />
        </div>

        {/* Overall feedback */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <h3 className="font-semibold text-text-primary text-sm mb-2">Overall Feedback</h3>
          <p className="text-text-secondary text-sm leading-relaxed">{scores.overall_feedback}</p>
        </div>

        {/* Criteria breakdown */}
        <div className="mb-6">
          <h3 className="font-semibold text-text-primary text-sm mb-3">Detailed Scores</h3>
          <ScoreCriteria criteria={scores.criteria_scores} />
        </div>

        {/* Transcript toggle */}
        {transcript.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="flex items-center gap-2 text-primary font-medium text-sm hover:text-primary/80 transition-colors"
            >
              <svg
                className={`w-4 h-4 transition-transform ${showTranscript ? 'rotate-90' : ''}`}
                fill="currentColor" viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              {showTranscript ? 'Hide' : 'View'} Full Transcript
            </button>

            {showTranscript && (
              <div className="mt-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {transcript.map((msg, i) => (
                  <div
                    key={i}
                    className={`px-4 py-3 border-b border-gray-50 ${i % 2 === 0 ? 'bg-background' : 'bg-white'}`}
                  >
                    <span className={`font-semibold text-sm ${msg.speaker === 'Rahul' ? 'text-customer' : 'text-secondary'}`}>
                      {msg.speaker === 'Rahul' ? 'Rahul:' : 'You:'}
                    </span>
                    <span className="ml-2 text-sm text-text-primary">{msg.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-full
              transition-all duration-200 shadow-md text-sm"
          >
            Try Again
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 bg-white hover:bg-gray-50 text-text-primary font-semibold py-3 rounded-full
              transition-all duration-200 shadow-sm border border-gray-200 text-sm"
          >
            Download Report
          </button>
        </div>
      </div>
    </div>
  );
}
