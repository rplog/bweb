import React, { useState, useEffect } from 'react';

interface TypewriterProps {
    text: string;
    speed?: number;
    onComplete?: () => void;
}

export const Typewriter: React.FC<TypewriterProps> = ({ text, speed = 10, onComplete }) => {
    const [currentLength, setCurrentLength] = useState(0);
    const onCompleteRef = React.useRef(onComplete);

    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    useEffect(() => {
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
