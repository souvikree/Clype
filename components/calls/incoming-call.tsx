'use client';

import { Phone, PhoneOff } from 'lucide-react';

interface IncomingCallProps {
  callerName: string;
  callType: 'voice' | 'video';
  onAccept: () => void;
  onReject: () => void;
}

export function IncomingCall({ callerName, callType, onAccept, onReject }: IncomingCallProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-8 p-8 bg-card rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-border">
        {/* Caller Avatar */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-xl animate-pulse">
            <span className="text-4xl font-bold text-primary-foreground">
              {callerName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Call Info */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">{callerName}</h2>
          <p className="text-lg text-muted-foreground font-mono">
            Incoming {callType === 'voice' ? 'voice' : 'video'} call
          </p>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-6 w-full">
          {/* Reject Button */}
          <button
            onClick={onReject}
            className="flex-1 p-4 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80 transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
            title="Reject call"
          >
            <PhoneOff size={20} />
            Decline
          </button>

          {/* Accept Button */}
          <button
            onClick={onAccept}
            className="flex-1 p-4 rounded-full bg-green-600 text-white hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
            title="Accept call"
          >
            <Phone size={20} />
            Accept
          </button>
        </div>

        {/* Ringing Animation */}
        <style>{`
          @keyframes ring {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          .animate-ring {
            animation: ring 1s infinite;
          }
        `}</style>
      </div>
    </div>
  );
}
