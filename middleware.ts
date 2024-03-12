export function middleware(request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401,
    });
  } else if (request.query.secret !== process.env.RATE_SECRET) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }
}

export const config = {
  matcher: "/(/api/(?!graphql|screen).*)",
};
