import React, { useState } from 'react';
import { toast } from 'react-toastify';

function DirectorsForm() {
    const [name, setName] = useState("");

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast.warn("Director name cannot be empty");
            return;
        }

        try {
            const response = await fetch('/directors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name })
            });

            if (!response.ok) throw new Error("Server error");

            const data = await response.json();
            toast.success(`Director added: ${data.name}`);
            setName("");
        } catch (error) {
            toast.error("Failed to add director.");
        }
    };

    return (
        <div className="director-form">
            <h3>Add new director</h3>
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

export default DirectorsForm;