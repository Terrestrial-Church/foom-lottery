// @ts-nocheck

import React, { useState, useEffect, useRef } from 'react';

// Komponent pomocniczy do renderowania tła, aby główny komponent był czystszy
const Background = () => (
  <div className="absolute inset-0 flex items-center justify-center z-0">
    <h1 className="text-green-900/70 font-bold text-[20vw] select-none">
      F00M
    </h1>
  </div>
);

export default function CyberpunkWall({ value = 400 }) {
  const [isClient, setIsClient] = useState(false);
  const canvasRef = useRef(null);

  const animationStateRef = useRef({ frameId: null });

  // Ten useEffect uruchamia się tylko raz po stronie klienta
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Główny useEffect do obsługi rysowania na canvasie
  useEffect(() => {
    // Upewniamy się, że kod wykonuje się tylko po stronie klienta i canvas jest dostępny
    if (!isClient  || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // --- Konfiguracja animacji i wyglądu ---
    const WALL_DIMENSION = 100; // Szerokość i wysokość siatki
    const TOTAL_BRICKS = WALL_DIMENSION * WALL_DIMENSION;
    const DURATION_MS = 5000; // Czas trwania animacji w milisekundach
    const BRICK_CHARS = ['0', '1', ];


    // Kolory dopasowane do oryginalnych klas Tailwind CSS
    const INACTIVE_COLOR = 'rgba(23, 37, 84, 0.5)'; // text-gray-900 with opacity-50
    const ACTIVE_COLOR = 'rgba(74, 222, 128, 1)';   // text-green-400

    // Generujemy dane siatki tylko raz
    const bricks = Array.from({ length: TOTAL_BRICKS }, (_, i) => ({
      char: BRICK_CHARS[Math.floor(Math.random() * BRICK_CHARS.length)],
      x: i % WALL_DIMENSION,
      y: Math.floor(i / WALL_DIMENSION),
    }));

    // --- Funkcje rysujące i animujące ---

    // Funkcja do rysowania pojedynczej klatki animacji
    const draw = (progress) => {
      // Progress to wartość od 0 (start) do 1 (koniec)
      const containerWidth = canvas.clientWidth;
      const containerHeight = canvas.clientHeight;

      // Czyścimy canvas przed narysowaniem nowej klatki
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const brickSizeX = containerWidth / WALL_DIMENSION;
      const brickSizeY = containerHeight / WALL_DIMENSION;
      const fontSize = Math.min(brickSizeX, brickSizeY);

      ctx.font = `${fontSize}px PixeloidSans`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Obliczamy, ile "cegiełek" ma być już aktywnych
      const animatedBrickCount = Math.floor(progress * value);

      for (let i = 0; i < TOTAL_BRICKS; i++) {
        const brick = bricks[i];
        const isActive = i < animatedBrickCount;

        ctx.fillStyle = isActive ? ACTIVE_COLOR : INACTIVE_COLOR;

        const drawX = (brick.x + 0.5) * brickSizeX;
        const drawY = (brick.y + 0.5) * brickSizeY;

        ctx.fillText(brick.char, drawX, drawY);
      }
    };

    // Pętla animacji
    const animate = (timestamp) => {
      if (!animationStateRef.current.startTime) {
        animationStateRef.current.startTime = timestamp;
      }

      const elapsed = timestamp - animationStateRef.current.startTime;
      const progress = Math.min(elapsed / DURATION_MS, 1);

      draw(progress); // Rysujemy klatkę

      // Kontynuujemy animację, jeśli nie dobiegła końca
      if (progress < 1) {
        animationStateRef.current.frameId = requestAnimationFrame(animate);
      }
    };

    // Funkcja do obsługi zmiany rozmiaru okna/kontenera
    const handleResize = () => {
      const dpr = window.devicePixelRatio = 1;
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      ctx.scale(dpr, dpr);

      // Przerysowujemy canvas po zmianie rozmiaru z aktualnym postępem
      const elapsed = performance.now() - (animationStateRef.current.startTime || performance.now());
      const progress = Math.min(elapsed / DURATION_MS, 1);
      draw(progress);
    };

    // --- Inicjalizacja i czyszczenie ---

    handleResize(); // Ustawiamy początkowy rozmiar

    // Używamy ResizeObserver do wydajnego śledzenia zmian rozmiaru kontenera
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas.parentElement);

    // Resetujemy i startujemy animację
    animationStateRef.current.startTime = null;
    animationStateRef.current.frameId = requestAnimationFrame(animate);

    // Funkcja czyszcząca, która uruchomi się przy odmontowaniu komponentu
    return () => {
      if (animationStateRef.current.frameId) {
        cancelAnimationFrame(animationStateRef.current.frameId);
      }
      resizeObserver.disconnect();
    };

  }, [isClient, value]); // Uruchom ponownie efekt, jeśli zmieni się prop 'value'

  // Renderujemy null po stronie serwera
  if (!isClient) {
    return null;
  }

  return (
<div className="absolute inset-0 -z-10 w-full h-full opacity-10">
  <canvas
    ref={canvasRef}
    className="w-full h-full"
    aria-hidden="true"
  />
</div>
  );
}
