import { useState } from 'react'
import PropTypes from 'prop-types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { X, } from 'lucide-react';
function RevenusModal({ data, stats, onClose, onSuccess, onError }) {
  const [reportPeriod, setReportPeriod] = useState('6months');
  const [isGenerating, setIsGenerating] = useState(false);
  // Fonction pour générer le rapport complet
  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      const today = new Date().toLocaleDateString('fr-FR');

      doc.setFontSize(20);
      doc.text("RAPPORT FINANCIER - VOTECOUNT", 14, 20);

      doc.setFontSize(12);
      doc.text(`Période : ${reportPeriod === '6months' ? '6 derniers mois' : 'Dernier mois'}`, 14, 30);
      doc.text(`Généré le : ${today}`, 14, 38);

      // Statistiques
      doc.setFontSize(14);
      doc.text("Résumé Financier", 14, 55);

      autoTable(doc, {
        startY: 65,
        head: [['Indicateur', 'Valeur']],
        body: [
          ['Revenu Total', `${Number(stats?.total_revenue ?? 0).toLocaleString('fr-FR')} CFA`],
          ['Moyenne par Votant', `${Number(stats?.average_per_voter ?? 0).toLocaleString('fr-FR')} CFA`],
          ['Sondages Payants Actifs', String(stats?.active_paid_polls ?? 0)],
        ],
        theme: 'striped',
      });

      // Tableau des transactions
      doc.setFontSize(14);
      doc.text("Transactions Récentes", 14, doc.lastAutoTable.finalY + 20);

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 30,
        head: [['Sondage', 'Date', 'Statut', 'Montant']],
        body: data.map(t => [
          t.poll,
          t.date,
          t.statut,
          `${t.montant.toLocaleString('fr-FR')} CFA`
        ]),
        theme: 'grid',
      });

      doc.save(`Rapport_Revenus_VoteCount_${today.replace(/\//g, '-')}.pdf`);

      onSuccess("Rapport généré avec succès et téléchargé !");
      onClose();

    } catch (error) {
      onError(error?.message ?? 'Erreur lors de la génération du rapport.');
    } finally {
      setIsGenerating(false);
    }
  }
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[var(--color-white)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] w-full max-w-md mx-4 overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-b-[var(--color-gray-light)]">
          <h2 className="text-xl font-semibold">Générer un Rapport Financier</h2>
          <button
            onClick={onClose}
            className="text-[var(--color-gray)] hover:text-[var(--color-dark)]"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Période du rapport
            </label>
            <select
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value)}
              className="w-full border border-gray-300 rounded-[var(--radius-md)] px-4 py-3 focus:outline-none focus:border-blue-500"
            >
              <option value="6months">Les 6 derniers mois</option>
              <option value="1month">Le dernier mois</option>
              <option value="3months">Les 3 derniers mois</option>
            </select>
          </div>

          <div className="bg-blue-50 p-4 rounded-[var(--radius-md)] text-sm text-[var(--color-primary)]">
            Le rapport contiendra :
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Résumé des revenus</li>
              <li>Liste des transactions récentes</li>
            </ul>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="border-t border-t-[var(--color-gray-light)] px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 btn-secondary font-medium hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={generateReport}
            disabled={isGenerating}
            className="flex-1 py-3 btn-primary font-medium disabled:bg-blue-400 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {isGenerating ? (
              <>Génération en cours...</>
            ) : (
              <>Générer et Télécharger le PDF</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

RevenusModal.propTypes = {
  data: PropTypes.array.isRequired,
  stats: PropTypes.shape({
    total_revenue: PropTypes.number,
    average_per_voter: PropTypes.number,
    active_paid_polls: PropTypes.number,
  }),
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
};

export default RevenusModal;
