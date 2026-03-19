import React from "react";

const detectInAppBrowser = () => {
  if (typeof navigator === "undefined") {
    return "";
  }

  const ua = navigator.userAgent || "";
  const knownInAppBrowsers = [
    { pattern: /LinkedInApp/i, name: "LinkedIn" },
    { pattern: /Instagram/i, name: "Instagram" },
    { pattern: /FBAN|FBAV|FB_IAB/i, name: "Facebook" },
    { pattern: /Line\//i, name: "LINE" },
    { pattern: /MicroMessenger/i, name: "WeChat" },
    { pattern: /Snapchat/i, name: "Snapchat" },
    { pattern: /TikTok/i, name: "TikTok" },
    { pattern: /Pinterest/i, name: "Pinterest" },
    { pattern: /Twitter/i, name: "X" }
  ];

  const knownMatch = knownInAppBrowsers.find(({ pattern }) => pattern.test(ua));
  if (knownMatch) {
    return knownMatch.name;
  }

  // Generic WebView fallback for in-app browsers not covered above.
  const webViewHint =
    /; wv\)|\bwv\b|WebView/i.test(ua) ||
    (/iPhone|iPad|iPod/i.test(ua) &&
      /AppleWebKit/i.test(ua) &&
      !/Safari|CriOS|FxiOS|EdgiOS/i.test(ua));

  return webViewHint ? "this app browser" : "";
};

const LoginPage = () => {
  const inAppBrowserName = React.useMemo(() => detectInAppBrowser(), []);
  const isInAppBrowser = Boolean(inAppBrowserName);
  const [copied, setCopied] = React.useState(false);

  const handleGoogleLogin = () => {
    if (isInAppBrowser) {
      return;
    }
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
    window.location.href = `${baseUrl}/auth/google`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      setCopied(false);
    }
  };

  return (
    <main className="max-w-lg mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Welcome to Ping</h1>
        <p className="text-sm text-slate-500 mt-2">
          Sign in to browse live events.
        </p>
        {isInAppBrowser ? (
          <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-medium">Google Sign-In is blocked in {inAppBrowserName}.</p>
            <p className="mt-1">
              Open this page in Safari or Chrome, then sign in again.
            </p>
            <button
              type="button"
              onClick={handleCopyLink}
              className="mt-3 inline-flex items-center rounded-md bg-amber-100 px-3 py-1.5 text-xs font-medium hover:bg-amber-200"
            >
              {copied ? "Link copied" : "Copy this page link"}
            </button>
          </div>
        ) : null}
        <div className="mt-6">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isInAppBrowser}
            className={`w-full rounded-lg py-2 font-medium ${
              isInAppBrowser
                ? "cursor-not-allowed bg-slate-300 text-slate-600"
                : "bg-indigo-600 text-white"
            }`}
          >
            Continue with Google
          </button>
        </div>
        <div className="mt-6 text-xs text-slate-500">
          If Google login is not configured, ask for client credentials.
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
