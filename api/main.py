from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, validator, Field
from typing import List, Optional
import sqlite3
import chromadb
from sentence_transformers import SentenceTransformer

class Movie(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    year: str
    director_id: Optional[int] = None
    actor_ids: List[int] = []
    rating: int = Field(default=0, ge=0, le=5)
    
    @validator('year')
    def validate_year(cls, v):
        if not v.strip():
            raise ValueError('Year cannot be empty')
        if not v.strip().isdigit():
            raise ValueError('Year must be numeric')
        year_int = int(v.strip())
        if not 1800 <= year_int <= 2100:
            raise ValueError('Year must be between 1800 and 2100')
        return v.strip()
    
    @validator('title')
    def validate_title(cls, v):
        if not v.strip():
            raise ValueError('Title cannot be empty')
        return v.strip()

class Actor(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    
    @validator('name')
    def validate_name(cls, v):
        if not v.strip():
            raise ValueError('Actor name cannot be empty')
        return v.strip()

class Director(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    
    @validator('name')
    def validate_name(cls, v):
        if not v.strip():
            raise ValueError('Director name cannot be empty')
        return v.strip()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = SentenceTransformer('all-MiniLM-L6-v2')
chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection(name="movies_collection")

def init_db():
    try:
        with sqlite3.connect('movies.db') as db:
            cursor = db.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS directors (
                    id INTEGER PRIMARY KEY,
                    name TEXT
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS movies (
                    id INTEGER PRIMARY KEY,
                    title TEXT,
                    year TEXT,
                    director_id INTEGER,
                    FOREIGN KEY(director_id) REFERENCES directors(id)
                )
            """)
            try:
                cursor.execute("ALTER TABLE movies ADD COLUMN rating INTEGER DEFAULT 0")
            except sqlite3.OperationalError:
                pass

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS actors (
                    id INTEGER PRIMARY KEY,
                    name TEXT
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS movie_actors (
                    movie_id INTEGER,
                    actor_id INTEGER,
                    FOREIGN KEY(movie_id) REFERENCES movies(id),
                    FOREIGN KEY(actor_id) REFERENCES actors(id),
                    PRIMARY KEY (movie_id, actor_id)
                )
            """)
            db.commit()
    except sqlite3.Error as e:
        print(f"Database initialization error: {e}")
        raise

def sync_vector_db():
    try:
        with sqlite3.connect('movies.db') as db:
            cursor = db.cursor()
            movies = cursor.execute("SELECT id, title FROM movies").fetchall()
            
            if not movies:
                return

            ids = [str(m[0]) for m in movies]
            documents = [m[1] for m in movies]
            embeddings = model.encode(documents).tolist()

            try:
                existing = collection.get()
                if existing['ids']:
                    collection.delete(ids=existing['ids'])
                
                collection.add(
                    documents=documents,
                    embeddings=embeddings,
                    ids=ids
                )
            except Exception as e:
                print(f"ChromaDB sync error: {e}")
    except sqlite3.Error as e:
        print(f"Database error during vector sync: {e}")
    except Exception as e:
        print(f"Unexpected error during vector sync: {e}")

@app.on_event("startup")
def on_startup():
    init_db()
    sync_vector_db()

@app.get("/")
def serve_react_app():
    return FileResponse("../ui/build/index.html")

@app.get('/movies')
def get_movies(search: Optional[str] = None):
    try:
        with sqlite3.connect('movies.db') as db:
            cursor = db.cursor()
            
            target_ids = []
            if search:
                try:
                    query_embedding = model.encode([search]).tolist()
                    results = collection.query(
                        query_embeddings=query_embedding,
                        n_results=5 
                    )
                    target_ids = results['ids'][0] if results['ids'] else []
                except Exception as e:
                    print(f"Search error: {e}")

            movies_query = 'SELECT * FROM movies'
            params = ()

            if search and target_ids:
                placeholders = ','.join(['?'] * len(target_ids))
                movies_query = f'SELECT * FROM movies WHERE id IN ({placeholders})'
                params = tuple(target_ids)
            elif search and not target_ids:
                return []

            movies = cursor.execute(movies_query, params).fetchall()
            
            output = []
            for movie in movies:
                movie_id = movie[0]
                director_id = movie[3]
                rating = movie[4] if len(movie) > 4 else 0
                
                director_name = "Unknown"
                if director_id:
                    dir_res = cursor.execute("SELECT name FROM directors WHERE id=?", (director_id,)).fetchone()
                    if dir_res:
                        director_name = dir_res[0]

                actors_cursor = db.cursor()
                actors_data = actors_cursor.execute("""
                    SELECT a.id, a.name FROM actors a
                    JOIN movie_actors ma ON a.id = ma.actor_id
                    WHERE ma.movie_id = ?
                """, (movie_id,)).fetchall()
                
                actor_names = ", ".join([a[1] for a in actors_data])
                actor_ids = [a[0] for a in actors_data]

                if not actor_names:
                    actor_names = "Unknown"
                
                movie_data = {
                    'id': movie_id, 
                    'title': movie[1], 
                    'year': movie[2], 
                    'director': director_name,
                    'actors': actor_names,
                    'director_id': director_id,
                    'actor_ids': actor_ids,
                    'rating': rating
                }
                output.append(movie_data)
                
            if search and target_ids:
                output.sort(key=lambda x: target_ids.index(str(x['id'])) if str(x['id']) in target_ids else 999)

            return output
            
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@app.post("/movies")
def add_movie(movie: Movie):
    try:
        with sqlite3.connect('movies.db') as db:
            cursor = db.cursor()
            cursor.execute("INSERT INTO movies (title, year, director_id, rating) VALUES (?, ?, ?, ?)", 
                           (movie.title, movie.year, movie.director_id, movie.rating))
            new_movie_id = cursor.lastrowid
            
            for actor_id in movie.actor_ids:
                cursor.execute("INSERT INTO movie_actors (movie_id, actor_id) VALUES (?, ?)", (new_movie_id, actor_id))
            
            db.commit()

            try:
                embedding = model.encode([movie.title]).tolist()
                collection.add(
                    documents=[movie.title],
                    embeddings=embedding,
                    ids=[str(new_movie_id)]
                )
            except Exception as e:
                print(f"Error adding to vector database: {e}")

        return {"id": new_movie_id, "title": movie.title, "year": movie.year, "rating": movie.rating}
        
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@app.put("/movies/{movie_id}")
def update_movie(movie_id: int, movie: Movie):
    try:
        with sqlite3.connect('movies.db') as db:
            cursor = db.cursor()
            
            existing = cursor.execute("SELECT id FROM movies WHERE id = ?", (movie_id,)).fetchone()
            if not existing:
                raise HTTPException(status_code=404, detail="Movie not found")
            
            cursor.execute("UPDATE movies SET title = ?, year = ?, director_id = ?, rating = ? WHERE id = ?", 
                           (movie.title, movie.year, movie.director_id, movie.rating, movie_id))
            
            cursor.execute("DELETE FROM movie_actors WHERE movie_id = ?", (movie_id,))
            for actor_id in movie.actor_ids:
                cursor.execute("INSERT INTO movie_actors (movie_id, actor_id) VALUES (?, ?)", (movie_id, actor_id))
            db.commit()

            try:
                embedding = model.encode([movie.title]).tolist()
                collection.upsert(
                    documents=[movie.title],
                    embeddings=embedding,
                    ids=[str(movie_id)]
                )
            except Exception as e:
                print(f"Error updating vector database: {e}")

        return {"message": "Updated"}
        
    except HTTPException:
        raise
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@app.delete("/movies/{movie_id}")
def delete_movie(movie_id: int):
    try:
        with sqlite3.connect('movies.db') as db:
            cursor = db.cursor()
            
            existing = cursor.execute("SELECT id FROM movies WHERE id = ?", (movie_id,)).fetchone()
            if not existing:
                raise HTTPException(status_code=404, detail="Movie not found")
            
            cursor.execute("DELETE FROM movies WHERE id = ?", (movie_id,))
            cursor.execute("DELETE FROM movie_actors WHERE movie_id = ?", (movie_id,))
            db.commit()

            try:
                collection.delete(ids=[str(movie_id)])
            except Exception as e:
                print(f"Error deleting from vector database: {e}")

        return {"message": "Deleted"}
        
    except HTTPException:
        raise
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@app.get('/actors')
def get_actors():
    try:
        with sqlite3.connect('movies.db') as db:
            cursor = db.cursor()
            actors = cursor.execute("SELECT * FROM actors").fetchall()
            return [{"id": row[0], "name": row[1]} for row in actors]
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@app.post("/actors")
def add_actor(actor: Actor):
    try:
        with sqlite3.connect('movies.db') as db:
            cursor = db.cursor()
            cursor.execute("INSERT INTO actors (name) VALUES (?)", (actor.name,))
            db.commit()
            new_id = cursor.lastrowid
        return {"id": new_id, "name": actor.name}
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@app.get('/directors')
def get_directors():
    try:
        with sqlite3.connect('movies.db') as db:
            cursor = db.cursor()
            directors = cursor.execute("SELECT * FROM directors").fetchall()
            return [{"id": row[0], "name": row[1]} for row in directors]
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@app.post("/directors")
def add_director(director: Director):
    try:
        with sqlite3.connect('movies.db') as db:
            cursor = db.cursor()
            cursor.execute("INSERT INTO directors (name) VALUES (?)", (director.name,))
            db.commit()
            new_id = cursor.lastrowid
        return {"id": new_id, "name": director.name}
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)