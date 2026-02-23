interface SessionRewindSDK {
    startSession: () => void;
    stopSession: () => void;
    identifyUser: (params: { userId: string;[key: string]: string | undefined }) => void;
    getUserInfo: (callback: (userInfo: any) => void) => void;
    setSessionInfo: (params: { [key: string]: string | undefined }) => void;
    getSessionInfo: (callback: (sessionInfo: any) => void) => void;
    getSessionUrl: (callback: (url: string) => void, options?: { withTimestamp?: boolean; offset?: number }) => void;
    logEvent: (type: string, data?: { [key: string]: string }) => void;
    logError: (error: Error, data?: { [key: string]: string }) => void;
}

declare global {
    interface Window {
        sessionRewind?: SessionRewindSDK;
    }
}

export { };
