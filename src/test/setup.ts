import "@testing-library/jest-dom/vitest";
// In-memory IndexedDB so mistakeStore and the App integration tests run
// against a realistic implementation instead of the missing jsdom one.
import "fake-indexeddb/auto";
