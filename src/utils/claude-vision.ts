import Anthropic from '@anthropic-ai/sdk';
import type { EquipmentType } from '@/types/room';

/**
 * AI-extracted floor-plan detection. All coordinates are in the ORIGINAL IMAGE
 * pixel frame. The import UI converts these to cm using a user-refined scale.
 */
export interface DetectedEquipment {
  type: EquipmentType;
  label: string;
  /** top-left corner in image pixels */
  positionPx: { x: number; y: number };
  dimensionsPx: { width: number; height: number };
  /** degrees clockwise; 0 = upright as drawn */
  rotation: number;
  confidence: number;
}

export interface DetectionResult {
  /** Vertices of the operating room outline in image pixels */
  roomPolygonPx: { x: number; y: number }[];
  /**
   * User-provided or AI-estimated scale. Meters per pixel. If the AI can
   * locate a scale bar or labelled dimension in the image it reports that
   * value here; otherwise it is null and the user must supply a value.
   */
  scaleMetersPerPixel: number | null;
  /** Natural-language notes about what was detected and any uncertainty. */
  notes: string;
  equipment: DetectedEquipment[];
}

const EQUIPMENT_TYPES: EquipmentType[] = [
  'operating-table',
  'patient-cart',
  'patient-cart-backup',
  'surgeon-console',
  'vision-cart',
  'anesthesia-station',
  'anesthetic-trolley',
  'instrument-table',
  'scrub-table',
  'monitor',
  'pendant',
  'pendant-screen',
  'external-screen',
  'mayo-stand',
  'back-table',
  'supply-cart',
  'trolley',
  'ultrasound-machine',
  'insufflator-cart',
  'swab-rack',
  'medical-fridge',
  'observation-station',
  'generic',
];

const SYSTEM_PROMPT = `You are an expert at analysing surgical operating-room floor-plan diagrams, especially setups for the da Vinci X robotic surgery system.

Given an image of an OR floor plan, identify:
- The outline (polygon) of the room in image pixels.
- Every piece of equipment visible, with its top-left bounding-box corner, width/height in pixels, and rotation in degrees.
- A rough meters-per-pixel scale if the diagram contains any scale bar, grid, or labelled dimension; otherwise return null.

Use only these equipment types (pick the closest match; use "generic" when nothing fits):
${EQUIPMENT_TYPES.join(', ')}

Common da Vinci X floor-plan abbreviations:
- PSR / Patient Side Robot / Patient Cart -> patient-cart
- Backup PSR / 2nd PSR -> patient-cart-backup
- Surgeon Console / SC -> surgeon-console
- Vision Cart / VC -> vision-cart
- Anaesthetic Machine / Anesthesia -> anesthesia-station
- Anaesthetic Trolley -> anesthetic-trolley
- Instrument / Scrub / Back / Mayo tables -> the matching *-table or mayo-stand
- Pendant, Pendant Screen, External Screen -> pendant / pendant-screen / external-screen
- Observation / Visitor stations (small circles) -> observation-station

Rotation: 0 means the item's "front" is pointing up in the image; positive rotates clockwise. Be conservative: if orientation is unclear, use 0.

Coordinate frame: (0,0) is the top-left of the image; x increases right, y increases down. All pixel values refer to the image supplied in this message.

Respond with ONLY a JSON object matching the schema you were told to produce. No prose, no markdown code fences.`;

const RESPONSE_SCHEMA_HINT = `{
  "roomPolygonPx": [{"x": number, "y": number}, ...],
  "scaleMetersPerPixel": number | null,
  "notes": string,
  "equipment": [
    {
      "type": "<one of the allowed equipment types>",
      "label": string,
      "positionPx": {"x": number, "y": number},
      "dimensionsPx": {"width": number, "height": number},
      "rotation": number,
      "confidence": number  // 0..1
    }
  ]
}`;

/**
 * Extract the base64 payload and media type from a data URL.
 */
function parseDataUrl(dataUrl: string): { mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'; data: string } {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|gif|webp));base64,(.+)$/);
  if (!match) {
    throw new Error('Image must be a base64 data URL (PNG, JPEG, GIF, or WEBP).');
  }
  return {
    mediaType: match[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
    data: match[2],
  };
}

/**
 * Strip a leading ```json ... ``` fence if the model added one despite instructions.
 */
function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fence ? fence[1].trim() : trimmed;
}

function coerceResult(raw: unknown): DetectionResult {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Model response was not an object.');
  }
  const obj = raw as Record<string, unknown>;
  const polygon = Array.isArray(obj.roomPolygonPx) ? obj.roomPolygonPx : [];
  const equipment = Array.isArray(obj.equipment) ? obj.equipment : [];

  const roomPolygonPx = polygon
    .map((p) => {
      const pp = p as Record<string, unknown>;
      return { x: Number(pp.x), y: Number(pp.y) };
    })
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));

  const normEquipment: DetectedEquipment[] = equipment.map((e) => {
    const ee = e as Record<string, unknown>;
    const pos = (ee.positionPx ?? {}) as Record<string, unknown>;
    const dim = (ee.dimensionsPx ?? {}) as Record<string, unknown>;
    const rawType = String(ee.type ?? 'generic');
    const type = (EQUIPMENT_TYPES as string[]).includes(rawType)
      ? (rawType as EquipmentType)
      : ('generic' as EquipmentType);
    return {
      type,
      label: String(ee.label ?? type),
      positionPx: { x: Number(pos.x) || 0, y: Number(pos.y) || 0 },
      dimensionsPx: {
        width: Math.max(1, Number(dim.width) || 30),
        height: Math.max(1, Number(dim.height) || 30),
      },
      rotation: Number(ee.rotation) || 0,
      confidence: Math.max(0, Math.min(1, Number(ee.confidence) || 0.5)),
    };
  });

  return {
    roomPolygonPx,
    scaleMetersPerPixel:
      typeof obj.scaleMetersPerPixel === 'number' && Number.isFinite(obj.scaleMetersPerPixel)
        ? obj.scaleMetersPerPixel
        : null,
    notes: String(obj.notes ?? ''),
    equipment: normEquipment,
  };
}

/**
 * Send the floor-plan image to Claude and get a structured detection result.
 * The API key is supplied by the user and stored in localStorage; we pass
 * `dangerouslyAllowBrowser` because this is a client-side personal-planning tool.
 */
export async function analyzeFloorPlan(
  imageDataUrl: string,
  apiKey: string,
): Promise<DetectionResult> {
  const { mediaType, data } = parseDataUrl(imageDataUrl);

  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data,
            },
          },
          {
            type: 'text',
            text:
              'Analyse this OR floor-plan image and return the JSON described below. ' +
              'Schema:\n' +
              RESPONSE_SCHEMA_HINT,
          },
        ],
      },
    ],
  });

  console.log('[claude-vision] stop_reason:', response.stop_reason);
  console.log(
    '[claude-vision] block types:',
    response.content.map((b) => b.type),
  );

  // Concatenate all text blocks in the response (skip thinking blocks).
  const text = response.content
    .filter((b): b is Extract<typeof b, { type: 'text' }> => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();

  if (!text) {
    const hint =
      response.stop_reason === 'max_tokens'
        ? ' Response hit max_tokens during thinking — try a smaller/simpler image.'
        : '';
    throw new Error(
      `Claude returned no text content (stop_reason=${response.stop_reason}).${hint}`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFence(text));
  } catch (err) {
    throw new Error(
      `Could not parse Claude response as JSON: ${(err as Error).message}\n\nRaw response:\n${text.slice(0, 500)}`,
    );
  }

  return coerceResult(parsed);
}
