/**
 * AI Parsing Service
 *
 * Extracts structured travel booking data from unstructured inputs.
 * Follows "null over guess" philosophy - NEVER fabricates data.
 *
 * Supports mock mode for development without API key:
 * Set MOCK_CLAUDE=true in environment
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  ParsedBookingData,
  ParseBookingResponse,
  DocumentType,
  VendorCategory,
  BookingStatus,
} from '../types/parsing.types';

// Initialize Anthropic client (will be null in mock mode)
let anthropic: Anthropic | null = null;

const MOCK_MODE = process.env.MOCK_CLAUDE === 'true';
const MODEL = 'claude-3-haiku-20240307';

if (!MOCK_MODE && process.env.ANTHROPIC_API_KEY) {
  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

/**
 * Parse unstructured booking content and extract structured data
 */
export async function parseBookingContent(
  content: string,
  documentTypeHint?: DocumentType
): Promise<ParseBookingResponse> {
  const startTime = Date.now();

  if (MOCK_MODE || !anthropic) {
    const mockResult = generateMockParsedData(content, documentTypeHint);
    return {
      ...mockResult,
      meta: {
        processingTimeMs: Date.now() - startTime,
        modelUsed: 'mock',
        mockMode: true,
      },
    };
  }

  try {
    const prompt = buildParsingPrompt(content, documentTypeHint);

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    const parsedData = normalizeExtractedData(textBlock.text, documentTypeHint);
    const confidence = calculateExtractionConfidence(parsedData);
    const warnings = generateWarnings(parsedData);

    return {
      success: true,
      data: parsedData,
      confidence,
      warnings,
      meta: {
        processingTimeMs: Date.now() - startTime,
        modelUsed: MODEL,
        mockMode: false,
      },
    };
  } catch (error) {
    console.error('Parsing error:', error);

    // In development, fall back to mock
    if (process.env.NODE_ENV === 'development') {
      const mockResult = generateMockParsedData(content, documentTypeHint);
      return {
        ...mockResult,
        warnings: [...mockResult.warnings, 'Fell back to mock due to API error'],
        meta: {
          processingTimeMs: Date.now() - startTime,
          modelUsed: 'mock-fallback',
          mockMode: true,
        },
      };
    }

    throw error;
  }
}

/**
 * Build the parsing prompt with anti-hallucination measures
 */
function buildParsingPrompt(content: string, documentTypeHint?: DocumentType): string {
  const docTypeContext = documentTypeHint
    ? `This appears to be a ${documentTypeHint.toLowerCase()} document.`
    : 'The document type is unknown.';

  return `You are a data extraction system. Extract travel booking information from the following document.

CRITICAL RULES - READ CAREFULLY:
1. If information is NOT explicitly stated in the document, return null for that field
2. NEVER guess, infer, or fabricate any data
3. Extract text VERBATIM for instruction fields (checkIn, specialNotes)
4. Only return valid JSON - no explanations, no prose
5. If unsure about a field, return null - partial extraction is preferred over guessing
6. For dates/times, only convert to ISO format if the original is unambiguous

${docTypeContext}

DOCUMENT TO PARSE:
---
${content}
---

Extract data into this exact JSON structure. Return null for any field not explicitly found:

{
  "vendor": {
    "name": "<exact vendor name or null>",
    "category": "<FLIGHT|HOTEL|CAR|ACTIVITY|OTHER>",
    "brandConfidence": <0.0-1.0>
  },
  "booking": {
    "confirmationNumber": "<confirmation/reference number or null>",
    "bookingDate": "<ISO date string or null>",
    "status": "<CONFIRMED|PENDING|CANCELLED>"
  },
  "contact": {
    "phone": "<phone number or null>",
    "email": "<email address or null>",
    "whatsapp": "<whatsapp number or null>",
    "website": "<website URL or null>"
  },
  "location": {
    "address": "<street address or null>",
    "city": "<city name or null>",
    "country": "<country name or null>"
  },
  "timing": {
    "startDateTime": "<ISO datetime or null>",
    "endDateTime": "<ISO datetime or null>",
    "checkInTime": "<HH:MM or null>",
    "checkOutTime": "<HH:MM or null>"
  },
  "instructions": {
    "checkIn": "<VERBATIM check-in instructions or null>",
    "specialNotes": "<VERBATIM special notes or null>"
  },
  "sourceMeta": {
    "documentType": "<EMAIL|PDF|TEXT>",
    "language": "<ISO 639-1 code or null>"
  }
}

EXAMPLES OF CORRECT BEHAVIOR:

Example 1 - Partial extraction is correct:
Input: "Your Delta flight DL123 departs at 3pm"
Output: {"vendor":{"name":"Delta","category":"FLIGHT","brandConfidence":0.95},"booking":{"confirmationNumber":"DL123","bookingDate":null,"status":"CONFIRMED"},"contact":{"phone":null,"email":null,"whatsapp":null,"website":null},"location":{"address":null,"city":null,"country":null},"timing":{"startDateTime":null,"endDateTime":null,"checkInTime":null,"checkOutTime":null},"instructions":{"checkIn":null,"specialNotes":null},"sourceMeta":{"documentType":"TEXT","language":"en"}}

Example 2 - Return null when uncertain:
Input: "Hotel booking confirmed"
Output: vendor.name should be null (hotel name not stated)

Return ONLY the JSON object, nothing else:`;
}

