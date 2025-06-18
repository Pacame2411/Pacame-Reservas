import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';

const ManualReservationForm = ({ restaurantId, onClose }) => {
    const { user } = useAuth();
    const [customerName, setCustomerName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [guests, setGuests] = useState(1);
    const [specialRequests, setSpecialRequests] = useState('');
    const [status, setStatus] = useState('pending');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { data, error } = await supabase
            .from('reservations')
            .insert([
                {
                    restaurant_id: restaurantId,
                    customer_name: customerName,
                    email,
                    phone,
                    date,
                    time,
                    guests,
                    status,
                    special_requests: specialRequests,
                    created_by: 'manager',
                },
            ]);

        if (error) {
            setError('Error creating reservation: ' + error.message);
        } else {
            // Handle successful reservation creation (e.g., notify user, close modal)
            onClose();
        }
        setLoading(false);
    };

    return (
        <div className="modal">
            <form onSubmit={handleSubmit} className="reservation-form">
                <h2>Create/Edit Reservation</h2>
                {error && <p className="error">{error}</p>}
                <label>
                    Customer Name:
                    <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                    />
                </label>
                <label>
                    Email:
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </label>
                <label>
                    Phone:
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                    />
                </label>
                <label>
                    Date:
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                    />
                </label>
                <label>
                    Time:
                    <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        required
                    />
                </label>
                <label>
                    Guests:
                    <input
                        type="number"
                        value={guests}
                        onChange={(e) => setGuests(e.target.value)}
                        min="1"
                        required
                    />
                </label>
                <label>
                    Special Requests:
                    <textarea
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                    />
                </label>
                <button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Reservation'}
                </button>
                <button type="button" onClick={onClose}>
                    Cancel
                </button>
            </form>
        </div>
    );
};

export default ManualReservationForm;