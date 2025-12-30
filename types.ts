
export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  competition: string;
  time: string;
  date: string;
  homeLogo?: string;
  awayLogo?: string;
}

export interface PredictionResult {
  probabilities: {
    home: number;
    draw: number;
    away: number;
  };
  score: string;
  analysis: string;
  weightingInfo: string;
  confidence: number;
  sources: string[];
  provider?: 'Gemini' | 'Mistral (HF)';
}
