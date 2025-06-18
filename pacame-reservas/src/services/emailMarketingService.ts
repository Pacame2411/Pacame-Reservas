import { supabase } from '../utils/supabase';

export const createEmailCampaign = async (campaignData) => {
    const { data, error } = await supabase
        .from('email_campaigns')
        .insert([campaignData]);

    if (error) {
        throw new Error(error.message);
    }
    return data;
};

export const getEmailCampaigns = async (restaurantId) => {
    const { data, error } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('restaurant_id', restaurantId);

    if (error) {
        throw new Error(error.message);
    }
    return data;
};

export const updateEmailCampaign = async (campaignId, updatedData) => {
    const { data, error } = await supabase
        .from('email_campaigns')
        .update(updatedData)
        .eq('id', campaignId);

    if (error) {
        throw new Error(error.message);
    }
    return data;
};

export const deleteEmailCampaign = async (campaignId) => {
    const { data, error } = await supabase
        .from('email_campaigns')
        .delete()
        .eq('id', campaignId);

    if (error) {
        throw new Error(error.message);
    }
    return data;
};

export const getEmailSegments = async (restaurantId) => {
    const { data, error } = await supabase
        .from('email_segments')
        .select('*')
        .eq('restaurant_id', restaurantId);

    if (error) {
        throw new Error(error.message);
    }
    return data;
};

export const createEmailSegment = async (segmentData) => {
    const { data, error } = await supabase
        .from('email_segments')
        .insert([segmentData]);

    if (error) {
        throw new Error(error.message);
    }
    return data;
};

export const updateEmailSegment = async (segmentId, updatedData) => {
    const { data, error } = await supabase
        .from('email_segments')
        .update(updatedData)
        .eq('id', segmentId);

    if (error) {
        throw new Error(error.message);
    }
    return data;
};

export const deleteEmailSegment = async (segmentId) => {
    const { data, error } = await supabase
        .from('email_segments')
        .delete()
        .eq('id', segmentId);

    if (error) {
        throw new Error(error.message);
    }
    return data;
};