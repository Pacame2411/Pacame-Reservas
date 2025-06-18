import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { Reservation } from '../types';
import ReservationItem from './ReservationItem';

const ReservationDashboard: React.FC = () => {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchReservations = async () => {
            const { data, error } = await supabase
                .from('reservations')
                .select('*')
                .eq('restaurant_id', supabase.auth.user()?.id);

            if (error) {
                setError(error.message);
            } else {
                setReservations(data);
            }
            setLoading(false);
        };

        fetchReservations();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Reservas</h1>
            <ul>
                {reservations.map((reservation) => (
                    <ReservationItem key={reservation.id} reservation={reservation} />
                ))}
            </ul>
        </div>
    );
};

export default ReservationDashboard;