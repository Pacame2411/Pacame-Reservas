import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { Reservation } from '../types';

const ReservationForm: React.FC = () => {
    const { restaurantId } = useParams<{ restaurantId: string }>();
    const [customerName, setCustomerName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [guests, setGuests] = useState(1);
    const [specialRequests, setSpecialRequests] = useState('');
    const [status, setStatus] = useState('pending');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
            .from<Reservation>('reservations')
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
                },
            ]);

        if (error) {
            setError(error.message);
        } else {
            // Reset form or show success message
            setCustomerName('');
            setEmail('');
            setPhone('');
            setDate('');
            setTime('');
            setGuests(1);
            setSpecialRequests('');
        }

        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="reservation-form">
            <h2>Make a Reservation</h2>
            {error && <p className="error">{error}</p>}
            <label>
                Name:
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
                    onChange={(e) => setGuests(Number(e.target.value))}
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
                {loading ? 'Submitting...' : 'Submit Reservation'}
            </button>
        </form>
    );
};

export default ReservationForm;