
import { GoogleGenAI, Type } from "@google/genai";
import { Match, PredictionResult } from "../types";

/**
 * Normalise les valeurs de l'IA (parfois elle renvoie 0.45 au lieu de 45)
 */
const normalizePercent = (val: number | undefined): number => {
  if (val === undefined || val === null) return 0;
  // Si la valeur est entre 0 et 1 (ex: 0.75), on multiplie par 100
  if (val > 0 && val <= 1) return Math.round(val * 100);
  return Math.round(val);
};

/**
 * RÉCUPÉRATION STRICTE : Uniquement depuis le localStorage de l'utilisateur.
 */
const getActiveKey = () => {
  const key = localStorage.getItem('FOOTAI_USER_KEY');
  return (key && key.trim().length > 10) ? key.trim() : null;
};

const getKeySignature = (key: string | null) => {
  if (!key) return 'no-key';
  return btoa(key.slice(-10)).substring(0, 8);
};

const getCache = (cacheKey: string) => {
  const apiKey = getActiveKey();
  if (!apiKey) return null;
  const signature = getKeySignature(apiKey);
  const cached = sessionStorage.getItem(`cache_${signature}_${cacheKey}`);
  if (cached) {
    const { data, expiry } = JSON.parse(cached);
    if (Date.now() < expiry) return data;
  }
  return null;
};

const setCache = (cacheKey: string, data: any, ttlHours = 1) => {
  const apiKey = getActiveKey();
  if (!apiKey) return;
  const signature = getKeySignature(apiKey);
  const expiry = Date.now() + (ttlHours * 60 * 60 * 1000);
  sessionStorage.setItem(`cache_${signature}_${cacheKey}`, JSON.stringify({ data, expiry }));
};

const parseSafeJson = (text: string) => {
  if (!text) return null;
  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { return null; }
    }
    return null;
  }
};

const predictionSchema = {
  type: Type.OBJECT,
  properties: {
    probabilities: {
      type: Type.OBJECT,
      properties: {
        home: { type: Type.NUMBER },
        draw: { type: Type.NUMBER },
        away: { type: Type.NUMBER },
      },
      required: ["home", "draw", "away"],
    },
    score: { type: Type.STRING },
    analysis: { type: Type.STRING },
    weighting_info: { type: Type.STRING },
    confidence: { type: Type.NUMBER },
  },
  required: ["probabilities", "score", "analysis", "weighting_info", "confidence"],
};

export async function findMatches(date: string, league: string, country: string): Promise<{ matches: Match[], sources: string[] }> {
  const apiKey = getActiveKey();
  if (!apiKey) throw new Error("Clé API absente. Accès refusé.");

  const cacheKey = `matches_${league}_${date}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Matchs officiels "${league}" (${country}) le ${date}. Format JSON strict: {"matches": [{"id": "id", "homeTeam": "Equipe A", "awayTeam": "Equipe B", "competition": "${league}", "time": "HH:mm"}]}`;

  try {
    const response = await ai.models.generateContent({
      //model: "gemini-3-flash-preview",
      model: "gemini-1.5-flash",
      contents: prompt,
      config: { 
       // tools: [{ googleSearch: {} }], 
        responseMimeType: "application/json" 
      },
    });

    const data = parseSafeJson(response.text);
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web?.uri)
      .filter(Boolean) || [];

    const result = { 
      matches: (data?.matches || []).filter((m: any) => m.homeTeam && m.awayTeam), 
      sources 
    };
    
    if (result.matches.length > 0) setCache(cacheKey, result);
    return result;
  } catch (error: any) {
    const msg = error.message?.toLowerCase() || "";
    if (msg.includes("401") || msg.includes("403") || msg.includes("key")) {
      throw new Error("Clé API invalide. Veuillez la corriger dans les réglages.");
    }
    throw error;
  }
}

export async function getPrediction(match: Match): Promise<PredictionResult> {
  const apiKey = getActiveKey();
  if (!apiKey) throw new Error("Clé API absente.");

  const cacheKey = `pred_${match.id}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyse PRO : ${match.homeTeam} vs ${match.awayTeam}. Inclus probabilités 1N2, score exact, et explication de la pondération statistique.`,
    config: { 
      tools: [{ googleSearch: {} }], 
      responseMimeType: "application/json", 
      responseSchema: predictionSchema 
    }
  });
  
  const resultRaw = parseSafeJson(response.text);
  if (!resultRaw) throw new Error("Analyse échouée.");

  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map((chunk: any) => chunk.web?.uri)
    .filter(Boolean) || [];

  const finalResult: PredictionResult = {
    probabilities: {
      home: normalizePercent(resultRaw.probabilities?.home),
      draw: normalizePercent(resultRaw.probabilities?.draw),
      away: normalizePercent(resultRaw.probabilities?.away)
    },
    score: resultRaw.score || "N/A",
    analysis: resultRaw.analysis || "N/A",
    weightingInfo: resultRaw.weighting_info || "Analyse basée sur l'historique H2H et la forme actuelle.",
    confidence: normalizePercent(resultRaw.confidence),
    sources,
    provider: 'Gemini'
  };

  setCache(cacheKey, finalResult, 24);
  return finalResult;
}
