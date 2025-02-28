declare module 'langdetect' {
  export function detect(text: string): { lang: string; prob: number }[] | null;
} 