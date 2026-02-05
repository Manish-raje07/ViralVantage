"use client";

import { useState, useEffect } from 'react';

type BreakpointKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const breakpoints: Record<BreakpointKey, number> = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

function getBreakpointFromWidth(width: number): BreakpointKey {
  if (width >= breakpoints['2xl']) return '2xl';
  if (width >= breakpoints.xl) return 'xl';
  if (width >= breakpoints.lg) return 'lg';
  if (width >= breakpoints.md) return 'md';
  if (width >= breakpoints.sm) return 'sm';
  return 'xs';
}

export function useResponsive() {
  // Safe defaults for SSR - assume desktop
  const [screenSize, setScreenSize] = useState<BreakpointKey>('lg');
  const [windowSize, setWindowSize] = useState({
    width: 1024,
    height: 768,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setWindowSize({ width, height });
      setScreenSize(getBreakpointFromWidth(width));
    };

    // Initial call to set correct values
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = mounted ? (screenSize === 'xs' || screenSize === 'sm') : false;
  const isTablet = mounted ? screenSize === 'md' : false;
  const isDesktop = mounted ? (screenSize === 'lg' || screenSize === 'xl' || screenSize === '2xl') : true;

  return {
    screenSize,
    windowSize,
    isMobile,
    isTablet,
    isDesktop,
    breakpoints,
    mounted,
  };
}

