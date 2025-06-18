import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const session = supabase.auth.session();
        setUser(session?.user ?? null);
        setLoading(false);

        const { data: subscription } = supabase.auth.onAuthStateChange((_, session) => {
            setUser(session?.user ?? null);
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    const login = async (email, password) => {
        setLoading(true);
        const { user, error } = await supabase.auth.signIn({ email, password });
        setUser(user);
        setLoading(false);
        return { user, error };
    };

    const logout = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signOut();
        setUser(null);
        setLoading(false);
        return { error };
    };

    return { user, loading, login, logout };
};

export default useAuth;