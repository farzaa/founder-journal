'use client';
import React, { useState, useRef, useEffect } from "react";

// Pre-generated summaries for each person
const personSummaries = {
  "Sam": "Feeling inspired after testing the new camera-based logo generator with real users today. The instant feedback loop is working better than expected, though still struggling with edge cases in low-light conditions. Excited to refine the AI's understanding of brand aesthetics based on today's user testing session.",
  "Sharif": "Had a breakthrough moment with the Mac AI tool's voice command system. Finally solved the latency issues that were bugging me all week. Feeling a mix of relief and excitement - the team's feedback on the new gesture controls was super positive. Still need to tackle the battery optimization tomorrow.",
  "Naveed": "The AR glasses prototype is coming together beautifully. Today's focus was on the hand-tracking accuracy, and we're seeing 95% success rate in complex gestures. Feeling proud of the team's progress, though the weight distribution is still a challenge we need to solve.",
  "Bihan": "Spent the day optimizing the AR glasses' field of view. The new lens design is showing promise, but the calibration process is taking longer than expected. Feeling determined to crack this by end of week. The team's energy is high despite the technical challenges.",
  "Max": "The AI workout app's new motion tracking is working like a charm. Today's user testing showed 40% better form correction accuracy. Feeling pumped about the progress, though the calorie burn algorithm needs tweaking. The team's feedback on the new UI was exactly what we needed."
};

// Helper to get previous N dates (including today)
function getPrevDates(n: number) {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(d);
  }
  return dates;
}

// Abbreviated weekday names
const weekdayAbbr = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];

