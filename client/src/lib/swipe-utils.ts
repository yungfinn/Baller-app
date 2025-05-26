import { useState, useCallback } from "react";

interface SwipeGestureOptions {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  threshold?: number;
}

export function useSwipeGestures({ 
  onSwipeLeft, 
  onSwipeRight, 
  threshold = 100 
}: SwipeGestureOptions) {
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const getEventPosition = (e: TouchEvent | MouseEvent) => {
    if ('touches' in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const position = getEventPosition(e.nativeEvent);
    setStartPosition(position);
    setCurrentPosition(position);
    setIsDragging(true);
    e.preventDefault();
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const position = getEventPosition(e.nativeEvent);
    setStartPosition(position);
    setCurrentPosition(position);
    setIsDragging(true);
    e.preventDefault();
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const position = getEventPosition(e.nativeEvent);
    setCurrentPosition(position);
    e.preventDefault();
  }, [isDragging]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const position = getEventPosition(e.nativeEvent);
    setCurrentPosition(position);
    e.preventDefault();
  }, [isDragging]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const deltaX = currentPosition.x - startPosition.x;
    const deltaY = Math.abs(currentPosition.y - startPosition.y);
    
    // Only trigger swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        onSwipeRight();
      } else {
        onSwipeLeft();
      }
    }
    
    setIsDragging(false);
    setStartPosition({ x: 0, y: 0 });
    setCurrentPosition({ x: 0, y: 0 });
    e.preventDefault();
  }, [isDragging, currentPosition, startPosition, threshold, onSwipeLeft, onSwipeRight]);

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = currentPosition.x - startPosition.x;
    const deltaY = Math.abs(currentPosition.y - startPosition.y);
    
    // Only trigger swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        onSwipeRight();
      } else {
        onSwipeLeft();
      }
    }
    
    setIsDragging(false);
    setStartPosition({ x: 0, y: 0 });
    setCurrentPosition({ x: 0, y: 0 });
    e.preventDefault();
  }, [isDragging, currentPosition, startPosition, threshold, onSwipeLeft, onSwipeRight]);

  // Calculate transform and opacity for visual feedback
  const deltaX = isDragging ? currentPosition.x - startPosition.x : 0;
  const rotation = deltaX * 0.1;
  const opacity = isDragging ? Math.max(0.5, 1 - Math.abs(deltaX) / 200) : 1;
  const transform = isDragging ? `translateX(${deltaX}px) rotate(${rotation}deg)` : '';

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    transform,
    opacity,
    isDragging,
  };
}
