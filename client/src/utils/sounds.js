// 🌱 Kodamots Web Audio Synthesizer
// Synthesizes charming Ghibli-esque acoustic chimes and organic sounds
// without requiring any external file asset loading!

let audioCtx = null;
let soundEnabled = true;

try {
  const saved = localStorage.getItem('kodamots_sounds_enabled');
  if (saved !== null) {
    soundEnabled = saved === 'true';
  }
} catch (e) {
  // Ignore localStorage blockages
}

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const soundManager = {
  isEnabled() {
    return soundEnabled;
  },

  toggle(enabled) {
    soundEnabled = enabled;
    try {
      localStorage.setItem('kodamots_sounds_enabled', String(enabled));
    } catch (e) {
      // Ignore
    }
  },

  play(type) {
    if (!soundEnabled) return;
    
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      switch (type) {
        case 'click': {
          // Soft woodblock / bubble pop
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(380, now);
          osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);
          
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(now);
          osc.stop(now + 0.09);
          break;
        }

        case 'success': {
          // Whimsical bell arpeggio (C5 -> E5 -> G5)
          const notes = [523.25, 659.25, 783.99];
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.07);
            
            gain.gain.setValueAtTime(0, now + idx * 0.07);
            gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.07 + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.22);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now + idx * 0.07);
            osc.stop(now + idx * 0.07 + 0.25);
          });
          break;
        }

        case 'fail': {
          // Soft descending hum (C4 -> G3)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(261.63, now);
          osc.frequency.linearRampToValueAtTime(196.00, now + 0.25);
          
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(now);
          osc.stop(now + 0.26);
          break;
        }

        case 'start': {
          // Ghibli magical harp: F4 -> A4 -> C5 -> F5 -> A5 -> C6
          const notes = [349.23, 440.00, 523.25, 698.46, 880.00, 1046.50];
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.05);
            
            gain.gain.setValueAtTime(0, now + idx * 0.05);
            gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.05 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.35);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now + idx * 0.05);
            osc.stop(now + idx * 0.05 + 0.4);
          });
          break;
        }

        case 'victory': {
          // Dreamy windchimes major cascade
          const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.06);
            
            gain.gain.setValueAtTime(0, now + idx * 0.06);
            gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.06 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.65);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now + idx * 0.06);
            osc.stop(now + idx * 0.06 + 0.7);
          });
          break;
        }

        case 'tick': {
          // Gentle clock tick
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(900, now);
          
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(now);
          osc.stop(now + 0.04);
          break;
        }
      }
    } catch (e) {
      console.warn('[SoundManager] Web Audio failed:', e);
    }
  }
};