export default function Home() {
  const [value, setValue] = useState("");
  const [placeholder, setPlaceholder] = useState("What did you get done this week?");
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(60); // 1 minute in seconds
  const [showTimer, setShowTimer] = useState(false);
  const [startTimer, setStartTimer] = useState(false);
  const textareaRef = useRef(null);
  const shadowRef = useRef(null);
  const scrollRef = useRef(null);

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && startTimer) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, startTimer]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progress = (timeLeft / 60) * 100;

  // Only today's date
  const today = new Date();
  const formattedToday = `${weekdayAbbr[today.getDay()]}, ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  const generateCompanySummary = async () => {
    setLoading(true);
    try {
      const allSummaries = Object.entries(personSummaries)
        .map(([name, summary]) => `${name}: ${summary}`)
        .join('\n\n');

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-2024-08-06",
          messages: [
            { 
              role: "system", 
              content: "You are a helpful assistant that creates a concise, engaging summary of a company's daily progress and team vibe. Focus on the collective energy, shared challenges, and overall team momentum. Keep it casual and inspiring, highlighting how different team members' work connects and contributes to the bigger picture. Make it feel like a team update that would get everyone excited. SHouldn't give kudos, it's more of a pulse check on the company. Don't be overly positive, don't call out specific names." 
            },
            { 
              role: "user", 
              content: `Here are today's updates from the team:\n\n${allSummaries}\n\nCreate a company-wide summary that captures the team's vibe and progress.` 
            },
          ],
          max_tokens: 150,
          temperature: 1.0,
        }),
      });
      const data = await res.json();
      const companySummary = data.choices?.[0]?.message?.content?.trim() || "";
      setSummary(companySummary);
      setSelectedPerson("Company");
    } catch (err) {
      console.error("Error generating company summary:", err);
      setSummary("Error generating company summary. Please try again.");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (textareaRef.current && shadowRef.current) {
      // @ts-expect-error - refs are properly typed but TypeScript doesn't know about style properties
      textareaRef.current.style.height = 'auto';
      // @ts-expect-error - refs are properly typed but TypeScript doesn't know about scrollHeight
      textareaRef.current.style.height = shadowRef.current.scrollHeight + 'px';
    }
  }, [value]);

  // Add new useEffect to handle focus when placeholder changes
  useEffect(() => {
    if (textareaRef.current && !loading) {
      // @ts-expect-error - refs are properly typed but TypeScript doesn't know about focus method
      textareaRef.current.focus();
    }
  }, [placeholder, loading]);

  const handleBlur = () => {
    if (textareaRef.current) {
      setTimeout(() => {
        // @ts-expect-error - refs are properly typed but TypeScript doesn't know about focus method
        textareaRef.current.focus();
      }, 0);
    }
  };

  // Handle Enter key: send to OpenAI and update placeholder
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.metaKey && e.key === 'Enter' && value.trim() && !loading) {
      e.preventDefault();
      setLoading(true);
      const userMessage = value.trim();
      setValue("");
      
      // Add user message to conversation
      setConversation(prev => [...prev, { role: 'user', content: userMessage }]);

      // Scroll down a bit
      setTimeout(() => {
        if (scrollRef.current) {
          // @ts-expect-error - refs are properly typed but TypeScript doesn't know about scrollIntoView
          scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }, 100);

      // Show and start timer after first answer
      if (conversation.length === 0) {
        setShowTimer(true);
        setStartTimer(true);
      }

      // If timer is at 0 or less than 20s, get summary
      if (timeLeft <= 20) {
        console.log('Full conversation before summary:', [...conversation, { role: 'user', content: userMessage }]);
        try {
          const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: "gpt-4o-2024-08-06",
              messages: [
                { 
                  role: "system", 
                  content: `You take a user's journal entry about their work day and reply back to it as Steve Jobs (but the user does't know you're Steve)

                  Talk through it with me like Steve Jobs would. In fact, keep Steve Job's tone. It should feel like he's giving me his opinions on the transcript + my work. Your goal is to have me do better/ more focused work. Don't quote Steve Jobs, don' assume too much of user. If not enough info -- say so.

                  Don't repeat back the users words.

                  Keep it casual, dont say yo, help me make new connections i don't see, comfort, validate, challenge.

                  Don't ask more q's here. The user can't reply to you at this point.
                  
                  Max 100 words.
                  ` 
                },
                { 
                  role: "user", 
                  content: `Here's the conversation to go through:\n${[...conversation, { role: 'user', content: userMessage }].map(msg => `${msg.role === 'assistant' ? 'Assistant' : 'User'}: ${msg.content}`).join('\n')}` 
                },
              ],
              temperature: 1.0,
            }),
          });
          const data = await res.json();
          const summaryText = data.choices?.[0]?.message?.content?.trim() || "";
          setSummary(summaryText);
          setLoading(false);
          return;
        } catch (error) {
          console.error("Error getting summary:", error);
          setSummary("Error generating summary. Please try again.");
        }
      }

      // If more than 20s left, ask another question
      if (timeLeft > 20) {
        try {
          const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: "gpt-4o-2024-08-06",
              messages: [
                { role: "system", content: `You are a helpful assistant that only asks the next best follow-up question for a user in a check-in conversation. Your goal is to drive focus and have them expand upon how they about the work in general for that specific day. Questions like 'Why do you feel x is the most important thing to work on today?' is a really good question. Or 'How do you feel about x right now?' Only return the next question, nothing else. 57 chars max including spaces. Ask questions relevant to convo. Don't pester them like an annoying micro-manager, let them explode on the page. You have the focus and intenseness of Steve Jobs and you must ask the user questions that may help you spot issues in their thinking, or, simply help them expand upon what they're doing + let them simply journal. Build up to tough q's. Challenge them, but start easy, let them arrive at the answers themselves via inception. Make each question very different from the previous. Try and understand the full scope of the users life, feelings, emotions, goals. Build a model of them via these q's.` },
                { role: "user", content: userMessage },
              ],
              max_tokens: 64,
              temperature: 1.0,
            }),
          });
          const data = await res.json();
          const nextQ = data.choices?.[0]?.message?.content?.trim() || "What else?";
          setPlaceholder(nextQ);
          // Add assistant's question to conversation
          setConversation(prev => [...prev, { role: 'assistant', content: nextQ }]);
          setLoading(false);
        } catch (error) {
          console.error("Error getting next question:", error);
          setPlaceholder("(Error getting next question)");
          setLoading(false);
        }
      }
    }
  };

  // Handle value change
  const handleValueChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };

  return (
    <div className="min-h-screen bg-[#f7f5f3] flex flex-col">
      <div className="flex flex-1">
        {/* Left sidebar */}
        <div className="w-48 flex flex-col justify-between py-8 pl-8 pr-4 left-nav">
          <div className="flex flex-col h-full">
            <span 
              className="font-medium text-[18px] mb-12 block cursor-pointer hover:text-black transition-colors" 
              style={{ color: selectedPerson === "Company" ? '#000000' : '#AEAEAE', letterSpacing: '-0.04em' }}
              onClick={generateCompanySummary}
            >
              Company
            </span>
            <div className="flex-1 flex flex-col justify-center gap-2">
              <span
                className="text-[18px] font-medium"
                style={{
                  color: '#AEAEAE',
                  letterSpacing: '-0.04em',
                }}
              >
                {formattedToday}
              </span>
              <span className="text-xs text-gray-300 mt-1 flex items-center gap-1" style={{letterSpacing: '-0.04em'}}>
                <span className="bg-gray-200 text-gray-700 rounded px-2 py-0.5 font-mono">⌘</span>
                <span className="text-gray-500">+</span>
                <span className="bg-gray-200 text-gray-700 rounded px-2 py-0.5 font-mono">↵</span>
                <span className="ml-1" style={{ color: '#AEAEAE' }}>to continue</span>
              </span>
            </div>
            {showTimer && (
              <div className="mb-2">
                <div className={`text-sm font-medium mb-1 ${startTimer ? 'text-black' : ''}`} style={{ color: startTimer ? '#000000' : '#AEAEAE' }}>
                  {formatTime(timeLeft)} left
                </div>
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ease-linear ${startTimer ? 'bg-black' : 'bg-gray-300'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Main content area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-full h-full flex items-center justify-center bg-[#eceae6] rounded-[40px] relative" style={{ minHeight: '80vh' }}>
            <div className="flex flex-1 items-center justify-center w-full h-full" ref={scrollRef}>
              <div className="relative w-full max-w-2xl flex items-center justify-center">
                {/* Show summary if available */}
                {summary && (
                  <div className="absolute inset-0 flex items-center justify-center w-full text-center text-black font-serif" style={{ fontSize: '1.5rem' }}>
                    {summary}
                  </div>
                )}
                {/* Only show input area if we don't have a summary yet */}
                {!summary && (
                  <>
                    {/* Hidden shadow textarea for auto-sizing */}
                    <textarea
                      ref={shadowRef}
                      className={`w-full bg-transparent outline-none resize-none font-serif italic text-3xl border-none shadow-none p-0 m-0 absolute opacity-0 pointer-events-none z-[-1] ${value ? 'text-black text-center' : 'text-gray-400 text-center placeholder-gray-400'}`}
                      rows={1}
                      aria-hidden="true"
                      tabIndex={-1}
                      readOnly
                      value={value || ' '}
                      style={{ fontSize: '1.5rem', minHeight: '3rem', lineHeight: 1.2, whiteSpace: 'pre-wrap', overflow: 'hidden' }}
                    />
                    {/* Custom blinking cursor and placeholder */}
                    {value === "" && (
                      <div className="absolute left-1/2 top-0 -translate-x-1/2 flex flex-row items-start justify-center w-full select-none pointer-events-none" style={{fontSize: '1.5rem'}}>
                        <span className="custom-blink-cursor" style={{height: '1.2em', width: '2px', background: '#9ca3af', display: 'inline-block', marginRight: '0.1em', verticalAlign: 'middle'}}></span>
                        <span className="text-gray-400 font-serif italic text-3xl" style={{ fontSize: '1.5rem' }}>{loading ? '...' : placeholder}</span>
                      </div>
                    )}
                    {/* The actual textarea, transparent placeholder when empty */}
                    <textarea
                      ref={textareaRef}
                      className={`w-full bg-transparent outline-none resize-none font-serif italic text-3xl border-none shadow-none p-0 m-0 ${value ? 'text-black text-center caret-auto' : 'text-gray-400 text-center placeholder-transparent caret-transparent'}`}
                      rows={1}
                      placeholder={value ? '' : placeholder}
                      style={{ fontSize: '1.5rem', minHeight: '3rem', lineHeight: 1.2, whiteSpace: 'pre-wrap', overflow: 'hidden', textAlign: 'center' }}
                      value={value}
                      onChange={handleValueChange}
                      onBlur={handleBlur}
                      onKeyDown={handleKeyDown}
                      disabled={loading}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
