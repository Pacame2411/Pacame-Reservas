import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { EmailCampaign, EmailSegment, EmailTemplate } from '../types';

const EmailNotificationPanel: React.FC = () => {
    const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
    const [segments, setSegments] = useState<EmailSegment[]>([]);
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEmailData = async () => {
            try {
                setLoading(true);
                const { data: campaignsData, error: campaignsError } = await supabase
                    .from('email_campaigns')
                    .select('*');

                if (campaignsError) throw campaignsError;

                const { data: segmentsData, error: segmentsError } = await supabase
                    .from('email_segments')
                    .select('*');

                if (segmentsError) throw segmentsError;

                const { data: templatesData, error: templatesError } = await supabase
                    .from('email_templates')
                    .select('*');

                if (templatesError) throw templatesError;

                setCampaigns(campaignsData);
                setSegments(segmentsData);
                setTemplates(templatesData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchEmailData();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h2>Email Notifications</h2>
            <h3>Campaigns</h3>
            <ul>
                {campaigns.map(campaign => (
                    <li key={campaign.id}>{campaign.name}</li>
                ))}
            </ul>
            <h3>Segments</h3>
            <ul>
                {segments.map(segment => (
                    <li key={segment.id}>{segment.name}</li>
                ))}
            </ul>
            <h3>Templates</h3>
            <ul>
                {templates.map(template => (
                    <li key={template.id}>{template.name}</li>
                ))}
            </ul>
        </div>
    );
};

export default EmailNotificationPanel;