import './App.css';
import {useState, useEffect} from "react";
import "milligram";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import MovieForm from "./MovieForm";
import MoviesList from "./MoviesList";
import ActorsForm from "./ActorsForm";
import DirectorsForm from "./DirectorsForm";

function App() {
    const [movies, setMovies] = useState([]);
    const [addingMovie, setAddingMovie] = useState(false);

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                const response = await fetch('/movies');
                if (!response.ok) {
                    throw new Error("Failed to fetch movies");
                }
                const movies = await response.json();
                setMovies(movies);
            } catch (error) {
                toast.error("Error loading movies. Is the backend running?");
            }
        };
        fetchMovies();
    }, []);

    async function handleAddMovie(movie) {
        try {
            const response = await fetch('/movies', {
                method: 'POST',
                body: JSON.stringify(movie),
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) {
                throw new Error("Failed to add movie");
            }
            
            const refresh = await fetch('/movies');
            const data = await refresh.json();
            setMovies(data);
            setAddingMovie(false);
            toast.success("Movie added successfully!");
        } catch (error) {
            toast.error("Could not add movie. Please try again.");
        }
    }

    async function handleDeleteMovie(movie) {
        try {
            const response = await fetch(`/movies/${movie.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error("Failed to delete movie");
            }
            const nextMovies = movies.filter(m => m !== movie);
            setMovies(nextMovies);
            toast.success("Movie deleted.");
        } catch (error) {
            toast.error("Could not delete movie.");
        }
    }

    return (
        <div className="container">
            <ToastContainer position="top-right" autoClose={3000} />
            <h1>My favourite movies to watch</h1>
            
            {movies.length === 0
                ? <p>No movies yet. Maybe add something?</p>
                : <MoviesList movies={movies}
                    onDeleteMovie={handleDeleteMovie}
                />}
            
            {addingMovie
                ? <MovieForm onMovieSubmit={handleAddMovie}
                    buttonLabel="Add a movie"
                />
                : <button onClick={() => setAddingMovie(true)}>Add a movie</button>}

            <hr />
            <div className="row">
                <div className="column">
                    <ActorsForm />
                </div>
                <div className="column">
                    <DirectorsForm />
                </div>
            </div>
        </div>
    );
}

export default App;