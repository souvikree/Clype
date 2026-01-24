'use client';

import { useState } from 'react';
import { Phone, Video, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuickCallPanelProps {
  mateName?: string;
  onVoiceCall?: (name: string) => void;
  onVideoCall?: (name: string) => void;
}

export function QuickCallPanel({ mateName = 'Mate', onVoiceCall, onVideoCall }: QuickCallPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputName, setInputName] = useState(mateName);

  const handleVoiceCall = () => {
    if (inputName.trim()) {
      onVoiceCall?.(inputName);
    }
  };

  const handleVideoCall = () => {
    if (inputName.trim()) {
      onVideoCall?.(inputName);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-30">
      {/* Expanded Panel */}
      <div
        className={`
          absolute bottom-full right-0 mb-4 bg-card border border-border rounded-lg shadow-2xl
          transition-all duration-200 origin-bottom-right
          ${isExpanded ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}
        `}
      >
        <div className="p-4 min-w-72">
          <h3 className="text-sm font-semibold text-foreground mb-3">Quick Call</h3>

          {/* Name Input */}
          <input
            type="text"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            placeholder="Enter name"
            className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleVoiceCall();
              }
            }}
          />

          {/* Call Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleVoiceCall}
              className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 text-sm"
              size="sm"
            >
              <Phone size={16} className="mr-1" />
              Voice
            </Button>
            <Button
              onClick={handleVideoCall}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/80 text-sm"
              size="sm"
            >
              <Video size={16} className="mr-1" />
              Video
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-3">
            Or use <code className="bg-input px-1 py-0.5 rounded">voice-call &lt;name&gt;</code> in terminal
          </p>
        </div>
      </div>

      {/* Toggle Button */}
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200 bg-primary text-primary-foreground hover:bg-primary/80"
        size="icon"
        title={isExpanded ? 'Close call panel' : 'Open call panel'}
      >
        {isExpanded ? <ChevronDown size={20} /> : <Phone size={20} />}
      </Button>
    </div>
  );
}
