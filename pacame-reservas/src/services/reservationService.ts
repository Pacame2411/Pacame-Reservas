import { supabase } from '../utils/supabase';
import { Reservation } from '../types';

export const createReservation = async (reservation: Reservation) => {
    const { data, error } = await supabase
        .from('reservations')
        .insert([reservation]);

    if (error) throw new Error(error.message);
    return data;
};

export const updateReservation = async (id: string, updates: Partial<Reservation>) => {
    const { data, error } = await supabase
        .from('reservations')
        .update(updates)
        .eq('id', id);

    if (error) throw new Error(error.message);
    return data;
};

export const deleteReservation = async (id: string) => {
    const { data, error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
    return data;
};

export const getReservationsByRestaurant = async (restaurantId: string) => {
    const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('restaurant_id', restaurantId);

    if (error) throw new Error(error.message);
    return data;
};