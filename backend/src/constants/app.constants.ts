// Server configuration
export const SERVER_CONFIG = {
  PORT: 3000,
  HOST: "0.0.0.0", // Listen on all interfaces for mobile device access
} as const;

// Body parser limits
export const BODY_PARSER_LIMIT = "20mb"; // For image uploads

// CORS configuration
// In production, you can restrict origins for better security
// For development, allow all origins
const getAllowedOrigins = (): string[] | boolean => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS;
  if (allowedOrigins) {
    // Comma-separated list of allowed origins
    return allowedOrigins.split(",").map((origin) => origin.trim());
  }
  // Development: allow all origins
  // Production: allow all origins (can be restricted if needed)
  return true;
};

export const CORS_CONFIG = {
  origin: getAllowedOrigins(),
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
