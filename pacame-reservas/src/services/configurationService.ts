import { supabase } from '../utils/supabase';

export const fetchRestaurantConfig = async (restaurantId: string) => {
    const { data, error } = await supabase
        .from('restaurant_configs')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

export const updateRestaurantConfig = async (restaurantId: string, config: any) => {
    const { data, error } = await supabase
        .from('restaurant_configs')
        .update(config)
        .eq('restaurant_id', restaurantId);

    if (error) {
        throw new Error(error.message);
    }

    return data;
};