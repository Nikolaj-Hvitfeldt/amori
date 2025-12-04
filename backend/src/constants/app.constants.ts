// Server configuration
export const SERVER_CONFIG = {
  PORT: 3000,
  HOST: "0.0.0.0", // Listen on all interfaces for mobile device access
} as const;

// Body parser limits
export const BODY_PARSER_LIMIT = "20mb"; // For image uploads

// CORS configuration
export const CORS_CONFIG = {
  origin: true, // Allow all origins for development
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
    "Origin",
    "X-Requested-With",
  ],
  exposedHeaders: ["Content-Length", "Content-Type"],
  preflightContinue: false,
  optionsSuccessStatus: 204,
} as const;

// Pagination defaults
export const PAGINATION_DEFAULTS = {
  DEFAULT_LIMIT: 1000,
  PARSE_BASE: 10,
} as const;