/**
 * Normalize and validate Claude's JSON response
 */
function normalizeExtractedData(
  rawJson: string,
  documentTypeHint?: DocumentType
): ParsedBookingData {
  // Try to parse JSON - Claude sometimes wraps in markdown code blocks
  let cleanJson = rawJson.trim();
  if (cleanJson.startsWith('```json')) {
    cleanJson = cleanJson.slice(7);
  }
  if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.slice(3);
  }
  if (cleanJson.endsWith('```')) {
    cleanJson = cleanJson.slice(0, -3);
  }
  cleanJson = cleanJson.trim();

  const parsed = JSON.parse(cleanJson);

  // Normalize with defaults for missing top-level objects
  const normalized: ParsedBookingData = {
    vendor: {
      name: parsed.vendor?.name ?? null,
      category: normalizeVendorCategory(parsed.vendor?.category),
      brandConfidence: clampConfidence(parsed.vendor?.brandConfidence ?? 0),
    },
    booking: {
      confirmationNumber: parsed.booking?.confirmationNumber ?? null,
      bookingDate: parsed.booking?.bookingDate ?? null,
      status: normalizeBookingStatus(parsed.booking?.status),
    },
    contact: {
      phone: parsed.contact?.phone ?? null,
      email: parsed.contact?.email ?? null,
      whatsapp: parsed.contact?.whatsapp ?? null,
      website: parsed.contact?.website ?? null,
    },
    location: {
      address: parsed.location?.address ?? null,
      city: parsed.location?.city ?? null,
      country: parsed.location?.country ?? null,
    },
    timing: {
      startDateTime: parsed.timing?.startDateTime ?? null,
      endDateTime: parsed.timing?.endDateTime ?? null,
      checkInTime: parsed.timing?.checkInTime ?? null,
      checkOutTime: parsed.timing?.checkOutTime ?? null,
    },
    instructions: {
      checkIn: parsed.instructions?.checkIn ?? null,
      specialNotes: parsed.instructions?.specialNotes ?? null,
    },
    sourceMeta: {
      documentType: documentTypeHint ?? normalizeDocumentType(parsed.sourceMeta?.documentType),
      language: parsed.sourceMeta?.language ?? null,
    },
  };

  return normalized;
}

/**
 * Normalize vendor category to valid enum value
 */
function normalizeVendorCategory(category: string | undefined): VendorCategory {
  const validCategories: VendorCategory[] = ['FLIGHT', 'HOTEL', 'CAR', 'ACTIVITY', 'OTHER'];
  const upper = (category ?? '').toUpperCase() as VendorCategory;
  return validCategories.includes(upper) ? upper : 'OTHER';
}

/**
 * Normalize booking status to valid enum value
 */
function normalizeBookingStatus(status: string | undefined): BookingStatus {
  const validStatuses: BookingStatus[] = ['CONFIRMED', 'PENDING', 'CANCELLED'];
  const upper = (status ?? '').toUpperCase() as BookingStatus;
  return validStatuses.includes(upper) ? upper : 'PENDING';
}

/**
 * Normalize document type to valid enum value
 */
function normalizeDocumentType(docType: string | undefined): DocumentType {
  const validTypes: DocumentType[] = ['EMAIL', 'PDF', 'TEXT'];
  const upper = (docType ?? '').toUpperCase() as DocumentType;
  return validTypes.includes(upper) ? upper : 'TEXT';
}

/**
 * Clamp confidence to 0-1 range
 */
function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, value || 0));
}

/**
 * Calculate overall extraction confidence based on populated fields
 */
