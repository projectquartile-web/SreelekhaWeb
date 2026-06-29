import React from "react";

interface LogoProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  isScrolled?: boolean;
}

export default function Logo({ className = "", width = 120, height = 90, isScrolled = false }: LogoProps) {
  return (
    <svg
      viewBox="0 0 400 300"
      width={width}
      height={height}
      className={`transition-all duration-300 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Curved Path for SREELEKHA arched text */}
        <path id="sreelekha-text-path" d="M 100,140 A 100,100 0 0,1 300,140" fill="none" />
      </defs>

      {/* Retro Horizontal Striped Wings (Left Wing) */}
      <g stroke={isScrolled ? "#111827" : "#FFFFFF"} strokeWidth="1.5" opacity="0.8">
        <line x1="20" y1="180" x2="80" y2="180" />
        <line x1="25" y1="187" x2="80" y2="187" />
        <line x1="30" y1="194" x2="80" y2="194" />
        <line x1="35" y1="201" x2="80" y2="201" />
        <line x1="40" y1="208" x2="80" y2="208" />
        <line x1="45" y1="215" x2="80" y2="215" />
      </g>

      {/* Retro Horizontal Striped Wings (Right Wing) */}
      <g stroke={isScrolled ? "#111827" : "#FFFFFF"} strokeWidth="1.5" opacity="0.8">
        <line x1="320" y1="180" x2="380" y2="180" />
        <line x1="320" y1="187" x2="375" y2="187" />
        <line x1="320" y1="194" x2="370" y2="194" />
        <line x1="320" y1="201" x2="365" y2="201" />
        <line x1="320" y1="208" x2="360" y2="208" />
        <line x1="320" y1="215" x2="355" y2="215" />
      </g>

      {/* Main Circular Red Badge */}
      <circle cx="200" cy="130" r="95" fill="#D90429" stroke={isScrolled ? "#111827" : "#FFFFFF"} strokeWidth="2.5" />
      {/* Innermost Ring Border */}
      <circle cx="200" cy="130" r="90" fill="none" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
      <circle cx="200" cy="130" r="82" fill="none" stroke="#111827" strokeWidth="1.5" />

      {/* Arched text: SREELEKHA */}
      <text fill="#FFFFFF" fontSize="24" fontWeight="800" fontFamily="system-ui, sans-serif" letterSpacing="4">
        <textPath href="#sreelekha-text-path" startOffset="50%" textAnchor="middle">
          SREELEKHA
        </textPath>
      </text>

      {/* Central White Badge containing Goddess Lakshmi */}
      <circle cx="200" cy="138" r="56" fill="#FFFFFF" stroke="#111827" strokeWidth="2" />

      {/* Lakshmi Line Art Illustration */}
      <g stroke="#111827" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Crown (Mukut) */}
        <path d="M 188,110 L 200,80 L 212,110 Z" fill="#FFFFFF" />
        <path d="M 194,110 L 200,90 L 206,110" />
        <circle cx="200" cy="76" r="3" fill="#111827" />
        <path d="M 183,110 Q 200,105 217,110" />

        {/* Face & Hair */}
        <path d="M 190,110 Q 183,122 190,135" /> {/* Left hair frame */}
        <path d="M 210,110 Q 217,122 210,135" /> {/* Right hair frame */}
        <path d="M 191,114 Q 200,128 209,114" /> {/* Face outline */}
        <circle cx="200" cy="115" r="1.5" fill="#D90429" stroke="none" /> {/* Bindi */}

        {/* Eyes & Eyebrows */}
        <path d="M 194,119 Q 196,118 198,119" strokeWidth="1.2" /> {/* Left eyebrow */}
        <path d="M 202,119 Q 204,118 206,119" strokeWidth="1.2" /> {/* Right eyebrow */}
        <path d="M 194,121 Q 196,122 198,121" strokeWidth="1" /> {/* Left eye */}
        <path d="M 202,121 Q 204,122 206,121" strokeWidth="1" /> {/* Right eye */}

        {/* Nose & Smile */}
        <path d="M 199,121 L 200,125 L 201,125" strokeWidth="1" />
        <path d="M 197,127 Q 200,130 203,127" strokeWidth="1" />

        {/* Garment / Necklaces */}
        <path d="M 191,130 Q 200,138 209,130" />
        <path d="M 189,134 Q 200,143 211,134" strokeWidth="1.2" />
        <path d="M 184,136 Q 200,150 216,136" />
        
        {/* Left Hand Holding Lotus */}
        <path d="M 174,138 Q 164,138 168,148 Q 172,154 175,148" /> {/* Arm/Hand */}
        <path d="M 166,138 L 166,134" strokeWidth="2" /> {/* Stem */}
        {/* Lotus Petals */}
        <path d="M 166,134 C 160,132 163,122 166,120 C 169,122 172,132 166,134 Z" fill="#FFFFFF" />
        <path d="M 166,134 C 158,136 156,128 161,126 C 164,128 165,133 166,134 Z" fill="#FFFFFF" />
        <path d="M 166,134 C 174,136 176,128 171,126 C 168,128 167,133 166,134 Z" fill="#FFFFFF" />

        {/* Right Hand Holding Lotus */}
        <path d="M 226,138 Q 236,138 232,148 Q 228,154 225,148" /> {/* Arm/Hand */}
        <path d="M 234,138 L 234,134" strokeWidth="2" /> {/* Stem */}
        {/* Lotus Petals */}
        <path d="M 234,134 C 228,132 231,122 234,120 C 237,122 240,132 234,134 Z" fill="#FFFFFF" />
        <path d="M 234,134 C 226,136 224,128 229,126 C 232,128 233,133 234,134 Z" fill="#FFFFFF" />
        <path d="M 234,134 C 242,136 244,128 239,126 C 236,128 235,133 234,134 Z" fill="#FFFFFF" />
      </g>

      {/* Horizontal Black "THEATRE" Banner */}
      <rect
        x="70"
        y="170"
        width="260"
        height="50"
        fill="#111827"
        stroke={isScrolled ? "#111827" : "#FFFFFF"}
        strokeWidth="2.5"
        rx="2"
      />
      {/* Inner White Frame on the Banner */}
      <rect
        x="75"
        y="175"
        width="250"
        height="40"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        rx="1"
      />
      {/* Bold Serif text: THEATRE */}
      <text
        x="200"
        y="204"
        fill="#FFFFFF"
        fontSize="22"
        fontWeight="800"
        fontFamily="Georgia, Times New Roman, serif"
        textAnchor="middle"
        letterSpacing="8"
      >
        THEATRE
      </text>
    </svg>
  );
}
