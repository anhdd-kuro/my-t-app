import { NextRequest, NextResponse } from "next/server";

const TRPC_BACKEND_URL = process.env.NEXT_PUBLIC_SERVER_URL;

if (!TRPC_BACKEND_URL) {
  // Log this error on the server, but don't expose the variable name to the client
  console.error(
    "FATAL: Missing NEXT_PUBLIC_SERVER_URL environment variable for tRPC proxy."
  );
  // Return a generic error response if the variable is not set during runtime
  // This check is more of a safeguard; ideally, the build/deploy process ensures env vars.
}

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ trpc: string }> }
) {
  const resolvedParams = await params;
  console.log(`🚀 \n - resolvedParams:`, resolvedParams);

  if (!TRPC_BACKEND_URL) {
    // This case should ideally not be hit if the server starts correctly with env vars
    return NextResponse.json(
      { error: "Internal server configuration error." },
      { status: 500 }
    );
  }

  // Construct the target URL for the tRPC backend
  // req.nextUrl.pathname is something like /api/trpc/procedure.name
  // params.trpc would be "procedure.name"
  // We want to forward to TRPC_BACKEND_URL/trpc/procedure.name
  const trpcPath = `/${resolvedParams.trpc}`;
  const targetUrl = `${TRPC_BACKEND_URL}/trpc${trpcPath}${req.nextUrl.search}`;

  // Prepare headers for forwarding.
  // Create a new Headers object to avoid modifying the original request's headers.
  const forwardedHeaders = new Headers();
  req.headers.forEach((value, key) => {
    // Don't forward the 'host' header, as 'fetch' will set the correct one for the target.
    // You might want to filter out other hop-by-hop headers if necessary.
    if (key.toLowerCase() !== "host") {
      forwardedHeaders.append(key, value);
    }
  });

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: forwardedHeaders,
      body: req.body, // Stream the body
      // @ts-expect-error: duplex is a Node.js-specific extension to fetch
      duplex: "half", // Required for streaming request bodies with Node.js fetch
    });

    // Stream the backend's response back to the client
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers, // Forward backend response headers
    });
  } catch (error) {
    console.error(
      `[TRPC PROXY ERROR] Failed to proxy request to ${targetUrl}:`,
      error
    );
    return NextResponse.json(
      { message: "Error proxying tRPC request." },
      { status: 502 } // Bad Gateway, standard for proxy errors
    );
  }
}

// Export handlers for all common HTTP methods tRPC might use
export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
};
