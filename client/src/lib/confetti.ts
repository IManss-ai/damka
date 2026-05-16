const COLORS = ['#7fa650', '#fbbf24', '#e0d9d0', '#9fc870', '#f59e0b', '#86efac'];

interface Particle {
  x: number; y: number; vx: number; vy: number;
  r: number; color: string; angle: number; va: number; life: number;
}

export function launchConfetti(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';

  const particles: Particle[] = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: -20,
    vx: (Math.random() - 0.5) * 6,
    vy: Math.random() * 4 + 2,
    r: Math.random() * 6 + 3,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    angle: Math.random() * Math.PI * 2,
    va: (Math.random() - 0.5) * 0.2,
    life: 1,
  }));

  let frame: number;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
      p.angle += p.va;
      p.life -= 0.008;
      if (p.life > 0 && p.y < canvas.height + 20) {
        alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 1.8);
        ctx.restore();
      }
    }
    if (alive) frame = requestAnimationFrame(draw);
    else canvas.remove();
  }
  draw();
  setTimeout(() => { cancelAnimationFrame(frame); canvas.remove(); }, 5000);
}
