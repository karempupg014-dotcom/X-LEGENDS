export type WeatherMode = 'clear' | 'rain' | 'snow';

interface RainDrop {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
}

interface RainSplash {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
}

interface SnowFlake {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  swaySpeed: number;
  swayOffset: number;
  opacity: number;
}

export class WeatherSystem {
  public mode: WeatherMode = 'rain'; // Default subtle rain for classic fantasy atmosphere
  public intensity: number = 0.5; // 0.0 to 1.0

  private rainDrops: RainDrop[] = [];
  private rainSplashes: RainSplash[] = [];
  private snowFlakes: SnowFlake[] = [];
  private time: number = 0;

  constructor(initialMode: WeatherMode = 'rain', intensity: number = 0.5) {
    this.mode = initialMode;
    this.intensity = intensity;
    this.initParticles();
  }

  public setMode(mode: WeatherMode) {
    this.mode = mode;
    this.initParticles();
  }

  public setIntensity(intensity: number) {
    this.intensity = Math.max(0.1, Math.min(1.0, intensity));
    this.initParticles();
  }

  private initParticles() {
    this.rainDrops = [];
    this.rainSplashes = [];
    this.snowFlakes = [];

    const rainCount = Math.floor(180 * this.intensity);
    for (let i = 0; i < rainCount; i++) {
      this.rainDrops.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        length: 12 + Math.random() * 16,
        speed: 650 + Math.random() * 450,
        opacity: 0.25 + Math.random() * 0.35,
      });
    }

    const snowCount = Math.floor(120 * this.intensity);
    for (let i = 0; i < snowCount; i++) {
      this.snowFlakes.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: 1.5 + Math.random() * 2.5,
        speedY: 45 + Math.random() * 65,
        swaySpeed: 1.5 + Math.random() * 2.0,
        swayOffset: Math.random() * Math.PI * 2,
        opacity: 0.35 + Math.random() * 0.45,
      });
    }
  }

  public render(ctx: CanvasRenderingContext2D, width: number, height: number, dt: number) {
    if (this.mode === 'clear') return;

    this.time += dt;

    if (this.mode === 'rain') {
      ctx.save();
      ctx.lineWidth = 1.2;

      // Draw subtle falling rain streaks (slanted slightly by wind)
      const windAngle = 0.15; // radians
      const cosW = Math.cos(windAngle);
      const sinW = Math.sin(windAngle);

      for (let i = 0; i < this.rainDrops.length; i++) {
        const drop = this.rainDrops[i];
        drop.y += drop.speed * dt;
        drop.x += drop.speed * sinW * dt;

        // Ground splash check
        if (drop.y > height) {
          drop.y = -drop.length;
          drop.x = Math.random() * (width + 200) - 100;

          // Trigger ground splash
          if (Math.random() < 0.25 && this.rainSplashes.length < 40) {
            this.rainSplashes.push({
              x: drop.x,
              y: height - Math.random() * 60,
              radius: 1.5,
              maxRadius: 6 + Math.random() * 5,
              opacity: 0.4,
            });
          }
        }

        ctx.strokeStyle = `rgba(186, 230, 253, ${drop.opacity * this.intensity})`;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + drop.length * sinW, drop.y + drop.length * cosW);
        ctx.stroke();
      }

      // Draw splash ripple rings
      for (let i = this.rainSplashes.length - 1; i >= 0; i--) {
        const s = this.rainSplashes[i];
        s.radius += dt * 18;
        s.opacity -= dt * 0.9;

        if (s.opacity <= 0 || s.radius >= s.maxRadius) {
          this.rainSplashes.splice(i, 1);
          continue;
        }

        ctx.strokeStyle = `rgba(186, 230, 253, ${s.opacity * this.intensity})`;
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, s.radius * 1.6, s.radius * 0.6, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    } else if (this.mode === 'snow') {
      ctx.save();

      // Soft white drifting snow flakes
      for (let i = 0; i < this.snowFlakes.length; i++) {
        const flake = this.snowFlakes[i];
        flake.y += flake.speedY * dt;
        flake.x += Math.sin(this.time * flake.swaySpeed + flake.swayOffset) * 25 * dt;

        if (flake.y > height) {
          flake.y = -flake.radius * 2;
          flake.x = Math.random() * width;
        }

        ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity * this.intensity})`;
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }
}
