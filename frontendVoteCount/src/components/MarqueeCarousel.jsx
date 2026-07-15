import { useEffect, useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import AutoScroll from 'embla-carousel-auto-scroll';
import {
    ChevronLeft,
    ChevronRight,
    ArrowRight,
    ListChecks,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';
import toast from 'react-hot-toast';
import { electionsApi } from '@services/api';

export default function MarqueeCarousel() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [elections, setElections] = useState([]);

    const [emblaRef, emblaApi] = useEmblaCarousel(
        {
            loop: true,
            dragFree: true,
            align: 'start',
            containScroll: false,
        },
        [
            AutoScroll({
                speed: 1.2, startDelay: 0, playOnInit: true, stopOnInteraction: true, stopOnMouseEnter: true,
            }),
        ]
    );

    useEffect(() => {
        const fetchElections = async () => {
            try {
                setLoading(true);

                const response = await electionsApi.openForCandidacy({
                    per_page: 15,
                });

                const data = response?.data?.data;
                setElections(data);

            } catch (error) {
                console.error(error);
                toast.error('Aucune élection disponible actuellement');
                setElections([]);
            } finally {
                setLoading(false);
            }
        };

        fetchElections();
    }, []);

    const scrollPrev = useCallback(() => {
        emblaApi?.scrollPrev();
    }, [emblaApi]);

    const scrollNext = useCallback(() => {
        emblaApi?.scrollNext();
    }, [emblaApi]);

    const handleCandidate = (electionUuid) => {
        navigate(`/elections/${electionUuid}/candidates`);
    };

    if (loading) {
        return (
            <div className="text-center">
                <ClipLoader color="#1e40af" size={48} />
                <p className="mt-4 text-gray-600">Chargement de l'élection...</p>
            </div>
        );
    }

    if (elections.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-gray-500">
                    Aucune élection n'attend de candidature pour le moment.
                </p>
            </div>
        );
    }

    return (
        <section className="relative py-6">

            {/* Navigation gauche */}
            <button
                onClick={scrollPrev}
                aria-label="Précédent"
                className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white p-3 shadow-lg transition hover:scale-110 hover:shadow-xl"
            >
                <ChevronLeft size={20} color="var(--color-primary)" />
            </button>

            {/* Navigation droite */}
            <button
                onClick={scrollNext}
                aria-label="Suivant"
                className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white p-3 shadow-lg transition hover:scale-110 hover:shadow-xl"
            >
                <ChevronRight size={20} color="var(--color-primary)" />
            </button>

            {/* Embla */}
            <div
                className="overflow-hidden"
                ref={emblaRef}
            >
                <div className="flex">
                    {elections.map((election) => (
                        <div
                            key={election.uuid}
                            className="min-w-[280px] sm:min-w-[320px] lg:min-w-[360px] px-3">
                            <article className="h-full overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                                <img
                                    src={election.banner || 'https://via.placeholder.com/600x300'}
                                    alt={election.title}
                                    loading="lazy"
                                    className="h-52 w-full object-cover" />
                                <div className="flex flex-col p-5">
                                    <h3 className=" line-clamp-2 text-lg font-semibold">
                                        {election.title}
                                    </h3>
                                    <p className="mt-2 text-sm text-gray-500">
                                        {
                                            election.organization?.name
                                        }
                                    </p>
                                    <div className="mt-3 text-sm text-amber-600">
                                        Clôture :{' '}{election.end_at ? new Date(election.end_at).toLocaleDateString('fr-FR') : 'N/A'}
                                    </div>
                                    <button
                                        onClick={() =>
                                            handleCandidate(election.uuid)}
                                        className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-3 text-white transition hover:bg-[var(--color-primary)]/50"
                                    >
                                        Candidater<ArrowRight size={16} />
                                    </button>
                                </div>
                            </article>
                        </div>
                    ))}
                    <div className="min-w-[280px] sm:min-w-[320px] lg:min-w-[360px] px-3">
                        <Link
                            to="/elections/open-for-candidacy"
                            className="h-52 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--color-primary)]/40 text-[var(--color-primary)] transition-all duration-300 hover:-translate-y-2 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5"
                        >
                            <ListChecks size={28} />
                            <span className="font-semibold">Voir toutes les élections</span>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}