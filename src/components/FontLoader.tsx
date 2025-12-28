"use client";

import { useEffect } from "react";

export function FontLoader() {
    useEffect(() => {
        // Load popular Arabic fonts from Google Fonts
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;600;700&family=Tajawal:wght@400;500;700&family=Noto+Sans+Arabic:wght@400;500;600;700&family=Scheherazade+New:wght@400;700&family=Almarai:wght@400;700;800&family=Changa:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=El+Messiri:wght@400;500;600;700&family=Markazi+Text:wght@400;500;600;700&display=swap";
        document.head.appendChild(link);

        return () => {
            // Cleanup: remove the link when component unmounts
            try {
                if (link.parentNode) {
                    link.parentNode.removeChild(link);
                }
            } catch (e) {
                // Ignore errors during cleanup
            }
        };
    }, []);

    return null;
}

