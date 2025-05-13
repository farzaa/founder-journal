'use client';
import React, { useState, useRef, useEffect } from "react";

const people = ["Sam", "Sharif", "Naveed", "Bihan", "Max"] as const;
type Person = typeof people[number];

// Pre-generated summaries for each person
const personSummaries: Record<Person, string> = {
  "Sam": "Feeling inspired after testing the new camera-based logo generator with real users today. The instant feedback loop is working better than expected, though still struggling with edge cases in low-light conditions. Excited to refine the AI's understanding of brand aesthetics based on today's user testing session.",
  "Sharif": "Had a breakthrough moment with the Mac AI tool's voice command system. Finally solved the latency issues that were bugging me all week. Feeling a mix of relief and excitement - the team's feedback on the new gesture controls was super positive. Still need to tackle the battery optimization tomorrow.",
  "Naveed": "The AR glasses prototype is coming together beautifully. Today's focus was on the hand-tracking accuracy, and we're seeing 95% success rate in complex gestures. Feeling proud of the team's progress, though the weight distribution is still a challenge we need to solve.",
  "Bihan": "Spent the day optimizing the AR glasses' field of view. The new lens design is showing promise, but the calibration process is taking longer than expected. Feeling determined to crack this by end of week. The team's energy is high despite the technical challenges.",
  "Max": "The AI workout app's new motion tracking is working like a charm. Today's user testing showed 40% better form correction accuracy. Feeling pumped about the progress, though the calorie burn algorithm needs tweaking. The team's feedback on the new UI was exactly what we needed."
};

export default function Home() {
  const [value, setValue] = useState("");
  const [placeholder, setPlaceholder] = useState("Whatcha working doing today?");
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<string[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const textareaRef = useRef(null);
  const shadowRef = useRef(null);
  const scrollRef = useRef(null);

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
          model: "gpt-4",
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
          temperature: 0.7,
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
      // @ts-ignore
      textareaRef.current.style.height = 'auto';
      // @ts-ignore
      textareaRef.current.style.height = shadowRef.current.scrollHeight + 'px';
    }
  }, [value]);

  // Add new useEffect to handle focus when placeholder changes
  useEffect(() => {
    if (textareaRef.current && !loading) {
      // @ts-ignore
      textareaRef.current.focus();
    }
  }, [placeholder, loading]);

  const handleBlur = () => {
    if (textareaRef.current) {
      setTimeout(() => {
        // @ts-ignore
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
      setConversation(prev => [...prev, userMessage]);

      // Scroll down a bit
      setTimeout(() => {
        if (scrollRef.current) {
          // @ts-ignore
          scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }, 100);

      // If we have 3 questions answered, get summary
      if (conversation.length >= 2) {
        console.log('Full conversation before summary:', [...conversation, userMessage]);
        try {
          const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: "gpt-4o",
              messages: [
                { 
                  role: "system", 
                  content: "You are a helpful assistant that summarizes Farza's feelings and journal about their work day, and presents it to their coworkers. Create a causal, concise, summary of the key points discussed. Focus on goals, progress, and important insights and feelings that are appropriate to communicate to the teammate reading it. Even if you have very little, do your best." 
                },
                { 
                  role: "user", 
                  content: `Here's the conversation to summarize:\n${[...conversation, userMessage].join('\n')}` 
                },
              ],
              max_tokens: 150,
              temperature: 0.7,
            }),
          });
          const data = await res.json();
          const summaryText = data.choices?.[0]?.message?.content?.trim() || "";
          setSummary(summaryText);
          setLoading(false);
          return;
        } catch (err) {
          console.error("Error getting summary:", err);
        }
      }

      // Regular question flow
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              { role: "system", content: "You are a helpful assistant that only asks the next best follow-up question for a user in a check-in conversation. Your goal is to drive focus and have them expand upon how they about the work in general for that specific day. Questions like 'Why do you feel x is the most important thing to work on today?' is a really good question. Or 'How do you feel about x right now?' Only return the next question, nothing else. 57 chars max including spaces. Ask questions relevant to convo. Don't pester them like an annoying micro-manager, let them explode on the page" },
              { role: "user", content: userMessage },
            ],
            max_tokens: 64,
            temperature: 0.7,
          }),
        });
        const data = await res.json();
        const nextQ = data.choices?.[0]?.message?.content?.trim() || "What else?";
        setPlaceholder(nextQ);
        setLoading(false);
      } catch (err) {
        setPlaceholder("(Error getting next question)");
        setLoading(false);
      }
    }
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
            <div className="flex-1 flex flex-col justify-center gap-1">
              {people.map((name) => (
                <span
                  key={name}
                  className="text-[18px] font-medium cursor-pointer hover:text-black transition-colors"
                  style={{
                    color: selectedPerson === name ? '#000000' : '#AEAEAE',
                    letterSpacing: '-0.04em',
                  }}
                  onClick={() => {
                    setSelectedPerson(name);
                    setSummary(personSummaries[name]);
                  }}
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
          <div className="mb-2">
            <span className="text-black text-lg mr-2 align-middle" style={{ fontWeight: 600 }}>•</span>
            <span 
              className="text-black text-lg font-semibold align-middle cursor-pointer hover:opacity-70 transition-opacity" 
              style={{ letterSpacing: '-0.04em' }}
              onClick={() => {
                setSelectedPerson(null);
                setSummary("");
                setValue("");
                setPlaceholder("Whatcha working doing today?");
              }}
            >
              Farza
            </span>
          </div>
        </div>
        {/* Main content area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-full h-full flex items-center justify-center bg-[#eceae6] rounded-[40px]" style={{ minHeight: '80vh' }}>
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
                      onChange={e => setValue(e.target.value)}
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
