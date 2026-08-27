/** Helpers to give the fake objects the same own properties as the originals they replace.
 *
 * A page can inspect the built-ins it is handed -- `Object.getOwnPropertyNames()`, `Object.keys()`,
 * spreading, `Object.prototype.toString()` -- and any difference gives the extension away or breaks
 * a library that iterates them (see https://github.com/cpulvermacher/time-travel/issues/41 ).
 * Built-in members are never enumerable, while both plain assignment and object literals produce
 * enumerable properties, so neither can be used directly.
 */

/** copy all own properties from source to target, except 'constructor'
 *
 * This includes both own properties and symbols, enumerable or not. Attributes are preserved, so a
 * member that is hidden from `Object.keys()` on the original stays hidden on the copy.
 */
export function copyOwnProperties<T extends object>(source: T, target: T): void {
    Reflect.ownKeys(source)
        .filter((key) => key !== 'constructor')
        .forEach((key) => {
            const descriptor = Object.getOwnPropertyDescriptor(source, key);
            if (descriptor) {
                Object.defineProperty(target, key, descriptor);
            }
        });
}

/** build a namespace object shaped like `Temporal` and `Temporal.Now`
 *
 * The members are taken from `members`, but made non-enumerable, and the read-only
 * `Symbol.toStringTag` the originals carry is added.
 */
export function asNamespace<T extends object>(tag: string, members: T): T {
    const namespace = {} as T;
    Object.entries(members).forEach(([name, value]) => {
        // the defaults for the omitted attributes match the original (not enumerable)
        Object.defineProperty(namespace, name, { value, writable: true, configurable: true });
    });
    Object.defineProperty(namespace, Symbol.toStringTag, { value: tag, configurable: true });
    return namespace;
}
