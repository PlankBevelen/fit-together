import { setToken, clearToken, saveProfile } from './UserState';

export const BASE_URL = 'http://127.0.0.1:9000'; // Update this to your actual backend URL in production

export interface RequestOptions extends Omit<WechatMiniprogram.RequestOption, 'url'> {
  url: string;
  skipAuth?: boolean;
  _retry?: boolean;
}

let isRefreshing = false;
let requestsQueue: Array<{ resolve: any; reject: any; options: RequestOptions }> = [];

export function doSilentLogin(): Promise<string> {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (res.code) {
          wx.request({
            url: `${BASE_URL}/auth/code2session`,
            method: 'POST',
            data: { code: res.code },
            success: (authRes: any) => {
              if (authRes.statusCode >= 200 && authRes.statusCode < 300 && authRes.data.status === 'success') {
                const newToken = authRes.data.token;
                setToken(newToken);
                if (authRes.data.data?.user) {
                  saveProfile(authRes.data.data.user, true);
                }
                resolve(newToken);
              } else {
                reject(new Error('Silent login API failed'));
              }
            },
            fail: (err) => reject(err),
          });
        } else {
          reject(new Error('Failed to get login code'));
        }
      },
      fail: (err) => reject(err),
    });
  });
}

function executeRequest<T = any>(options: RequestOptions, resolve: (val: any) => void, reject: (err: any) => void) {
  const token = wx.getStorageSync('ft_token');
  const header = { ...options.header } as Record<string, string>;
  
  if (token) {
    header['Authorization'] = `Bearer ${token}`;
  }

  wx.request({
    ...options,
    url: options.url.startsWith('http') ? options.url : `${BASE_URL}${options.url}`,
    header,
    success: (res) => {
      if (res.statusCode === 401 && !options._retry) {
        options._retry = true;
        if (!isRefreshing) {
          isRefreshing = true;
          requestsQueue.push({ resolve, reject, options });

          doSilentLogin()
            .then(() => {
              requestsQueue.forEach((req) => executeRequest(req.options, req.resolve, req.reject));
              requestsQueue = [];
            })
            .catch(() => {
              clearToken();
              requestsQueue.forEach((req) => req.reject(new Error('登录已过期，请重新登录')));
              requestsQueue = [];
              wx.navigateTo({ url: '/pages/login/login' });
            })
            .finally(() => {
              isRefreshing = false;
            });
        } else {
          requestsQueue.push({ resolve, reject, options });
        }
      } else if (res.statusCode === 401 && options._retry) {
        clearToken();
        reject(new Error('登录已过期，请重新登录'));
        wx.navigateTo({ url: '/pages/login/login' });
      } else if (res.statusCode >= 200 && res.statusCode < 300) {
        resolve(res.data as T);
      } else {
        reject(res.data);
      }
    },
    fail: (err) => {
      reject(err);
    },
  });
}

export function request<T = any>(options: RequestOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('ft_token');

    if (options.skipAuth || token) {
      executeRequest(options, resolve, reject);
      return;
    }

    if (!isRefreshing) {
      isRefreshing = true;
      requestsQueue.push({ resolve, reject, options });
      
      doSilentLogin()
        .then(() => {
          requestsQueue.forEach((req) => executeRequest(req.options, req.resolve, req.reject));
          requestsQueue = [];
        })
        .catch(() => {
          requestsQueue.forEach((req) => req.reject(new Error('未登录')));
          requestsQueue = [];
          wx.navigateTo({ url: '/pages/login/login' });
        })
        .finally(() => {
          isRefreshing = false;
        });
    } else {
      requestsQueue.push({ resolve, reject, options });
    }
  });
}

