import React from 'react';
import { motion } from "framer-motion";

export default function OscarRating({ rating, onRate, readonly = false }) {
    const stars = [1, 2, 3, 4, 5];

    return (
        <div style={{ display: 'flex', gap: '2px' }}>
            {stars.map((star) => {
                const isFilled = star <= rating;
                
                return (
                    <motion.div
                        key={star}
                        whileHover={!readonly ? { scale: 1.2, y: -2 } : {}}
                        whileTap={!readonly ? { scale: 0.9 } : {}}
                        onClick={() => !readonly && onRate && onRate(star)}
                        style={{ 
                            cursor: readonly ? 'default' : 'pointer',
                            color: isFilled ? '#FFD700' : '#E0E0E0' 
                        }}
                    >
                       <svg 
                           width="24" 
                           height="24" 
                           viewBox="0 0 24 24" 
                           fill="currentColor"
                           xmlns="http://www.w3.org/2000/svg"
                       >
                           <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM12 22C11.4 22 11 21.6 11 21V16C11 16 9 14 9 11C9 10 10 9 10 9L12 8L14 9C14 9 15 10 15 11C15 14 13 16 13 16V21C13 21.6 12.6 22 12 22ZM15 11C15 11.8 14.5 12.6 13.8 13.1C13.2 13.4 12.6 13.5 12 13.5C11.4 13.5 10.8 13.4 10.2 13.1C9.5 12.6 9 11.8 9 11H15Z" />
                           <path d="M7 22H17V24H7V22Z" />
                       </svg>
                    </motion.div>
                );
            })}
        </div>
    );
}