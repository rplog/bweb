import { useState, useEffect, useRef } from 'react';

interface TypewriterProps {
    text: string;
    speed?: number;
    onComplete?: () => void;
}

export const Typewriter = ({ text, speed = 10, onComplete }: TypewriterProps) => {
    const [currentLength, setCurrentLength] = useState(0);
    const [prevText, setPrevText] = useState(text);

    // Modern React pattern: Derive state during render instead of forcing an effect update
    if (text !== prevText) {
        setPrevText(text);
        setCurrentLength(0);
    }

    const onCompleteRef = useRef(onComplete);

    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

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
