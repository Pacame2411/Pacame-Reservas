import { supabase } from '../utils/supabase';

export const sendEmail = async (to: string, subject: string, body: string) => {
    const { data, error } = await supabase
        .from('email_logs')
        .insert([
            { to, subject, body, sent_at: new Date() }
        ]);

    if (error) {
        console.error('Error sending email:', error);
        return { success: false, error };
    }

    // Simulate email sending
    console.log(`Email sent to ${to} with subject: ${subject}`);
    return { success: true, data };
};

export const logEmailActivity = async (to: string, subject: string, status: string) => {
    const { error } = await supabase
        .from('email_logs')
        .insert([
            { to, subject, status, logged_at: new Date() }
        ]);

    if (error) {
        console.error('Error logging email activity:', error);
    }
};