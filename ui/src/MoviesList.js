import React from "react";

export default function MoviesList({movies, onDeleteMovie}) {
    return (
        <div className="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Year</th>
                        <th>Director</th>
                        <th>Main Actor</th>
                        <th style={{textAlign: 'center'}}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {movies.map(movie => (
                        <tr key={movie.id}>
                            <td><strong>{movie.title}</strong></td>
                            <td>{movie.year}</td>
                            <td>{movie.director}</td>
                            <td>{movie.actors}</td>
                            <td style={{textAlign: 'center'}}>
                                <button 
                                    className="button button-outline" 
                                    onClick={() => onDeleteMovie(movie)}
                                    style={{
                                        borderColor: '#ff4d4d', 
                                        color: '#ff4d4d', 
                                        padding: '0 10px', 
                                        height: '30px', 
                                        lineHeight: '28px',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}