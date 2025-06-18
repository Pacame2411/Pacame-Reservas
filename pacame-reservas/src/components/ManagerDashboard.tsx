import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { dashboardService } from '../services/dashboardService';
import ReservationDashboard from './ReservationDashboard';
import ManualReservationForm from './ManualReservationForm';
import ConfigurationPanel from './ConfigurationPanel';
import EmailNotificationPanel from './EmailNotificationPanel';
import EmailMarketingDashboard from './EmailMarketingDashboard';
import BusinessDashboard from './BusinessDashboard';

const ManagerDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await dashboardService.getDashboardStats(user.restaurant_id);
                setStats(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user.restaurant_id]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="manager-dashboard">
            <h1>Manager Dashboard</h1>
            <div className="stats">
                <h2>Statistics</h2>
                <p>Total Reservations: {stats.totalReservations}</p>
                <p>Confirmed: {stats.confirmed}</p>
                <p>Pending: {stats.pending}</p>
                <p>Cancelled: {stats.cancelled}</p>
                <p>Total Guests: {stats.totalGuests}</p>
            </div>
            <ReservationDashboard />
            <ManualReservationForm />
            <ConfigurationPanel />
            <EmailNotificationPanel />
            <EmailMarketingDashboard />
            <BusinessDashboard />
        </div>
    );
};

export default ManagerDashboard;