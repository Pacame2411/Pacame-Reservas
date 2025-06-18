import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { RestaurantConfig } from '../types';

const ConfigurationPanel: React.FC<{ restaurantId: string }> = ({ restaurantId }) => {
    const [config, setConfig] = useState<RestaurantConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const { data, error } = await supabase
                    .from('restaurant_configs')
                    .select('*')
                    .eq('restaurant_id', restaurantId)
                    .single();

                if (error) throw error;

                setConfig(data);
            } catch (error) {
                setError('Error fetching configuration');
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, [restaurantId]);

    const handleUpdateConfig = async (updatedConfig: RestaurantConfig) => {
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase
                .from('restaurant_configs')
                .update(updatedConfig)
                .eq('restaurant_id', restaurantId);

            if (error) throw error;

            setConfig(updatedConfig);
        } catch (error) {
            setError('Error updating configuration');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div>
            <h2>Configuration Panel</h2>
            {/* Configuration form goes here */}
            <form onSubmit={(e) => {
                e.preventDefault();
                // Handle form submission to update config
                handleUpdateConfig(config!);
            }}>
                {/* Form fields for configuration */}
                <button type="submit">Update Configuration</button>
            </form>
        </div>
    );
};

export default ConfigurationPanel;