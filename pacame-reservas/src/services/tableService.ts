import { supabase } from '../utils/supabase';
import { Table } from '../types';

export const fetchTables = async (restaurantId: string): Promise<Table[]> => {
    const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', restaurantId);

    if (error) {
        throw new Error(error.message);
    }

    return data as Table[];
};

export const fetchTableById = async (tableId: string): Promise<Table | null> => {
    const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('id', tableId)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data as Table | null;
};

export const createTable = async (table: Omit<Table, 'id'>): Promise<Table> => {
    const { data, error } = await supabase
        .from('tables')
        .insert([table])
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data as Table;
};

export const updateTable = async (tableId: string, updates: Partial<Table>): Promise<Table> => {
    const { data, error } = await supabase
        .from('tables')
        .update(updates)
        .eq('id', tableId)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data as Table;
};

export const deleteTable = async (tableId: string): Promise<void> => {
    const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', tableId);

    if (error) {
        throw new Error(error.message);
    }
};