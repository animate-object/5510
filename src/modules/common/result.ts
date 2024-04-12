// simple result monad

export type Result<T> = Success<T> | Failure;

export interface Success<T> {
    success: true;
    value: T;
}

export interface Failure {
    success: false;
    message?: string;
}

export function success<T>(value: T): Success<T> {
    return { success: true, value };
}

export function failure(message?: string): Failure {
    return { success: false, message };
}

export function isSuccess<T>(result: Result<T>): result is Success<T> {
    return result.success;
}

export function isFailure<T>(result: Result<T>): result is Failure {
    return !result.success;
}

export function map<T, U>(result: Result<T>, fn: (value: T) => U): Result<U> {
    if (isFailure(result)) {
        console.log("map failure", result.message);
    }
    return isSuccess(result) ? success(fn(result.value)) : result;
}

export function mapFailure<T, U>(result: Result<T>, fn: () => U): Result<T | U> {
    return isFailure(result) ? success(fn()) : result;
}

export function withFallback<T>(result: Result<T>, fallback: T): Result<T> {
    return mapFailure<T, T>(result, () => fallback);
}
