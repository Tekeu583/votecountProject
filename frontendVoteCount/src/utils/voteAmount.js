// src/utils/voteAmount.js
// Calcul du nombre de voix à partir d'un montant et du prix d'une voix —
// utilisé par tout bulletin payant (VotePayment.jsx, VotePaymentMultiple.jsx,
// MultipleBallotForm.jsx) pour rester cohérent avec la validation backend
// (VotingService::submitVote — le montant doit être un multiple exact du prix).
export function computeVoteQuantity(amountStr, votePriceStr) {
    const amount = parseFloat(amountStr);
    const price = parseFloat(votePriceStr);

    if (!amount || !price || amount <= 0 || price <= 0) {
        return { isValid: false, quantity: 0 };
    }

    const amountCents = Math.round(amount * 100);
    const priceCents = Math.round(price * 100);

    if (amountCents % priceCents !== 0) {
        return { isValid: false, quantity: Math.floor(amountCents / priceCents) };
    }

    return { isValid: true, quantity: amountCents / priceCents };
}
