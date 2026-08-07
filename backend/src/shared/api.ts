export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  data: null;
  error: string;
}

export function success<T>(data: T): ApiSuccess<T> {
  return { success: true, data };
}

export function failure(error: string): ApiFailure {
  return { success: false, data: null, error };
}
