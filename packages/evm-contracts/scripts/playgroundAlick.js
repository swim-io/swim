"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var wormhole_sdk_1 = require("@certusone/wormhole-sdk");
var hardhat_1 = require("hardhat");
var ROUTING_ADDRESS = "0x591bf69E5dAa731e26a87fe0C5b394263A8c3375";
var POOL_ADDRESS = "0x37FFb2ee5A3ab1785bD5179243EDD27dDeADF823";
//const POOL_ADDRESS = "0x57305259a6fEB206fd58559AbC8a6A611001e15b";
var USDC_ADDRESS_GOERLI = "0x45B167CF5b14007Ca0490dCfB7C4B870Ec0C0Aa6";
var USDT_ADDRESS_GOERLI = "0x996f42BdB0CB71F831C2eFB05Ac6d0d226979e5B";
var BNB_BUSD_ADDRESS = "0x92934a8b10DDF85e81B65Be1D6810544744700dC";
var BNB_USDT_ADDRESS = "0x98529E942FD121d9C470c3d4431A008257E0E714";
var WORMHOLE_CORE_BRIDGE_ADDRESS_TESTNET_GOERLI = "0x706abc4E45D419950511e474C7B9Ed348A4a716c";
var WORMHOLE_TOKEN_BRIDGE_ADDRESS_TESTNET_GOERLI = "0xF890982f9310df57d00f659cf4fd87e65adEd8d7";
var ETHERSCAN_API_KEY = "BN2UC67VNXRK6N5SH9JN4PA167R35Y8I9Z";
var WORMHOLE_RPC_HOSTS = [
    "https://wormhole-v2-testnet-api.certus.one"
];
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var signers, routing, _a, _b, swimUsdAddress, swimUsd, usdc, theSigner, balance, pool, _c, _d, _e, _f, inputAmount, txnResponse, txnReceipt, sequence, vaa;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0: return [4 /*yield*/, hardhat_1.ethers.getSigners()];
            case 1:
                signers = _g.sent();
                return [4 /*yield*/, hardhat_1.ethers.getContractAt("Routing", ROUTING_ADDRESS)];
            case 2:
                routing = _g.sent();
                /*
                const provider = new ethers.providers.EtherscanProvider("goerli", ETHERSCAN_API_KEY);
                console.log("provider.getCode");
                console.log(await provider.getCode(ROUTING_ADDRESS));
                */
                console.log("owner");
                _b = (_a = console).log;
                return [4 /*yield*/, routing.owner()];
            case 3:
                _b.apply(_a, [_g.sent()]);
                return [4 /*yield*/, routing.swimUsdAddress()];
            case 4:
                swimUsdAddress = _g.sent();
                return [4 /*yield*/, hardhat_1.ethers.getContractAt("ERC20", swimUsdAddress)];
            case 5:
                swimUsd = _g.sent();
                return [4 /*yield*/, hardhat_1.ethers.getContractAt("ERC20Token", USDC_ADDRESS_GOERLI)];
            case 6:
                usdc = _g.sent();
                theSigner = signers[0];
                return [4 /*yield*/, usdc.balanceOf(theSigner.address)];
            case 7:
                balance = _g.sent();
                console.log(theSigner.address);
                console.log(balance);
                return [4 /*yield*/, hardhat_1.ethers.getContractAt("Pool", POOL_ADDRESS)];
            case 8:
                pool = _g.sent();
                //console.log(pool);
                console.log("pool balances");
                _d = (_c = console).log;
                _f = (_e = JSON).stringify;
                return [4 /*yield*/, pool.getState()];
            case 9:
                _d.apply(_c, [_f.apply(_e, [_g.sent(), null, 2])]);
                inputAmount = 10;
                //await usdc.connect(signers[0]).approve(ROUTING_ADDRESS, inputAmount);
                console.log("swapAndTransfer");
                return [4 /*yield*/, routing.connect(signers[0]).swapAndTransfer(usdc.address, inputAmount, 0, //slippage
                    4, //binance chain id
                    "0x" + "00".repeat(12) + signers[0].address.substring(2), "0x" + "00".repeat(16), {
                        gasLimit: hardhat_1.ethers.BigNumber.from("2000000")
                    })];
            case 10:
                txnResponse = _g.sent();
                console.log("swapAndTransfer done");
                return [4 /*yield*/, txnResponse.wait(6)];
            case 11:
                txnReceipt = _g.sent();
                console.log("txnReceipt");
                sequence = (0, wormhole_sdk_1.parseSequenceFromLogEth)(txnReceipt, WORMHOLE_CORE_BRIDGE_ADDRESS_TESTNET_GOERLI);
                console.log("sequence");
                console.log(sequence);
                return [4 /*yield*/, (0, wormhole_sdk_1.getSignedVAAWithRetry)(WORMHOLE_RPC_HOSTS, 2, // goerli chain id
                    WORMHOLE_TOKEN_BRIDGE_ADDRESS_TESTNET_GOERLI, sequence)];
            case 12:
                vaa = _g.sent();
                console.log("vaa");
                console.log(vaa);
                console.log("done");
                return [2 /*return*/];
        }
    });
}); })();
