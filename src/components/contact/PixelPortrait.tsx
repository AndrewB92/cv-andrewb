"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type FocusEvent,
  type PointerEvent,
} from "react";

import styles from "./PixelPortrait.module.css";

export type FaceMask = {
  /** Horizontal face centre as a fraction of canvas width. */
  centerX: number;

  /** Vertical face centre as a fraction of canvas height. */
  centerY: number;

  /** Horizontal ellipse radius as a fraction of canvas width. */
  radiusX: number;

  /** Vertical ellipse radius as a fraction of canvas height. */
  radiusY: number;

  /** Optional clockwise rotation in radians. */
  rotation?: number;
};

type PixelPortraitProps = {
  src: string;
  alt: string;
  blockSize?: number;
  faceMask?: FaceMask;

  /** Time used to reveal the clear face on hover/focus. */
  revealDurationMs?: number;

  /** Time used to restore the pixelated face. */
  pixelateDurationMs?: number;
};

type PixelBlock = {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
};

type PixelMask = {
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
  rotation: number;
};

const MAX_CANVAS_EDGE = 720;

const DEFAULT_FACE_MASK: FaceMask = {
  centerX: 0.5,
  centerY: 0.31,
  radiusX: 0.2,
  radiusY: 0.235,
  rotation: 0,
};

function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));

    [result[index], result[swapIndex]] = [
      result[swapIndex],
      result[index],
    ];
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

function toPixelMask(
  canvasWidth: number,
  canvasHeight: number,
  mask: FaceMask,
): PixelMask {
  return {
    centerX: canvasWidth * mask.centerX,
    centerY: canvasHeight * mask.centerY,
    radiusX: canvasWidth * mask.radiusX,
    radiusY: canvasHeight * mask.radiusY,
    rotation: mask.rotation ?? 0,
  };
}

function isInsideRotatedEllipse(
  x: number,
  y: number,
  mask: PixelMask,
): boolean {
  const translatedX = x - mask.centerX;
  const translatedY = y - mask.centerY;

  const cos = Math.cos(-mask.rotation);
  const sin = Math.sin(-mask.rotation);

  const rotatedX = translatedX * cos - translatedY * sin;
  const rotatedY = translatedX * sin + translatedY * cos;

  return (
    (rotatedX * rotatedX) / (mask.radiusX * mask.radiusX) +
      (rotatedY * rotatedY) / (mask.radiusY * mask.radiusY) <=
    1
  );
}

function withFaceClip(
  context: CanvasRenderingContext2D,
  mask: PixelMask,
  draw: () => void,
) {
  context.save();
  context.beginPath();
  context.ellipse(
    mask.centerX,
    mask.centerY,
    mask.radiusX,
    mask.radiusY,
    mask.rotation,
    0,
    Math.PI * 2,
  );
  context.clip();

  draw();

  context.restore();
}

