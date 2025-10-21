export {};

declare global {
  interface Window {
    __env?: {
      NG_APP_API_URL?: string;
      NG_APP_HUB_URL?: string;
      NG_APP_IOT_API_URL?: string;
      NG_APP_IOT_HUB_URL?: string;
      NG_APP_LOGIN_REDIRECT_URL?: string;
      NG_APP_LOGOUT_REDIRECT_URL?: string;
    };
  }
}
