import { useEffect, useState, useCallback } from 'react';

// Konami Code: ↑↑↓↓←→←→BA
const KONAMI_CODE = [
  'ArrowUp', 'ArrowUp',
  'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight',
  'ArrowLeft', 'ArrowRight',
  'KeyB', 'KeyA',
];

/**
 * Hook to detect Konami Code input.
 * Returns true when the secret code is entered.
 * Plays Contra FC title music as a reward.
 */
export function useKonamiCode(): boolean {
  const [activated, setActivated] = useState(false);
  const [inputSequence, setInputSequence] = useState<string[]>([]);

  const playContraSound = useCallback(() => {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    const playTone = (frequency: number, startTime: number, duration: number, volume = 0.3, type: OscillatorType = 'square') => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, startTime);
      gainNode.gain.setValueAtTime(volume, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration - 0.02);
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    const now = audioContext.currentTime;
    const tempo = 0.12;

    // Contra title screen melody
    playTone(329.63, now, tempo * 1.5, 0.35);
    playTone(329.63, now + tempo * 2, tempo, 0.35);
    playTone(329.63, now + tempo * 4, tempo * 1.5, 0.35);
    playTone(261.63, now + tempo * 6, tempo, 0.3);
    playTone(329.63, now + tempo * 7.5, tempo * 1.5, 0.35);
    playTone(392.00, now + tempo * 10, tempo * 2, 0.4);
    playTone(196.00, now + tempo * 10, tempo * 2, 0.25, 'triangle');
    playTone(523.25, now + tempo * 13, tempo * 2.5, 0.35);
    playTone(659.25, now + tempo * 16, tempo * 3, 0.4);

    // Drum hits
    const playDrum = (startTime: number, duration: number) => {
      const bufferSize = audioContext.sampleRate * duration;
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
      }
      const source = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();
      source.buffer = buffer;
      gainNode.gain.setValueAtTime(0.15, startTime);
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      source.start(startTime);
    };

    playDrum(now, 0.08);
    playDrum(now + tempo * 4, 0.08);
    playDrum(now + tempo * 10, 0.1);

    setTimeout(() => audioContext.close(), 3000);
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem('konami-activated') === 'true') {
      setActivated(true);
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (activated) return;

      const newSequence = [...inputSequence, event.code].slice(-KONAMI_CODE.length);
      setInputSequence(newSequence);

      if (
        newSequence.length === KONAMI_CODE.length &&
        newSequence.every((key, index) => key === KONAMI_CODE[index])
      ) {
        playContraSound();
        setTimeout(() => {
          setActivated(true);
          sessionStorage.setItem('konami-activated', 'true');
        }, 300);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputSequence, activated, playContraSound]);

  return activated;
}

/** Check if Konami was previously activated in this session. */
export function isKonamiActivated(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem('konami-activated') === 'true';
}

/** Clear Konami activation (for logout). */
export function clearKonamiActivation(): void {
  sessionStorage.removeItem('konami-activated');
}
