import { useEffect, useState } from 'react';
import { Image as KonvaImage } from 'react-konva';

interface BackgroundImageProps {
  dataUrl: string;
  width: number;
  height: number;
  opacity: number;
}

/**
 * Renders the uploaded floor-plan image behind the editable layer.
 * The image is stretched to cover the room's bounding box.
 */
export function BackgroundImage({ dataUrl, width, height, opacity }: BackgroundImageProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!dataUrl) {
      setImage(null);
      return;
    }
    const img = new window.Image();
    img.src = dataUrl;
    img.onload = () => setImage(img);
    return () => {
      img.onload = null;
    };
  }, [dataUrl]);

  if (!image) return null;

  return (
    <KonvaImage
      image={image}
      x={0}
      y={0}
      width={width}
      height={height}
      opacity={opacity}
      listening={false}
    />
  );
}
