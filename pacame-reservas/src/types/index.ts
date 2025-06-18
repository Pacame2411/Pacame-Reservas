// src/types/index.ts

export interface Restaurant {
    id: string;
    name: string;
    address: string;
    phone: string;
    email: string;
    owner_user_id: string;
    shortcode_slug: string;
    created_at: string;
    updated_at: string;
}

export interface Reservation {
    id: string;
    restaurant_id: string;
    customer_name: string;
    email: string;
    phone: string;
    date: string;
    time: string;
    guests: number;
    status: 'confirmed' | 'pending' | 'cancelled' | 'occupied' | 'blocked';
    special_requests?: string;
    table_type_preference?: string;
    duration_minutes?: number;
    assigned_table_id?: string;
    created_by: 'customer' | 'manager';
    created_at: string;
    updated_at: string;
}

export interface Table {
    id: string;
    restaurant_id: string;
    table_number: string;
    capacity: number;
    x_pos: number;
    y_pos: number;
    width: number;
    height: number;
    shape: 'square' | 'circle' | 'rectangle';
    zone_id: string;
    type: 'standard' | 'window' | 'private' | 'smoking' | 'non-smoking' | 'bar';
    features?: string[];
    created_at: string;
    updated_at: string;
}

export interface Zone {
    id: string;
    restaurant_id: string;
    name: string;
    color: string;
    created_at: string;
    updated_at: string;
}

export interface RestaurantConfig {
    id: string;
    restaurant_id: string;
    max_total_capacity: number;
    max_guests_per_reservation: number;
    max_capacity_per_slot: number;
    time_slot_duration_minutes: number;
    average_table_duration_minutes: number;
    advance_booking_days: number;
    operating_hours: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface ReservationRule {
    id: string;
    restaurant_id: string;
    min_advance_time: number;
    max_advance_time: number;
    cancellation_policy_free_until: number;
    cancellation_policy_late_fee: number;
    require_deposit: boolean;
    deposit_amount: number;
    deposit_required_for_groups: boolean;
    special_dates_enabled: boolean;
    special_dates_extra_deposit: number;
    special_dates_list: string[];
    vip_minimum_spend: number;
    window_table_surcharge: number;
    created_at: string;
    updated_at: string;
}

export interface AnalyticsConfig {
    id: string;
    restaurant_id: string;
    enable_tracking: boolean;
    report_frequency: string;
    metrics_to_track: string[];
    alert_thresholds: Record<string, any>;
    export_formats: string[];
    auto_reports_daily: boolean;
    auto_reports_weekly: boolean;
    auto_reports_monthly: boolean;
    created_at: string;
    updated_at: string;
}

// Additional types for email campaigns, segments, marketing consents, etc. can be added here as needed.