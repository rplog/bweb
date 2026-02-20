import React, { useState, useEffect } from 'react';

interface TypewriterProps {
    text: string;
    speed?: number;
    onComplete?: () => void;
}

export const Typewriter = ({ text, speed = 10, onComplete }: TypewriterProps) => {
    const [currentLength, setCurrentLength] = useState(0);
    const onCompleteRef = React.useRef(onComplete);

    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentLength(0);
    }, [text]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentLength((prev) => {
                if (prev < text.length) {
                    return prev + 1;
                } else {
                    clearInterval(timer);
                    onCompleteRef.current?.();
                    return prev;
                }
            });
        }, speed);

        return () => clearInterval(timer);
    }, [text, speed]);

    return <span>{text.substring(0, currentLength)}</span>;
};
