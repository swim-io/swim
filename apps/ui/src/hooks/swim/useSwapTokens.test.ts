import { renderHookWithAppContext } from "../../testUtils";

import { useSwapTokens } from "./useSwapTokens";

describe("useSwapTokens", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe("should have valid defaults with no url parameters (/swap)", () => {
    it("test", async () => {
      jest.mock("react-router-dom", () => ({
        ...jest.requireActual("react-router-dom"),
        useNavigate: () => jest.fn(),
      }));
      const { result } = renderHookWithAppContext(() => useSwapTokens());

      expect(result.current.fromToken.id).toEqual("mainnet-solana-usdc");
      expect(result.current.toToken.id).toEqual("mainnet-solana-usdt");
      expect(result.current.hasUrlError).toEqual(false);
    });
  });

  describe("should correct find tokenSpecs given valid parameters", () => {
    jest.mock("react-router-dom", () => ({
      ...jest.requireActual("react-router-dom"),
      useNavigate: () => jest.fn(),
      useParams: () => ({
        fromEcosystem: "avalanche-usdc",
        toEcosystem: "aurora-usdt",
      }),
    }));
    it("test", async () => {
      const { result } = renderHookWithAppContext(() => useSwapTokens());
      expect(result.current.fromToken.id).toEqual("mainnet-avalanche-usdc");
      expect(result.current.toToken.id).toEqual("mainnet-aurora-usdt");
      expect(result.current.hasUrlError).toEqual(false);
    });
  });

  describe("should use default parameters with invalid parameters", () => {
    jest.mock("react-router-dom", () => ({
      ...jest.requireActual("react-router-dom"),
      useNavigate: () => jest.fn(),
      useParams: () => ({
        fromEcosystem: "andrew",
        toEcosystem: "huang",
      }),
    }));
    it("test", async () => {
      const { result } = renderHookWithAppContext(() => useSwapTokens());
      expect(result.current.fromToken.id).toEqual("mainnet-solana-usdc");
      expect(result.current.toToken.id).toEqual("mainnet-solana-usdt");
      expect(result.current.hasUrlError).toEqual(true);
    });
  });

  describe("should use default parameters with invalid fromEcosystem param", () => {
    jest.mock("react-router-dom", () => ({
      ...jest.requireActual("react-router-dom"),
      useNavigate: () => jest.fn(),
      useParams: () => ({
        fromEcosystem: "solana-andrewtoken",
        toEcosystem: "aurora-usdt",
      }),
    }));
    it("test", async () => {
      const { result } = renderHookWithAppContext(() => useSwapTokens());
      expect(result.current.fromToken.id).toEqual("mainnet-solana-usdc");
      expect(result.current.toToken.id).toEqual("mainnet-solana-usdt");
      expect(result.current.hasUrlError).toEqual(true);
    });
  });

  describe("should use valid toToken with invalid toEcosystem param", () => {
    jest.mock("react-router-dom", () => ({
      ...jest.requireActual("react-router-dom"),
      useNavigate: () => jest.fn(),
      useParams: () => ({
        fromEcosystem: "mainnet-solana-gst",
        toEcosystem: "mainnet-bnb-busd",
      }),
    }));
    it("test", async () => {
      const { result } = renderHookWithAppContext(() => useSwapTokens());
      expect(result.current.fromToken.id).toEqual("mainnet-solana-gst");
      expect(result.current.toToken.id).toEqual("mainnet-bnb-gst");
      expect(result.current.hasUrlError).toEqual(true);
    });
  });
});
