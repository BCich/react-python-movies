import React, { useState } from 'react';
import { toast } from 'react-toastify';

function ActorsForm() {
    const [name, setName] = useState("");

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
        } catch (error) {
            toast.error("Failed to add actor.");
        }
    };

    return (
        <div className="actor-form">
            <h3>Add new actor</h3>
            <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <button onClick={handleSubmit}>Add</button>
        </div>
    );
}

export default ActorsForm;