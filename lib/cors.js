export const setCorsHeaders = (req, res) => {
    const allowedOrigins = [
        'https://app.dev.opendollar.com',
        'https://app.opendollar.com',
        'https://hai.opendollar.com',
        'https://hai.dev.opendollar.com',
        'https://app.dev-staging.opendollar.com',
        'https://app.pentest.opendollar.com',
        'https://app.staging.opendollar.com',
        "https://*.vercel.app",
    ];
    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    if (process.env.NODE_ENV === 'development' && origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'sentry-trace, Baggage, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
};