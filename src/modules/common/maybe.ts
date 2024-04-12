
type Maybe<T> = T | undefined;

function of<T>(value: T): Maybe<T> {
    return value;
}

function fromNullable<T>(value: T | null | undefined): Maybe<T> {
    return value === null || value === undefined ? undefined : value;
}

function nothing<T>(): Maybe<T> {
    return undefined;
}

function isNothing<T>(value: Maybe<T>): value is undefined {
    return value === undefined;
}

function isJust<T>(value: Maybe<T>): value is T {
    return value !== undefined;
}

function map<T, U>(value: Maybe<T>, fn: (value: T) => U): Maybe<U> {
    return value === undefined ? undefined : fn(value);
}

export type {
    Maybe,
}

export {
    of,
    fromNullable,
    nothing,
    isNothing,
    isJust,
    map,
}