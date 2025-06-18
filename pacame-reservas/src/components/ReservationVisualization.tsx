import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { Table } from '../types'; // Assuming you have a Table type defined in your types

const ReservationVisualization: React.FC<{ restaurantId: string }> = ({ restaurantId }) => {
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTables = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('tables')
                .select('*')
                .eq('restaurant_id', restaurantId);

            if (error) {
                setError(error.message);
            } else {
                setTables(data);
            }
            setLoading(false);
        };

        fetchTables();
    }, [restaurantId]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, tableId: string) => {
        const reservationId = e.dataTransfer.getData('text/plain');
        // Logic to assign reservation to the table
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="reservation-visualization">
            <h2>Restaurant Layout</h2>
            <div className="tables-grid">
                {tables.map((table) => (
                    <div
                        key={table.id}
                        className="table"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, table.id)}
                        style={{
                            position: 'absolute',
                            left: table.x_pos,
                            top: table.y_pos,
                            width: table.width,
                            height: table.height,
                        }}
                    >
                        <span>{table.table_number}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ReservationVisualization;