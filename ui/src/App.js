import './App.css';
import { useState, useEffect } from "react";
import "milligram";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from "framer-motion";
import MovieForm from "./MovieForm";
import MoviesList from "./MoviesList";
import ActorsForm from "./ActorsForm";
import DirectorsForm from "./DirectorsForm";

const getErrorMessage = (errorData) => {
    if (!errorData) return "An error occurred";
    
    if (typeof errorData.detail === 'string') {
        return errorData.detail;
    }
    
    if (Array.isArray(errorData.detail)) {
        return errorData.detail.map(err => {
            if (err.msg) return err.msg;
            if (err.message) return err.message;
            return JSON.stringify(err);
        }).join(', ');
    }
    
    if (typeof errorData.detail === 'object') {
        return JSON.stringify(errorData.detail);
    }
    
    return "An error occurred";
};

function App() {
    const [movies, setMovies] = useState([]);
    const [addingMovie, setAddingMovie] = useState(false);
    const [isGlobalLoading, setIsGlobalLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchMovies(searchQuery, true);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const fetchMovies = async (query = "", isSearch = false) => {
        if (isSearch) setIsSearching(true);
        else setIsGlobalLoading(true);

        try {
            let url = '/movies';
            if (query) {
                url += `?search=${encodeURIComponent(query)}`;
            }
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = getErrorMessage(errorData) || "Failed to fetch movies";
                throw new Error(errorMessage);
            }
            const moviesData = await response.json();
            setMovies(moviesData);
        } catch (error) {
            toast.error(error.message || "Error loading movies.");
        } finally {
            if (isSearch) setIsSearching(false);
            else setIsGlobalLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    async function handleAddMovie(movie) {
        setIsGlobalLoading(true);
        try {
            const response = await fetch('/movies', {
                method: 'POST',
                body: JSON.stringify(movie),
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = getErrorMessage(errorData) || "Failed to add movie";
                throw new Error(errorMessage);
            }
            
            await fetchMovies(searchQuery);
            setAddingMovie(false);
            toast.success("Movie added successfully!");
        } catch (error) {
            toast.error(error.message || "Could not add movie.");
        } finally {
            setIsGlobalLoading(false);
        }
    }

    async function handleUpdateMovie(movieId, updatedData) {
        setIsGlobalLoading(true);
        try {
            const response = await fetch(`/movies/${movieId}`, {
                method: 'PUT',
                body: JSON.stringify(updatedData),
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = getErrorMessage(errorData) || "Failed to update movie";
                throw new Error(errorMessage);
            }
            
            await fetchMovies(searchQuery);
            toast.success("Movie updated!");
        } catch (error) {
            toast.error(error.message || "Could not update movie.");
        } finally {
            setIsGlobalLoading(false);
        }
    }

    const performDelete = async (movie) => {
        setIsGlobalLoading(true);
        try {
            const response = await fetch(`/movies/${movie.id}`, {
                method: 'DELETE',
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = getErrorMessage(errorData) || "Failed to delete movie";
                throw new Error(errorMessage);
            }
            
            const nextMovies = movies.filter(m => m.id !== movie.id);
            setMovies(nextMovies);
            toast.success("Movie deleted.");
        } catch (error) {
            toast.error(error.message || "Could not delete movie.");
        } finally {
            setIsGlobalLoading(false);
        }
    };

    function handleDeleteClick(movie) {
        const ConfirmToast = ({ closeToast }) => (
            <div style={{ textAlign: 'center' }}>
                <p style={{marginBottom: '10px'}}>
                    Delete <strong>{movie.title}</strong>?
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <button 
                        onClick={() => { performDelete(movie); closeToast(); }}
                        style={{ backgroundColor: '#ff4d4d', borderColor: '#ff4d4d', color: 'white', height: '30px', lineHeight: '28px', padding: '0 15px', fontSize: '12px' }}
                    >Yes</button>
                    <button 
                        onClick={closeToast}
                        style={{ backgroundColor: '#ccc', borderColor: '#ccc', color: 'black', height: '30px', lineHeight: '28px', padding: '0 15px', fontSize: '12px' }}
                    >No</button>
                </div>
            </div>
        );
        toast.warn(<ConfirmToast />, { position: "top-center", autoClose: false, closeOnClick: false, draggable: false, closeButton: false });
    }

    return (
        <div className="container">
            <ToastContainer position="top-right" autoClose={3000} />
            
            {isGlobalLoading && (<div className="loading-overlay"><div className="lds-dual-ring"></div></div>)}

            <h1>My favourite movies</h1>
            
            <div style={{ position: 'relative' }}>
                <motion.input 
                    type="text" 
                    placeholder="🔍 Search movies (AI powered)..." 
                    value={searchQuery}
                    onChange={handleSearchChange}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{
                        marginBottom: '20px',
                        padding: '12px',
                        fontSize: '1.1rem',
                        borderRadius: '8px',
                        border: '1px solid #ccc',
                        width: '100%',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                />
                {isSearching && (
                    <div style={{ position: 'absolute', right: '15px', top: '15px' }}>
                        <span>⏳</span> 
                    </div>
                )}
            </div>

            {movies.length === 0 && !isGlobalLoading && !isSearching && !searchQuery
                ? <p>No movies yet. Maybe add something?</p>
                : <MoviesList 
                    movies={movies}
                    onDeleteMovie={handleDeleteClick}
                    onUpdateMovie={handleUpdateMovie}
                />}
            
            {movies.length === 0 && searchQuery && !isGlobalLoading && !isSearching && (
                <p>No results found for "{searchQuery}". Try something else!</p>
            )}
            
            {addingMovie ? (
                <div style={{ marginBottom: '20px' }}>
                    <MovieForm onMovieSubmit={handleAddMovie} buttonLabel="Add a movie" />
                    <button 
                        className="button button-outline" 
                        onClick={() => setAddingMovie(false)} 
                        style={{ marginTop: '10px', borderColor: '#999', color: '#999', width: '100%' }}
                    >
                        Cancel
                    </button>
                </div>
            ) : (
                <motion.button 
                    onClick={() => setAddingMovie(true)} 
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }}
                >
                    Add a movie
                </motion.button>
            )}

            <hr />
            <div className="row">
                <div className="column"><ActorsForm /></div>
                <div className="column"><DirectorsForm /></div>
            </div>
        </div>
    );
}

export default App;