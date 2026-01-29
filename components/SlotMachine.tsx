'use client';

import { useState, useEffect, useCallback } from 'react';

interface SlotMachineProps {
  finalNumbers: {
    red: number[];
    blue: number;
  };
  onComplete: () => void;
}

export default function SlotMachine({ finalNumbers, onComplete }: SlotMachineProps) {
  const [spinning, setSpinning] = useState(true);
  const [displayNumbers, setDisplayNumbers] = useState<(number | null)[]>(
    [null, null, null, null, null, null, null]
  );

  const stableOnComplete = useCallback(onComplete, [onComplete]);

  useEffect(() => {
    const stopTimes = [800, 1200, 1600, 2000, 2400, 2800, 3400];

    stopTimes.forEach((time, index) => {
      setTimeout(() => {
        setDisplayNumbers(prev => {
          const newArr = [...prev];
          if (index < 6) {
            newArr[index] = finalNumbers.red[index];
          } else {
            newArr[index] = finalNumbers.blue;
          }
          return newArr;
        });

        // Play ding sound
        try {
          const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const audioContext = new AudioCtx();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.frequency.value = 800 + Math.random() * 400;
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
        } catch (_e) {
          // audio not supported
        }

        if (index === 6) {
          setTimeout(() => {
            setSpinning(false);
            stableOnComplete();
          }, 500);
        }
      }, time);
    });
  }, [finalNumbers, stableOnComplete]);

  return (
    <div className="bg-gradient-to-b from-yellow-400 via-yellow-500 to-orange-500 rounded-3xl p-6 shadow-2xl">
      {/* Top decoration */}
      <div className="text-center mb-4">
        <div className="text-4xl">🎰</div>
        <div className="text-white font-bold text-lg">
          {spinning ? '妖精鬼显灵中...' : '✨ 发财签出炉啦！'}
        </div>
      </div>

      {/* Reel area */}
      <div className="bg-white rounded-2xl p-4 shadow-inner">
        <div className="flex justify-center gap-2">
          {/* 6 red ball reels */}
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <div key={index} className="relative">
              <div className={`
                w-12 h-16 rounded-lg overflow-hidden
                ${displayNumbers[index] === null ? 'bg-gradient-to-b from-gray-200 to-gray-300' : 'bg-red-500'}
                flex items-center justify-center
                shadow-lg border-4 border-yellow-600
                transition-colors duration-300
              `}>
                {displayNumbers[index] === null ? (
                  <div className="animate-slot-spin text-2xl font-bold text-gray-400">
                    <div className="animate-pulse">?</div>
                  </div>
                ) : (
                  <span className="text-white font-bold text-xl animate-fade-in-up">
                    {String(displayNumbers[index]).padStart(2, '0')}
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Separator */}
          <div className="flex items-center text-2xl text-yellow-600 font-bold">+</div>

          {/* Blue ball reel */}
          <div className="relative">
            <div className={`
              w-12 h-16 rounded-lg overflow-hidden
              ${displayNumbers[6] === null ? 'bg-gradient-to-b from-gray-200 to-gray-300' : 'bg-blue-500'}
              flex items-center justify-center
              shadow-lg border-4 border-yellow-600
              transition-colors duration-300
            `}>
              {displayNumbers[6] === null ? (
                <div className="animate-pulse text-2xl font-bold text-gray-400">?</div>
              ) : (
                <span className="text-white font-bold text-xl animate-fade-in-up">
                  {String(displayNumbers[6]).padStart(2, '0')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pig expression */}
      <div className="text-center mt-4">
        <div className="text-4xl animate-bounce">
          {spinning ? '🐷💫' : '🐷🎉'}
        </div>
        <div className="text-white text-sm mt-1">
          {spinning ? '哼哼~转转转~' : '哼哼~发财啦！'}
        </div>
      </div>
    </div>
  );
}