function calculateExtractionConfidence(data: ParsedBookingData): number {
  let filledFields = 0;
  let totalFields = 0;
  const weights: Record<string, number> = {
    'vendor.name': 1.5,
    'vendor.category': 0.5,
    'booking.confirmationNumber': 2.0,
    'booking.status': 0.5,
    'contact.email': 1.0,
    'contact.phone': 1.0,
    'location.city': 1.0,
    'timing.startDateTime': 1.5,
    'timing.endDateTime': 1.0,
    'instructions.checkIn': 0.5,
  };

  // Check vendor
  if (data.vendor.name) {
    filledFields += weights['vendor.name'];
  }
  totalFields += weights['vendor.name'];

  // Check booking
  if (data.booking.confirmationNumber) {
    filledFields += weights['booking.confirmationNumber'];
  }
  totalFields += weights['booking.confirmationNumber'];

  // Check contact
  if (data.contact.email) {
    filledFields += weights['contact.email'];
  }
  totalFields += weights['contact.email'];

  if (data.contact.phone) {
    filledFields += weights['contact.phone'];
  }
  totalFields += weights['contact.phone'];

  // Check location
  if (data.location.city) {
    filledFields += weights['location.city'];
  }
  totalFields += weights['location.city'];

  // Check timing
  if (data.timing.startDateTime) {
    filledFields += weights['timing.startDateTime'];
  }
  totalFields += weights['timing.startDateTime'];

  if (data.timing.endDateTime) {
    filledFields += weights['timing.endDateTime'];
  }
  totalFields += weights['timing.endDateTime'];

  // Factor in vendor's self-reported confidence
  const vendorConfidence = data.vendor.brandConfidence;

  // Weighted average
  const fieldConfidence = totalFields > 0 ? filledFields / totalFields : 0;
  const overallConfidence = fieldConfidence * 0.7 + vendorConfidence * 0.3;

  return Math.round(overallConfidence * 100) / 100;
}

/**
 * Generate warnings about missing or uncertain data
 */
function generateWarnings(data: ParsedBookingData): string[] {
  const warnings: string[] = [];

  if (!data.vendor.name) {
    warnings.push('Vendor name not detected');
  }

  if (!data.booking.confirmationNumber) {
    warnings.push('Confirmation number not detected');
  }

  if (!data.timing.startDateTime) {
    warnings.push('Start date/time not detected');
  }

  if (!data.timing.endDateTime) {
    warnings.push('End date/time not detected');
  }

  if (!data.contact.email && !data.contact.phone) {
    warnings.push('No contact information detected');
  }

  if (!data.location.city && !data.location.address) {
    warnings.push('No location information detected');
  }

  if (data.vendor.brandConfidence < 0.5) {
    warnings.push('Low confidence in vendor identification');
  }

  return warnings;
}

/**
 * Generate mock parsed data for development
 */
function generateMockParsedData(
  content: string,
  documentTypeHint?: DocumentType
): Omit<ParseBookingResponse, 'meta'> {
  const lowerContent = content.toLowerCase();

  // Try to detect some basic patterns
  const confirmationMatch = content.match(/(?:confirmation|booking|reference)[:\s#]*([A-Z0-9]{5,12})/i);
  const emailMatch = content.match(/[\w.-]+@[\w.-]+\.\w+/);
  const phoneMatch = content.match(/(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);

  // Detect vendor category from content
  let category: VendorCategory = 'OTHER';
  if (lowerContent.includes('flight') || lowerContent.includes('airline')) {
    category = 'FLIGHT';
  } else if (lowerContent.includes('hotel') || lowerContent.includes('reservation')) {
    category = 'HOTEL';
  } else if (lowerContent.includes('car') || lowerContent.includes('rental')) {
    category = 'CAR';
  }

  const mockData: ParsedBookingData = {
    vendor: {
      name: null,
      category,
      brandConfidence: 0.5,
    },
    booking: {
      confirmationNumber: confirmationMatch ? confirmationMatch[1] : null,
      bookingDate: null,
      status: 'CONFIRMED',
    },
    contact: {
      phone: phoneMatch ? phoneMatch[0] : null,
      email: emailMatch ? emailMatch[0] : null,
      whatsapp: null,
      website: null,
    },
    location: {
      address: null,
      city: null,
      country: null,
    },
    timing: {
      startDateTime: null,
      endDateTime: null,
      checkInTime: null,
      checkOutTime: null,
    },
    instructions: {
      checkIn: null,
      specialNotes: null,
    },
    sourceMeta: {
      documentType: documentTypeHint ?? 'TEXT',
      language: 'en',
    },
  };

  const warnings = generateWarnings(mockData);
  warnings.unshift('Using mock mode - results may be limited');

  return {
    success: true,
    data: mockData,
    confidence: calculateExtractionConfidence(mockData),
    warnings,
  };
}
