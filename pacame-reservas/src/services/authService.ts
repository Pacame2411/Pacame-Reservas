import { supabase } from '../utils/supabase';

export const login = async (email: string, password: string) => {
    const { user, error } = await supabase.auth.signIn({
        email,
        password,
    });
    return { user, error };
};

export const logout = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
};

export const getUser = () => {
    return supabase.auth.user();
};

export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
};