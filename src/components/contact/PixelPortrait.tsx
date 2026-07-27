"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type FocusEvent,
  type PointerEvent,
} from "react";

import styles from "./PixelPortrait.module.css";

type FaceMask = {
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
  rotation?: number;
};

type PixelPortraitProps = {
  src: string;
  alt: string;
  blockSize?: number;
  faceMask?: FaceMask;
};

type PixelBlock = {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
};

const MAX_CANVAS_EDGE = 720;
const BLOCKS_PER_FRAME = 7;

const DEFAULT_FACE_MASK: FaceMask = {
  centerX: 0.5,
  centerY: 0.245,
  radiusX: 0.205,
  radiusY: 0.23,
  rotation: 0,
};

function shuffle<T>(items: T[]) {
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

function isInsideRotatedEllipse(
  x: number,
  y: number,
  canvasWidth: number,
  canvasHeight: number,
  mask: FaceMask,
) {
  const centerX = canvasWidth * mask.centerX;
  const centerY = canvasHeight * mask.centerY;
  const radiusX = canvasWidth * mask.radiusX;
  const radiusY = canvasHeight * mask.radiusY;
  const rotation = mask.rotation ?? 0;

  const translatedX = x - centerX;
  const translatedY = y - centerY;

  const cos = Math.cos(-rotation);
  const sin = Math.sin(-rotation);

  const rotatedX = translatedX * cos - translatedY * sin;
  const rotatedY = translatedX * sin + translatedY * cos;

  return (
    (rotatedX * rotatedX) / (radiusX * radiusX) +
      (rotatedY * rotatedY) / (radiusY * radiusY) <=
    1
  );
}

export function PixelPortrait({
  src,
  alt,
  blockSize = 34,
  faceMask = DEFAULT_FACE_MASK,
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

  const renderPixelatedFace = useCallback(() => {
    drawFullImage();

    for (const block of blocksRef.current) {
      drawPixelBlock(block);
    }

    modeRef.current = "pixelated";
  }, [drawFullImage, drawPixelBlock]);

  const animateTo = useCallback(
    (nextMode: "pixelated" | "clear") => {
      if (!isReadyRef.current || modeRef.current === nextMode) return;

      cancelAnimation();
      modeRef.current = nextMode;

      if (nextMode === "pixelated") {
        drawFullImage();
      }

      const blocks = shuffle(blocksRef.current);
      let index = 0;

      const renderFrame = () => {
        const end = Math.min(index + BLOCKS_PER_FRAME, blocks.length);

        for (; index < end; index += 1) {
          if (nextMode === "clear") {
            drawOriginalBlock(blocks[index]);
          } else {
            drawPixelBlock(blocks[index]);
          }
        }

        if (index < blocks.length) {
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

      const sourceRatio = image.naturalWidth / image.naturalHeight;
      const canvasWidth = Math.min(
        MAX_CANVAS_EDGE,
        Math.max(320, image.naturalWidth),
      );
      const canvasHeight = Math.min(
        MAX_CANVAS_EDGE,
        Math.round(canvasWidth / sourceRatio),
      );

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      sourceRectRef.current = getCoverSourceRect(
        image.naturalWidth,
        image.naturalHeight,
        canvas.width,
        canvas.height,
      );

      contextRef.current = context;
      drawFullImage();

      const imageData = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height,
      );

      const blocks: PixelBlock[] = [];

      for (let y = 0; y < canvas.height; y += blockSize) {
        for (let x = 0; x < canvas.width; x += blockSize) {
          const width = Math.min(blockSize, canvas.width - x);
          const height = Math.min(blockSize, canvas.height - y);

          const blockCenterX = x + width / 2;
          const blockCenterY = y + height / 2;

          if (
            !isInsideRotatedEllipse(
              blockCenterX,
              blockCenterY,
              canvas.width,
              canvas.height,
              faceMask,
            )
          ) {
            continue;
          }

          let red = 0;
          let green = 0;
          let blue = 0;
          let samples = 0;

          for (let sampleY = y; sampleY < y + height; sampleY += 4) {
            for (let sampleX = x; sampleX < x + width; sampleX += 4) {
              if (
                !isInsideRotatedEllipse(
                  sampleX,
                  sampleY,
                  canvas.width,
                  canvas.height,
                  faceMask,
                )
              ) {
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
      isReadyRef.current = false;
    };
  }, [cancelAnimation, initialiseCanvas, src]);

  const reveal = (_event?: PointerEvent | FocusEvent) =>
    animateTo("clear");

  const pixelate = (_event?: PointerEvent | FocusEvent) =>
    animateTo("pixelated");

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