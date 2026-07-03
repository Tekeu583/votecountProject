// src/components/CampaignCard.jsx
import { Clock, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function CampaignCard({ election }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = campaign.endDate - now;

      if (diff <= 0) {
        setTimeLeft('Terminée');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft(`${hours}h ${minutes}m`);
    }, 60000);

    return () => clearInterval(interval);
  }, [election.endDate]);

  return (
    <div className="campaign-card bg-white rounded-xl overflow-hidden shadow-xl group">
      <div className="relative">
        <img
          src={election.image}
          alt={election.title}
          className="w-full h-56 object-cover"
        />
        <div className={`absolute top-4 left-4 px-3 py-1 text-xs font-bold text-white rounded-2xl ${election.color}`}>
          {election.category}
        </div>
      </div>

      <div className="p-6">
        <h3 className="font-semibold text-xl leading-tight mb-3 line-clamp-2">{election.title}</h3>
        <p className="text-gray-600 text-sm line-clamp-2 mb-6">{election.description}</p>

        <div className="flex justify-between items-end mb-6">
          <div>
            <div className="text-xs text-gray-500">PARTICIPATION</div>
            <div className="text-3xl font-semibold text-gray-900">{election.participation}%</div>
          </div>

          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5 text-sm text-gray-500 mb-1">
              <Users className="w-4 h-4" /> {election?.votes} votes
            </div>
            <div className="flex items-center gap-1 text-xs text-amber-600">
              <Clock className="w-3.5 h-3.5" />
              {timeLeft}
            </div>
          </div>
        </div>

        <Link
          to={`/elections/${election.uuid}`}
          className="block w-full py-3 text-center bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]
          text-white font-semibold rounded-[var(--radius-md)] transition-all active:scale-[0.985]"
        >
          Voir la campagne →
        </Link>
      </div>
    </div>
  );
}