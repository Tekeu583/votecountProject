// src/mocks/campaigns.js
export const campaigns = [
  {
    id: 1,
    title: "Renouveau Urbain : Cap sur Bordeaux",
    category: "MUNICIPALES 2024",
    image: "https://picsum.photos/id/1015/600/400",
    description: "Une vision audacieuse pour transformer le centre-ville en zone piétonne végétalisée...",
    participation: 68,
    votes: 12450,
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 47 + 1000 * 60 * 12),
    color: "bg-amber-500"
  },
  {
    id: 2,
    title: "Réforme du Conseil Régional",
    category: "GOUVERNANCE",
    image: "https://picsum.photos/id/106/600/400",
    description: "Votez pour la nouvelle structure organisationnelle de la région Île-de...",
    participation: 42,
    votes: 8200,
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 23),
    color: "bg-slate-600"
  },
  {
    id: 3,
    title: "Plan Vert 2030 : Transition Énergétique",
    category: "ENVIRONNEMENT",
    image: "https://picsum.photos/id/1018/600/400",
    description: "Consultation citoyenne sur le déploiement des énergies renouvelables locales.",
    participation: 89,
    votes: 45600,
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 120),
    color: "bg-emerald-600"
  },
  {
    id: 4,
    title: "Pacte Solidarité & Emploi",
    category: "SOCIAL",
    image: "https://picsum.photos/id/201/600/400",
    description: "Vote pour l'allocation des budgets participatifs dédiés à l'insertion...",
    participation: 55,
    votes: 5430,
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 72),
    color: "bg-blue-600"
  },
  {
    id: 5,
    title: "Campus Numérique National",
    category: "ÉDUCATION",
    image: "https://picsum.photos/id/367/600/400",
    description: "Consultation sur les nouveaux programmes d'apprentissage...",
    participation: 31,
    votes: 1200,
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 15),
    color: "bg-cyan-600"
  },
  {
    id: 6,
    title: "Fondation d'Art Contemporain",
    category: "CULTURE",
    image: "https://picsum.photos/id/1016/600/400",
    description: "Votez pour le projet architectural du futur centre culturel du Grand Est.",
    participation: 76,
    votes: 22800,
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 96),
    color: "bg-violet-600"
  }
];

export const candidates = {
  1: [
    {
      id: 101,
      name: "Sophie Laurent",
      party: "Écologie en Action",
      photo: "https://picsum.photos/id/64/300/300",
      votes: 4520,
      program: "Priorité à la mobilité douce et aux espaces verts."
    },
    {
      id: 102,
      name: "Marc Dubois",
      party: "Avenir Bordeaux",
      photo: "https://picsum.photos/id/65/300/300",
      votes: 3850,
      program: "Modernisation des infrastructures et attractivité économique."
    }
  ],
  // Add more for other campaigns if needed
};