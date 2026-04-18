import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, RotateCcw, AlertTriangle, Terminal } from 'lucide-react';

const TRACKS = [
  { id: 1, title: 'NEON_GEN.exe', artist: 'NULL_POINTER', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2, title: 'CYBER_FLW.dat', artist: 'SYNTH_ERR', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 3, title: 'FATAL_EXC.sys', artist: 'DUMP_MEM', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
];

const GRID_SIZE = 20;
const INITIAL_SPEED = 120;

type Point = { x: number; y: number };

export default function App() {
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }]);
  const [dir, setDir] = useState<Point>({ x: 0, y: -1 });
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isGamePlaying, setIsGamePlaying] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const snakeRef = useRef(snake);
  const dirRef = useRef(dir);
  const nextDirRef = useRef(dir);

  useEffect(() => {
    snakeRef.current = snake;
    dirRef.current = dir;
  }, [snake, dir]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("ERR_AUDIO_RESTRICT", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const nextTrack = () => {
    setCurrentTrack((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };
  
  const prevTrack = () => {
    setCurrentTrack((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      if (!currentSnake.some(s => s.x === newFood.x && s.y === newFood.y)) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    const initialSnake = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
    setSnake(initialSnake);
    snakeRef.current = initialSnake;
    
    const initialDir = { x: 0, y: -1 };
    setDir(initialDir);
    dirRef.current = initialDir;
    nextDirRef.current = initialDir;

    setFood(generateFood(initialSnake));
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setGameOver(false);
    setIsGamePlaying(true);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }
    
    if (e.key === ' ' && gameOver) {
      resetGame(); return;
    }
    if (e.key === ' ' && !gameOver) {
      setIsGamePlaying(p => !p); return;
    }

    const { x, y } = dirRef.current;
    switch (e.key) {
      case 'ArrowUp': case 'w': case 'W': if (y === 0) nextDirRef.current = { x: 0, y: -1 }; break;
      case 'ArrowDown': case 's': case 'S': if (y === 0) nextDirRef.current = { x: 0, y: 1 }; break;
      case 'ArrowLeft': case 'a': case 'A': if (x === 0) nextDirRef.current = { x: -1, y: 0 }; break;
      case 'ArrowRight': case 'd': case 'D': if (x === 0) nextDirRef.current = { x: 1, y: 0 }; break;
    }
  }, [gameOver]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!isGamePlaying || gameOver) return;

    const moveSnake = () => {
      const currentSnake = [...snakeRef.current];
      const head = { ...currentSnake[0] };
      const currentDir = nextDirRef.current;
      
      setDir(currentDir);
      dirRef.current = currentDir;
      
      head.x += currentDir.x; head.y += currentDir.y;

      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameOver(true); setIsGamePlaying(false); setHighScore(prev => Math.max(prev, score)); return;
      }
      if (currentSnake.some((s, index) => index !== currentSnake.length - 1 && s.x === head.x && s.y === head.y)) {
        setGameOver(true); setIsGamePlaying(false); setHighScore(prev => Math.max(prev, score)); return;
      }

      currentSnake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        const newScore = score + 10;
        setScore(newScore);
        setFood(generateFood(currentSnake));
        if (newScore % 50 === 0 && speed > 40) setSpeed(s => s - 10);
      } else {
        currentSnake.pop();
      }
      setSnake(currentSnake);
    };

    const gameLoop = setInterval(moveSnake, speed);
    return () => clearInterval(gameLoop);
  }, [isGamePlaying, gameOver, food, score, speed, generateFood]);

  return (
    <div className="h-screen w-full bg-black text-[#00ffff] font-sys flex items-center justify-center p-2 sm:p-5 overflow-hidden static-bg relative">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Silkscreen&family=VT323&display=swap');
          
          .font-sys { font-family: 'VT323', monospace; }
          .font-pixel { font-family: 'Silkscreen', cursive; }

          body { background: #000; overflow: hidden; }

          /* Grain and Scanlines */
          .static-bg::after {
            content: "";
            position: absolute;
            top: 0; left: 0; width: 100vw; height: 100vh;
            background: repeating-linear-gradient(0deg, rgba(0,0,0,0.15), rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px);
            pointer-events: none;
            z-index: 100;
          }

          @keyframes scanline-anim {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100vh); }
          }
          .scanline {
            position: absolute; top: 0; left: 0; width: 100%; height: 15px;
            background: rgba(255, 0, 255, 0.2);
            animation: scanline-anim 6s linear infinite;
            pointer-events: none;
            z-index: 99;
          }

          /* Tear Animations */
          @keyframes screen-tear-anim {
            0% { transform: translateX(0); filter: none; }
            1% { transform: translateX(12px) skewX(-15deg); filter: drop-shadow(-8px 0 #ff00ff) drop-shadow(8px 0 #00ffff); }
            2% { transform: translateX(-12px) skewX(15deg); filter: drop-shadow(8px 0 #ff00ff) drop-shadow(-8px 0 #00ffff); }
            3% { transform: translateX(0); filter: none; }
            4% { transform: translateY(-4px) scaleY(1.05); }
            5% { transform: translateY(0) scaleY(1); }
            100% { transform: translateX(0); filter: none; }
          }
          .screen-tear {
            animation: screen-tear-anim 4.5s infinite running;
          }

          /* Glitch Text Layering */
          .glitch-text[data-text] {
            position: relative;
            display: inline-block;
          }
          .glitch-text[data-text]::before, .glitch-text[data-text]::after {
            content: attr(data-text);
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8);
          }
          .glitch-text[data-text]::before {
            left: 3px;
            text-shadow: -2px 0 #00ffff;
            animation: glitch-clip-1 2s infinite linear alternate-reverse;
          }
          .glitch-text[data-text]::after {
            left: -3px;
            text-shadow: -2px 0 #ff00ff;
            animation: glitch-clip-2 3s infinite linear alternate-reverse;
          }
          @keyframes glitch-clip-1 {
            0% { clip-path: inset(15% 0 80% 0); transform: translateX(-2px); }
            20% { clip-path: inset(50% 0 10% 0); transform: translateX(2px); }
            40% { clip-path: inset(5% 0 45% 0); transform: translateX(0); }
            60% { clip-path: inset(90% 0 2% 0); transform: translateX(2px); }
            80% { clip-path: inset(30% 0 60% 0); transform: translateX(-2px); }
            100% { clip-path: inset(60% 0 20% 0); transform: translateX(0); }
          }
          @keyframes glitch-clip-2 {
            0% { clip-path: inset(80% 0 10% 0); transform: translateX(2px); }
            20% { clip-path: inset(10% 0 60% 0); transform: translateX(-2px); }
            40% { clip-path: inset(45% 0 20% 0); transform: translateX(2px); }
            60% { clip-path: inset(20% 0 75% 0); transform: translateX(0); }
            80% { clip-path: inset(70% 0 5% 0); transform: translateX(-2px); }
            100% { clip-path: inset(35% 0 45% 0); transform: translateX(2px); }
          }
          
          /* Visualizer bars */
          @keyframes viz-bounce {
             0% { transform: scaleY(0.2); background: #00ffff; }
             50% { background: white; }
             100% { transform: scaleY(1); background: #ff00ff; }
          }

          /* Irregular borders */
          .chopped-border {
             clip-path: polygon(0 15px, 15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%);
             border: 2px solid #00ffff;
          }
          .chopped-border-magenta {
             clip-path: polygon(15px 0, 100% 0, 100% 100%, 0 100%, 0 15px);
             border: 3px solid #ff00ff;
          }

          /* Noise Background */
          .bg-noise {
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
            opacity: 0.05;
            mix-blend-mode: overlay;
          }
          
          .grid-bg-pattern {
            background-image: 
              linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px);
            background-size: 20px 20px;
          }
        `}
      </style>

      <div className="scanline" />
      <div className="absolute inset-0 bg-noise pointer-events-none z-0" />

      {/* Main Interface Wrapper */}
      <div className="w-full max-w-6xl h-full flex flex-col md:flex-row gap-6 lg:gap-10 screen-tear relative z-10 mx-auto px-4 py-8">
        
        {/* LEFT COLUMN: Data Stream & Playback */}
        <div className="flex-1 flex flex-col gap-6 justify-between order-2 md:order-1">
          
          <div className="bg-[#050505] chopped-border p-5 relative group overflow-hidden">
             <div className="absolute top-0 right-0 p-1 bg-[#00ffff] text-black text-xs font-bold font-sys uppercase tracking-widest leading-none">
                SYS_AUDIO // 0xFF
             </div>
             <div className="flex items-center gap-2 mb-6 border-b-2 border-dashed border-[#ff00ff]/30 pb-2">
                <Terminal size={18} className="text-[#ff00ff]" />
                <span className="font-pixel text-[#ff00ff] text-xl tracking-wider glitch-text pt-1" data-text="PLAYBACK">PLAYBACK</span>
             </div>

             <div className="space-y-3 mb-6">
               {TRACKS.map((track, idx) => (
                 <div 
                   key={track.id} 
                   className={`flex items-center p-3 cursor-pointer border-l-4 transition-all
                     ${idx === currentTrack ? 'bg-[#ff00ff] text-black border-white shadow-[4px_4px_0px_#00ffff]' : 'bg-[#111] text-[#00ffff] border-[#333] hover:border-[#00ffff]'}`}
                   onClick={() => { setCurrentTrack(idx); setIsPlaying(true); }}
                 >
                   <div className={`w-8 font-sys text-lg ${idx === currentTrack ? 'text-black' : 'text-[#ff00ff]'}`}>
                     [{idx.toString().padStart(2, '0')}]
                   </div>
                   <div className="flex flex-col ml-2 overflow-hidden">
                     <span className={`font-pixel text-sm truncate uppercase ${idx === currentTrack ? '' : 'opacity-80'}`}>{track.title}</span>
                     <span className="font-sys text-xs opacity-60 uppercase">{track.artist}</span>
                   </div>
                   {idx === currentTrack && isPlaying && <div className="ml-auto animate-pulse">▼</div>}
                 </div>
               ))}
             </div>

             <div className="bg-black border border-[#333] p-4 relative">
                <div className="absolute -top-3 left-3 bg-black px-2 text-[#00ffff] text-xs">CTRL_PANEL</div>
                <div className="flex items-center justify-between text-[#00ffff]">
                  <button onClick={prevTrack} className="hover:text-[#ff00ff] hover:-translate-x-1 outline-none transition-transform"><SkipBack size={24} /></button>
                  <button onClick={togglePlay} className="w-14 h-14 border border-[#00ffff] text-[#ff00ff] hover:bg-[#00ffff] hover:text-black hover:border-black shadow-[4px_4px_0px_#ff00ff] hover:shadow-[4px_4px_0px_white] transition-all flex items-center justify-center translate-x-1">
                    {isPlaying ? <Pause size={24}/> : <Play size={24} className="ml-1"/>}
                  </button>
                  <button onClick={nextTrack} className="hover:text-[#ff00ff] hover:translate-x-1 outline-none transition-transform"><SkipForward size={24} /></button>
                </div>

                {/* Cyber Visualizer */}
                <div className="h-10 mt-6 flex items-end justify-between gap-1 overflow-hidden">
                  {[...Array(12)].map((_, i) => (
                    <div 
                      key={i} 
                      className="flex-1 w-full rounded-none origin-bottom opacity-80"
                      style={{
                        animation: isPlaying ? `viz-bounce ${0.3 + (i % 3) * 0.2}s infinite alternate ease-in` : 'none',
                        height: isPlaying ? '10%' : '5%',
                        background: isPlaying ? '#00ffff' : '#333'
                      }}
                    />
                  ))}
                </div>
             </div>
             
             <audio ref={audioRef} src={TRACKS[currentTrack].url} onEnded={nextTrack} />
          </div>

          <div className="bg-[#110011] border-2 border-[#ff00ff] border-dashed p-4 text-center">
             <div className="font-pixel text-[10px] text-[#ff00ff] mb-2 uppercase leading-relaxed">
               WARNING: Memory Leak Detected<br/>
               Execute W/A/S/D to overwrite sectors.
             </div>
             <div className="font-sys text-[#00ffff] text-opacity-50 text-xs">
               0x4F424A454354_NOT_FOUND
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CORE GAME LOOP */}
        <div className="flex-[2] flex flex-col order-1 md:order-2 h-full justify-center items-center">
          
          <div className="w-full flex justify-between items-end mb-4 border-b-4 border-[#00ffff] pb-2 relative">
             <div className="absolute right-0 bottom-0 w-16 h-4 bg-[#00ffff]" />
             <h1 className="font-pixel text-4xl sm:text-5xl text-[#00ffff] m-0 leading-none glitch-text tracking-tighter" data-text="SNAKE.SYS">
               SNAKE.SYS
             </h1>
             <div className="flex gap-6 pr-16 items-end">
                <div className="flex flex-col text-right">
                  <span className="font-sys text-[#ff00ff] text-sm uppercase">MEM_ALLOC</span>
                  <span className="font-sys text-white text-3xl leading-none font-bold">{(score).toString().padStart(4, '0')}</span>
                </div>
                <div className="flex flex-col text-right hidden lg:flex">
                  <span className="font-sys text-[#00ffff] text-sm opacity-50 uppercase">PEAK_MEM</span>
                  <span className="font-sys text-white text-3xl leading-none font-bold opacity-50">{(highScore).toString().padStart(4, '0')}</span>
                </div>
             </div>
          </div>

          <div className="relative p-2 bg-[#050505] chopped-border-magenta shadow-[0_0_30px_rgba(255,0,255,0.15)] flex-shrink-0 mx-auto">
            
            {/* The Grid Board */}
            <div 
              className="bg-black/90 grid-bg-pattern relative z-10"
              style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`, gap: '1px' }}
            >
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                const x = i % GRID_SIZE;
                const y = Math.floor(i / GRID_SIZE);
                const isHead = snake[0].x === x && snake[0].y === y;
                const isSnake = !isHead && snake.some(s => s.x === x && s.y === y);
                const isFood = food.x === x && food.y === y;
                
                return (
                  <div 
                    key={i} 
                    className={`w-[12px] h-[12px] sm:w-[16px] sm:h-[16px] md:w-[22px] md:h-[22px] lg:w-[24px] lg:h-[24px] transition-none
                      ${isHead ? 'bg-white shadow-[0_0_10px_white] z-20 scale-[1.15]' 
                        : isSnake ? 'bg-[#ff00ff] shadow-[0_0_8px_#ff00ff] opacity-80' 
                        : isFood ? 'bg-[#00ffff] rounded-none rotate-45 scale-75 animate-pulse shadow-[0_0_15px_#00ffff]' 
                        : 'bg-transparent'}`}
                  />
                );
              })}
            </div>

            {/* Overlays */}
            {!isGamePlaying && !gameOver && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-30 transition-all backdrop-blur-[2px] chopped-border-magenta m-2">
                <button 
                  onClick={() => setIsGamePlaying(true)}
                  className="px-8 py-4 bg-[#00ffff] text-black font-pixel text-xl sm:text-2xl hover:bg-white hover:shadow-[0_0_20px_white] transition-all transform hover:-translate-y-1 mb-6 border-4 border-black"
                >
                  INITIALIZE
                </button>
                <p className="font-sys text-[#ff00ff] text-xl animate-pulse tracking-widest text-center">
                  PRESS [SPACE] TO EXECUTE
                </p>
              </div>
            )}
            
            {gameOver && (
              <div className="absolute inset-0 bg-[#000000] z-30 flex flex-col items-center justify-center backdrop-blur-sm shadow-[inset_0_0_100px_#ff00ff] p-4 text-center">
                <AlertTriangle size={48} className="text-[#ff00ff] mb-4 animate-ping absolute opacity-20" />
                <h2 className="font-pixel text-[2.5rem] sm:text-5xl lg:text-6xl text-white tracking-widest mb-2 glitch-text leading-tight drop-shadow-[4px_4px_0_#ff00ff]" data-text="KERNEL PANIC">
                  KERNEL PANIC
                </h2>
                <div className="bg-[#ff00ff] text-black font-sys text-xl px-4 py-1 mb-8 shadow-[4px_4px_0_#00ffff] font-bold">
                  DUMP_VAL: 0x{score.toString(16).toUpperCase().padStart(4, '0')}
                </div>
                <button 
                  onClick={resetGame}
                  className="group flex items-center space-x-3 bg-transparent border-4 border-[#00ffff] text-[#00ffff] px-8 py-4 text-xl sm:text-2xl hover:bg-[#00ffff] hover:text-black hover:shadow-[0_0_30px_#00ffff] transition-all outline-none font-pixel"
                >
                  <RotateCcw size={24} className="group-hover:-rotate-180 transition-transform duration-500" />
                  <span>RECOVERY.BAT</span>
                </button>
              </div>
            )}
          </div>
          
          <div className="mt-4 text-[#ff00ff] font-sys text-sm tracking-[0.3em] uppercase w-full flex justify-between animate-pulse">
            <span>[SYS_CLK: OK]</span>
            <span>[FPS_LCK: THRESHOLD]</span>
          </div>
        </div>

      </div>
    </div>
  );
}
