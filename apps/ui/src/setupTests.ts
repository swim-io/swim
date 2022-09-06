// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// setup translation early
import "./i18n";

// mock Solana websocket connection
jest.mock("rpc-websockets", () => ({
  Client: class MockRpcWebsocketClient {
    on(): null {
      return null;
    }
    connect(): null {
      return null;
    }
  },
}));

jest.mock("@swim-io/solana", () => ({
  ...jest.requireActual("@swim-io/solana"),
  SolanaConnection: jest.fn(),
}));
