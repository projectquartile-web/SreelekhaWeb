export const theme = {
  colors: {
    background: "#FFFFFF", // Pristine clean white
    secondaryBackground: "#F8FAFC", // Soft slate off-white
    accentBlue: "#2563EB", // Premium digital blue
    lightBlue: "#60A5FA", // Soft accent highlight
    textPrimary: "#111827", // Deep obsidian gray
    textSecondary: "#6B7280", // Muted neutral gray
    border: "#E5E7EB", // Subtle boundary lines
  },
  spacing: {
    containerMaxWidth: "max-w-7xl",
    sectionPadding: "py-32 md:py-40", // Spacious, premium Apple-like spacing
    mobileHeaderHeight: "h-20",
  },
  animations: {
    springDefault: {
      type: "spring" as const,
      stiffness: 100,
      damping: 20,
    },
    springSlow: {
      type: "spring" as const,
      stiffness: 60,
      damping: 15,
    },
    fadeInUp: {
      initial: { opacity: 0, y: 30 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -30 },
    },
  },
} as const;
