import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from "framer-motion";

function ActorsForm() {
    const [name, setName] = useState("");
    const [actors, setActors] = useState([]);

    const fetchActors = async () => {
        try {
            const response = await fetch('/actors');
            if (response.ok) {
                const data = await response.json();
                setActors(data);
            }
        } catch (error) {
            console.error("Failed to load actors");
        }
    };

    useEffect(() => {
        fetchActors();
    }, []);

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast.warn("Actor name cannot be empty");
            return;
        }

        try {
            const response = await fetch('/actors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name })
            });

            if (!response.ok) throw new Error("Server error");

            const data = await response.json();
            toast.success(`Actor added: ${data.name}`);
            setName("");
            fetchActors();
        } catch (error) {
            toast.error("Failed to add actor.");
        }
    };

    return (
        <motion.div 
            className="actor-form"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            style={{ 
                backgroundColor: 'white', 
                padding: '20px', 
                borderRadius: '10px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
            }}
        >
            <h3>Add new actor</h3>
            <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <motion.button 
                onClick={handleSubmit}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{marginBottom: '20px'}}
            >
                Add
            </motion.button>

            <div style={{
                marginTop: 'auto', 
                borderTop: '2px solid #f4f4f4', 
                paddingTop: '15px'
            }}>
                <h5 style={{fontSize: '1rem', color: '#9b4dca', marginBottom: '10px'}}>
                    Current Actors ({actors.length})
                </h5>
                <ul style={{
                    listStyle: 'none', 
                    padding: 0, 
                    margin: 0, 
                    maxHeight: '150px', 
                    overflowY: 'auto',
                    textAlign: 'left'
                }}>
                    <AnimatePresence>
                        {actors.map(actor => (
                            <motion.li 
                                key={actor.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                style={{
                                    padding: '5px 0', 
                                    borderBottom: '1px solid #eee',
                                    fontSize: '0.9rem',
                                    color: '#666'
                                }}
                            >
                                🎭 {actor.name}
                            </motion.li>
                        ))}
                    </AnimatePresence>
                </ul>
            </div>
        </motion.div>
    );
}

export default ActorsForm;