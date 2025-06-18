import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import ReservationForm from './ReservationForm';

const CustomerView = () => {
    const [restaurant, setRestaurant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRestaurant = async () => {
            const { data, error } = await supabase
                .from('restaurants')
                .select('*')
                .eq('shortcode_slug', window.location.pathname.split('/').pop())
                .single();

            if (error) {
                setError(error.message);
            } else {
                setRestaurant(data);
            }
            setLoading(false);
        };

        fetchRestaurant();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!restaurant) {
        return <div>Restaurant not found.</div>;
    }

    return (
        <div className="customer-view">
            <h1 className="text-2xl font-bold">{restaurant.name}</h1>
            <p>{restaurant.address}</p>
            <p>{restaurant.phone}</p>
            <p>{restaurant.email}</p>
            <ReservationForm restaurantId={restaurant.id} />
        </div>
    );
};

export default CustomerView;