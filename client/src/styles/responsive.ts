export const horizontalPadding = {
    // Horizontal padding that scales with screen size
    page: "px-4 sm:px-6 md:px-12 lg:px-24 xl:px-48",

    // Alternative smaller padding for sections
    section: "px-4 sm:px-6 md:px-8 lg:px-12",

    // Minimal padding for tight spaces
    compact: "px-2 sm:px-4 md:px-6",
};

// Vertical padding options
export const verticalPadding = {
    section: "py-8 md:py-12 lg:py-20",
    compact: "py-4 md:py-6 lg:py-8",
    minimal: "py-2 md:py-4",
};

// Responsive text sizes
export const textSizes = {
    hero: "text-3xl sm:text-4xl md:text-5xl lg:text-6xl",
    pageTitle: "text-2xl sm:text-3xl md:text-4xl",
    sectionTitle: "text-xl sm:text-2xl md:text-3xl",
    heading: "text-lg sm:text-xl md:text-2xl",
    body: "text-base md:text-lg",
};

// Responsive layout patterns
export const flexLayouts = {
    stackToRow: "flex flex-col md:flex-row",
    stackToRowReverse: "flex flex-col md:flex-row-reverse",
    centerStack: "flex flex-col items-center",
};

// Breakpoint values for JavaScript usage (matches Tailwind defaults)
export const breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
} as const;
