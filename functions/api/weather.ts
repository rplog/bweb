interface Env {
    OPENWEATHER_API_KEY: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env } = context;
    const url = new URL(request.url);
    const city = url.searchParams.get('city');

    if (!city) {
        return new Response('Missing city parameter', { status: 400 });
    }

    const apiKey = env.OPENWEATHER_API_KEY;

    // Fallback if no API key provided (Simulation for demo/dev without key)
    if (!apiKey) {
        // Return a simulated response so the UI doesn't break
        const simulatedData = {
            name: city,
            sys: { country: 'SIM' },
            main: { temp: 22, humidity: 45 },
            weather: [{ description: 'scattered clouds (Simulation - No API Key)', icon: '03d' }],
            wind: { speed: 5.2 }
        };
        return new Response(JSON.stringify(simulatedData), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`
        );

        if (!response.ok) {
            if (response.status === 404) {
                return new Response('City not found', { status: 404 });
            }
            return new Response(`OpenWeather API Error: ${response.statusText}`, { status: response.status });
        }

        const data = await response.json();
        return new Response(JSON.stringify(data), {
            headers: {
                'Content-Type': 'application/json',
                // Cache for 10 minutes
                'Cache-Control': 'public, max-age=600'
            }
        });
    } catch (e: any) {
        return new Response(`Internal Error: ${e.message}`, { status: 500 });
    }
};