export function PixelPortrait({
  src,
  alt,
  blockSize = 36,
  faceMask = DEFAULT_FACE_MASK,
  revealDurationMs = 1900,
  pixelateDurationMs = 1500,
}: PixelPortraitProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const blocksRef = useRef<PixelBlock[]>([]);
  const pixelMaskRef = useRef<PixelMask | null>(null);
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

  const drawFullImage = useCallback(() => {
    const context = contextRef.current;
    const image = imageRef.current;
    const canvas = canvasRef.current;

    if (!context || !image || !canvas) return;

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
  }, []);

  const drawOriginalBlock = useCallback((block: PixelBlock) => {
    const context = contextRef.current;
    const image = imageRef.current;
    const canvas = canvasRef.current;
    const mask = pixelMaskRef.current;

    if (!context || !image || !canvas || !mask) return;

    const source = sourceRectRef.current;
    const scaleX = source.sw / canvas.width;
    const scaleY = source.sh / canvas.height;

    withFaceClip(context, mask, () => {
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
    });
  }, []);

  const drawPixelBlock = useCallback((block: PixelBlock) => {
    const context = contextRef.current;
    const mask = pixelMaskRef.current;

    if (!context || !mask) return;

    withFaceClip(context, mask, () => {
      context.fillStyle = block.color;
      context.fillRect(block.x, block.y, block.width, block.height);
    });
  }, []);

  const renderPixelatedFace = useCallback(() => {
    drawFullImage();

    for (const block of blocksRef.current) {
      drawPixelBlock(block);
    }

    modeRef.current = "pixelated";
  }, [drawFullImage, drawPixelBlock]);

  const animateTo = useCallback(
    (
      nextMode: "pixelated" | "clear",
      durationMs: number,
    ) => {
      if (!isReadyRef.current || modeRef.current === nextMode) return;

      cancelAnimation();
      modeRef.current = nextMode;

      /*
       * Always rebuild the stable starting frame. This prevents visual holes
       * when the pointer changes direction before an animation has completed.
       */
      if (nextMode === "pixelated") {
        drawFullImage();
      } else {
        renderPixelatedFace();
        modeRef.current = "clear";
      }

      const blocks = shuffle(blocksRef.current);

      if (!blocks.length) return;

      const safeDuration = Math.max(120, durationMs);
      let drawnCount = 0;
      let startedAt: number | null = null;

      const renderFrame = (timestamp: number) => {
        if (startedAt === null) {
          startedAt = timestamp;
        }

        const progress = Math.min(
          1,
          (timestamp - startedAt) / safeDuration,
        );

        const targetCount = Math.min(
          blocks.length,
          Math.ceil(progress * blocks.length),
        );

        while (drawnCount < targetCount) {
          const block = blocks[drawnCount];

          if (nextMode === "clear") {
            drawOriginalBlock(block);
          } else {
            drawPixelBlock(block);
          }

          drawnCount += 1;
        }

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(renderFrame);
        } else {
          animationFrameRef.current = null;
        }
      };

      animationFrameRef.current = requestAnimationFrame(renderFrame);
    },
    [
      cancelAnimation,
      drawFullImage,
      drawOriginalBlock,
      drawPixelBlock,
      renderPixelatedFace,
    ],
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

      /*
       * The canvas uses the same 4:5 ratio as its CSS container. This is
       * important: face-mask coordinates now match what is actually visible,
       * even when the source image has a different aspect ratio.
       */
      const canvasWidth = Math.min(
        MAX_CANVAS_EDGE,
        Math.max(320, image.naturalWidth),
      );
      const canvasHeight = Math.round(canvasWidth * 1.25);

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      sourceRectRef.current = getCoverSourceRect(
        image.naturalWidth,
        image.naturalHeight,
        canvas.width,
        canvas.height,
      );

      pixelMaskRef.current = toPixelMask(
        canvas.width,
        canvas.height,
        faceMask,
      );

      contextRef.current = context;
      drawFullImage();

      const imageData = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height,
      );

      const mask = pixelMaskRef.current;
      const blocks: PixelBlock[] = [];

      for (let y = 0; y < canvas.height; y += blockSize) {
        for (let x = 0; x < canvas.width; x += blockSize) {
          const width = Math.min(blockSize, canvas.width - x);
          const height = Math.min(blockSize, canvas.height - y);
          const blockCenterX = x + width / 2;
          const blockCenterY = y + height / 2;

          if (!mask || !isInsideRotatedEllipse(blockCenterX, blockCenterY, mask)) {
            continue;
          }

          let red = 0;
          let green = 0;
          let blue = 0;
          let samples = 0;

          for (let sampleY = y; sampleY < y + height; sampleY += 4) {
            for (let sampleX = x; sampleX < x + width; sampleX += 4) {
              if (!isInsideRotatedEllipse(sampleX, sampleY, mask)) {
                continue;
              }

              const offset = (sampleY * canvas.width + sampleX) * 4;

              red += imageData.data[offset];
              green += imageData.data[offset + 1];
              blue += imageData.data[offset + 2];
              samples += 1;
            }
          }

          if (!samples) continue;

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

      blocksRef.current = blocks;
      isReadyRef.current = true;

      renderPixelatedFace();
    },
    [blockSize, drawFullImage, faceMask, renderPixelatedFace],
  );

  useEffect(() => {
    const image = new Image();

    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.src = src;
    imageRef.current = image;

    const onLoad = () => initialiseCanvas(image);

    if (image.complete && image.naturalWidth > 0) {
      onLoad();
    } else {
      image.addEventListener("load", onLoad, { once: true });
    }

    return () => {
      cancelAnimation();
      image.removeEventListener("load", onLoad);

      imageRef.current = null;
      contextRef.current = null;
      blocksRef.current = [];
      pixelMaskRef.current = null;
      isReadyRef.current = false;
    };
  }, [cancelAnimation, initialiseCanvas, src]);

  const reveal = (_event?: PointerEvent | FocusEvent) => {
    animateTo("clear", revealDurationMs);
  };

  const pixelate = (_event?: PointerEvent | FocusEvent) => {
    animateTo("pixelated", pixelateDurationMs);
  };

  return (
    <figure
      className={styles.root}
      tabIndex={0}
      onPointerEnter={reveal}
      onPointerLeave={pixelate}
      onFocus={reveal}
      onBlur={pixelate}
      aria-label={`${alt}. Focus or hover to reveal the face.`}
    >
      <img className={styles.fallback} src={src} alt={alt} />

      <canvas
        ref={canvasRef}
        className={styles.canvas}
        role="img"
        aria-label={alt}
      />

      <figcaption className={styles.caption}>
        <span>Hover to reveal</span>
      </figcaption>
    </figure>
  );
}