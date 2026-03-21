import { useState } from 'react';

const PROTOCOL_STEPS = [
  'Greet the customer warmly',
  'Ask what assistance they need',
  'Ask for registered mobile number',
  'Verify identity — check Aadhaar card',
  'Acknowledge situation empathetically',
  'Explain SIM replacement process',
  'Inform about replacement charges',
  'Advise about police FIR',
  'Confirm number will be preserved',
  'Hand over new SIM with reference number',
  'Explain activation timeline (2-4 hours)',
  'Ask if anything else is needed',
  'Thank and close professionally',
];

export default function ProtocolChecklist({ checkedSteps = [] }) {
  const [isOpen, setIsOpen] = useState(false);

  const completedCount = checkedSteps.filter(Boolean).length;

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed bottom-24 right-4 z-40 bg-primary text-white rounded-full px-4 py-2 shadow-lg text-sm font-medium"
      >
        Protocol {completedCount}/{PROTOCOL_STEPS.length}
      </button>

      {/* Checklist panel */}
      <div
        className={`
          ${isOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
          fixed md:static bottom-0 left-0 right-0 md:bottom-auto
          z-50 md:z-auto
          bg-white rounded-t-2xl md:rounded-2xl shadow-lg md:shadow-sm
          border border-gray-100
          transition-transform duration-300 md:transition-none
          max-h-[60vh] md:max-h-none overflow-y-auto
        `}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-text-primary text-sm">
            Protocol Checklist ({completedCount}/{PROTOCOL_STEPS.length})
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden text-text-secondary hover:text-text-primary"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Steps */}
        <div className="p-3 space-y-1">
          {PROTOCOL_STEPS.map((step, i) => {
            const checked = checkedSteps[i];
            return (
              <div
                key={i}
                className={`flex items-start gap-2 px-2 py-1.5 rounded-lg text-sm ${
                  checked ? 'bg-green-50' : ''
                }`}
              >
                <span className="mt-0.5 flex-shrink-0">
                  {checked ? (
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" strokeWidth={2} />
                    </svg>
                  )}
                </span>
                <span className={checked ? 'text-green-700 line-through' : 'text-text-secondary'}>
                  {i + 1}. {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
