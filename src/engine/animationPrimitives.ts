// Reusable Animation Primitives for CodeFlow DSA Lab
// Provides deterministic animation tokens, classnames, and keyframes for state transitions

export type AnimationType =
  | 'valueChange'
  | 'highlight'
  | 'move'
  | 'appear'
  | 'disappear'
  | 'compare'
  | 'swap'
  | 'pulse';

export interface AnimationConfig {
  type: AnimationType;
  durationMs?: number;
  highlightColor?: string;
  fromValue?: any;
  toValue?: any;
}

export const AnimationPrimitives = {
  // Value change animation: numbers/text transitions with glow
  valueChange: (oldVal: any, newVal: any) => ({
    className: 'animate-pulse text-[#3fb950] font-extrabold scale-110 transition-all duration-300',
    description: `Value transition: ${oldVal} ➔ ${newVal}`,
  }),

  // Highlight an active element currently participating in execution
  highlight: (color: 'blue' | 'green' | 'amber' | 'purple' = 'blue') => {
    switch (color) {
      case 'green':
        return 'ring-2 ring-[#3fb950] bg-[#3fb950]/20 text-[#3fb950] shadow-lg shadow-[#3fb950]/20';
      case 'amber':
        return 'ring-2 ring-[#d29922] bg-[#d29922]/20 text-[#d29922] shadow-lg shadow-[#d29922]/20';
      case 'purple':
        return 'ring-2 ring-[#bc8cff] bg-[#bc8cff]/20 text-[#bc8cff] shadow-lg shadow-[#bc8cff]/20';
      default:
        return 'ring-2 ring-[#58a6ff] bg-[#58a6ff]/20 text-[#58a6ff] shadow-lg shadow-[#58a6ff]/20';
    }
  },

  // Comparison pulse when evaluating boolean expressions
  compare: (result: boolean) => ({
    className: result
      ? 'border-[#3fb950] bg-[#3fb950]/15 text-[#3fb950] ring-1 ring-[#3fb950]'
      : 'border-[#f85149] bg-[#f85149]/15 text-[#f85149] ring-1 ring-[#f85149]',
    label: result ? 'TRUE ✓' : 'FALSE ✗',
  }),

  // Swap animation classes for two swapping indices
  swap: () => 'transform translate-y-[-4px] ring-2 ring-[#bc8cff] bg-[#bc8cff]/20 text-[#bc8cff] transition-transform duration-300',

  // Pulse animation for active pointers/iterations
  pulse: () => 'animate-bounce text-[#58a6ff]',

  // Elements entering the visualization
  appear: () => 'opacity-100 scale-100 transition-all duration-300 ease-out',

  // Elements leaving the visualization
  disappear: () => 'opacity-0 scale-95 transition-all duration-200 ease-in',

  // Move animation for pointer arrows
  move: () => 'transition-all duration-300 ease-in-out',
};
