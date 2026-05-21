interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  life: number;
  decay: number;
}

export function launchCaptureExplosion(
  boardElement: HTMLElement,
  row: number,
  col: number,
  playerColor: 'white' | 'black',
  isCapturedWhite: boolean,
  squareSize: number
) {
  // 1. Calculate the coordinates relative to the viewport
  const rect = boardElement.getBoundingClientRect();
  const boardRows = [0, 1, 2, 3, 4, 5, 6, 7];
  const boardCols = [0, 1, 2, 3, 4, 5, 6, 7];
  
  // Account for board flip if playing as black
  const rowIdx = playerColor === 'white' ? row : 7 - row;
  const colIdx = playerColor === 'white' ? col : 7 - col;

  const targetX = rect.left + window.scrollX + (colIdx + 0.5) * squareSize;
  const targetY = rect.top + window.scrollY + (rowIdx + 0.5) * squareSize;

  // 2. Create the temporary canvas
  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d')!;

  // 3. Define particle colors
  const whiteColors = ['#fff8cc', '#ffe880', '#d4a017', '#e8d9b8', '#ffffff'];
  const blackColors = ['#e15f5f', '#ff6060', '#4a4440', '#2c2826', '#181512'];
  const colors = isCapturedWhite ? whiteColors : blackColors;

  // 4. Generate particles
  const particles: Particle[] = Array.from({ length: 24 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5 + 3;
    return {
      x: targetX,
      y: targetY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: Math.random() * 4 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1.0,
      decay: Math.random() * 0.03 + 0.02,
    };
  });

  // 5. Animation loop
  let frameId: number;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let anyAlive = false;

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1; // gravity
      p.vx *= 0.98; // air resistance
      p.life -= p.decay;

      if (p.life > 0) {
        anyAlive = true;
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    if (anyAlive) {
      frameId = requestAnimationFrame(animate);
    } else {
      canvas.remove();
    }
  }

  animate();
  setTimeout(() => {
    cancelAnimationFrame(frameId);
    canvas.remove();
  }, 1500);
}
