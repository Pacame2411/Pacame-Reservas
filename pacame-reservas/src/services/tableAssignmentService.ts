import { supabase } from '../utils/supabase';
import { Reservation } from '../types';

export const assignTableToReservation = async (reservationId: string, tableId: string) => {
    const { data, error } = await supabase
        .from<Reservation>('reservations')
        .update({ assigned_table_id: tableId })
        .eq('id', reservationId);

    if (error) {
        throw new Error(`Error assigning table: ${error.message}`);
    }

    return data;
};

export const unassignTableFromReservation = async (reservationId: string) => {
    const { data, error } = await supabase
        .from<Reservation>('reservations')
        .update({ assigned_table_id: null })
        .eq('id', reservationId);

    if (error) {
        throw new Error(`Error unassigning table: ${error.message}`);
    }

    return data;
};