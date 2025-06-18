import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';

const BusinessDashboard = () => {
    const { user } = useAuth();
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalyticsData = async () => {
            if (!user) return;

            try {
                const { data, error } = await supabase
                    .from('analytics_configs')
                    .select('*')
                    .eq('restaurant_id', user.restaurant_id);

                if (error) throw error;

                setAnalyticsData(data);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalyticsData();
    }, [user]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold">Business Analytics</h1>
            {analyticsData ? (
                <div>
                    {/* Render analytics data here */}
                    <pre>{JSON.stringify(analyticsData, null, 2)}</pre>
                </div>
            ) : (
                <p>No analytics data available.</p>
            )}
        </div>
    );
};

export default BusinessDashboard;