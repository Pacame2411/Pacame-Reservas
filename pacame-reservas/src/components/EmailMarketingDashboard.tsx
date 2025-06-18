import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { EmailCampaign, EmailSegment, EmailTemplate } from '../types';

const EmailMarketingDashboard: React.FC = () => {
    const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
    const [segments, setSegments] = useState<EmailSegment[]>([]);
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
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

        fetchData();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Email Marketing Dashboard</h1>
            <section>
                <h2 className="text-xl font-semibold">Campaigns</h2>
                <ul>
                    {campaigns.map(campaign => (
                        <li key={campaign.id} className="border-b py-2">
                            <h3 className="font-medium">{campaign.name}</h3>
                            <p>Status: {campaign.status}</p>
                        </li>
                    ))}
                </ul>
            </section>
            <section className="mt-4">
                <h2 className="text-xl font-semibold">Segments</h2>
                <ul>
                    {segments.map(segment => (
                        <li key={segment.id} className="border-b py-2">
                            <h3 className="font-medium">{segment.name}</h3>
                            <p>Criteria: {segment.criteria}</p>
                        </li>
                    ))}
                </ul>
            </section>
            <section className="mt-4">
                <h2 className="text-xl font-semibold">Templates</h2>
                <ul>
                    {templates.map(template => (
                        <li key={template.id} className="border-b py-2">
                            <h3 className="font-medium">{template.name}</h3>
                            <p>Description: {template.description}</p>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
};

export default EmailMarketingDashboard;