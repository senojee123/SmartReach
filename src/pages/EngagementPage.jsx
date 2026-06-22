import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Tv, 
  Star, 
  Send, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  MessageSquare
} from 'lucide-react';

const EngagementPage = () => {
  const [searchParams] = useSearchParams();
  const boardId = searchParams.get('boardId');
  const campaignId = searchParams.get('campaignId');
  const assetId = searchParams.get('assetId');

  // Rating and Poll states
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Status states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. Log QR scan automatically when the page loads
  useEffect(() => {
    const logScanEvent = async () => {
      if (!boardId || !campaignId || !assetId) {
        setError('Invalid interaction link. Please check your QR code URL.');
        setLoading(false);
        return;
      }

      try {
        await axios.post('/api/engagement/scan', {
          boardId,
          campaignId,
          assetId
        });
      } catch (err) {
        console.error('Failed to log scan event:', err);
        // We do not block the UI even if logging the scan fails, to let the user finish the poll
      } finally {
        setLoading(false);
      }
    };

    logScanEvent();
  }, [boardId, campaignId, assetId]);

  // 2. Submit rating poll feedback
  const handlePollSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a star rating before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await axios.post('/api/engagement/poll', {
        boardId,
        campaignId,
        assetId,
        rating,
        feedback
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit poll feedback:', err);
      setError('Failed to submit response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-400">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="mt-4 text-xs font-semibold tracking-wider uppercase">Connecting to Smartboard node...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 select-none font-sans">
      
      {/* Top logo */}
      <header className="py-4 flex justify-center items-center space-x-2 border-b border-slate-900">
        <Tv className="w-6 h-6 text-blue-500 stroke-[2.2]" />
        <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          SmartReach Screen Interaction
        </span>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center py-8">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          
          {/* Decorative radial gradient glow */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />

          {submitted ? (
            /* Success Response State */
            <div className="text-center py-6 space-y-6 animate-fade-in">
              <div className="flex justify-center">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 stroke-[1.5] animate-scale-in" />
              </div>
              <div className="space-y-2.5">
                <h2 className="text-xl font-extrabold text-slate-100">Thank You!</h2>
                <p className="text-xs text-slate-400 leading-relaxed px-4">
                  Your feedback has been successfully registered and synced with our smartboard analytics center.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => {
                    setRating(0);
                    setFeedback('');
                    setSubmitted(false);
                  }}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-xl text-xs font-semibold text-slate-300 transition-colors shadow-sm"
                >
                  Submit Another Response
                </button>
              </div>
            </div>
          ) : (
            /* Form Poll State */
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest bg-blue-950/40 border border-blue-900/40 px-3 py-1 rounded-full">
                  Live Scanner Poll
                </span>
                <h2 className="text-lg font-bold text-slate-100 mt-2">How was your display experience?</h2>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Help us calibrate screen visibility and media quality by sharing a quick rating.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-rose-950/30 border border-rose-900/50 rounded-xl text-xs text-rose-400 flex items-start space-x-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handlePollSubmit} className="space-y-6">
                
                {/* Stars Selection widget */}
                <div className="flex flex-col items-center space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Your Rating</span>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isActive = (hoverRating || rating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 focus:outline-none transition-transform active:scale-95"
                        >
                          <Star 
                            className={`w-9 h-9 transition-colors ${
                              isActive 
                                ? 'fill-amber-400 text-amber-400' 
                                : 'text-slate-700 hover:text-slate-600'
                            }`} 
                            strokeWidth={1.8}
                          />
                        </button>
                      );
                    })}
                  </div>
                  {rating > 0 && (
                    <span className="text-[11px] font-semibold text-amber-400 transition-all">
                      {rating === 5 ? 'Excellent!' : rating === 4 ? 'Very Good' : rating === 3 ? 'Average' : rating === 2 ? 'Poor' : 'Very Poor'}
                    </span>
                  )}
                </div>

                {/* Optional Feedback Comment Box */}
                <div className="space-y-1.5">
                  <label htmlFor="comments" className="block text-[10px] uppercase font-bold tracking-wider text-slate-500">
                    Optional Comments
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute top-3 left-3 flex items-center pointer-events-none">
                      <MessageSquare className="h-4 w-4 text-slate-600" />
                    </div>
                    <textarea
                      id="comments"
                      rows={3}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Share your experience (e.g. content clarity, visual quality...)"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting || rating === 0}
                  className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-xs font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <Loader2 className="w-4.5 h-4.5 animate-spin mr-1.5" />
                  ) : (
                    <Send className="w-4 h-4 mr-1.5" />
                  )}
                  <span>Submit Feedback</span>
                </button>

              </form>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center border-t border-slate-900">
        <span className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold block">
          Powered by SmartReach Analytics
        </span>
      </footer>

    </div>
  );
};

export default EngagementPage;
