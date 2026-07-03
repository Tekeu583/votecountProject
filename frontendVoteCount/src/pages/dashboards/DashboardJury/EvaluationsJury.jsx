import React, { useState } from "react";
import {
    Star,
    MessageSquare,
    CheckCircle,
    AlertCircle,
    XCircle,
    Send,
} from "lucide-react";
import TextInput from "@components/ui/TextInput";
import { useLocation } from "react-router-dom";

const JuryEvaluation = () => {
    const [scores, setScores] = useState({
        performance: "",
        communication: "",
        development: "",
        assurance: "",
        respect: "",
        originalite: "",
    });

    const [comment, setComment] = useState("");
    const [verdict, setVerdict] = useState("");

    const location = useLocation();
    const candidate = location.state?.candidate;

    const handleChange = (e) => {
        setScores({
            ...scores,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = () => {
        console.log({ scores, comment, verdict });
    };

    return (

        <div className="flex p-4 bg-[var(--color-background-white)]">
            {/* MAIN */}
            < div className="flex-1" >
                {/* HEADER */}
                <div className="flex flex-col lg:flex-row justify-between gap-4 mb-6" >
                    <div>
                        <h2 className="text-xl font-semibold">Evaluez  {candidate ? candidate.name : ""}</h2>
                        <p className="text-gray-500 text-sm">
                            Candidat Développeur Senior Fullstack
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button className="px-4 py-2 border border-[var(--color-gray-light)] rounded-md btn-secondary text-sm">
                            Voir CV
                        </button>
                        <button className="px-4 py-2 border border-[var(--color-gray-light)] rounded-md btn-secondary text-sm">
                            Dossier
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* LEFT CONTENT */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* CRITERES */}
                        <div className="bg-white p-6 rounded-xl shadow-sm">
                            <div className="flex items-center gap-2 mb-6">
                                <Star size={18} />
                                <h3 className="font-semibold">Critères d'évaluation</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { label: "Prestation / performance", name: "performance" },
                                    { label: "Maîtrise/communication", name: "communication" },
                                    { label: "Présence / assurance", name: "assurance" },
                                    { label: "Respect des règles", name: "respect" },
                                    { label: "Originalité", name: "originalite" },
                                    { label: "Présentation/Developpement", name: "development" },
                                ].map((item) => (
                                    <div key={item.name}>
                                        <label className="text-sm text-gray-600">
                                            {item.label}
                                        </label>
                                        <TextInput
                                            type="number"
                                            name={item.name}
                                            value={scores[item.name]}
                                            onChange={handleChange}
                                            placeholder="0 - 10"
                                            className="mt-1 w-full px-3 py-2"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* COMMENT */}
                        <div className="bg-white p-6 rounded-xl shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <MessageSquare size={18} />
                                <h3 className="font-semibold">Commentaire</h3>
                            </div>

                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows={5}
                                placeholder="Votre évaluation..."
                                className="w-full border border-[var(--color-gray-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent rounded-lg px-3 py-2"
                            />
                        </div>
                    </div>

                    {/* RIGHT PANEL */}
                    <div className="space-y-6">

                        {/* VERDICT */}
                        <div className="bg-[#0f172a] text-white p-6 rounded-xl shadow-md">
                            <h3 className="font-semibold mb-4">Verdict Final</h3>

                            <div className="space-y-3">
                                <button
                                    onClick={() => setVerdict("favorable")}
                                    className={`w-full py-2 rounded-md flex items-center justify-center gap-2 ${verdict === "favorable"
                                        ? "bg-white text-black"
                                        : "bg-white/10"
                                        }`}
                                >
                                    <CheckCircle size={18} />
                                    Favorable
                                </button>

                                <button
                                    onClick={() => setVerdict("discuter")}
                                    className={`w-full py-2 rounded-md flex items-center justify-center gap-2 ${verdict === "discuter"
                                        ? "bg-white text-black"
                                        : "bg-white/10"
                                        }`}
                                >
                                    <AlertCircle size={18} />
                                    À discuter
                                </button>

                                <button
                                    onClick={() => setVerdict("defavorable")}
                                    className={`w-full py-2 rounded-md flex items-center justify-center gap-2 ${verdict === "defavorable"
                                        ? "bg-white text-black"
                                        : "bg-white/10"
                                        }`}
                                >
                                    <XCircle size={18} />
                                    Défavorable
                                </button>
                            </div>
                        </div>

                        {/* STATS */}
                        <div className="bg-white p-6 rounded-xl shadow-sm">
                            <h4 className="text-sm text-gray-500 mb-4">
                                STATISTIQUES JURY
                            </h4>

                            <div className="flex justify-between mb-2">
                                <span>Score moyen</span>
                                <span className="font-semibold">7.2/10</span>
                            </div>

                            <div className="flex justify-between">
                                <span>Membres ayant voté</span>
                                <span className="font-semibold">2 / 6</span>
                            </div>
                        </div>

                        {/* SUBMIT */}
                        <button
                            onClick={handleSubmit}
                            className="w-full btn-primary py-3 rounded-xl flex items-center justify-center gap-2"
                        >
                            <Send size={18} />
                            Valider l'évaluation
                        </button>
                    </div>
                </div>
            </div >
        </div>
    );
};

export default JuryEvaluation;