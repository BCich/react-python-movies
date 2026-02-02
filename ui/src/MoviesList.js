import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import OscarRating from "./OscarRating";
import MovieForm from "./MovieForm";

export default function MoviesList({movies, onDeleteMovie, onUpdateMovie}) {
    const [editingId, setEditingId] = useState(null);

    const handleEditClick = (movie) => {
        setEditingId(movie.id);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
    };

    const handleFormSubmit = (movieId, updatedData) => {
        onUpdateMovie(movieId, updatedData);
        setEditingId(null);
    };

    const handleQuickRate = (movie, newRating) => {
        const dataToSend = {
            id: movie.id,
            title: movie.title,
            year: movie.year,
            director_id: movie.director_id,
            actor_ids: movie.actor_ids || [],
            rating: newRating
        };
        onUpdateMovie(movie.id, dataToSend);
    };

    return (
        <motion.div 
            className="table-wrapper"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ borderRadius: '10px', overflow: 'hidden' }}
        >
            <table>
                <thead>
                    <tr>
                        <th style={{width: '120px'}}>Rating</th>
                        <th>Title</th>
                        <th style={{width: '80px'}}>Year</th>
                        <th>Director</th>
                        <th>Actors</th>
                        <th style={{textAlign: 'center', width: '200px'}}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <AnimatePresence mode='wait'>
                        {movies.map(movie => {
                            const isEditing = editingId === movie.id;

                            if (isEditing) {
                                return (
                                    <motion.tr 
                                        key={`edit-${movie.id}`}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        style={{ backgroundColor: '#f9f9f9' }}
                                    >
                                        <td colSpan="6" style={{ padding: '20px' }}>
                                            <h4 style={{marginBottom: '15px'}}>Edit Movie: {movie.title}</h4>
                                            
                                            <MovieForm 
                                                initialData={movie}
                                                buttonLabel="Save Changes"
                                                onMovieSubmit={(data) => handleFormSubmit(movie.id, data)}
                                            />
                                            
                                            <button 
                                                className="button button-outline"
                                                onClick={handleCancelEdit}
                                                style={{ marginTop: '10px', width: '100%', borderColor: '#999', color: '#999' }}
                                            >
                                                Cancel
                                            </button>
                                        </td>
                                    </motion.tr>
                                );
                            }

                            return (
                                <motion.tr 
                                    key={movie.id}
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <td>
                                        <OscarRating 
                                            rating={movie.rating || 0} 
                                            onRate={(r) => handleQuickRate(movie, r)}
                                        />
                                    </td>
                                    <td><strong>{movie.title}</strong></td>
                                    <td>{movie.year}</td>
                                    <td>{movie.director}</td>
                                    <td>
                                        {movie.actors && movie.actors !== "Unknown" 
                                            ? movie.actors.split(',').map((actor, index) => (
                                                <span key={index} className="actor-badge">
                                                    {actor.trim()}
                                                </span>
                                              )) 
                                            : <span style={{color: '#ccc', fontStyle: 'italic'}}>No actors</span>
                                        }
                                    </td>
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
                                </motion.tr>
                            );
                        })}
                    </AnimatePresence>
                </tbody>
            </table>
        </motion.div>
    );
}