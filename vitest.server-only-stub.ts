// `server-only`'s default export condition throws unconditionally on import
// (see node_modules/server-only/index.js); Next's webpack build only avoids
// that by resolving the package's `react-server` condition to a no-op
// (empty.js) when bundling for the server. Vitest has no such bundler
// condition, so vitest.config.mts aliases "server-only" to this empty
// module instead: importing it here is a no-op, exactly like a real server
// build, while a browser bundle still gets the throwing package.
export {};
