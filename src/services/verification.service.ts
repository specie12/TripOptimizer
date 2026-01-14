/**
 * AI Verification Service
 *
 * Verifies existence and operational status of travel-related entities.
 * Follows "UNKNOWN over guess" philosophy - never fabricates or suggests.
 *
 * Supports mock mode for development without API key:
 * Set MOCK_CLAUDE=true in environment
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  VerificationResult,
  VerifyEntityResponse,
  VerifyEntityRequest,
  VerificationStatus,
  EntityType,
} from '../types/verification.types';

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
 * Verify existence and operational status of an entity
 */
export async function verifyEntity(
  request: VerifyEntityRequest
): Promise<VerifyEntityResponse> {
  const startTime = Date.now();

  if (MOCK_MODE || !anthropic) {
    const mockResult = generateMockVerification(request);
    return {
      success: true,
      result: mockResult,
      meta: {
        processingTimeMs: Date.now() - startTime,
        modelUsed: 'mock',
        mockMode: true,
      },
    };
  }

  try {
    const prompt = buildVerificationPrompt(request);

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    const result = normalizeVerificationResult(textBlock.text, request.entityName);

    return {
      success: true,
      result,
      meta: {
        processingTimeMs: Date.now() - startTime,
        modelUsed: MODEL,
        mockMode: false,
      },
    };
  } catch (error) {
    console.error('Verification error:', error);

    // In development, fall back to mock
    if (process.env.NODE_ENV === 'development') {
      const mockResult = generateMockVerification(request);
      mockResult.notes = 'Fell back to mock due to API error';
      return {
        success: true,
        result: mockResult,
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
 * Build the verification prompt with anti-hallucination measures
 */
function buildVerificationPrompt(request: VerifyEntityRequest): string {
  const entityContext = buildEntityContext(request);

  return `You are a VERIFICATION AGENT. Your ONLY job is to verify if an entity exists and operates.

CRITICAL RULES:
1. You ONLY verify. You NEVER suggest alternatives.
2. You NEVER hallucinate or invent information.
3. If uncertain, return "UNKNOWN" - never guess.
4. Return ONLY valid JSON - no markdown, no explanations.
5. Be conservative and skeptical.

ENTITY TO VERIFY:
${entityContext}

VERIFICATION TASKS:
1. Does this entity appear to exist?
2. Does the website (if provided) appear to resolve?
3. Does the entity appear to still operate?
4. Is there any signal it is permanently closed?

You are NOT checking:
- Real-time availability
- Prices
- Schedules
- Booking inventory

Return this EXACT JSON structure:

{
  "entityName": "${request.entityName}",
  "verificationStatus": "<VERIFIED|UNVERIFIED|UNKNOWN>",
  "signals": {
    "websiteResolves": <true|false|null>,
    "appearsOperational": <true|false|null>,
    "closureSignalDetected": <true|false|null>
  },
  "confidence": <0.0-1.0>,
  "notes": "<short factual note or null>"
}

GUIDELINES:
- verificationStatus:
  - VERIFIED: Strong signals entity exists and operates
  - UNVERIFIED: Strong signals entity does NOT exist or is closed
  - UNKNOWN: Conflicting, weak, or missing signals

- signals:
  - websiteResolves: true ONLY if you can verify the website works
  - appearsOperational: true ONLY if clearly operating
  - closureSignalDetected: true ONLY if explicit closure signals

- confidence: Number 0-1 reflecting signal strength, NOT certainty

- notes: Short, factual. No speculation. No recommendations.

IMPORTANT:
- Do NOT browse creatively
- Do NOT infer intent
- Do NOT suggest alternatives
- Do NOT include marketing language

Return ONLY valid JSON:`;
}

/**
 * Build entity context string for the prompt
 */
function buildEntityContext(request: VerifyEntityRequest): string {
  const parts: string[] = [`Name: ${request.entityName}`];

  if (request.entityType) {
    parts.push(`Type: ${request.entityType}`);
  }
  if (request.address) {
    parts.push(`Address: ${request.address}`);
  }
  if (request.city) {
    parts.push(`City: ${request.city}`);
  }
  if (request.country) {
    parts.push(`Country: ${request.country}`);
  }
  if (request.website) {
    parts.push(`Website: ${request.website}`);
  }

  return parts.join('\n');
}

/**
 * Normalize and validate Claude's JSON response
 */
function normalizeVerificationResult(
  rawJson: string,
  entityName: string
): VerificationResult {
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

  try {
    const parsed = JSON.parse(cleanJson);

    // Normalize with safe defaults
    const normalized: VerificationResult = {
      entityName: parsed.entityName ?? entityName,
      verificationStatus: normalizeStatus(parsed.verificationStatus),
      signals: {
        websiteResolves: normalizeBoolean(parsed.signals?.websiteResolves),
        appearsOperational: normalizeBoolean(parsed.signals?.appearsOperational),
        closureSignalDetected: normalizeBoolean(parsed.signals?.closureSignalDetected),
      },
      confidence: clampConfidence(parsed.confidence),
      notes: typeof parsed.notes === 'string' ? parsed.notes : null,
    };

    return normalized;
  } catch (error) {
    // If JSON parsing fails, return UNKNOWN result
    console.error('Failed to parse verification JSON:', error);
    return {
      entityName,
      verificationStatus: 'UNKNOWN',
      signals: {
        websiteResolves: null,
        appearsOperational: null,
        closureSignalDetected: null,
      },
      confidence: null,
      notes: 'Failed to parse verification response',
    };
  }
}

/**
 * Normalize verification status to valid enum value
 */
function normalizeStatus(status: string | undefined): VerificationStatus {
  const validStatuses: VerificationStatus[] = ['VERIFIED', 'UNVERIFIED', 'UNKNOWN'];
  const upper = (status ?? '').toUpperCase() as VerificationStatus;
  return validStatuses.includes(upper) ? upper : 'UNKNOWN';
}

/**
 * Normalize boolean or null value
 */
function normalizeBoolean(value: unknown): boolean | null {
  if (value === true || value === false) {
    return value;
  }
  return null;
}

/**
 * Clamp confidence to 0-1 range or null
 */
function clampConfidence(value: unknown): number | null {
  if (typeof value !== 'number' || isNaN(value)) {
    return null;
  }
  return Math.max(0, Math.min(1, value));
}

/**
 * Generate mock verification for development
 */
function generateMockVerification(request: VerifyEntityRequest): VerificationResult {
  const entityName = request.entityName;
  const lowerName = entityName.toLowerCase();

  // Well-known brands get VERIFIED status
  const wellKnownBrands = [
    'hilton',
    'marriott',
    'hyatt',
    'delta',
    'united',
    'american airlines',
    'southwest',
    'airbnb',
    'booking.com',
    'expedia',
    'uber',
    'lyft',
    'hertz',
    'enterprise',
    'mcdonald',
    'starbucks',
  ];

  const isWellKnown = wellKnownBrands.some((brand) => lowerName.includes(brand));

  if (isWellKnown) {
    return {
      entityName,
      verificationStatus: 'VERIFIED',
      signals: {
        websiteResolves: request.website ? true : null,
        appearsOperational: true,
        closureSignalDetected: false,
      },
      confidence: 0.9,
      notes: 'Well-known brand (mock mode)',
    };
  }

  // If website provided, assume likely exists
  if (request.website) {
    return {
      entityName,
      verificationStatus: 'VERIFIED',
      signals: {
        websiteResolves: true,
        appearsOperational: null,
        closureSignalDetected: null,
      },
      confidence: 0.6,
      notes: 'Website provided (mock mode)',
    };
  }

  // If location provided, lean toward UNKNOWN with some signals
  if (request.city || request.address) {
    return {
      entityName,
      verificationStatus: 'UNKNOWN',
      signals: {
        websiteResolves: null,
        appearsOperational: null,
        closureSignalDetected: null,
      },
      confidence: 0.3,
      notes: 'Location provided but cannot verify (mock mode)',
    };
  }

  // Default: UNKNOWN
  return {
    entityName,
    verificationStatus: 'UNKNOWN',
    signals: {
      websiteResolves: null,
      appearsOperational: null,
      closureSignalDetected: null,
    },
    confidence: null,
    notes: 'Insufficient information for verification (mock mode)',
  };
}
