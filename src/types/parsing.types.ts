/**
 * AI Parsing Agent Type Definitions
 *
 * Types for extracting structured travel booking data from unstructured inputs.
 * Follows "null over guess" philosophy - only extract explicitly present data.
 */

// =============================================================================
// ENUMS
// =============================================================================

/**
 * Category of vendor/service provider
 */
export type VendorCategory = 'FLIGHT' | 'HOTEL' | 'CAR' | 'ACTIVITY' | 'OTHER';

/**
 * Booking confirmation status
 */
export type BookingStatus = 'CONFIRMED' | 'PENDING' | 'CANCELLED';

/**
 * Type of source document
 */
export type DocumentType = 'EMAIL' | 'PDF' | 'TEXT';

// =============================================================================
// PARSED DATA STRUCTURE
// =============================================================================

/**
 * Vendor/service provider information
 */
export interface ParsedVendor {
  /** Exact vendor name as stated in document */
  name: string | null;
  /** Category of service */
  category: VendorCategory;
  /** Confidence in vendor identification (0-1) */
  brandConfidence: number;
}

/**
 * Booking reference information
 */
export interface ParsedBooking {
  /** Confirmation/reference number */
  confirmationNumber: string | null;
  /** Date booking was made (ISO format if parseable) */
  bookingDate: string | null;
  /** Current booking status */
  status: BookingStatus;
}

/**
 * Contact information extracted from document
 */
export interface ParsedContact {
  /** Phone number */
  phone: string | null;
  /** Email address */
  email: string | null;
  /** WhatsApp number */
  whatsapp: string | null;
  /** Website URL */
  website: string | null;
}

/**
 * Location information
 */
export interface ParsedLocation {
  /** Street address */
  address: string | null;
  /** City name */
  city: string | null;
  /** Country name or code */
  country: string | null;
}

/**
 * Timing/schedule information
 */
export interface ParsedTiming {
  /** Start date/time (ISO format) */
  startDateTime: string | null;
  /** End date/time (ISO format) */
  endDateTime: string | null;
  /** Check-in time (HH:MM format) */
  checkInTime: string | null;
  /** Check-out time (HH:MM format) */
  checkOutTime: string | null;
}

/**
 * Instructions extracted VERBATIM from source
 */
export interface ParsedInstructions {
  /** Check-in instructions - VERBATIM from source */
  checkIn: string | null;
  /** Special notes or requirements - VERBATIM from source */
  specialNotes: string | null;
}

/**
 * Metadata about the source document
 */
export interface ParsedSourceMeta {
  /** Type of document */
  documentType: DocumentType;
  /** Language of document (ISO 639-1 code) */
  language: string | null;
}

/**
 * Complete parsed booking data structure
 */
export interface ParsedBookingData {
  vendor: ParsedVendor;
  booking: ParsedBooking;
  contact: ParsedContact;
  location: ParsedLocation;
  timing: ParsedTiming;
  instructions: ParsedInstructions;
  sourceMeta: ParsedSourceMeta;
}

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

/**
 * Request body for POST /parse/booking
 */
export interface ParseBookingRequest {
  /** Raw content to parse (email body, PDF text, etc.) */
  content: string;
  /** Hint about document type (helps parsing) */
  documentTypeHint?: DocumentType;
  /** Optional user ID for tracking */
  userId?: string;
}

/**
 * Processing metadata
 */
export interface ParseMeta {
  /** Time taken to process in milliseconds */
  processingTimeMs: number;
  /** Model used for parsing */
  modelUsed: string;
  /** Whether mock mode was used */
  mockMode: boolean;
}

/**
 * Response body for POST /parse/booking
 */
export interface ParseBookingResponse {
  /** Whether parsing was successful */
  success: boolean;
  /** Parsed data (null if parsing failed) */
  data: ParsedBookingData | null;
  /** Overall confidence score (0-1) */
  confidence: number;
  /** Warnings about missing or uncertain data */
  warnings: string[];
  /** Processing metadata */
  meta: ParseMeta;
}

/**
 * Validation error for parsing requests
 */
export interface ParseValidationError {
  field: string;
  message: string;
}

/**
 * Error response for parsing endpoint
 */
export interface ParseErrorResponse {
  error: string;
  message?: string;
  details?: ParseValidationError[];
}
