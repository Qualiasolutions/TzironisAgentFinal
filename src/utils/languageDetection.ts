// Simple language detection implementation
// This is a basic implementation that checks for common character patterns

type DetectedLanguage = {
  lang: string;
  prob: number;
};

// Common character patterns in different languages
const patterns: Record<string, RegExp[]> = {
  en: [/\b(the|and|is|in|to|of|a|for|that|this)\b/gi],
  el: [/[αβγδεζηθικλμνξοπρστυφχψω]/gi],
  es: [/\b(el|la|los|las|un|una|y|en|de|que|por)\b/gi],
  fr: [/\b(le|la|les|un|une|et|en|de|que|pour)\b/gi],
  de: [/\b(der|die|das|und|in|zu|den|für|ist|auf)\b/gi],
};

export function detect(text: string): DetectedLanguage[] | null {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return null;
  }

  const results: DetectedLanguage[] = [];
  let totalMatches = 0;

  // Count matches for each language
  Object.entries(patterns).forEach(([lang, regexList]) => {
    let matches = 0;
    
    regexList.forEach(regex => {
      const match = text.match(regex);
      if (match) {
        matches += match.length;
      }
    });
    
    if (matches > 0) {
      results.push({ lang, prob: matches });
      totalMatches += matches;
    }
  });

  // Default to English if no matches found
  if (results.length === 0) {
    return [{ lang: 'en', prob: 1 }];
  }

  // Normalize probabilities
  results.forEach(result => {
    result.prob = result.prob / totalMatches;
  });

  // Sort by probability (highest first)
  return results.sort((a, b) => b.prob - a.prob);
} 