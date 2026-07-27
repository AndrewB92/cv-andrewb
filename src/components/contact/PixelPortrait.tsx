"use client";

import { useCallback, useEffect, useRef } from "react";
import styles from "./PixelPortrait.module.css";

type PixelPortraitProps = {
  src: string;
  alt: string;
  blockSize?: number;
};

type PixelBlock = {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
};

const MAX_CANVAS_EDGE = 720;
const BLOCKS_PER_FRAME = 8;

function shuffle<T>(items: T[]) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

function getCoverSourceRect(
  imageWidth: number,
  imageHeight: number,
  canvasWidth: number,
  canvasHeight: number,
) {
  const imageRatio = imageWidth / imageHeight;
  const canvasRatio = canvasWidth / canvasHeight;

  if (imageRatio > canvasRatio) {
    const sourceWidth = imageHeight * canvasRatio;
    return {
      sx: (imageWidth - sourceWidth) / 2,
      sy: 0,
      sw: sourceWidth,
      sh: imageHeight,
    };
  }

  const sourceHeight = imageWidth / canvasRatio;
  return {
    sx: 0,
    sy: (imageHeight - sourceHeight) / 2,
    sw: imageWidth,
    sh: sourceHeight,
  };
}

export function PixelPortrait({
  src,
  alt,
  blockSize = 42,
}: PixelPortraitProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const blocksRef = useRef<PixelBlock[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const modeRef = useRef<"pixelated" | "clear">("pixelated");
  const isReadyRef = useRef(false);
  const sourceRectRef = useRef({ sx: 0, sy: 0, sw: 0, sh: 0 });

  const cancelAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const drawOriginalBlock = useCallback((block: PixelBlock) => {
    const context = contextRef.current;
    const image = imageRef.current;
    const canvas = canvasRef.current;
    if (!context || !image || !canvas) return;

    const source = sourceRectRef.current;
    const scaleX = source.sw / canvas.width;
    const scaleY = source.sh / canvas.height;

    context.drawImage(
      image,
      source.sx + block.x * scaleX,
      source.sy + block.y * scaleY,
      block.width * scaleX,
      block.height * scaleY,
      block.x,
      block.y,
      block.width,
      block.height,
    );
  }, []);

  const drawPixelBlock = useCallback((block: PixelBlock) => {
    const context = contextRef.current;
    if (!context) return;
    context.fillStyle = block.color;
    context.fillRect(block.x, block.y, block.width, block.height);
  }, []);

  const animateTo = useCallback(
    (nextMode: "pixelated" | "clear") => {
      if (!isReadyRef.current || modeRef.current === nextMode) return;

      cancelAnimation();
      modeRef.current = nextMode;
      const blocks = shuffle(blocksRef.current);
      let index = 0;

      const renderFrame = () => {
        const end = Math.min(index + BLOCKS_PER_FRAME, blocks.length);

        for (; index < end; index += 1) {
          if (nextMode === "clear") drawOriginalBlock(blocks[index]);
          else drawPixelBlock(blocks[index]);
        }

        if (index < blocks.length) {
          animationFrameRef.current = requestAnimationFrame(renderFrame);
        } else {
          animationFrameRef.current = null;
        }
      };

      animationFrameRef.current = requestAnimationFrame(renderFrame);
    },
    [cancelAnimation, drawOriginalBlock, drawPixelBlock],
  );

  const initialiseCanvas = useCallback(
    (image: HTMLImageElement) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext("2d", {
        alpha: false,
        willReadFrequently: true,
      });
      if (!context) return;

      const canvasWidth = Math.min(
        MAX_CANVAS_EDGE,
        Math.max(320, image.naturalWidth),
      );
      const targetRatio = 4 / 5;
      canvas.width = canvasWidth;
      canvas.height = Math.round(canvasWidth / targetRatio);

      sourceRectRef.current = getCoverSourceRect(
        image.naturalWidth,
        image.naturalHeight,
        canvas.width,
        canvas.height,
      );

      const source = sourceRectRef.current;
      context.drawImage(
        image,
        source.sx,
        source.sy,
        source.sw,
        source.sh,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const blocks: PixelBlock[] = [];

      for (let y = 0; y < canvas.height; y += blockSize) {
        for (let x = 0; x < canvas.width; x += blockSize) {
          const width = Math.min(blockSize, canvas.width - x);
          const height = Math.min(blockSize, canvas.height - y);
          let red = 0;
          let green = 0;
          let blue = 0;
          let samples = 0;

          for (let sampleY = y; sampleY < y + height; sampleY += 4) {
            for (let sampleX = x; sampleX < x + width; sampleX += 4) {
              const offset = (sampleY * canvas.width + sampleX) * 4;
              red += imageData.data[offset];
              green += imageData.data[offset + 1];
              blue += imageData.data[offset + 2];
              samples += 1;
            }
          }

          blocks.push({
            x,
            y,
            width,
            height,
            color: `rgb(${Math.round(red / samples)}, ${Math.round(
              green / samples,
            )}, ${Math.round(blue / samples)})`,
          });
        }
      }

      contextRef.current = context;
      blocksRef.current = blocks;
      isReadyRef.current = true;
      modeRef.current = "clear";
      animateTo("pixelated");
    },
    [animateTo, blockSize],
  );

  useEffect(() => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.src = src;
    imageRef.current = image;

    const onLoad = () => initialiseCanvas(image);

    if (image.complete && image.naturalWidth > 0) onLoad();
    else image.addEventListener("load", onLoad, { once: true });

    return () => {
      cancelAnimation();
      image.removeEventListener("load", onLoad);
      imageRef.current = null;
      contextRef.current = null;
      blocksRef.current = [];
      isReadyRef.current = false;
    };
  }, [cancelAnimation, initialiseCanvas, src]);

  return (
    <figure
      className={styles.root}
      tabIndex={0}
      onPointerEnter={() => animateTo("clear")}
      onPointerLeave={() => animateTo("pixelated")}
      onFocus={() => animateTo("clear")}
      onBlur={() => animateTo("pixelated")}
      aria-label={`${alt}. Focus or hover to reveal the portrait.`}
    >
      <img className={styles.fallback} src={src} alt={alt} />
      <canvas ref={canvasRef} className={styles.canvas} role="img" aria-label={alt} />
      <figcaption className={styles.caption}>Hover to reveal</figcaption>
    </figure>
  );
}