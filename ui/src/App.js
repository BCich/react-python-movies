import './App.css';
import {useState, useEffect} from "react";
import "milligram";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from "framer-motion";
import MovieForm from "./MovieForm";
import MoviesList from "./MoviesList";
import ActorsForm from "./ActorsForm";
import DirectorsForm from "./DirectorsForm";

function App() {
    const [movies, setMovies] = useState([]);
    const [addingMovie, setAddingMovie] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchMovies();
    }, []);

    const fetchMovies = async (query = "") => {
        setIsLoading(true);
        try {
            let url = '/movies';
            if (query) {
                url += `?search=${encodeURIComponent(query)}`;
            }
            const response = await fetch(url);
            if (!response.ok) throw new Error("Failed to fetch movies");
            const movies = await response.json();
            setMovies(movies);
        } catch (error) {
            toast.error("Error loading movies.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        fetchMovies(val);
    };

    async function handleAddMovie(movie) {
        setIsLoading(true);
        try {
            const response = await fetch('/movies', {
                method: 'POST',
                body: JSON.stringify(movie),
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) throw new Error("Failed to add movie");
            await fetchMovies(searchQuery);
            setAddingMovie(false);
            toast.success("Movie added successfully!");
        } catch (error) {
            toast.error("Could not add movie.");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleUpdateMovie(movieId, updatedData) {
        setIsLoading(true);
        try {
            const response = await fetch(`/movies/${movieId}`, {
                method: 'PUT',
                body: JSON.stringify(updatedData),
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) throw new Error("Failed to update movie");
            await fetchMovies(searchQuery);
            toast.success("Movie updated!");
        } catch (error) {
            toast.error("Could not update movie.");
        } finally {
            setIsLoading(false);
        }
    }

    const performDelete = async (movie) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/movies/${movie.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error("Failed to delete movie");
            const nextMovies = movies.filter(m => m !== movie);
            setMovies(nextMovies);
            toast.success("Movie deleted.");
        } catch (error) {
            toast.error("Could not delete movie.");
        } finally {
            setIsLoading(false);
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
            {isLoading && (<div className="loading-overlay"><div className="lds-dual-ring"></div></div>)}

            <h1>My favourite movies to watch</h1>
            
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

            {movies.length === 0 && !isLoading && !searchQuery
                ? <p>No movies yet. Maybe add something?</p>
                : <MoviesList 
                    movies={movies}
                    onDeleteMovie={handleDeleteClick}
                    onUpdateMovie={handleUpdateMovie}
                />}
            
            {movies.length === 0 && searchQuery && !isLoading && (
                <p>No results found for "{searchQuery}". Try something else!</p>
            )}
            
            {addingMovie
                ? <MovieForm onMovieSubmit={handleAddMovie} buttonLabel="Add a movie" />
                : <motion.button onClick={() => setAddingMovie(true)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Add a movie</motion.button>
            }

            <hr />
            <div className="row">
                <div className="column"><ActorsForm /></div>
                <div className="column"><DirectorsForm /></div>
            </div>
        </div>
    );
}

export default App;