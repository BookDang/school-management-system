import { MessageChannel as NodeMessageChannel } from 'node:worker_threads';
import '@testing-library/jest-dom';

// antd's Select (@rc-component/select) schedules its open/close state via MessageChannel - jsdom
// doesn't implement it, but node:worker_threads ships a real one that works fine here.
window.MessageChannel = NodeMessageChannel as unknown as typeof MessageChannel;

// antd's Grid/Form internals check window.matchMedia for responsive breakpoints - jsdom doesn't
// implement it.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// antd's Tooltip/Trigger positioning (@rc-component/resize-observer) needs ResizeObserver -
// jsdom doesn't implement it either.
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = MockResizeObserver;
