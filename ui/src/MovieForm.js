import React, {useState, useEffect} from "react";
import { toast } from 'react-toastify';
import { motion } from "framer-motion";
import OscarRating from "./OscarRating";

export default function MovieForm({onMovieSubmit, buttonLabel, initialData}) {
    const [title, setTitle] = useState('');
    const [year, setYear] = useState('');
    const [rating, setRating] = useState(0);
    const [availableActors, setAvailableActors] = useState([]);
    const [availableDirectors, setAvailableDirectors] = useState([]);
    const [selectedActorIds, setSelectedActorIds] = useState([]);
    const [selectedDirectorId, setSelectedDirectorId] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const actorsRes = await fetch('/actors');
                if (!actorsRes.ok) throw new Error("Failed to load actors");
                const actorsData = await actorsRes.json();
                setAvailableActors(actorsData);

                const dirRes = await fetch('/directors');
                if (!dirRes.ok) throw new Error("Failed to load directors");
                const dirData = await dirRes.json();
                setAvailableDirectors(dirData);
            } catch (error) {
                toast.error("Could not load data for lists.");
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || '');
            setYear(initialData.year || '');
            setRating(initialData.rating || 0);
            
            if (initialData.director_id) {
                setSelectedDirectorId(initialData.director_id.toString());
            } else {
                setSelectedDirectorId("");
            }

            if (initialData.actor_ids && Array.isArray(initialData.actor_ids)) {
                setSelectedActorIds(initialData.actor_ids);
            } else {
                setSelectedActorIds([]);
            }
        }
    }, [initialData]);

    const handleActorToggle = (actorId) => {
        setSelectedActorIds(prev => {
            if (prev.includes(actorId)) {
                return prev.filter(id => id !== actorId);
            } else {
                return [...prev, actorId];
            }
        });
    };

    function handleSubmit(event) {
        event.preventDefault();
        if (!title || !year) {
            toast.warn("Title and Year are required");
            return;
        }

        const movieData = {
            id: initialData ? initialData.id : undefined, 
            title, 
            year, 
            rating,
            director_id: selectedDirectorId ? parseInt(selectedDirectorId) : null,
            actor_ids: selectedActorIds 
        };
        onMovieSubmit(movieData);
        
        if (!initialData) {
            setTitle('');
            setYear('');
            setRating(0);
            setSelectedActorIds([]);
            setSelectedDirectorId("");
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label>Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
                <label>Year</label>
                <input type="text" value={year} onChange={(e) => setYear(e.target.value)} />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
                <label>Rating (Oscars)</label>
                <div style={{ padding: '5px 0' }}>
                    <OscarRating rating={rating} onRate={setRating} />
                </div>
            </div>

            <div>
                <label>Director</label>
                <select 
                    value={selectedDirectorId} 
                    onChange={(e) => setSelectedDirectorId(e.target.value)}
                    style={{backgroundColor: 'white'}}
                >
                    <option value="">-- Select Director --</option>
                    {availableDirectors.map(director => (
                        <option key={director.id} value={director.id}>
                            {director.name}
                        </option>
                    ))}
                </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
                <label>Actors (Select multiple)</label>
                <div style={{ 
                    maxHeight: '150px',
                    overflowY: 'auto',
                    border: '1px solid #ccc',
                    padding: '10px', 
                    backgroundColor: 'white',
                    marginTop: '5px',
                    borderRadius: '4px'
                }}>
                    {availableActors.length === 0 ? <p style={{color: '#999'}}>No actors available</p> : null}
                    
                    {availableActors.map(actor => (
                        <div key={actor.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                            <input
                                type="checkbox"
                                id={`actor-${actor.id}`}
                                checked={selectedActorIds.includes(actor.id)}
                                onChange={() => handleActorToggle(actor.id)}
                                style={{ width: 'auto', marginRight: '10px' }}
                            />
                            <label htmlFor={`actor-${actor.id}`} style={{ margin: 0, cursor: 'pointer', fontWeight: 'normal' }}>
                                {actor.name}
                            </label>
                        </div>
                    ))}
                </div>
            </div>
            
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
                {buttonLabel || 'Add movie'}
            </motion.button>
        </form>
    );
}