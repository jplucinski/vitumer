import { useRef } from 'react';
import { gsap, useGSAP } from '../utils/gsap';

export function useSectionReveal(reduced: boolean) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const root = rootRef.current;
    if (reduced || !root) return;
    const nodes = root.querySelectorAll('[data-reveal]');
    if (nodes.length === 0) return;
    gsap.from(nodes, {
      opacity: 0,
      y: 28,
      duration: 0.7,
      stagger: 0.08,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: root,
        start: 'top 88%',
      },
    });
  }, { dependencies: [reduced], scope: rootRef });

  return rootRef;
}
