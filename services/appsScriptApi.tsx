import { API_BASE_URL } from "./apiConfig";

type ApiOk<T> = { ok: true; data?: T; action?: string; time?: string };
type ApiErr = { ok: false; error: string };
type ApiResp<T> = ApiOk<T> | ApiErr;

// ====== Helper: GET ======
async function apiGet<T>(params: Record<string, string>): Promise<ApiResp<T>> {
  const url = new URL(API_BASE_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), { method: "GET" });
  const json = (await res.json()) as ApiResp<T>;
  return json;
}

// ====== Helper: POST ======
async function apiPost<T>(body: Record<string, any>): Promise<ApiResp<T>> {
  const res = await fetch(API_BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as ApiResp<T>;
  return json;
}

// ====== API FUNCTIONS ======
export async function apiPing() {
  return apiGet<{ action: string; time: string }>({ action: "ping" });
}

export async function apiListGhiNhan(email?: string) {
  const params: Record<string, string> = { action: "listGhiNhan" };
  if (email) params.email = email;
  return apiGet<any[]>(params);
}

export async function apiGetTongHop() {
  return apiGet<any[]>({ action: "getTongHop" });
}

export async function apiXacNhan(id_ghi_nhan: string) {
  return apiPost<{ ok: true }>({ action: "xacNhan", id_ghi_nhan });
}

export async function apiPhanHoi(id_ghi_nhan: string, noi_dung_phan_hoi: string) {
  return apiPost<{ ok: true }>({ action: "phanHoi", id_ghi_nhan, noi_dung_phan_hoi });
}
