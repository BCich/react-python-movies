import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import OscarRating from "./OscarRating";

export default function MoviesList({movies, onDeleteMovie, onUpdateMovie}) {
    const [editingId, setEditingId] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    
    const [actorsList, setActorsList] = useState([]);
    const [directorsList, setDirectorsList] = useState([]);

    useEffect(() => {
        fetch('/actors').then(r => r.json()).then(data => setActorsList(data));
        fetch('/directors').then(r => r.json()).then(data => setDirectorsList(data));
    }, []);

    const handleEditClick = (movie) => {
        setEditingId(movie.id);
        setEditFormData({
            title: movie.title,
            year: movie.year,
            rating: movie.rating || 0,
            director_id: movie.director_id || "",
            actor_ids: [] 
        });
    };

    const handleCancelClick = () => {
        setEditingId(null);
    };

    const handleSaveClick = (movieId) => {
        const dataToSend = {
            ...editFormData,
            director_id: editFormData.director_id === "" ? null : parseInt(editFormData.director_id)
        };
        
        onUpdateMovie(movieId, dataToSend);
        setEditingId(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleActorChange = (e) => {
        const val = e.target.value;
        setEditFormData(prev => ({ 
            ...prev, 
            actor_ids: val ? [parseInt(val)] : [] 
        }));
    };

    return (
        <motion.div 
            className="table-wrapper"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            style={{ borderRadius: '10px', overflow: 'hidden' }}
        >
            <table>
                <thead>
                    <tr>
                        <th>Rating</th>
                        <th>Title</th>
                        <th>Year</th>
                        <th>Director</th>
                        <th>Main Actor</th>
                        <th style={{textAlign: 'center', width: '200px'}}>Actions</th>
                    </tr>
                </thead>
                <tbody style={{position: 'relative'}}>
                    <AnimatePresence mode='popLayout'>
                        {movies.map(movie => {
                            const isEditing = editingId === movie.id;
                            return (
                                <motion.tr 
                                    key={movie.id}
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    style={{ backgroundColor: isEditing ? '#fff8e1' : 'white' }}
                                >
                                    {isEditing ? (
                                        <>
                                            <td>
                                                <OscarRating 
                                                    rating={editFormData.rating} 
                                                    onRate={(r) => setEditFormData(prev => ({...prev, rating: r}))} 
                                                />
                                            </td>
                                            <td>
                                                <input 
                                                    type="text" 
                                                    name="title" 
                                                    value={editFormData.title} 
                                                    onChange={handleChange}
                                                    style={{marginBottom: 0}} 
                                                />
                                            </td>
                                            <td>
                                                <input 
                                                    type="text" 
                                                    name="year" 
                                                    value={editFormData.year} 
                                                    onChange={handleChange}
                                                    style={{marginBottom: 0, width: '80px'}} 
                                                />
                                            </td>
                                            <td>
                                                <select 
                                                    name="director_id" 
                                                    value={editFormData.director_id} 
                                                    onChange={handleChange}
                                                    style={{marginBottom: 0}}
                                                >
                                                    <option value="">Unknown</option>
                                                    {directorsList.map(d => (
                                                        <option key={d.id} value={d.id}>{d.name}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td>
                                                 <select 
                                                    onChange={handleActorChange}
                                                    style={{marginBottom: 0}}
                                                >
                                                    <option value="">(Change Actor)</option>
                                                    {actorsList.map(a => (
                                                        <option key={a.id} value={a.id}>{a.name}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td style={{textAlign: 'center'}}>
                                                <button 
                                                    className="button button-clear"
                                                    onClick={() => handleSaveClick(movie.id)}
                                                    style={{color: 'green', marginRight: '5px', padding: '0 5px'}}
                                                >
                                                    Save
                                                </button>
                                                <button 
                                                    className="button button-clear"
                                                    onClick={handleCancelClick}
                                                    style={{color: 'gray', padding: '0 5px'}}
                                                >
                                                    Cancel
                                                </button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td>
                                                <OscarRating rating={movie.rating || 0} readonly />
                                            </td>
                                            <td><strong>{movie.title}</strong></td>
                                            <td>{movie.year}</td>
                                            <td>{movie.director}</td>
                                            <td>{movie.actors}</td>
                                            <td style={{textAlign: 'center'}}>
                                                <button 
                                                    className="button button-outline"
                                                    onClick={() => handleEditClick(movie)}
                                                    style={{borderColor: '#9b4dca', color: '#9b4dca', padding: '0 10px', height: '30px', lineHeight: '28px', fontSize: '0.8rem', marginRight: '5px'}}
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    className="button button-outline" 
                                                    onClick={() => onDeleteMovie(movie)}
                                                    style={{borderColor: '#ff4d4d', color: '#ff4d4d', padding: '0 10px', height: '30px', lineHeight: '28px', fontSize: '0.8rem'}}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </>
                                    )}
                                </motion.tr>
                            );
                        })}
                    </AnimatePresence>
                </tbody>
            </table>
        </motion.div>
    );
}