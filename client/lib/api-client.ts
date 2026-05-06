import axios, {
  AxiosError,
  AxiosHeaders,
  InternalAxiosRequestConfig,
} from "axios";

const URI = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

type RetryAxiosRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export type AuthUser = {
  id: number;
  user_id: string;
  admin_name: string;
  user_name: string;
  sanchalak_name: string;
  user_email: string;
  admin_email: string;
  sanchalak_email: string;
  user_mobile: string;
  admin_mobile: string;
  sanchalak_mobile: string;
  profile_photo: string | null;
  status: string;
};

export type RefreshTokenResponse = {
  success: boolean;
  message: string;
  user_type: "admin" | "sanchalaka";
  access_token: string;
  expires_in: number;
  data: AuthUser;
};

export type AccessTokenHandlers = {
  getAccessToken: () => string | null;
  setAccessToken: (token: string | null) => void;
  clearAuth: () => void;
};

let accessTokenHandlers: AccessTokenHandlers = {
  getAccessToken: () => null,
  setAccessToken: () => {},
  clearAuth: () => {},
};

export function configureAccessTokenHandlers(
  handlers: AccessTokenHandlers,
): void {
  accessTokenHandlers = handlers;
}

const apiClient = axios.create({
  baseURL: URI,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<RefreshTokenResponse>(
        `${URI}/api/v1/auth/refresh`,
        {},
        {
          withCredentials: true,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        },
      )
      .then((response) => {
        const token = response.data.access_token;

        if (!token) {
          accessTokenHandlers.clearAuth();
          return null;
        }

        accessTokenHandlers.setAccessToken(token);
        return token;
      })
      .catch(() => {
        accessTokenHandlers.clearAuth();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

apiClient.interceptors.request.use((config) => {
  const token = accessTokenHandlers.getAccessToken();

  config.headers = AxiosHeaders.from(config.headers);

  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryAxiosRequestConfig | undefined;
    const requestUrl = String(originalRequest?.url ?? "");

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !requestUrl.includes("/api/v1/auth/refresh") &&
      !requestUrl.includes("/api/v1/admin/login") &&
      !requestUrl.includes("/api/v1/sanchalaka/login")
    ) {
      originalRequest._retry = true;

      const newToken = await refreshAccessToken();

      if (newToken) {
        originalRequest.headers = AxiosHeaders.from(originalRequest.headers);
        originalRequest.headers.set("Authorization", `Bearer ${newToken}`);

        return apiClient(originalRequest);
      }

      accessTokenHandlers.clearAuth();
    }

    return Promise.reject(error);
  },
);

export { apiClient, refreshAccessToken };
