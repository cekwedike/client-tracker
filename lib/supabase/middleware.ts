import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { checkDatabaseReadyInMiddleware } from "@/lib/supabase/schema";

function isConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
      key &&
      url !== "https://your-project.supabase.co" &&
      key !== "your-anon-key",
  );
}

async function hasAuthorizedProfile(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return false;
  return data.is_active !== false;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const pathname = request.nextUrl.pathname;
  const isPublicAsset =
    pathname === "/manifest.webmanifest" || pathname === "/sw.js";

  if (isPublicAsset) {
    return supabaseResponse;
  }

  const isSetupRoute = pathname.startsWith("/setup");

  if (!isConfigured()) {
    if (!isSetupRoute) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/setup";
      return NextResponse.redirect(redirectUrl);
    }
    return supabaseResponse;
  }

  if (pathname === "/setup") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname.startsWith("/signup")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("error", "invite_only");
    return NextResponse.redirect(redirectUrl);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth/callback");

  if (!user && !isAuthRoute && pathname !== "/" && !pathname.startsWith("/setup") && pathname !== "/offline") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  const isDashboardRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/clients") ||
    pathname.startsWith("/templates") ||
    pathname.startsWith("/tasks") ||
    pathname.startsWith("/team") ||
    pathname.startsWith("/settings");

  if (user && isDashboardRoute) {
    const authorized = await hasAuthorizedProfile(supabase, user.id);
    if (!authorized) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("error", "invite_only");
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (user && (pathname === "/" || pathname.startsWith("/login"))) {
    const authorized = await hasAuthorizedProfile(supabase, user.id);
    if (!authorized) {
      return supabaseResponse;
    }

    const dbReady = await checkDatabaseReadyInMiddleware(
      url,
      key,
      () => request.cookies.getAll(),
      (name, value, options) =>
        supabaseResponse.cookies.set(name, value, options),
    );
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = dbReady ? "/dashboard" : "/setup/database";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
