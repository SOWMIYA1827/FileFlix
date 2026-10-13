function FolderIcon3D({ size = 80 }) {
  return (
    <svg
      width={size}
      height={size * 0.85}
      viewBox="0 0 100 85"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", filter: "drop-shadow(0 8px 16px rgba(245, 158, 11, 0.2))" }}
    >
      <defs>
        {/* Back folder gradient */}
        <linearGradient id="folderBackGrad" x1="10" y1="15" x2="90" y2="75" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>

        {/* Paper 1 gradient */}
        <linearGradient id="paperGrad1" x1="20" y1="10" x2="80" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>

        {/* Paper 2 gradient */}
        <linearGradient id="paperGrad2" x1="25" y1="5" x2="75" y2="45" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>

        {/* Front flap gradient */}
        <linearGradient id="folderFrontGrad" x1="10" y1="35" x2="90" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>

        {/* Front flap highlight shine */}
        <linearGradient id="shineGrad" x1="15" y1="35" x2="85" y2="35" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* 1. Back Folder Body with Tab */}
      <path
        d="M12 24C12 20.6863 14.6863 18 18 18H38C40.6522 18 43.1957 19.0536 45.0711 20.9289L48.1421 24H82C85.3137 24 88 26.6863 88 30V68C88 72.4183 84.4183 76 80 76H20C15.5817 76 12 72.4183 12 68V24Z"
        fill="url(#folderBackGrad)"
      />

      {/* 2. Paper Sheet 1 (back paper) */}
      <rect
        x="24"
        y="8"
        width="52"
        height="40"
        rx="4"
        fill="url(#paperGrad2)"
        transform="rotate(-3 24 8)"
      />
      {/* Paper 1 lines */}
      <rect x="30" y="16" width="22" height="2.5" rx="1" fill="#94a3b8" opacity="0.6" transform="rotate(-3 30 16)" />
      <rect x="30" y="22" width="36" height="2" rx="1" fill="#cbd5e1" opacity="0.7" transform="rotate(-3 30 22)" />

      {/* 3. Paper Sheet 2 (main crisp white paper) */}
      <rect
        x="28"
        y="12"
        width="50"
        height="44"
        rx="4"
        fill="url(#paperGrad1)"
        filter="drop-shadow(0 2px 5px rgba(0,0,0,0.15))"
      />
      {/* Paper 2 lines */}
      <rect x="35" y="20" width="24" height="3" rx="1.5" fill="#64748b" opacity="0.7" />
      <rect x="35" y="27" width="36" height="2" rx="1" fill="#94a3b8" opacity="0.5" />
      <rect x="35" y="32" width="30" height="2" rx="1" fill="#94a3b8" opacity="0.5" />

      {/* 4. Front Folder Flap (perspective 3D flap) */}
      <path
        d="M10 38C10 34.6863 12.6863 32 16 32H84C87.3137 32 90 34.6863 90 38V68C90 73.5228 85.5228 78 80 78H20C14.4772 78 10 73.5228 10 68V38Z"
        fill="url(#folderFrontGrad)"
        filter="drop-shadow(0 -2px 6px rgba(0,0,0,0.25))"
      />

      {/* 5. Front Flap Glossy Top Rim Highlight */}
      <path
        d="M12 34C12 33 13 32.5 14 32.5H86C87 32.5 88 33 88 34C88 34.8 87 35.5 86 35.5H14C13 35.5 12 34.8 12 34Z"
        fill="url(#shineGrad)"
      />
    </svg>
  );
}

export default FolderIcon3D;
