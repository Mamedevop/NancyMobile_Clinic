// SVG recreation of the Nancy monogram logo (N-Y-C in a golden circle)
export default function NancyLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer circle — open at bottom-right like the reference */}
      <path
        d="M 85 50 A 35 35 0 1 0 72 80"
        stroke="#C9960C" strokeWidth="4" strokeLinecap="round" fill="none"
      />
      {/* N letter */}
      <line x1="30" y1="68" x2="30" y2="32" stroke="#C9960C" strokeWidth="4" strokeLinecap="round"/>
      <line x1="30" y1="32" x2="55" y2="68" stroke="#C9960C" strokeWidth="4" strokeLinecap="round"/>
      <line x1="55" y1="68" x2="55" y2="32" stroke="#C9960C" strokeWidth="4" strokeLinecap="round"/>
      {/* Y letter — sits above, overlapping */}
      <line x1="42" y1="22" x2="50" y2="34" stroke="#C9960C" strokeWidth="3.5" strokeLinecap="round"/>
      <line x1="58" y1="22" x2="50" y2="34" stroke="#C9960C" strokeWidth="3.5" strokeLinecap="round"/>
      <line x1="50" y1="34" x2="50" y2="44" stroke="#C9960C" strokeWidth="3.5" strokeLinecap="round"/>
      {/* A letter — sits inside/below */}
      <line x1="36" y1="76" x2="50" y2="54" stroke="#C9960C" strokeWidth="3.5" strokeLinecap="round"/>
      <line x1="64" y1="76" x2="50" y2="54" stroke="#C9960C" strokeWidth="3.5" strokeLinecap="round"/>
      <line x1="41" y1="68" x2="59" y2="68" stroke="#C9960C" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  )
}
