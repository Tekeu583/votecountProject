import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { ChevronLeft, Users } from 'lucide-react';

// --- Hero d'une catégorie de candidats -----------------
// Même gabarit visuel que le hero de PortailVote.jsx (image pleine
// largeur + dégradé + contenu centré), appliqué à une catégorie.
const ElectionCategoryBanner = ({ election, category, candidatesCount }) => {
    const bannerUrl = category?.banner || election?.banner;

    return (
        <div className="relative rounded overflow-hidden shadow-2xl">
            <Link
                to={`/elections/${election?.uuid}/categories`}
                className="inline-flex items-center gap-2 absolute text-white hover:text-blue-300 cursor-pointer top-4 left-4 z-20"
            >
                <ChevronLeft size={16} /> Retour aux catégories
            </Link>
            <img
                src={bannerUrl || 'https://i.pravatar.cc/1200?u=category'}
                alt={category?.name}
                className="w-full h-72 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/20" />
            <div className="absolute inset-0 flex items-center justify-center px-6">
                <div className="text-center text-white max-w-3xl">
                    <p className="text-sm uppercase tracking-wide opacity-80">{election?.title}</p>
                    <h1 className="text-3xl md:text-5xl font-bold leading-tight mt-2">
                        {category?.name}
                    </h1>
                    {category?.description && (
                        <p className="text-md md:text-lg mt-4 opacity-90">{category.description}</p>
                    )}
                    <div className="mt-4 inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full font-medium bg-white/20">
                        <Users size={14} /> {candidatesCount} candidat{candidatesCount > 1 ? 's' : ''}
                    </div>
                </div>
            </div>
        </div>
    );
};

ElectionCategoryBanner.propTypes = {
    election: PropTypes.shape({
        uuid: PropTypes.string,
        title: PropTypes.string,
        banner: PropTypes.string,
    }),
    category: PropTypes.shape({
        name: PropTypes.string,
        description: PropTypes.string,
        banner: PropTypes.string,
    }),
    candidatesCount: PropTypes.number,
};

export default ElectionCategoryBanner;
