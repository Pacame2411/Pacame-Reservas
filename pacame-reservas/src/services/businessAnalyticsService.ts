import { supabase } from '../utils/supabase';

export const getBusinessAnalytics = async (restaurantId: string) => {
    const { data, error } = await supabase
        .from('analytics_configs')
        .select('*')
        .eq('restaurant_id', restaurantId);

    if (error) {
        throw new Error(`Error fetching business analytics: ${error.message}`);
    }

    return data;
};

export const getCustomerInsights = async (restaurantId: string) => {
    const { data, error } = await supabase
        .from('reservations')
        .select('customer_name, email, phone, created_at')
        .eq('restaurant_id', restaurantId);

    if (error) {
        throw new Error(`Error fetching customer insights: ${error.message}`);
    }

    return data;
};

export const getReservationTrends = async (restaurantId: string) => {
    const { data, error } = await supabase
        .from('reservations')
        .select('date, count(*) as total')
        .eq('restaurant_id', restaurantId)
        .group('date')
        .order('date', { ascending: true });

    if (error) {
        throw new Error(`Error fetching reservation trends: ${error.message}`);
    }

    return data;
};