import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const CustomCursor = () => {
    const cursorRef = useRef(null);
    const followerRef = useRef(null);

    useEffect(() => {
        const moveCursor = (e) => {
            gsap.to(cursorRef.current, { x: e.clientX, y: e.clientY, duration: 0.1, xPercent: -50, yPercent: -50 });
            gsap.to(followerRef.current, { x: e.clientX, y: e.clientY, duration: 0.3, xPercent: -50, yPercent: -50 });
        };
        const handleMouseDown = () => {
            cursorRef.current?.classList.add('clicking');
            followerRef.current?.classList.add('clicking');
        };
        const handleMouseUp = () => {
            cursorRef.current?.classList.remove('clicking');
            followerRef.current?.classList.remove('clicking');
        };

        window.addEventListener('mousemove', moveCursor);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', moveCursor);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    return (
        <>
            <div className="custom-cursor" ref={cursorRef} />
            <div className="custom-cursor-follower" ref={followerRef} />
        </>
    );
};

export default CustomCursor;
