import React from 'react';

const steps = [
    { id: 1, title: "Informations Générales" },
    { id: 2, title: "Gestion des Candidats" },
    { id: 3, title: "Paramètres des Votants" },
    { id: 4, title: "Récapitulatif & Publication" },
];

const ScrutinBreadcrumb = ({ currentStep, onStepClick }) => {
    return (
        <div className="mb-12">
            <div className="flex items-center justify-center">
                {steps.map((step, index) => {
                    const isActive = step.id === currentStep;
                    const isCompleted = step.id < currentStep;
                    const isLast = index === steps.length - 1;

                    return (
                        <React.Fragment key={step.id}>
                            {/* Étape */}
                            <div className="flex flex-col items-center ">
                                <button
                                    onClick={() => onStepClick(step.id)}
                                    disabled={step.id > currentStep}
                                    className={`w-10 h-10 rounded-full flex bg-[var(--color-white)] items-center justify-center text-sm font-semibold transition-all duration-200 border-2
                                    ${isCompleted
                                            ? 'bg-[var(--color-success)] border-[var(--color-success)] text-[var(--color-success)]'
                                            : isActive
                                                ? ' border-[var(--color-primary)] text-[var(--color-primary)]'
                                                : ' border-gray-300 text-[var(--color-gray)] hover:border-[var(--color-gray)]'
                                        }`}
                                >
                                    {step.id}
                                </button>

                                <span className={`mt-3 text-xs  font-medium text-center max-w-[110px] transition-colors
                                    ${isActive ? 'text-[var(--color-primary)]' : isCompleted ? 'text-[var(--color-success)]' : 'text-[var(--color-gray)]'}`}>
                                    {step.title}
                                </span>
                            </div>

                            {/* Ligne de connexion */}
                            {!isLast && (
                                <div className="flex-1 max-w-[80px] h-0.5 mx-4 mt-5 bg-[var(--color-gray)] relative">
                                    <div
                                        className={`absolute top-0 left-0 h-full transition-all duration-300
                                    ${step.id < currentStep ? 'bg-[var(--color-success)]' : 'bg-transparent'}`}
                                        style={{ width: isCompleted ? '100%' : '0%' }}
                                    />
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

export default ScrutinBreadcrumb;
