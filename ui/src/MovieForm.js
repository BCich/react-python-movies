import React, {useState, useEffect} from "react";
import { toast } from 'react-toastify';
import { motion } from "framer-motion";
import OscarRating from "./OscarRating";

export default function MovieForm({onMovieSubmit, buttonLabel}) {
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

    function handleSubmit(event) {
        event.preventDefault();
        if (!title || !year) {
            toast.warn("Title and Year are required");
            return;
        }

        const movieData = {
            title, 
            year, 
            rating,
            director_id: selectedDirectorId ? parseInt(selectedDirectorId) : null,
            actor_ids: selectedActorIds 
        };
        onMovieSubmit(movieData);
        setTitle('');
        setYear('');
        setRating(0);
        setSelectedActorIds([]);
        setSelectedDirectorId("");
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

            <div>
                <label>Main Actor</label>
                <select 
                    value={selectedActorIds[0] || ""} 
                    onChange={(e) => {
                        const val = e.target.value;
                        setSelectedActorIds(val ? [parseInt(val)] : []);
                    }}
                    style={{backgroundColor: 'white'}}
                >
                    <option value="">-- Select Actor --</option>
                    {availableActors.map(actor => (
                        <option key={actor.id} value={actor.id}>
                            {actor.name}
                        </option>
                    ))}
                </select>
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