import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SimulateurRetraite = () => {
  // États pour les paramètres de simulation
  const [capitalInitial, setCapitalInitial] = useState(10000);
  const [investissementMensuel, setInvestissementMensuel] = useState(500);
  const [anneesInvestissement, setAnneesInvestissement] = useState(30);
  const [tauxRendementAnnuel, setTauxRendementAnnuel] = useState(5);
  const [inflation, setInflation] = useState(2);
  const [retraitMensuelRetraite, setRetraitMensuelRetraite] = useState(2000);
  const [anneeDebutRetraite, setAnneeDebutRetraite] = useState(2050);
  const [anneesRetraite, setAnneesRetraite] = useState(25);
  
  // État pour les données du graphique
  const [graphData, setGraphData] = useState([]);
  
  // Fonction pour calculer l'évolution du capital
  const calculerSimulation = () => {
    const anneeActuelle = new Date().getFullYear();
    const indexDebutRetraite = anneeDebutRetraite - anneeActuelle;
    const dureeSimulation = Math.max(indexDebutRetraite + anneesRetraite, anneesInvestissement);
    
    let capital = capitalInitial;
    const data = [];
    
    const rendementMensuel = tauxRendementAnnuel / 100 / 12;
    const inflationMensuelle = inflation / 100 / 12;
    
    // Valeur actuelle du retrait mensuel (sera ajustée avec l'inflation)
    let retraitMensuelActuel = retraitMensuelRetraite;
    
    for (let annee = 0; annee <= dureeSimulation; annee++) {
      const anneeSimulee = anneeActuelle + annee;
      const enPhaseRetraite = anneeSimulee >= anneeDebutRetraite;
      let capitalDebut = capital;
      
      // Calcul mois par mois pour l'année
      for (let mois = 0; mois < 12; mois++) {
        // Intérêts mensuels (composés)
        const interets = capital * rendementMensuel;
        capital += interets;
        
        // Ajout de l'investissement mensuel ou retrait pour la retraite
        if (!enPhaseRetraite && annee < anneesInvestissement) {
          capital += investissementMensuel;
        } else if (enPhaseRetraite) {
          capital -= retraitMensuelActuel;
          // Ajuster le retrait avec l'inflation pour le mois suivant
          retraitMensuelActuel *= (1 + inflationMensuelle);
        }
        
        // Si le capital devient négatif, le mettre à zéro
        if (capital < 0) capital = 0;
      }
      
      // Ajouter les données de l'année au graphique
      data.push({
        annee: anneeSimulee,
        capital: Math.round(capital),
        variation: Math.round(capital - capitalDebut),
        retraite: enPhaseRetraite ? "Oui" : "Non"
      });
      
      // Si le capital est épuisé, arrêter la simulation
      if (capital <= 0) break;
    }
    
    setGraphData(data);
  };
  
  // Recalculer la simulation chaque fois qu'un paramètre change
  useEffect(() => {
    calculerSimulation();
  }, [
    capitalInitial, 
    investissementMensuel, 
    anneesInvestissement, 
    tauxRendementAnnuel, 
    inflation, 
    retraitMensuelRetraite, 
    anneeDebutRetraite,
    anneesRetraite
  ]);
  
  // Formater les nombres pour l'affichage
  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(montant);
  };
  
  // Calculer quelques statistiques pour le résumé
  const capitalFinal = graphData.length > 0 ? graphData[graphData.length - 1].capital : 0;
  const anneeEpuisement = graphData.length > 0 && graphData[graphData.length - 1].capital <= 0 
    ? graphData[graphData.length - 1].annee 
    : "Non épuisé";
  
  // Calculer le montant total investi
  const montantTotalInvesti = capitalInitial + (investissementMensuel * 12 * Math.min(anneesInvestissement, anneeDebutRetraite - new Date().getFullYear()));
  
  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6">Simulateur d'Investissement pour la Retraite</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Paramètres de simulation */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Paramètres</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capital initial
              </label>
              <input
                type="number"
                min="0"
                value={capitalInitial}
                onChange={(e) => setCapitalInitial(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Investissement mensuel
              </label>
              <input
                type="number"
                min="0"
                value={investissementMensuel}
                onChange={(e) => setInvestissementMensuel(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Années d'investissement
              </label>
              <input
                type="number"
                min="1"
                value={anneesInvestissement}
                onChange={(e) => setAnneesInvestissement(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taux de rendement annuel (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={tauxRendementAnnuel}
                onChange={(e) => setTauxRendementAnnuel(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inflation annuelle (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={inflation}
                onChange={(e) => setInflation(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Année début retraite
              </label>
              <input
                type="number"
                min={new Date().getFullYear()}
                value={anneeDebutRetraite}
                onChange={(e) => setAnneeDebutRetraite(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Retrait mensuel à la retraite
              </label>
              <input
                type="number"
                min="0"
                value={retraitMensuelRetraite}
                onChange={(e) => setRetraitMensuelRetraite(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Durée de retraite (années)
              </label>
              <input
                type="number"
                min="1"
                value={anneesRetraite}
                onChange={(e) => setAnneesRetraite(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
          </div>
        </div>
        
        {/* Résumé des résultats */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Résumé</h2>
          
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="font-medium">Montant total investi:</div>
              <div>{formatMontant(montantTotalInvesti)}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="font-medium">Capital final:</div>
              <div>{formatMontant(capitalFinal)}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="font-medium">Fin de l'investissement:</div>
              <div>{new Date().getFullYear() + anneesInvestissement}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="font-medium">Début des retraits:</div>
              <div>{anneeDebutRetraite}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="font-medium">Année d'épuisement:</div>
              <div>{anneeEpuisement}</div>
            </div>
            
            {/* Résumé des performances */}
            {capitalFinal > 0 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                <p className="font-medium text-green-800">
                  Votre capital devrait durer jusqu'à la fin de la période de retraite.
                </p>
              </div>
            )}
            
            {capitalFinal <= 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                <p className="font-medium text-red-800">
                  Attention: Votre capital sera épuisé avant la fin de la période de retraite.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Graphique */}
      <div className="mt-8 bg-white p-4 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Évolution du capital</h2>
        
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={graphData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="annee" 
              label={{ value: 'Année', position: 'insideBottomRight', offset: -10 }} 
            />
            <YAxis 
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              label={{ value: 'Capital (€)', angle: -90, position: 'insideLeft' }} 
            />
            <Tooltip 
              formatter={(value) => [`${formatMontant(value)}`, '']}
              labelFormatter={(value) => `Année: ${value}`}
              contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="capital"
              stroke="#4f46e5"
              name="Capital"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Tableau des données détaillées */}
      <div className="mt-8 bg-white p-4 rounded-lg border border-gray-200 overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4">Données détaillées</h2>
        
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Année
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Capital
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Variation
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phase
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {graphData.map((entry, index) => (
              <tr key={index} className={entry.retraite === "Oui" ? "bg-orange-50" : ""}>
                <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                  {entry.annee}
                </td>
                <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                  {formatMontant(entry.capital)}
                </td>
                <td className={`px-6 py-2 whitespace-nowrap text-sm ${entry.variation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {entry.variation >= 0 ? '+' : ''}{formatMontant(entry.variation)}
                </td>
                <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                  {entry.retraite === "Oui" ? "Retraite" : "Investissement"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SimulateurRetraite;
