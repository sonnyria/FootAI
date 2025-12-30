
import React, { useState } from 'react';
import { Match, PredictionResult } from './types';
import { findMatches, getPrediction } from './services/aiEngine';
import { Icons, MAJOR_LEAGUES, LeagueInfo } from './constants';

export default function App() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState<LeagueInfo>(MAJOR_LEAGUES[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [predLoading, setPredLoading] = useState(false);
  const [searchSources, setSearchSources] = useState<string[]>([]);
  
  const [userKey, setUserKey] = useState(localStorage.getItem('FOOTAI_USER_KEY') || '');
  const [showConfig, setShowConfig] = useState(!localStorage.getItem('FOOTAI_USER_KEY'));
  const [showMethodology, setShowMethodology] = useState(false);
  const [isKeyValid, setIsKeyValid] = useState<boolean | null>(null);

  const keyDisplay = userKey.length > 5 ? `***${userKey.slice(-5)}` : 'Non configurée';

  const handleSaveKey = () => {
    localStorage.setItem('FOOTAI_USER_KEY', userKey.trim());
    sessionStorage.clear();
    setMatches([]);
    setPrediction(null);
    setIsKeyValid(null);
    setShowConfig(false);
    setError(null);
  };

  const handleSearch = async () => {
    setLoading(true); setError(null); setHasSearched(true);
    try {
      const result = await findMatches(date, selectedLeague.name, selectedLeague.country);
      setMatches(result.matches);
      setSearchSources(result.sources);
      setIsKeyValid(true);
    } catch (err: any) {
      setError(err.message);
      setIsKeyValid(false);
      if (err.message.includes("Clé API invalide")) setShowConfig(true);
    } finally { setLoading(false); }
  };

  const handlePrediction = async (match: Match) => {
    setSelectedMatch(match); setPrediction(null); setPredLoading(true);
    try {
      const res = await getPrediction(match);
      setPrediction(res);
      setIsKeyValid(true);
    } catch (err: any) {
      setError(`Analyse impossible : ${err.message}`);
      setIsKeyValid(false);
      setSelectedMatch(null);
    } finally { setPredLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-slate-100 font-sans selection:bg-emerald-500/30">
      <nav className="border-b border-white/5 bg-black/80 backdrop-blur-3xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-xl text-black shadow-lg shadow-emerald-500/20"><Icons.SoccerBall /></div>
            <div className="leading-tight">
              <h1 className="text-sm font-black uppercase tracking-tighter">FootAI <span className="text-emerald-500">PRO</span></h1>
              <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">Clé : {keyDisplay}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`hidden sm:block px-2 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest ${isKeyValid === true ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' : isKeyValid === false ? 'border-rose-500/30 text-rose-500 bg-rose-500/5' : 'border-white/10 text-slate-500'}`}>
              {isKeyValid === true ? 'Connecté' : isKeyValid === false ? 'Erreur Clé' : 'En attente'}
            </div>
            <button 
              onClick={() => setShowMethodology(true)}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:text-emerald-400 transition-all group"
              title="Méthodologie d'analyse"
            >
              <Icons.Info />
            </button>
            <button onClick={() => setShowConfig(true)} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
              <Icons.Settings />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="bg-white/[0.02] border border-white/5 p-3 rounded-[32px] mb-10 flex flex-col lg:flex-row gap-3 shadow-2xl backdrop-blur-md">
          <div className="flex-1 relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500"><Icons.Flag /></div>
            <select value={selectedLeague.id} onChange={(e) => setSelectedLeague(MAJOR_LEAGUES.find(l => l.id === e.target.value) || MAJOR_LEAGUES[0])} className="w-full bg-black/40 border border-white/5 rounded-2xl py-5 pl-14 pr-6 appearance-none font-bold text-xs focus:border-emerald-500/50 outline-none">
              {MAJOR_LEAGUES.map(league => <option key={league.id} value={league.id} className="bg-slate-900">{league.label}</option>)}
            </select>
          </div>
          <div className="flex-1 relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500"><Icons.Calendar /></div>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl py-5 pl-14 pr-6 font-bold text-xs focus:border-emerald-500/50 outline-none" />
          </div>
          <button onClick={handleSearch} disabled={loading} className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-black font-black px-10 py-5 rounded-2xl uppercase text-[10px] tracking-widest transition-all">
            {loading ? '...' : 'Rechercher'}
          </button>
        </div>

        {error && (
          <div className="mb-10 p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl text-center animate-in slide-in-from-top-4">
            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {!loading && matches.map(match => (
            <div key={match.id} className="group bg-[#080808] border border-white/5 hover:border-emerald-500/40 rounded-[32px] overflow-hidden transition-all flex flex-col hover:shadow-xl">
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{match.competition}</span>
                <span className="text-[10px] font-black text-emerald-400">{match.time}</span>
              </div>
              <div className="p-8 flex-1 flex items-center justify-between text-center gap-2">
                <div className="flex-1"><h3 className="font-bold text-xs">{match.homeTeam}</h3></div>
                <div className="text-white/10 font-black italic text-xs">VS</div>
                <div className="flex-1"><h3 className="font-bold text-xs">{match.awayTeam}</h3></div>
              </div>
              <div className="p-6 pt-0">
                <button onClick={() => handlePrediction(match)} className="w-full py-4 bg-emerald-500/5 hover:bg-emerald-500 hover:text-black rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all border border-emerald-500/10">Analyser</button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* MODAL METHODOLOGIE */}
      {showMethodology && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl">
          <div className="relative w-full max-w-xl bg-[#080808] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/40">
              <div className="flex items-center gap-3">
                <div className="text-emerald-500"><Icons.Info /></div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Protocole d'Analyse</span>
              </div>
              <button onClick={() => setShowMethodology(false)} className="p-2 hover:bg-white/5 rounded-xl transition-all"><Icons.X /></button>
            </div>
            <div className="p-10 overflow-y-auto custom-scrollbar space-y-8">
              <section className="space-y-3">
                <h4 className="text-xs font-black uppercase text-emerald-500 tracking-widest">1. Recherche Contextuelle (Grounding)</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">Le moteur interroge Google Search en temps réel pour extraire les dernières informations critiques : compositions probables, blessures majeures, suspensions, état du terrain et enjeux psychologiques (lutte pour le maintien, qualification européenne).</p>
              </section>
              <section className="space-y-3">
                <h4 className="text-xs font-black uppercase text-emerald-500 tracking-widest">2. Analyse Statistique H2H & Forme</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">Comparaison des 5 derniers matchs de chaque équipe. L'IA pondère ces résultats selon la force des adversaires rencontrés et l'historique direct (Head-to-Head) sur les 3 dernières saisons.</p>
              </section>
              <section className="space-y-3">
                <h4 className="text-xs font-black uppercase text-emerald-500 tracking-widest">3. Algorithme de Pondération</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">Les probabilités 1N2 sont calculées via un modèle de distribution de Poisson croisé avec des facteurs correctifs : avantage domicile (+12% en moyenne), impact de l'absence d'un joueur clé (-15% sur l'efficacité offensive/défensive) et densité du calendrier.</p>
              </section>
              <section className="space-y-3">
                <h4 className="text-xs font-black uppercase text-emerald-500 tracking-widest">4. Indice de Confiance</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">Il représente le degré de convergence des données. Plus les sources (stats + news) sont concordantes, plus l'indice est élevé. Un indice faible (&lt;60%) indique souvent un match à haute incertitude ou un manque de données fraîches.</p>
              </section>
              <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                <p className="text-[9px] font-bold text-emerald-500/60 uppercase tracking-widest text-center italic">Important : Les prédictions sont fournies à titre informatif et ne garantissent aucun résultat.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PRÉDICTION - FIXE ET SCROLLABLE */}
      {selectedMatch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl">
          <div className="relative w-full max-w-2xl bg-[#080808] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-300">
            {/* Header du Modal */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/40 sticky top-0 z-10">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-500">Expertise Neural IA</span>
              <button onClick={() => setSelectedMatch(null)} className="p-2 bg-white/5 hover:bg-rose-500/20 hover:text-rose-500 rounded-xl transition-all"><Icons.X /></button>
            </div>

            {/* Contenu Scrollable */}
            <div className="p-8 lg:p-12 overflow-y-auto custom-scrollbar flex-1 space-y-10">
              {predLoading ? (
                <div className="py-20 flex flex-col items-center gap-6">
                  <div className="w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Calcul en cours...</p>
                </div>
              ) : prediction && (
                <div className="space-y-10 animate-in fade-in duration-500">
                  <div className="text-center space-y-2">
                    <p className="text-2xl font-black tracking-tight uppercase">{selectedMatch.homeTeam} vs {selectedMatch.awayTeam}</p>
                    <div className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                      <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Fiabilité : {prediction.confidence}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-black border border-white/5 rounded-3xl p-8 text-center">
                      <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Score Prévu</span>
                      <div className="text-6xl font-black text-emerald-500 mt-2 tracking-tighter tabular-nums">{prediction.score}</div>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 flex flex-col justify-center gap-4">
                      <div className="flex justify-between text-[9px] font-black uppercase">
                        <span className="text-emerald-500">DOM: {prediction.probabilities.home}%</span>
                        <span className="text-slate-500">NUL: {prediction.probabilities.draw}%</span>
                        <span className="text-rose-500">EXT: {prediction.probabilities.away}%</span>
                      </div>
                      <div className="h-3 w-full flex rounded-full overflow-hidden bg-black border border-white/10 p-1">
                        <div style={{ width: `${prediction.probabilities.home}%` }} className="h-full bg-emerald-500 transition-all duration-1000"></div>
                        <div style={{ width: `${prediction.probabilities.draw}%` }} className="h-full bg-slate-700 transition-all duration-1000"></div>
                        <div style={{ width: `${prediction.probabilities.away}%` }} className="h-full bg-rose-500 transition-all duration-1000"></div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-8 bg-white/[0.03] border border-white/5 rounded-3xl relative">
                      <span className="absolute -top-3 left-6 px-3 bg-[#080808] border border-white/10 rounded-full text-[7px] font-black uppercase text-emerald-500 tracking-widest">Analyse Tactique</span>
                      <p className="text-xs text-slate-300 leading-relaxed italic">"{prediction.analysis}"</p>
                    </div>
                    
                    <div className="p-8 bg-emerald-500/[0.02] border border-emerald-500/10 rounded-3xl relative">
                      <span className="absolute -top-3 left-6 px-3 bg-[#080808] border border-white/10 rounded-full text-[7px] font-black uppercase text-emerald-500 tracking-widest">Pondération IA</span>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-medium uppercase tracking-tight">{prediction.weightingInfo}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURATION */}
      {showConfig && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl">
          <div className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[48px] p-12 shadow-2xl space-y-8 animate-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="bg-emerald-500 w-12 h-12 rounded-2xl mx-auto flex items-center justify-center text-black shadow-lg shadow-emerald-500/20 mb-4"><Icons.Settings /></div>
              <h2 className="text-xl font-black uppercase">Accès Moteur</h2>
              <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">Votre clé est stockée localement dans votre navigateur</p>
            </div>
            <div className="space-y-6">
              <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-center">
                <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest mb-4">Créez votre clé gratuite pour activer l'analyse</p>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[10px] font-black text-white bg-emerald-500/20 px-6 py-3 rounded-xl border border-emerald-500/10 uppercase tracking-widest hover:bg-emerald-500/30 transition-all"><Icons.ExternalLink /> Obtenir ma clé</a>
              </div>
              <div className="space-y-3">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Clé API Gemini (AIza...)</label>
                <input type="password" value={userKey} onChange={(e) => setUserKey(e.target.value)} placeholder="Collez votre clé ici..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 outline-none font-mono text-xs focus:border-emerald-500/50" />
              </div>
            </div>
            <button onClick={handleSaveKey} className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-2xl transition-all uppercase text-xs tracking-[0.2em]">Enregistrer</button>
          </div>
        </div>
      )}
    </div>
  );
}
