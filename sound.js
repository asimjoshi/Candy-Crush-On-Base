// sound.js - Web Audio API Synthesizer

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type, duration, vol = 0.1) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
}

window.playSwapSound = function() {
    playTone(300, 'sine', 0.1, 0.05);
    setTimeout(() => playTone(400, 'sine', 0.1, 0.05), 50);
}

window.playPopSound = function() {
    // A sweet popping sound
    playTone(600, 'sine', 0.15, 0.1);
    setTimeout(() => playTone(800, 'triangle', 0.1, 0.05), 50);
}

window.playWinSound = function() {
    // Upward arpeggio
    let time = 0;
    [440, 554, 659, 880].forEach(freq => {
        setTimeout(() => playTone(freq, 'square', 0.2, 0.1), time);
        time += 150;
    });
}

window.playLoseSound = function() {
    // Downward arpeggio
    let time = 0;
    [440, 415, 392, 349].forEach(freq => {
        setTimeout(() => playTone(freq, 'sawtooth', 0.3, 0.1), time);
        time += 200;
    });
}
