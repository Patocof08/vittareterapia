/**
 * Validates message content to prevent sharing contact information.
 * This is a client-side check for UX. The real enforcement is a database trigger.
 */

interface ValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateMessageContent(content: string): ValidationResult {
  const text = content.trim();
  if (!text) return { valid: true };

  const lower = text.toLowerCase();

  // 1. Check for 7+ consecutive digits (plain phone number)
  if (/\d{7,}/.test(text)) {
    return { valid: false, reason: "No se permite compartir números de teléfono." };
  }

  // 2. Check for digit clusters (digits separated by spaces, dashes, dots, parens)
  //    e.g. "55 1234 5678", "+52-55-1234-5678", "55.12.34.56.78"
  const clusterMatches = text.match(/\d[\d\s\-\.\(\)\+]{5,}\d/g);
  if (clusterMatches) {
    for (const cluster of clusterMatches) {
      const digitsOnly = cluster.replace(/[^0-9]/g, "");
      if (digitsOnly.length >= 7) {
        return { valid: false, reason: "No se permite compartir números de teléfono." };
      }
    }
  }

  // 3. Email patterns
  if (/[a-z0-9._%+-]+\s*@\s*[a-z0-9.-]+\s*\.\s*[a-z]{2,}/i.test(text)) {
    return { valid: false, reason: "No se permite compartir correos electrónicos." };
  }

  // 4. "arroba" written out
  if (/[a-z0-9]+\s*(arroba|aroba)\s*[a-z0-9]+\s*(punto)\s*[a-z]{2,}/i.test(lower)) {
    return { valid: false, reason: "No se permite compartir correos electrónicos." };
  }

  // 5. Social media & messaging apps
  if (/(instagram|facebook|whatsapp|whats\s*app|wpp|telegram|signal|tiktok|twitter|snap\s*chat|linkedin|wa\.me|t\.me)/i.test(lower)) {
    return { valid: false, reason: "No se permite compartir redes sociales o apps de mensajería." };
  }

  // 6. URLs
  if (/(https?:\/\/|www\.|\.com[\/\s]|\.mx[\/\s]|\.net[\/\s]|\.org[\/\s])/i.test(lower)) {
    return { valid: false, reason: "No se permite compartir enlaces." };
  }

  // 7. Numbers as Spanish words (7+ number-words = likely a phone number)
  const numberWords = lower.match(/\b(cero|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\b/g);
  if (numberWords && numberWords.length >= 7) {
    return { valid: false, reason: "No se permite compartir números de teléfono." };
  }

  return { valid: true };
}
