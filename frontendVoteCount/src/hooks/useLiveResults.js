// src/hooks/useLiveResults.js
// Hook de connexion au canal de résultats en direct.

import { useState, useEffect, useRef } from 'react';

export const useLiveResults = (electionId, enabled, initialData = null) => {
    const [liveScores, setLiveScores] = useState(initialData);
    const [connected, setConnected] = useState(false);
    const channelRef = useRef(null);


    useEffect(() => {
        if (!initialData) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLiveScores(initialData);
    }, [initialData]);

    useEffect(() => {
        if (!enabled || !electionId || typeof window.Echo === 'undefined') {
            return undefined;
        }

        const channelName = `election.${electionId}.live`;

        channelRef.current = window.Echo.channel(channelName);
        channelRef.current

            .listen('.results.live', (data) => {
                setLiveScores(data);
            })
            .subscribed(() => {
                setConnected(true)
            })
            .error(() => setConnected(false));

        return () => {
            if (channelRef.current) {
                window.Echo.leaveChannel(channelName);
            }
        };
    }, [electionId, enabled]);

    return { liveScores, connected };
};

export default useLiveResults;