import { supabase } from '../utils/supabase';

export const getDashboardStats = async (restaurantId: string) => {
    const { data, error } = await supabase
        .from('reservations')
        .select('status, count(*) as count')
        .eq('restaurant_id', restaurantId)
        .group('status');

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

export const getReservationCount = async (restaurantId: string) => {
    const { count, error } = await supabase
        .from('reservations')
        .select('*', { count: 'exact' })
        .eq('restaurant_id', restaurantId);

    if (error) {
        throw new Error(error.message);
    }

    return count;
};

export const getTotalGuests = async (restaurantId: string) => {
    const { data, error } = await supabase
        .from('reservations')
        .select('guests')
        .eq('restaurant_id', restaurantId);

    if (error) {
        throw new Error(error.message);
    }

    return data.reduce((total, reservation) => total + reservation.guests, 0);
};