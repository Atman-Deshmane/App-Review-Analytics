export interface TriggerConfig {
    appId: string;
    count: number;
    email: string;
    themes: string;
    jobId: string;
    startDate?: string;
    endDate?: string;
}

export const triggerAnalysis = async (config: TriggerConfig) => {
    const owner = import.meta.env.VITE_GITHUB_OWNER;
    const repo = import.meta.env.VITE_GITHUB_REPO;
    const token = import.meta.env.VITE_GITHUB_TOKEN;

    console.log("Config check:", {
        owner,
        repo,
        hasToken: !!token
    });

    if (!owner || !repo || !token) {
        throw new Error("Missing GitHub Configuration (Owner, Repo, or Token)");
    }

    const url = `https://api.github.com/repos/${owner}/${repo}/dispatches`;

    const payload = {
        event_type: 'start-analysis',
        client_payload: {
            app_id: config.appId,
            count: config.count,
            email: config.email,
            themes: config.themes,
            job_id: config.jobId, // Send as snake_case for Python/GitHub
            start_date: config.startDate,
            end_date: config.endDate
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GitHub API Failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return true;
};
