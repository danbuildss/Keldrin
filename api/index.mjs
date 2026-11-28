import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res, err4) => function __init() {
  if (err4) throw err4[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e2) {
    throw err4 = [e2], e2;
  }
};
var __commonJS = (cb, mod) => function __require2() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e2) {
    throw mod = 0, e2;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/abitype/dist/esm/version.js
var version;
var init_version = __esm({
  "node_modules/abitype/dist/esm/version.js"() {
    version = "1.0.7";
  }
});

// node_modules/abitype/dist/esm/errors.js
var BaseError;
var init_errors = __esm({
  "node_modules/abitype/dist/esm/errors.js"() {
    init_version();
    BaseError = class _BaseError extends Error {
      constructor(shortMessage, args = {}) {
        const details = args.cause instanceof _BaseError ? args.cause.details : args.cause?.message ? args.cause.message : args.details;
        const docsPath3 = args.cause instanceof _BaseError ? args.cause.docsPath || args.docsPath : args.docsPath;
        const message = [
          shortMessage || "An error occurred.",
          "",
          ...args.metaMessages ? [...args.metaMessages, ""] : [],
          ...docsPath3 ? [`Docs: https://abitype.dev${docsPath3}`] : [],
          ...details ? [`Details: ${details}`] : [],
          `Version: abitype@${version}`
        ].join("\n");
        super(message);
        Object.defineProperty(this, "details", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "docsPath", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "metaMessages", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "shortMessage", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "AbiTypeError"
        });
        if (args.cause)
          this.cause = args.cause;
        this.details = details;
        this.docsPath = docsPath3;
        this.metaMessages = args.metaMessages;
        this.shortMessage = shortMessage;
      }
    };
  }
});

// node_modules/abitype/dist/esm/regex.js
function execTyped(regex, string) {
  const match = regex.exec(string);
  return match?.groups;
}
var bytesRegex, integerRegex, isTupleRegex;
var init_regex = __esm({
  "node_modules/abitype/dist/esm/regex.js"() {
    bytesRegex = /^bytes([1-9]|1[0-9]|2[0-9]|3[0-2])?$/;
    integerRegex = /^u?int(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?$/;
    isTupleRegex = /^\(.+?\).*?$/;
  }
});

// node_modules/abitype/dist/esm/human-readable/formatAbiParameter.js
function formatAbiParameter(abiParameter) {
  let type = abiParameter.type;
  if (tupleRegex.test(abiParameter.type) && "components" in abiParameter) {
    type = "(";
    const length = abiParameter.components.length;
    for (let i = 0; i < length; i++) {
      const component = abiParameter.components[i];
      type += formatAbiParameter(component);
      if (i < length - 1)
        type += ", ";
    }
    const result = execTyped(tupleRegex, abiParameter.type);
    type += `)${result?.array ?? ""}`;
    return formatAbiParameter({
      ...abiParameter,
      type
    });
  }
  if ("indexed" in abiParameter && abiParameter.indexed)
    type = `${type} indexed`;
  if (abiParameter.name)
    return `${type} ${abiParameter.name}`;
  return type;
}
var tupleRegex;
var init_formatAbiParameter = __esm({
  "node_modules/abitype/dist/esm/human-readable/formatAbiParameter.js"() {
    init_regex();
    tupleRegex = /^tuple(?<array>(\[(\d*)\])*)$/;
  }
});

// node_modules/abitype/dist/esm/human-readable/formatAbiParameters.js
function formatAbiParameters(abiParameters) {
  let params = "";
  const length = abiParameters.length;
  for (let i = 0; i < length; i++) {
    const abiParameter = abiParameters[i];
    params += formatAbiParameter(abiParameter);
    if (i !== length - 1)
      params += ", ";
  }
  return params;
}
var init_formatAbiParameters = __esm({
  "node_modules/abitype/dist/esm/human-readable/formatAbiParameters.js"() {
    init_formatAbiParameter();
  }
});

// node_modules/abitype/dist/esm/human-readable/formatAbiItem.js
function formatAbiItem(abiItem) {
  if (abiItem.type === "function")
    return `function ${abiItem.name}(${formatAbiParameters(abiItem.inputs)})${abiItem.stateMutability && abiItem.stateMutability !== "nonpayable" ? ` ${abiItem.stateMutability}` : ""}${abiItem.outputs?.length ? ` returns (${formatAbiParameters(abiItem.outputs)})` : ""}`;
  if (abiItem.type === "event")
    return `event ${abiItem.name}(${formatAbiParameters(abiItem.inputs)})`;
  if (abiItem.type === "error")
    return `error ${abiItem.name}(${formatAbiParameters(abiItem.inputs)})`;
  if (abiItem.type === "constructor")
    return `constructor(${formatAbiParameters(abiItem.inputs)})${abiItem.stateMutability === "payable" ? " payable" : ""}`;
  if (abiItem.type === "fallback")
    return `fallback() external${abiItem.stateMutability === "payable" ? " payable" : ""}`;
  return "receive() external payable";
}
var init_formatAbiItem = __esm({
  "node_modules/abitype/dist/esm/human-readable/formatAbiItem.js"() {
    init_formatAbiParameters();
  }
});

// node_modules/abitype/dist/esm/human-readable/runtime/signatures.js
function isErrorSignature(signature) {
  return errorSignatureRegex.test(signature);
}
function execErrorSignature(signature) {
  return execTyped(errorSignatureRegex, signature);
}
function isEventSignature(signature) {
  return eventSignatureRegex.test(signature);
}
function execEventSignature(signature) {
  return execTyped(eventSignatureRegex, signature);
}
function isFunctionSignature(signature) {
  return functionSignatureRegex.test(signature);
}
function execFunctionSignature(signature) {
  return execTyped(functionSignatureRegex, signature);
}
function isStructSignature(signature) {
  return structSignatureRegex.test(signature);
}
function execStructSignature(signature) {
  return execTyped(structSignatureRegex, signature);
}
function isConstructorSignature(signature) {
  return constructorSignatureRegex.test(signature);
}
function execConstructorSignature(signature) {
  return execTyped(constructorSignatureRegex, signature);
}
function isFallbackSignature(signature) {
  return fallbackSignatureRegex.test(signature);
}
function isReceiveSignature(signature) {
  return receiveSignatureRegex.test(signature);
}
var errorSignatureRegex, eventSignatureRegex, functionSignatureRegex, structSignatureRegex, constructorSignatureRegex, fallbackSignatureRegex, receiveSignatureRegex, eventModifiers, functionModifiers;
var init_signatures = __esm({
  "node_modules/abitype/dist/esm/human-readable/runtime/signatures.js"() {
    init_regex();
    errorSignatureRegex = /^error (?<name>[a-zA-Z$_][a-zA-Z0-9$_]*)\((?<parameters>.*?)\)$/;
    eventSignatureRegex = /^event (?<name>[a-zA-Z$_][a-zA-Z0-9$_]*)\((?<parameters>.*?)\)$/;
    functionSignatureRegex = /^function (?<name>[a-zA-Z$_][a-zA-Z0-9$_]*)\((?<parameters>.*?)\)(?: (?<scope>external|public{1}))?(?: (?<stateMutability>pure|view|nonpayable|payable{1}))?(?: returns\s?\((?<returns>.*?)\))?$/;
    structSignatureRegex = /^struct (?<name>[a-zA-Z$_][a-zA-Z0-9$_]*) \{(?<properties>.*?)\}$/;
    constructorSignatureRegex = /^constructor\((?<parameters>.*?)\)(?:\s(?<stateMutability>payable{1}))?$/;
    fallbackSignatureRegex = /^fallback\(\) external(?:\s(?<stateMutability>payable{1}))?$/;
    receiveSignatureRegex = /^receive\(\) external payable$/;
    eventModifiers = /* @__PURE__ */ new Set(["indexed"]);
    functionModifiers = /* @__PURE__ */ new Set([
      "calldata",
      "memory",
      "storage"
    ]);
  }
});

// node_modules/abitype/dist/esm/human-readable/errors/abiItem.js
var UnknownTypeError, UnknownSolidityTypeError;
var init_abiItem = __esm({
  "node_modules/abitype/dist/esm/human-readable/errors/abiItem.js"() {
    init_errors();
    UnknownTypeError = class extends BaseError {
      constructor({ type }) {
        super("Unknown type.", {
          metaMessages: [
            `Type "${type}" is not a valid ABI type. Perhaps you forgot to include a struct signature?`
          ]
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "UnknownTypeError"
        });
      }
    };
    UnknownSolidityTypeError = class extends BaseError {
      constructor({ type }) {
        super("Unknown type.", {
          metaMessages: [`Type "${type}" is not a valid ABI type.`]
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "UnknownSolidityTypeError"
        });
      }
    };
  }
});

// node_modules/abitype/dist/esm/human-readable/errors/abiParameter.js
var InvalidParameterError, SolidityProtectedKeywordError, InvalidModifierError, InvalidFunctionModifierError, InvalidAbiTypeParameterError;
var init_abiParameter = __esm({
  "node_modules/abitype/dist/esm/human-readable/errors/abiParameter.js"() {
    init_errors();
    InvalidParameterError = class extends BaseError {
      constructor({ param }) {
        super("Invalid ABI parameter.", {
          details: param
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "InvalidParameterError"
        });
      }
    };
    SolidityProtectedKeywordError = class extends BaseError {
      constructor({ param, name }) {
        super("Invalid ABI parameter.", {
          details: param,
          metaMessages: [
            `"${name}" is a protected Solidity keyword. More info: https://docs.soliditylang.org/en/latest/cheatsheet.html`
          ]
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "SolidityProtectedKeywordError"
        });
      }
    };
    InvalidModifierError = class extends BaseError {
      constructor({ param, type, modifier }) {
        super("Invalid ABI parameter.", {
          details: param,
          metaMessages: [
            `Modifier "${modifier}" not allowed${type ? ` in "${type}" type` : ""}.`
          ]
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "InvalidModifierError"
        });
      }
    };
    InvalidFunctionModifierError = class extends BaseError {
      constructor({ param, type, modifier }) {
        super("Invalid ABI parameter.", {
          details: param,
          metaMessages: [
            `Modifier "${modifier}" not allowed${type ? ` in "${type}" type` : ""}.`,
            `Data location can only be specified for array, struct, or mapping types, but "${modifier}" was given.`
          ]
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "InvalidFunctionModifierError"
        });
      }
    };
    InvalidAbiTypeParameterError = class extends BaseError {
      constructor({ abiParameter }) {
        super("Invalid ABI parameter.", {
          details: JSON.stringify(abiParameter, null, 2),
          metaMessages: ["ABI parameter type is invalid."]
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "InvalidAbiTypeParameterError"
        });
      }
    };
  }
});

// node_modules/abitype/dist/esm/human-readable/errors/signature.js
var InvalidSignatureError, UnknownSignatureError, InvalidStructSignatureError;
var init_signature = __esm({
  "node_modules/abitype/dist/esm/human-readable/errors/signature.js"() {
    init_errors();
    InvalidSignatureError = class extends BaseError {
      constructor({ signature, type }) {
        super(`Invalid ${type} signature.`, {
          details: signature
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "InvalidSignatureError"
        });
      }
    };
    UnknownSignatureError = class extends BaseError {
      constructor({ signature }) {
        super("Unknown signature.", {
          details: signature
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "UnknownSignatureError"
        });
      }
    };
    InvalidStructSignatureError = class extends BaseError {
      constructor({ signature }) {
        super("Invalid struct signature.", {
          details: signature,
          metaMessages: ["No properties exist."]
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "InvalidStructSignatureError"
        });
      }
    };
  }
});

// node_modules/abitype/dist/esm/human-readable/errors/struct.js
var CircularReferenceError;
var init_struct = __esm({
  "node_modules/abitype/dist/esm/human-readable/errors/struct.js"() {
    init_errors();
    CircularReferenceError = class extends BaseError {
      constructor({ type }) {
        super("Circular reference detected.", {
          metaMessages: [`Struct "${type}" is a circular reference.`]
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "CircularReferenceError"
        });
      }
    };
  }
});

// node_modules/abitype/dist/esm/human-readable/errors/splitParameters.js
var InvalidParenthesisError;
var init_splitParameters = __esm({
  "node_modules/abitype/dist/esm/human-readable/errors/splitParameters.js"() {
    init_errors();
    InvalidParenthesisError = class extends BaseError {
      constructor({ current, depth }) {
        super("Unbalanced parentheses.", {
          metaMessages: [
            `"${current.trim()}" has too many ${depth > 0 ? "opening" : "closing"} parentheses.`
          ],
          details: `Depth "${depth}"`
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "InvalidParenthesisError"
        });
      }
    };
  }
});

// node_modules/abitype/dist/esm/human-readable/runtime/cache.js
function getParameterCacheKey(param, type, structs) {
  let structKey = "";
  if (structs)
    for (const struct of Object.entries(structs)) {
      if (!struct)
        continue;
      let propertyKey = "";
      for (const property of struct[1]) {
        propertyKey += `[${property.type}${property.name ? `:${property.name}` : ""}]`;
      }
      structKey += `(${struct[0]}{${propertyKey}})`;
    }
  if (type)
    return `${type}:${param}${structKey}`;
  return param;
}
var parameterCache;
var init_cache = __esm({
  "node_modules/abitype/dist/esm/human-readable/runtime/cache.js"() {
    parameterCache = /* @__PURE__ */ new Map([
      // Unnamed
      ["address", { type: "address" }],
      ["bool", { type: "bool" }],
      ["bytes", { type: "bytes" }],
      ["bytes32", { type: "bytes32" }],
      ["int", { type: "int256" }],
      ["int256", { type: "int256" }],
      ["string", { type: "string" }],
      ["uint", { type: "uint256" }],
      ["uint8", { type: "uint8" }],
      ["uint16", { type: "uint16" }],
      ["uint24", { type: "uint24" }],
      ["uint32", { type: "uint32" }],
      ["uint64", { type: "uint64" }],
      ["uint96", { type: "uint96" }],
      ["uint112", { type: "uint112" }],
      ["uint160", { type: "uint160" }],
      ["uint192", { type: "uint192" }],
      ["uint256", { type: "uint256" }],
      // Named
      ["address owner", { type: "address", name: "owner" }],
      ["address to", { type: "address", name: "to" }],
      ["bool approved", { type: "bool", name: "approved" }],
      ["bytes _data", { type: "bytes", name: "_data" }],
      ["bytes data", { type: "bytes", name: "data" }],
      ["bytes signature", { type: "bytes", name: "signature" }],
      ["bytes32 hash", { type: "bytes32", name: "hash" }],
      ["bytes32 r", { type: "bytes32", name: "r" }],
      ["bytes32 root", { type: "bytes32", name: "root" }],
      ["bytes32 s", { type: "bytes32", name: "s" }],
      ["string name", { type: "string", name: "name" }],
      ["string symbol", { type: "string", name: "symbol" }],
      ["string tokenURI", { type: "string", name: "tokenURI" }],
      ["uint tokenId", { type: "uint256", name: "tokenId" }],
      ["uint8 v", { type: "uint8", name: "v" }],
      ["uint256 balance", { type: "uint256", name: "balance" }],
      ["uint256 tokenId", { type: "uint256", name: "tokenId" }],
      ["uint256 value", { type: "uint256", name: "value" }],
      // Indexed
      [
        "event:address indexed from",
        { type: "address", name: "from", indexed: true }
      ],
      ["event:address indexed to", { type: "address", name: "to", indexed: true }],
      [
        "event:uint indexed tokenId",
        { type: "uint256", name: "tokenId", indexed: true }
      ],
      [
        "event:uint256 indexed tokenId",
        { type: "uint256", name: "tokenId", indexed: true }
      ]
    ]);
  }
});

// node_modules/abitype/dist/esm/human-readable/runtime/utils.js
function parseSignature(signature, structs = {}) {
  if (isFunctionSignature(signature)) {
    const match = execFunctionSignature(signature);
    if (!match)
      throw new InvalidSignatureError({ signature, type: "function" });
    const inputParams = splitParameters(match.parameters);
    const inputs = [];
    const inputLength = inputParams.length;
    for (let i = 0; i < inputLength; i++) {
      inputs.push(parseAbiParameter(inputParams[i], {
        modifiers: functionModifiers,
        structs,
        type: "function"
      }));
    }
    const outputs = [];
    if (match.returns) {
      const outputParams = splitParameters(match.returns);
      const outputLength = outputParams.length;
      for (let i = 0; i < outputLength; i++) {
        outputs.push(parseAbiParameter(outputParams[i], {
          modifiers: functionModifiers,
          structs,
          type: "function"
        }));
      }
    }
    return {
      name: match.name,
      type: "function",
      stateMutability: match.stateMutability ?? "nonpayable",
      inputs,
      outputs
    };
  }
  if (isEventSignature(signature)) {
    const match = execEventSignature(signature);
    if (!match)
      throw new InvalidSignatureError({ signature, type: "event" });
    const params = splitParameters(match.parameters);
    const abiParameters = [];
    const length = params.length;
    for (let i = 0; i < length; i++) {
      abiParameters.push(parseAbiParameter(params[i], {
        modifiers: eventModifiers,
        structs,
        type: "event"
      }));
    }
    return { name: match.name, type: "event", inputs: abiParameters };
  }
  if (isErrorSignature(signature)) {
    const match = execErrorSignature(signature);
    if (!match)
      throw new InvalidSignatureError({ signature, type: "error" });
    const params = splitParameters(match.parameters);
    const abiParameters = [];
    const length = params.length;
    for (let i = 0; i < length; i++) {
      abiParameters.push(parseAbiParameter(params[i], { structs, type: "error" }));
    }
    return { name: match.name, type: "error", inputs: abiParameters };
  }
  if (isConstructorSignature(signature)) {
    const match = execConstructorSignature(signature);
    if (!match)
      throw new InvalidSignatureError({ signature, type: "constructor" });
    const params = splitParameters(match.parameters);
    const abiParameters = [];
    const length = params.length;
    for (let i = 0; i < length; i++) {
      abiParameters.push(parseAbiParameter(params[i], { structs, type: "constructor" }));
    }
    return {
      type: "constructor",
      stateMutability: match.stateMutability ?? "nonpayable",
      inputs: abiParameters
    };
  }
  if (isFallbackSignature(signature))
    return { type: "fallback" };
  if (isReceiveSignature(signature))
    return {
      type: "receive",
      stateMutability: "payable"
    };
  throw new UnknownSignatureError({ signature });
}
function parseAbiParameter(param, options) {
  const parameterCacheKey = getParameterCacheKey(param, options?.type, options?.structs);
  if (parameterCache.has(parameterCacheKey))
    return parameterCache.get(parameterCacheKey);
  const isTuple = isTupleRegex.test(param);
  const match = execTyped(isTuple ? abiParameterWithTupleRegex : abiParameterWithoutTupleRegex, param);
  if (!match)
    throw new InvalidParameterError({ param });
  if (match.name && isSolidityKeyword(match.name))
    throw new SolidityProtectedKeywordError({ param, name: match.name });
  const name = match.name ? { name: match.name } : {};
  const indexed = match.modifier === "indexed" ? { indexed: true } : {};
  const structs = options?.structs ?? {};
  let type;
  let components = {};
  if (isTuple) {
    type = "tuple";
    const params = splitParameters(match.type);
    const components_ = [];
    const length = params.length;
    for (let i = 0; i < length; i++) {
      components_.push(parseAbiParameter(params[i], { structs }));
    }
    components = { components: components_ };
  } else if (match.type in structs) {
    type = "tuple";
    components = { components: structs[match.type] };
  } else if (dynamicIntegerRegex.test(match.type)) {
    type = `${match.type}256`;
  } else {
    type = match.type;
    if (!(options?.type === "struct") && !isSolidityType(type))
      throw new UnknownSolidityTypeError({ type });
  }
  if (match.modifier) {
    if (!options?.modifiers?.has?.(match.modifier))
      throw new InvalidModifierError({
        param,
        type: options?.type,
        modifier: match.modifier
      });
    if (functionModifiers.has(match.modifier) && !isValidDataLocation(type, !!match.array))
      throw new InvalidFunctionModifierError({
        param,
        type: options?.type,
        modifier: match.modifier
      });
  }
  const abiParameter = {
    type: `${type}${match.array ?? ""}`,
    ...name,
    ...indexed,
    ...components
  };
  parameterCache.set(parameterCacheKey, abiParameter);
  return abiParameter;
}
function splitParameters(params, result = [], current = "", depth = 0) {
  const length = params.trim().length;
  for (let i = 0; i < length; i++) {
    const char = params[i];
    const tail = params.slice(i + 1);
    switch (char) {
      case ",":
        return depth === 0 ? splitParameters(tail, [...result, current.trim()]) : splitParameters(tail, result, `${current}${char}`, depth);
      case "(":
        return splitParameters(tail, result, `${current}${char}`, depth + 1);
      case ")":
        return splitParameters(tail, result, `${current}${char}`, depth - 1);
      default:
        return splitParameters(tail, result, `${current}${char}`, depth);
    }
  }
  if (current === "")
    return result;
  if (depth !== 0)
    throw new InvalidParenthesisError({ current, depth });
  result.push(current.trim());
  return result;
}
function isSolidityType(type) {
  return type === "address" || type === "bool" || type === "function" || type === "string" || bytesRegex.test(type) || integerRegex.test(type);
}
function isSolidityKeyword(name) {
  return name === "address" || name === "bool" || name === "function" || name === "string" || name === "tuple" || bytesRegex.test(name) || integerRegex.test(name) || protectedKeywordsRegex.test(name);
}
function isValidDataLocation(type, isArray) {
  return isArray || type === "bytes" || type === "string" || type === "tuple";
}
var abiParameterWithoutTupleRegex, abiParameterWithTupleRegex, dynamicIntegerRegex, protectedKeywordsRegex;
var init_utils = __esm({
  "node_modules/abitype/dist/esm/human-readable/runtime/utils.js"() {
    init_regex();
    init_abiItem();
    init_abiParameter();
    init_signature();
    init_splitParameters();
    init_cache();
    init_signatures();
    abiParameterWithoutTupleRegex = /^(?<type>[a-zA-Z$_][a-zA-Z0-9$_]*)(?<array>(?:\[\d*?\])+?)?(?:\s(?<modifier>calldata|indexed|memory|storage{1}))?(?:\s(?<name>[a-zA-Z$_][a-zA-Z0-9$_]*))?$/;
    abiParameterWithTupleRegex = /^\((?<type>.+?)\)(?<array>(?:\[\d*?\])+?)?(?:\s(?<modifier>calldata|indexed|memory|storage{1}))?(?:\s(?<name>[a-zA-Z$_][a-zA-Z0-9$_]*))?$/;
    dynamicIntegerRegex = /^u?int$/;
    protectedKeywordsRegex = /^(?:after|alias|anonymous|apply|auto|byte|calldata|case|catch|constant|copyof|default|defined|error|event|external|false|final|function|immutable|implements|in|indexed|inline|internal|let|mapping|match|memory|mutable|null|of|override|partial|private|promise|public|pure|reference|relocatable|return|returns|sizeof|static|storage|struct|super|supports|switch|this|true|try|typedef|typeof|var|view|virtual)$/;
  }
});

// node_modules/abitype/dist/esm/human-readable/runtime/structs.js
function parseStructs(signatures) {
  const shallowStructs = {};
  const signaturesLength = signatures.length;
  for (let i = 0; i < signaturesLength; i++) {
    const signature = signatures[i];
    if (!isStructSignature(signature))
      continue;
    const match = execStructSignature(signature);
    if (!match)
      throw new InvalidSignatureError({ signature, type: "struct" });
    const properties = match.properties.split(";");
    const components = [];
    const propertiesLength = properties.length;
    for (let k = 0; k < propertiesLength; k++) {
      const property = properties[k];
      const trimmed = property.trim();
      if (!trimmed)
        continue;
      const abiParameter = parseAbiParameter(trimmed, {
        type: "struct"
      });
      components.push(abiParameter);
    }
    if (!components.length)
      throw new InvalidStructSignatureError({ signature });
    shallowStructs[match.name] = components;
  }
  const resolvedStructs = {};
  const entries = Object.entries(shallowStructs);
  const entriesLength = entries.length;
  for (let i = 0; i < entriesLength; i++) {
    const [name, parameters] = entries[i];
    resolvedStructs[name] = resolveStructs(parameters, shallowStructs);
  }
  return resolvedStructs;
}
function resolveStructs(abiParameters, structs, ancestors = /* @__PURE__ */ new Set()) {
  const components = [];
  const length = abiParameters.length;
  for (let i = 0; i < length; i++) {
    const abiParameter = abiParameters[i];
    const isTuple = isTupleRegex.test(abiParameter.type);
    if (isTuple)
      components.push(abiParameter);
    else {
      const match = execTyped(typeWithoutTupleRegex, abiParameter.type);
      if (!match?.type)
        throw new InvalidAbiTypeParameterError({ abiParameter });
      const { array, type } = match;
      if (type in structs) {
        if (ancestors.has(type))
          throw new CircularReferenceError({ type });
        components.push({
          ...abiParameter,
          type: `tuple${array ?? ""}`,
          components: resolveStructs(structs[type] ?? [], structs, /* @__PURE__ */ new Set([...ancestors, type]))
        });
      } else {
        if (isSolidityType(type))
          components.push(abiParameter);
        else
          throw new UnknownTypeError({ type });
      }
    }
  }
  return components;
}
var typeWithoutTupleRegex;
var init_structs = __esm({
  "node_modules/abitype/dist/esm/human-readable/runtime/structs.js"() {
    init_regex();
    init_abiItem();
    init_abiParameter();
    init_signature();
    init_struct();
    init_signatures();
    init_utils();
    typeWithoutTupleRegex = /^(?<type>[a-zA-Z$_][a-zA-Z0-9$_]*)(?<array>(?:\[\d*?\])+?)?$/;
  }
});

// node_modules/abitype/dist/esm/human-readable/parseAbi.js
function parseAbi(signatures) {
  const structs = parseStructs(signatures);
  const abi = [];
  const length = signatures.length;
  for (let i = 0; i < length; i++) {
    const signature = signatures[i];
    if (isStructSignature(signature))
      continue;
    abi.push(parseSignature(signature, structs));
  }
  return abi;
}
var init_parseAbi = __esm({
  "node_modules/abitype/dist/esm/human-readable/parseAbi.js"() {
    init_signatures();
    init_structs();
    init_utils();
  }
});

// node_modules/abitype/dist/esm/exports/index.js
var init_exports = __esm({
  "node_modules/abitype/dist/esm/exports/index.js"() {
    init_formatAbiItem();
    init_parseAbi();
  }
});

// node_modules/viem/_esm/utils/abi/formatAbiItem.js
function formatAbiItem2(abiItem, { includeName = false } = {}) {
  if (abiItem.type !== "function" && abiItem.type !== "event" && abiItem.type !== "error")
    throw new InvalidDefinitionTypeError(abiItem.type);
  return `${abiItem.name}(${formatAbiParams(abiItem.inputs, { includeName })})`;
}
function formatAbiParams(params, { includeName = false } = {}) {
  if (!params)
    return "";
  return params.map((param) => formatAbiParam(param, { includeName })).join(includeName ? ", " : ",");
}
function formatAbiParam(param, { includeName }) {
  if (param.type.startsWith("tuple")) {
    return `(${formatAbiParams(param.components, { includeName })})${param.type.slice("tuple".length)}`;
  }
  return param.type + (includeName && param.name ? ` ${param.name}` : "");
}
var init_formatAbiItem2 = __esm({
  "node_modules/viem/_esm/utils/abi/formatAbiItem.js"() {
    init_abi();
  }
});

// node_modules/viem/_esm/utils/data/isHex.js
function isHex(value, { strict = true } = {}) {
  if (!value)
    return false;
  if (typeof value !== "string")
    return false;
  return strict ? /^0x[0-9a-fA-F]*$/.test(value) : value.startsWith("0x");
}
var init_isHex = __esm({
  "node_modules/viem/_esm/utils/data/isHex.js"() {
  }
});

// node_modules/viem/_esm/utils/data/size.js
function size(value) {
  if (isHex(value, { strict: false }))
    return Math.ceil((value.length - 2) / 2);
  return value.length;
}
var init_size = __esm({
  "node_modules/viem/_esm/utils/data/size.js"() {
    init_isHex();
  }
});

// node_modules/viem/_esm/errors/version.js
var version2;
var init_version2 = __esm({
  "node_modules/viem/_esm/errors/version.js"() {
    version2 = "2.21.54";
  }
});

// node_modules/viem/_esm/errors/base.js
function walk(err4, fn) {
  if (fn?.(err4))
    return err4;
  if (err4 && typeof err4 === "object" && "cause" in err4 && err4.cause !== void 0)
    return walk(err4.cause, fn);
  return fn ? null : err4;
}
var errorConfig, BaseError2;
var init_base = __esm({
  "node_modules/viem/_esm/errors/base.js"() {
    init_version2();
    errorConfig = {
      getDocsUrl: ({ docsBaseUrl, docsPath: docsPath3 = "", docsSlug }) => docsPath3 ? `${docsBaseUrl ?? "https://viem.sh"}${docsPath3}${docsSlug ? `#${docsSlug}` : ""}` : void 0,
      version: `viem@${version2}`
    };
    BaseError2 = class _BaseError extends Error {
      constructor(shortMessage, args = {}) {
        const details = (() => {
          if (args.cause instanceof _BaseError)
            return args.cause.details;
          if (args.cause?.message)
            return args.cause.message;
          return args.details;
        })();
        const docsPath3 = (() => {
          if (args.cause instanceof _BaseError)
            return args.cause.docsPath || args.docsPath;
          return args.docsPath;
        })();
        const docsUrl = errorConfig.getDocsUrl?.({ ...args, docsPath: docsPath3 });
        const message = [
          shortMessage || "An error occurred.",
          "",
          ...args.metaMessages ? [...args.metaMessages, ""] : [],
          ...docsUrl ? [`Docs: ${docsUrl}`] : [],
          ...details ? [`Details: ${details}`] : [],
          ...errorConfig.version ? [`Version: ${errorConfig.version}`] : []
        ].join("\n");
        super(message, args.cause ? { cause: args.cause } : void 0);
        Object.defineProperty(this, "details", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "docsPath", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "metaMessages", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "shortMessage", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "version", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "BaseError"
        });
        this.details = details;
        this.docsPath = docsPath3;
        this.metaMessages = args.metaMessages;
        this.name = args.name ?? this.name;
        this.shortMessage = shortMessage;
        this.version = version2;
      }
      walk(fn) {
        return walk(this, fn);
      }
    };
  }
});

// node_modules/viem/_esm/errors/abi.js
var AbiDecodingDataSizeTooSmallError, AbiDecodingZeroDataError, AbiEncodingArrayLengthMismatchError, AbiEncodingBytesSizeMismatchError, AbiEncodingLengthMismatchError, AbiFunctionNotFoundError, AbiFunctionOutputsNotFoundError, AbiItemAmbiguityError, InvalidAbiEncodingTypeError, InvalidAbiDecodingTypeError, InvalidArrayError, InvalidDefinitionTypeError;
var init_abi = __esm({
  "node_modules/viem/_esm/errors/abi.js"() {
    init_formatAbiItem2();
    init_size();
    init_base();
    AbiDecodingDataSizeTooSmallError = class extends BaseError2 {
      constructor({ data, params, size: size2 }) {
        super([`Data size of ${size2} bytes is too small for given parameters.`].join("\n"), {
          metaMessages: [
            `Params: (${formatAbiParams(params, { includeName: true })})`,
            `Data:   ${data} (${size2} bytes)`
          ],
          name: "AbiDecodingDataSizeTooSmallError"
        });
        Object.defineProperty(this, "data", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "params", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "size", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.data = data;
        this.params = params;
        this.size = size2;
      }
    };
    AbiDecodingZeroDataError = class extends BaseError2 {
      constructor() {
        super('Cannot decode zero data ("0x") with ABI parameters.', {
          name: "AbiDecodingZeroDataError"
        });
      }
    };
    AbiEncodingArrayLengthMismatchError = class extends BaseError2 {
      constructor({ expectedLength, givenLength, type }) {
        super([
          `ABI encoding array length mismatch for type ${type}.`,
          `Expected length: ${expectedLength}`,
          `Given length: ${givenLength}`
        ].join("\n"), { name: "AbiEncodingArrayLengthMismatchError" });
      }
    };
    AbiEncodingBytesSizeMismatchError = class extends BaseError2 {
      constructor({ expectedSize, value }) {
        super(`Size of bytes "${value}" (bytes${size(value)}) does not match expected size (bytes${expectedSize}).`, { name: "AbiEncodingBytesSizeMismatchError" });
      }
    };
    AbiEncodingLengthMismatchError = class extends BaseError2 {
      constructor({ expectedLength, givenLength }) {
        super([
          "ABI encoding params/values length mismatch.",
          `Expected length (params): ${expectedLength}`,
          `Given length (values): ${givenLength}`
        ].join("\n"), { name: "AbiEncodingLengthMismatchError" });
      }
    };
    AbiFunctionNotFoundError = class extends BaseError2 {
      constructor(functionName, { docsPath: docsPath3 } = {}) {
        super([
          `Function ${functionName ? `"${functionName}" ` : ""}not found on ABI.`,
          "Make sure you are using the correct ABI and that the function exists on it."
        ].join("\n"), {
          docsPath: docsPath3,
          name: "AbiFunctionNotFoundError"
        });
      }
    };
    AbiFunctionOutputsNotFoundError = class extends BaseError2 {
      constructor(functionName, { docsPath: docsPath3 }) {
        super([
          `Function "${functionName}" does not contain any \`outputs\` on ABI.`,
          "Cannot decode function result without knowing what the parameter types are.",
          "Make sure you are using the correct ABI and that the function exists on it."
        ].join("\n"), {
          docsPath: docsPath3,
          name: "AbiFunctionOutputsNotFoundError"
        });
      }
    };
    AbiItemAmbiguityError = class extends BaseError2 {
      constructor(x, y) {
        super("Found ambiguous types in overloaded ABI items.", {
          metaMessages: [
            `\`${x.type}\` in \`${formatAbiItem2(x.abiItem)}\`, and`,
            `\`${y.type}\` in \`${formatAbiItem2(y.abiItem)}\``,
            "",
            "These types encode differently and cannot be distinguished at runtime.",
            "Remove one of the ambiguous items in the ABI."
          ],
          name: "AbiItemAmbiguityError"
        });
      }
    };
    InvalidAbiEncodingTypeError = class extends BaseError2 {
      constructor(type, { docsPath: docsPath3 }) {
        super([
          `Type "${type}" is not a valid encoding type.`,
          "Please provide a valid ABI type."
        ].join("\n"), { docsPath: docsPath3, name: "InvalidAbiEncodingType" });
      }
    };
    InvalidAbiDecodingTypeError = class extends BaseError2 {
      constructor(type, { docsPath: docsPath3 }) {
        super([
          `Type "${type}" is not a valid decoding type.`,
          "Please provide a valid ABI type."
        ].join("\n"), { docsPath: docsPath3, name: "InvalidAbiDecodingType" });
      }
    };
    InvalidArrayError = class extends BaseError2 {
      constructor(value) {
        super([`Value "${value}" is not a valid array.`].join("\n"), {
          name: "InvalidArrayError"
        });
      }
    };
    InvalidDefinitionTypeError = class extends BaseError2 {
      constructor(type) {
        super([
          `"${type}" is not a valid definition type.`,
          'Valid types: "function", "event", "error"'
        ].join("\n"), { name: "InvalidDefinitionTypeError" });
      }
    };
  }
});

// node_modules/viem/_esm/errors/data.js
var SliceOffsetOutOfBoundsError, SizeExceedsPaddingSizeError;
var init_data = __esm({
  "node_modules/viem/_esm/errors/data.js"() {
    init_base();
    SliceOffsetOutOfBoundsError = class extends BaseError2 {
      constructor({ offset, position, size: size2 }) {
        super(`Slice ${position === "start" ? "starting" : "ending"} at offset "${offset}" is out-of-bounds (size: ${size2}).`, { name: "SliceOffsetOutOfBoundsError" });
      }
    };
    SizeExceedsPaddingSizeError = class extends BaseError2 {
      constructor({ size: size2, targetSize, type }) {
        super(`${type.charAt(0).toUpperCase()}${type.slice(1).toLowerCase()} size (${size2}) exceeds padding size (${targetSize}).`, { name: "SizeExceedsPaddingSizeError" });
      }
    };
  }
});

// node_modules/viem/_esm/utils/data/pad.js
function pad(hexOrBytes, { dir, size: size2 = 32 } = {}) {
  if (typeof hexOrBytes === "string")
    return padHex(hexOrBytes, { dir, size: size2 });
  return padBytes(hexOrBytes, { dir, size: size2 });
}
function padHex(hex_, { dir, size: size2 = 32 } = {}) {
  if (size2 === null)
    return hex_;
  const hex = hex_.replace("0x", "");
  if (hex.length > size2 * 2)
    throw new SizeExceedsPaddingSizeError({
      size: Math.ceil(hex.length / 2),
      targetSize: size2,
      type: "hex"
    });
  return `0x${hex[dir === "right" ? "padEnd" : "padStart"](size2 * 2, "0")}`;
}
function padBytes(bytes, { dir, size: size2 = 32 } = {}) {
  if (size2 === null)
    return bytes;
  if (bytes.length > size2)
    throw new SizeExceedsPaddingSizeError({
      size: bytes.length,
      targetSize: size2,
      type: "bytes"
    });
  const paddedBytes = new Uint8Array(size2);
  for (let i = 0; i < size2; i++) {
    const padEnd = dir === "right";
    paddedBytes[padEnd ? i : size2 - i - 1] = bytes[padEnd ? i : bytes.length - i - 1];
  }
  return paddedBytes;
}
var init_pad = __esm({
  "node_modules/viem/_esm/utils/data/pad.js"() {
    init_data();
  }
});

// node_modules/viem/_esm/errors/encoding.js
var IntegerOutOfRangeError, InvalidBytesBooleanError, SizeOverflowError;
var init_encoding = __esm({
  "node_modules/viem/_esm/errors/encoding.js"() {
    init_base();
    IntegerOutOfRangeError = class extends BaseError2 {
      constructor({ max, min, signed, size: size2, value }) {
        super(`Number "${value}" is not in safe ${size2 ? `${size2 * 8}-bit ${signed ? "signed" : "unsigned"} ` : ""}integer range ${max ? `(${min} to ${max})` : `(above ${min})`}`, { name: "IntegerOutOfRangeError" });
      }
    };
    InvalidBytesBooleanError = class extends BaseError2 {
      constructor(bytes) {
        super(`Bytes value "${bytes}" is not a valid boolean. The bytes array must contain a single byte of either a 0 or 1 value.`, {
          name: "InvalidBytesBooleanError"
        });
      }
    };
    SizeOverflowError = class extends BaseError2 {
      constructor({ givenSize, maxSize }) {
        super(`Size cannot exceed ${maxSize} bytes. Given size: ${givenSize} bytes.`, { name: "SizeOverflowError" });
      }
    };
  }
});

// node_modules/viem/_esm/utils/data/trim.js
function trim(hexOrBytes, { dir = "left" } = {}) {
  let data = typeof hexOrBytes === "string" ? hexOrBytes.replace("0x", "") : hexOrBytes;
  let sliceLength = 0;
  for (let i = 0; i < data.length - 1; i++) {
    if (data[dir === "left" ? i : data.length - i - 1].toString() === "0")
      sliceLength++;
    else
      break;
  }
  data = dir === "left" ? data.slice(sliceLength) : data.slice(0, data.length - sliceLength);
  if (typeof hexOrBytes === "string") {
    if (data.length === 1 && dir === "right")
      data = `${data}0`;
    return `0x${data.length % 2 === 1 ? `0${data}` : data}`;
  }
  return data;
}
var init_trim = __esm({
  "node_modules/viem/_esm/utils/data/trim.js"() {
  }
});

// node_modules/viem/_esm/utils/encoding/fromHex.js
function assertSize(hexOrBytes, { size: size2 }) {
  if (size(hexOrBytes) > size2)
    throw new SizeOverflowError({
      givenSize: size(hexOrBytes),
      maxSize: size2
    });
}
function hexToBigInt(hex, opts = {}) {
  const { signed } = opts;
  if (opts.size)
    assertSize(hex, { size: opts.size });
  const value = BigInt(hex);
  if (!signed)
    return value;
  const size2 = (hex.length - 2) / 2;
  const max = (1n << BigInt(size2) * 8n - 1n) - 1n;
  if (value <= max)
    return value;
  return value - BigInt(`0x${"f".padStart(size2 * 2, "f")}`) - 1n;
}
function hexToNumber(hex, opts = {}) {
  return Number(hexToBigInt(hex, opts));
}
var init_fromHex = __esm({
  "node_modules/viem/_esm/utils/encoding/fromHex.js"() {
    init_encoding();
    init_size();
  }
});

// node_modules/viem/_esm/utils/encoding/toHex.js
function toHex(value, opts = {}) {
  if (typeof value === "number" || typeof value === "bigint")
    return numberToHex(value, opts);
  if (typeof value === "string") {
    return stringToHex(value, opts);
  }
  if (typeof value === "boolean")
    return boolToHex(value, opts);
  return bytesToHex(value, opts);
}
function boolToHex(value, opts = {}) {
  const hex = `0x${Number(value)}`;
  if (typeof opts.size === "number") {
    assertSize(hex, { size: opts.size });
    return pad(hex, { size: opts.size });
  }
  return hex;
}
function bytesToHex(value, opts = {}) {
  let string = "";
  for (let i = 0; i < value.length; i++) {
    string += hexes[value[i]];
  }
  const hex = `0x${string}`;
  if (typeof opts.size === "number") {
    assertSize(hex, { size: opts.size });
    return pad(hex, { dir: "right", size: opts.size });
  }
  return hex;
}
function numberToHex(value_, opts = {}) {
  const { signed, size: size2 } = opts;
  const value = BigInt(value_);
  let maxValue;
  if (size2) {
    if (signed)
      maxValue = (1n << BigInt(size2) * 8n - 1n) - 1n;
    else
      maxValue = 2n ** (BigInt(size2) * 8n) - 1n;
  } else if (typeof value_ === "number") {
    maxValue = BigInt(Number.MAX_SAFE_INTEGER);
  }
  const minValue = typeof maxValue === "bigint" && signed ? -maxValue - 1n : 0;
  if (maxValue && value > maxValue || value < minValue) {
    const suffix = typeof value_ === "bigint" ? "n" : "";
    throw new IntegerOutOfRangeError({
      max: maxValue ? `${maxValue}${suffix}` : void 0,
      min: `${minValue}${suffix}`,
      signed,
      size: size2,
      value: `${value_}${suffix}`
    });
  }
  const hex = `0x${(signed && value < 0 ? (1n << BigInt(size2 * 8)) + BigInt(value) : value).toString(16)}`;
  if (size2)
    return pad(hex, { size: size2 });
  return hex;
}
function stringToHex(value_, opts = {}) {
  const value = encoder.encode(value_);
  return bytesToHex(value, opts);
}
var hexes, encoder;
var init_toHex = __esm({
  "node_modules/viem/_esm/utils/encoding/toHex.js"() {
    init_encoding();
    init_pad();
    init_fromHex();
    hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_v, i) => i.toString(16).padStart(2, "0"));
    encoder = /* @__PURE__ */ new TextEncoder();
  }
});

// node_modules/viem/_esm/utils/encoding/toBytes.js
function toBytes(value, opts = {}) {
  if (typeof value === "number" || typeof value === "bigint")
    return numberToBytes(value, opts);
  if (typeof value === "boolean")
    return boolToBytes(value, opts);
  if (isHex(value))
    return hexToBytes(value, opts);
  return stringToBytes(value, opts);
}
function boolToBytes(value, opts = {}) {
  const bytes = new Uint8Array(1);
  bytes[0] = Number(value);
  if (typeof opts.size === "number") {
    assertSize(bytes, { size: opts.size });
    return pad(bytes, { size: opts.size });
  }
  return bytes;
}
function charCodeToBase16(char) {
  if (char >= charCodeMap.zero && char <= charCodeMap.nine)
    return char - charCodeMap.zero;
  if (char >= charCodeMap.A && char <= charCodeMap.F)
    return char - (charCodeMap.A - 10);
  if (char >= charCodeMap.a && char <= charCodeMap.f)
    return char - (charCodeMap.a - 10);
  return void 0;
}
function hexToBytes(hex_, opts = {}) {
  let hex = hex_;
  if (opts.size) {
    assertSize(hex, { size: opts.size });
    hex = pad(hex, { dir: "right", size: opts.size });
  }
  let hexString = hex.slice(2);
  if (hexString.length % 2)
    hexString = `0${hexString}`;
  const length = hexString.length / 2;
  const bytes = new Uint8Array(length);
  for (let index = 0, j = 0; index < length; index++) {
    const nibbleLeft = charCodeToBase16(hexString.charCodeAt(j++));
    const nibbleRight = charCodeToBase16(hexString.charCodeAt(j++));
    if (nibbleLeft === void 0 || nibbleRight === void 0) {
      throw new BaseError2(`Invalid byte sequence ("${hexString[j - 2]}${hexString[j - 1]}" in "${hexString}").`);
    }
    bytes[index] = nibbleLeft * 16 + nibbleRight;
  }
  return bytes;
}
function numberToBytes(value, opts) {
  const hex = numberToHex(value, opts);
  return hexToBytes(hex);
}
function stringToBytes(value, opts = {}) {
  const bytes = encoder2.encode(value);
  if (typeof opts.size === "number") {
    assertSize(bytes, { size: opts.size });
    return pad(bytes, { dir: "right", size: opts.size });
  }
  return bytes;
}
var encoder2, charCodeMap;
var init_toBytes = __esm({
  "node_modules/viem/_esm/utils/encoding/toBytes.js"() {
    init_base();
    init_isHex();
    init_pad();
    init_fromHex();
    init_toHex();
    encoder2 = /* @__PURE__ */ new TextEncoder();
    charCodeMap = {
      zero: 48,
      nine: 57,
      A: 65,
      F: 70,
      a: 97,
      f: 102
    };
  }
});

// node_modules/@noble/hashes/esm/_assert.js
function anumber(n) {
  if (!Number.isSafeInteger(n) || n < 0)
    throw new Error("positive integer expected, got " + n);
}
function isBytes(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function abytes(b, ...lengths) {
  if (!isBytes(b))
    throw new Error("Uint8Array expected");
  if (lengths.length > 0 && !lengths.includes(b.length))
    throw new Error("Uint8Array expected of length " + lengths + ", got length=" + b.length);
}
function aexists(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (checkFinished && instance.finished)
    throw new Error("Hash#digest() has already been called");
}
function aoutput(out, instance) {
  abytes(out);
  const min = instance.outputLen;
  if (out.length < min) {
    throw new Error("digestInto() expects output buffer of length at least " + min);
  }
}
var init_assert = __esm({
  "node_modules/@noble/hashes/esm/_assert.js"() {
  }
});

// node_modules/@noble/hashes/esm/_u64.js
function fromBig(n, le = false) {
  if (le)
    return { h: Number(n & U32_MASK64), l: Number(n >> _32n & U32_MASK64) };
  return { h: Number(n >> _32n & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
}
function split(lst, le = false) {
  let Ah = new Uint32Array(lst.length);
  let Al = new Uint32Array(lst.length);
  for (let i = 0; i < lst.length; i++) {
    const { h, l } = fromBig(lst[i], le);
    [Ah[i], Al[i]] = [h, l];
  }
  return [Ah, Al];
}
var U32_MASK64, _32n, rotlSH, rotlSL, rotlBH, rotlBL;
var init_u64 = __esm({
  "node_modules/@noble/hashes/esm/_u64.js"() {
    U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
    _32n = /* @__PURE__ */ BigInt(32);
    rotlSH = (h, l, s) => h << s | l >>> 32 - s;
    rotlSL = (h, l, s) => l << s | h >>> 32 - s;
    rotlBH = (h, l, s) => l << s - 32 | h >>> 64 - s;
    rotlBL = (h, l, s) => h << s - 32 | l >>> 64 - s;
  }
});

// node_modules/@noble/hashes/esm/utils.js
function byteSwap32(arr) {
  for (let i = 0; i < arr.length; i++) {
    arr[i] = byteSwap(arr[i]);
  }
}
function utf8ToBytes(str) {
  if (typeof str !== "string")
    throw new Error("utf8ToBytes expected string, got " + typeof str);
  return new Uint8Array(new TextEncoder().encode(str));
}
function toBytes2(data) {
  if (typeof data === "string")
    data = utf8ToBytes(data);
  abytes(data);
  return data;
}
function wrapConstructor(hashCons) {
  const hashC = (msg) => hashCons().update(toBytes2(msg)).digest();
  const tmp = hashCons();
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.create = () => hashCons();
  return hashC;
}
function wrapXOFConstructorWithOpts(hashCons) {
  const hashC = (msg, opts) => hashCons(opts).update(toBytes2(msg)).digest();
  const tmp = hashCons({});
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.create = (opts) => hashCons(opts);
  return hashC;
}
var u32, isLE, byteSwap, Hash;
var init_utils2 = __esm({
  "node_modules/@noble/hashes/esm/utils.js"() {
    init_assert();
    u32 = (arr) => new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
    isLE = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
    byteSwap = (word2) => word2 << 24 & 4278190080 | word2 << 8 & 16711680 | word2 >>> 8 & 65280 | word2 >>> 24 & 255;
    Hash = class {
      // Safe version that clones internal state
      clone() {
        return this._cloneInto();
      }
    };
  }
});

// node_modules/@noble/hashes/esm/sha3.js
function keccakP(s, rounds = 24) {
  const B = new Uint32Array(5 * 2);
  for (let round = 24 - rounds; round < 24; round++) {
    for (let x = 0; x < 10; x++)
      B[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
    for (let x = 0; x < 10; x += 2) {
      const idx1 = (x + 8) % 10;
      const idx0 = (x + 2) % 10;
      const B0 = B[idx0];
      const B1 = B[idx0 + 1];
      const Th = rotlH(B0, B1, 1) ^ B[idx1];
      const Tl = rotlL(B0, B1, 1) ^ B[idx1 + 1];
      for (let y = 0; y < 50; y += 10) {
        s[x + y] ^= Th;
        s[x + y + 1] ^= Tl;
      }
    }
    let curH = s[2];
    let curL = s[3];
    for (let t = 0; t < 24; t++) {
      const shift = SHA3_ROTL[t];
      const Th = rotlH(curH, curL, shift);
      const Tl = rotlL(curH, curL, shift);
      const PI = SHA3_PI[t];
      curH = s[PI];
      curL = s[PI + 1];
      s[PI] = Th;
      s[PI + 1] = Tl;
    }
    for (let y = 0; y < 50; y += 10) {
      for (let x = 0; x < 10; x++)
        B[x] = s[y + x];
      for (let x = 0; x < 10; x++)
        s[y + x] ^= ~B[(x + 2) % 10] & B[(x + 4) % 10];
    }
    s[0] ^= SHA3_IOTA_H[round];
    s[1] ^= SHA3_IOTA_L[round];
  }
  B.fill(0);
}
var SHA3_PI, SHA3_ROTL, _SHA3_IOTA, _0n, _1n, _2n, _7n, _256n, _0x71n, SHA3_IOTA_H, SHA3_IOTA_L, rotlH, rotlL, Keccak, gen, sha3_224, sha3_256, sha3_384, sha3_512, keccak_224, keccak_256, keccak_384, keccak_512, genShake, shake128, shake256;
var init_sha3 = __esm({
  "node_modules/@noble/hashes/esm/sha3.js"() {
    init_assert();
    init_u64();
    init_utils2();
    SHA3_PI = [];
    SHA3_ROTL = [];
    _SHA3_IOTA = [];
    _0n = /* @__PURE__ */ BigInt(0);
    _1n = /* @__PURE__ */ BigInt(1);
    _2n = /* @__PURE__ */ BigInt(2);
    _7n = /* @__PURE__ */ BigInt(7);
    _256n = /* @__PURE__ */ BigInt(256);
    _0x71n = /* @__PURE__ */ BigInt(113);
    for (let round = 0, R = _1n, x = 1, y = 0; round < 24; round++) {
      [x, y] = [y, (2 * x + 3 * y) % 5];
      SHA3_PI.push(2 * (5 * y + x));
      SHA3_ROTL.push((round + 1) * (round + 2) / 2 % 64);
      let t = _0n;
      for (let j = 0; j < 7; j++) {
        R = (R << _1n ^ (R >> _7n) * _0x71n) % _256n;
        if (R & _2n)
          t ^= _1n << (_1n << /* @__PURE__ */ BigInt(j)) - _1n;
      }
      _SHA3_IOTA.push(t);
    }
    [SHA3_IOTA_H, SHA3_IOTA_L] = /* @__PURE__ */ split(_SHA3_IOTA, true);
    rotlH = (h, l, s) => s > 32 ? rotlBH(h, l, s) : rotlSH(h, l, s);
    rotlL = (h, l, s) => s > 32 ? rotlBL(h, l, s) : rotlSL(h, l, s);
    Keccak = class _Keccak extends Hash {
      // NOTE: we accept arguments in bytes instead of bits here.
      constructor(blockLen, suffix, outputLen, enableXOF = false, rounds = 24) {
        super();
        this.blockLen = blockLen;
        this.suffix = suffix;
        this.outputLen = outputLen;
        this.enableXOF = enableXOF;
        this.rounds = rounds;
        this.pos = 0;
        this.posOut = 0;
        this.finished = false;
        this.destroyed = false;
        anumber(outputLen);
        if (0 >= this.blockLen || this.blockLen >= 200)
          throw new Error("Sha3 supports only keccak-f1600 function");
        this.state = new Uint8Array(200);
        this.state32 = u32(this.state);
      }
      keccak() {
        if (!isLE)
          byteSwap32(this.state32);
        keccakP(this.state32, this.rounds);
        if (!isLE)
          byteSwap32(this.state32);
        this.posOut = 0;
        this.pos = 0;
      }
      update(data) {
        aexists(this);
        const { blockLen, state } = this;
        data = toBytes2(data);
        const len = data.length;
        for (let pos = 0; pos < len; ) {
          const take = Math.min(blockLen - this.pos, len - pos);
          for (let i = 0; i < take; i++)
            state[this.pos++] ^= data[pos++];
          if (this.pos === blockLen)
            this.keccak();
        }
        return this;
      }
      finish() {
        if (this.finished)
          return;
        this.finished = true;
        const { state, suffix, pos, blockLen } = this;
        state[pos] ^= suffix;
        if ((suffix & 128) !== 0 && pos === blockLen - 1)
          this.keccak();
        state[blockLen - 1] ^= 128;
        this.keccak();
      }
      writeInto(out) {
        aexists(this, false);
        abytes(out);
        this.finish();
        const bufferOut = this.state;
        const { blockLen } = this;
        for (let pos = 0, len = out.length; pos < len; ) {
          if (this.posOut >= blockLen)
            this.keccak();
          const take = Math.min(blockLen - this.posOut, len - pos);
          out.set(bufferOut.subarray(this.posOut, this.posOut + take), pos);
          this.posOut += take;
          pos += take;
        }
        return out;
      }
      xofInto(out) {
        if (!this.enableXOF)
          throw new Error("XOF is not possible for this instance");
        return this.writeInto(out);
      }
      xof(bytes) {
        anumber(bytes);
        return this.xofInto(new Uint8Array(bytes));
      }
      digestInto(out) {
        aoutput(out, this);
        if (this.finished)
          throw new Error("digest() was already called");
        this.writeInto(out);
        this.destroy();
        return out;
      }
      digest() {
        return this.digestInto(new Uint8Array(this.outputLen));
      }
      destroy() {
        this.destroyed = true;
        this.state.fill(0);
      }
      _cloneInto(to) {
        const { blockLen, suffix, outputLen, rounds, enableXOF } = this;
        to || (to = new _Keccak(blockLen, suffix, outputLen, enableXOF, rounds));
        to.state32.set(this.state32);
        to.pos = this.pos;
        to.posOut = this.posOut;
        to.finished = this.finished;
        to.rounds = rounds;
        to.suffix = suffix;
        to.outputLen = outputLen;
        to.enableXOF = enableXOF;
        to.destroyed = this.destroyed;
        return to;
      }
    };
    gen = (suffix, blockLen, outputLen) => wrapConstructor(() => new Keccak(blockLen, suffix, outputLen));
    sha3_224 = /* @__PURE__ */ gen(6, 144, 224 / 8);
    sha3_256 = /* @__PURE__ */ gen(6, 136, 256 / 8);
    sha3_384 = /* @__PURE__ */ gen(6, 104, 384 / 8);
    sha3_512 = /* @__PURE__ */ gen(6, 72, 512 / 8);
    keccak_224 = /* @__PURE__ */ gen(1, 144, 224 / 8);
    keccak_256 = /* @__PURE__ */ gen(1, 136, 256 / 8);
    keccak_384 = /* @__PURE__ */ gen(1, 104, 384 / 8);
    keccak_512 = /* @__PURE__ */ gen(1, 72, 512 / 8);
    genShake = (suffix, blockLen, outputLen) => wrapXOFConstructorWithOpts((opts = {}) => new Keccak(blockLen, suffix, opts.dkLen === void 0 ? outputLen : opts.dkLen, true));
    shake128 = /* @__PURE__ */ genShake(31, 168, 128 / 8);
    shake256 = /* @__PURE__ */ genShake(31, 136, 256 / 8);
  }
});

// node_modules/viem/_esm/utils/hash/keccak256.js
function keccak256(value, to_) {
  const to = to_ || "hex";
  const bytes = keccak_256(isHex(value, { strict: false }) ? toBytes(value) : value);
  if (to === "bytes")
    return bytes;
  return toHex(bytes);
}
var init_keccak256 = __esm({
  "node_modules/viem/_esm/utils/hash/keccak256.js"() {
    init_sha3();
    init_isHex();
    init_toBytes();
    init_toHex();
  }
});

// node_modules/viem/_esm/utils/hash/hashSignature.js
function hashSignature(sig) {
  return hash(sig);
}
var hash;
var init_hashSignature = __esm({
  "node_modules/viem/_esm/utils/hash/hashSignature.js"() {
    init_toBytes();
    init_keccak256();
    hash = (value) => keccak256(toBytes(value));
  }
});

// node_modules/viem/_esm/utils/hash/normalizeSignature.js
function normalizeSignature(signature) {
  let active = true;
  let current = "";
  let level = 0;
  let result = "";
  let valid = false;
  for (let i = 0; i < signature.length; i++) {
    const char = signature[i];
    if (["(", ")", ","].includes(char))
      active = true;
    if (char === "(")
      level++;
    if (char === ")")
      level--;
    if (!active)
      continue;
    if (level === 0) {
      if (char === " " && ["event", "function", ""].includes(result))
        result = "";
      else {
        result += char;
        if (char === ")") {
          valid = true;
          break;
        }
      }
      continue;
    }
    if (char === " ") {
      if (signature[i - 1] !== "," && current !== "," && current !== ",(") {
        current = "";
        active = false;
      }
      continue;
    }
    result += char;
    current += char;
  }
  if (!valid)
    throw new BaseError2("Unable to normalize signature.");
  return result;
}
var init_normalizeSignature = __esm({
  "node_modules/viem/_esm/utils/hash/normalizeSignature.js"() {
    init_base();
  }
});

// node_modules/viem/_esm/utils/hash/toSignature.js
var toSignature;
var init_toSignature = __esm({
  "node_modules/viem/_esm/utils/hash/toSignature.js"() {
    init_exports();
    init_normalizeSignature();
    toSignature = (def) => {
      const def_ = (() => {
        if (typeof def === "string")
          return def;
        return formatAbiItem(def);
      })();
      return normalizeSignature(def_);
    };
  }
});

// node_modules/viem/_esm/utils/hash/toSignatureHash.js
function toSignatureHash(fn) {
  return hashSignature(toSignature(fn));
}
var init_toSignatureHash = __esm({
  "node_modules/viem/_esm/utils/hash/toSignatureHash.js"() {
    init_hashSignature();
    init_toSignature();
  }
});

// node_modules/viem/_esm/utils/hash/toEventSelector.js
var toEventSelector;
var init_toEventSelector = __esm({
  "node_modules/viem/_esm/utils/hash/toEventSelector.js"() {
    init_toSignatureHash();
    toEventSelector = toSignatureHash;
  }
});

// node_modules/viem/_esm/errors/address.js
var InvalidAddressError;
var init_address = __esm({
  "node_modules/viem/_esm/errors/address.js"() {
    init_base();
    InvalidAddressError = class extends BaseError2 {
      constructor({ address }) {
        super(`Address "${address}" is invalid.`, {
          metaMessages: [
            "- Address must be a hex value of 20 bytes (40 hex characters).",
            "- Address must match its checksum counterpart."
          ],
          name: "InvalidAddressError"
        });
      }
    };
  }
});

// node_modules/viem/_esm/utils/lru.js
var LruMap;
var init_lru = __esm({
  "node_modules/viem/_esm/utils/lru.js"() {
    LruMap = class extends Map {
      constructor(size2) {
        super();
        Object.defineProperty(this, "maxSize", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.maxSize = size2;
      }
      get(key) {
        const value = super.get(key);
        if (super.has(key) && value !== void 0) {
          this.delete(key);
          super.set(key, value);
        }
        return value;
      }
      set(key, value) {
        super.set(key, value);
        if (this.maxSize && this.size > this.maxSize) {
          const firstKey = this.keys().next().value;
          if (firstKey)
            this.delete(firstKey);
        }
        return this;
      }
    };
  }
});

// node_modules/viem/_esm/utils/address/getAddress.js
function checksumAddress(address_, chainId) {
  if (checksumAddressCache.has(`${address_}.${chainId}`))
    return checksumAddressCache.get(`${address_}.${chainId}`);
  const hexAddress = chainId ? `${chainId}${address_.toLowerCase()}` : address_.substring(2).toLowerCase();
  const hash2 = keccak256(stringToBytes(hexAddress), "bytes");
  const address = (chainId ? hexAddress.substring(`${chainId}0x`.length) : hexAddress).split("");
  for (let i = 0; i < 40; i += 2) {
    if (hash2[i >> 1] >> 4 >= 8 && address[i]) {
      address[i] = address[i].toUpperCase();
    }
    if ((hash2[i >> 1] & 15) >= 8 && address[i + 1]) {
      address[i + 1] = address[i + 1].toUpperCase();
    }
  }
  const result = `0x${address.join("")}`;
  checksumAddressCache.set(`${address_}.${chainId}`, result);
  return result;
}
var checksumAddressCache;
var init_getAddress = __esm({
  "node_modules/viem/_esm/utils/address/getAddress.js"() {
    init_toBytes();
    init_keccak256();
    init_lru();
    checksumAddressCache = /* @__PURE__ */ new LruMap(8192);
  }
});

// node_modules/viem/_esm/utils/address/isAddress.js
function isAddress(address, options) {
  const { strict = true } = options ?? {};
  const cacheKey = `${address}.${strict}`;
  if (isAddressCache.has(cacheKey))
    return isAddressCache.get(cacheKey);
  const result = (() => {
    if (!addressRegex.test(address))
      return false;
    if (address.toLowerCase() === address)
      return true;
    if (strict)
      return checksumAddress(address) === address;
    return true;
  })();
  isAddressCache.set(cacheKey, result);
  return result;
}
var addressRegex, isAddressCache;
var init_isAddress = __esm({
  "node_modules/viem/_esm/utils/address/isAddress.js"() {
    init_lru();
    init_getAddress();
    addressRegex = /^0x[a-fA-F0-9]{40}$/;
    isAddressCache = /* @__PURE__ */ new LruMap(8192);
  }
});

// node_modules/viem/_esm/utils/data/concat.js
function concat(values) {
  if (typeof values[0] === "string")
    return concatHex(values);
  return concatBytes(values);
}
function concatBytes(values) {
  let length = 0;
  for (const arr of values) {
    length += arr.length;
  }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const arr of values) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}
function concatHex(values) {
  return `0x${values.reduce((acc, x) => acc + x.replace("0x", ""), "")}`;
}
var init_concat = __esm({
  "node_modules/viem/_esm/utils/data/concat.js"() {
  }
});

// node_modules/viem/_esm/utils/data/slice.js
function slice(value, start, end, { strict } = {}) {
  if (isHex(value, { strict: false }))
    return sliceHex(value, start, end, {
      strict
    });
  return sliceBytes(value, start, end, {
    strict
  });
}
function assertStartOffset(value, start) {
  if (typeof start === "number" && start > 0 && start > size(value) - 1)
    throw new SliceOffsetOutOfBoundsError({
      offset: start,
      position: "start",
      size: size(value)
    });
}
function assertEndOffset(value, start, end) {
  if (typeof start === "number" && typeof end === "number" && size(value) !== end - start) {
    throw new SliceOffsetOutOfBoundsError({
      offset: end,
      position: "end",
      size: size(value)
    });
  }
}
function sliceBytes(value_, start, end, { strict } = {}) {
  assertStartOffset(value_, start);
  const value = value_.slice(start, end);
  if (strict)
    assertEndOffset(value, start, end);
  return value;
}
function sliceHex(value_, start, end, { strict } = {}) {
  assertStartOffset(value_, start);
  const value = `0x${value_.replace("0x", "").slice((start ?? 0) * 2, (end ?? value_.length) * 2)}`;
  if (strict)
    assertEndOffset(value, start, end);
  return value;
}
var init_slice = __esm({
  "node_modules/viem/_esm/utils/data/slice.js"() {
    init_data();
    init_isHex();
    init_size();
  }
});

// node_modules/viem/_esm/utils/regex.js
var integerRegex2;
var init_regex2 = __esm({
  "node_modules/viem/_esm/utils/regex.js"() {
    integerRegex2 = /^(u?int)(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?$/;
  }
});

// node_modules/viem/_esm/utils/abi/encodeAbiParameters.js
function encodeAbiParameters(params, values) {
  if (params.length !== values.length)
    throw new AbiEncodingLengthMismatchError({
      expectedLength: params.length,
      givenLength: values.length
    });
  const preparedParams = prepareParams({
    params,
    values
  });
  const data = encodeParams(preparedParams);
  if (data.length === 0)
    return "0x";
  return data;
}
function prepareParams({ params, values }) {
  const preparedParams = [];
  for (let i = 0; i < params.length; i++) {
    preparedParams.push(prepareParam({ param: params[i], value: values[i] }));
  }
  return preparedParams;
}
function prepareParam({ param, value }) {
  const arrayComponents = getArrayComponents(param.type);
  if (arrayComponents) {
    const [length, type] = arrayComponents;
    return encodeArray(value, { length, param: { ...param, type } });
  }
  if (param.type === "tuple") {
    return encodeTuple(value, {
      param
    });
  }
  if (param.type === "address") {
    return encodeAddress(value);
  }
  if (param.type === "bool") {
    return encodeBool(value);
  }
  if (param.type.startsWith("uint") || param.type.startsWith("int")) {
    const signed = param.type.startsWith("int");
    const [, , size2 = "256"] = integerRegex2.exec(param.type) ?? [];
    return encodeNumber(value, {
      signed,
      size: Number(size2)
    });
  }
  if (param.type.startsWith("bytes")) {
    return encodeBytes(value, { param });
  }
  if (param.type === "string") {
    return encodeString(value);
  }
  throw new InvalidAbiEncodingTypeError(param.type, {
    docsPath: "/docs/contract/encodeAbiParameters"
  });
}
function encodeParams(preparedParams) {
  let staticSize = 0;
  for (let i = 0; i < preparedParams.length; i++) {
    const { dynamic, encoded } = preparedParams[i];
    if (dynamic)
      staticSize += 32;
    else
      staticSize += size(encoded);
  }
  const staticParams = [];
  const dynamicParams = [];
  let dynamicSize = 0;
  for (let i = 0; i < preparedParams.length; i++) {
    const { dynamic, encoded } = preparedParams[i];
    if (dynamic) {
      staticParams.push(numberToHex(staticSize + dynamicSize, { size: 32 }));
      dynamicParams.push(encoded);
      dynamicSize += size(encoded);
    } else {
      staticParams.push(encoded);
    }
  }
  return concat([...staticParams, ...dynamicParams]);
}
function encodeAddress(value) {
  if (!isAddress(value))
    throw new InvalidAddressError({ address: value });
  return { dynamic: false, encoded: padHex(value.toLowerCase()) };
}
function encodeArray(value, { length, param }) {
  const dynamic = length === null;
  if (!Array.isArray(value))
    throw new InvalidArrayError(value);
  if (!dynamic && value.length !== length)
    throw new AbiEncodingArrayLengthMismatchError({
      expectedLength: length,
      givenLength: value.length,
      type: `${param.type}[${length}]`
    });
  let dynamicChild = false;
  const preparedParams = [];
  for (let i = 0; i < value.length; i++) {
    const preparedParam = prepareParam({ param, value: value[i] });
    if (preparedParam.dynamic)
      dynamicChild = true;
    preparedParams.push(preparedParam);
  }
  if (dynamic || dynamicChild) {
    const data = encodeParams(preparedParams);
    if (dynamic) {
      const length2 = numberToHex(preparedParams.length, { size: 32 });
      return {
        dynamic: true,
        encoded: preparedParams.length > 0 ? concat([length2, data]) : length2
      };
    }
    if (dynamicChild)
      return { dynamic: true, encoded: data };
  }
  return {
    dynamic: false,
    encoded: concat(preparedParams.map(({ encoded }) => encoded))
  };
}
function encodeBytes(value, { param }) {
  const [, paramSize] = param.type.split("bytes");
  const bytesSize = size(value);
  if (!paramSize) {
    let value_ = value;
    if (bytesSize % 32 !== 0)
      value_ = padHex(value_, {
        dir: "right",
        size: Math.ceil((value.length - 2) / 2 / 32) * 32
      });
    return {
      dynamic: true,
      encoded: concat([padHex(numberToHex(bytesSize, { size: 32 })), value_])
    };
  }
  if (bytesSize !== Number.parseInt(paramSize))
    throw new AbiEncodingBytesSizeMismatchError({
      expectedSize: Number.parseInt(paramSize),
      value
    });
  return { dynamic: false, encoded: padHex(value, { dir: "right" }) };
}
function encodeBool(value) {
  if (typeof value !== "boolean")
    throw new BaseError2(`Invalid boolean value: "${value}" (type: ${typeof value}). Expected: \`true\` or \`false\`.`);
  return { dynamic: false, encoded: padHex(boolToHex(value)) };
}
function encodeNumber(value, { signed, size: size2 = 256 }) {
  if (typeof size2 === "number") {
    const max = 2n ** (BigInt(size2) - (signed ? 1n : 0n)) - 1n;
    const min = signed ? -max - 1n : 0n;
    if (value > max || value < min)
      throw new IntegerOutOfRangeError({
        max: max.toString(),
        min: min.toString(),
        signed,
        size: size2 / 8,
        value: value.toString()
      });
  }
  return {
    dynamic: false,
    encoded: numberToHex(value, {
      size: 32,
      signed
    })
  };
}
function encodeString(value) {
  const hexValue = stringToHex(value);
  const partsLength = Math.ceil(size(hexValue) / 32);
  const parts = [];
  for (let i = 0; i < partsLength; i++) {
    parts.push(padHex(slice(hexValue, i * 32, (i + 1) * 32), {
      dir: "right"
    }));
  }
  return {
    dynamic: true,
    encoded: concat([
      padHex(numberToHex(size(hexValue), { size: 32 })),
      ...parts
    ])
  };
}
function encodeTuple(value, { param }) {
  let dynamic = false;
  const preparedParams = [];
  for (let i = 0; i < param.components.length; i++) {
    const param_ = param.components[i];
    const index = Array.isArray(value) ? i : param_.name;
    const preparedParam = prepareParam({
      param: param_,
      value: value[index]
    });
    preparedParams.push(preparedParam);
    if (preparedParam.dynamic)
      dynamic = true;
  }
  return {
    dynamic,
    encoded: dynamic ? encodeParams(preparedParams) : concat(preparedParams.map(({ encoded }) => encoded))
  };
}
function getArrayComponents(type) {
  const matches = type.match(/^(.*)\[(\d+)?\]$/);
  return matches ? (
    // Return `null` if the array is dynamic.
    [matches[2] ? Number(matches[2]) : null, matches[1]]
  ) : void 0;
}
var init_encodeAbiParameters = __esm({
  "node_modules/viem/_esm/utils/abi/encodeAbiParameters.js"() {
    init_abi();
    init_address();
    init_base();
    init_encoding();
    init_isAddress();
    init_concat();
    init_pad();
    init_size();
    init_slice();
    init_toHex();
    init_regex2();
  }
});

// node_modules/viem/_esm/utils/hash/toFunctionSelector.js
var toFunctionSelector;
var init_toFunctionSelector = __esm({
  "node_modules/viem/_esm/utils/hash/toFunctionSelector.js"() {
    init_slice();
    init_toSignatureHash();
    toFunctionSelector = (fn) => slice(toSignatureHash(fn), 0, 4);
  }
});

// node_modules/viem/_esm/utils/abi/getAbiItem.js
function getAbiItem(parameters) {
  const { abi, args = [], name } = parameters;
  const isSelector = isHex(name, { strict: false });
  const abiItems = abi.filter((abiItem) => {
    if (isSelector) {
      if (abiItem.type === "function")
        return toFunctionSelector(abiItem) === name;
      if (abiItem.type === "event")
        return toEventSelector(abiItem) === name;
      return false;
    }
    return "name" in abiItem && abiItem.name === name;
  });
  if (abiItems.length === 0)
    return void 0;
  if (abiItems.length === 1)
    return abiItems[0];
  let matchedAbiItem = void 0;
  for (const abiItem of abiItems) {
    if (!("inputs" in abiItem))
      continue;
    if (!args || args.length === 0) {
      if (!abiItem.inputs || abiItem.inputs.length === 0)
        return abiItem;
      continue;
    }
    if (!abiItem.inputs)
      continue;
    if (abiItem.inputs.length === 0)
      continue;
    if (abiItem.inputs.length !== args.length)
      continue;
    const matched = args.every((arg, index) => {
      const abiParameter = "inputs" in abiItem && abiItem.inputs[index];
      if (!abiParameter)
        return false;
      return isArgOfType(arg, abiParameter);
    });
    if (matched) {
      if (matchedAbiItem && "inputs" in matchedAbiItem && matchedAbiItem.inputs) {
        const ambiguousTypes = getAmbiguousTypes(abiItem.inputs, matchedAbiItem.inputs, args);
        if (ambiguousTypes)
          throw new AbiItemAmbiguityError({
            abiItem,
            type: ambiguousTypes[0]
          }, {
            abiItem: matchedAbiItem,
            type: ambiguousTypes[1]
          });
      }
      matchedAbiItem = abiItem;
    }
  }
  if (matchedAbiItem)
    return matchedAbiItem;
  return abiItems[0];
}
function isArgOfType(arg, abiParameter) {
  const argType = typeof arg;
  const abiParameterType = abiParameter.type;
  switch (abiParameterType) {
    case "address":
      return isAddress(arg, { strict: false });
    case "bool":
      return argType === "boolean";
    case "function":
      return argType === "string";
    case "string":
      return argType === "string";
    default: {
      if (abiParameterType === "tuple" && "components" in abiParameter)
        return Object.values(abiParameter.components).every((component, index) => {
          return isArgOfType(Object.values(arg)[index], component);
        });
      if (/^u?int(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?$/.test(abiParameterType))
        return argType === "number" || argType === "bigint";
      if (/^bytes([1-9]|1[0-9]|2[0-9]|3[0-2])?$/.test(abiParameterType))
        return argType === "string" || arg instanceof Uint8Array;
      if (/[a-z]+[1-9]{0,3}(\[[0-9]{0,}\])+$/.test(abiParameterType)) {
        return Array.isArray(arg) && arg.every((x) => isArgOfType(x, {
          ...abiParameter,
          // Pop off `[]` or `[M]` from end of type
          type: abiParameterType.replace(/(\[[0-9]{0,}\])$/, "")
        }));
      }
      return false;
    }
  }
}
function getAmbiguousTypes(sourceParameters, targetParameters, args) {
  for (const parameterIndex in sourceParameters) {
    const sourceParameter = sourceParameters[parameterIndex];
    const targetParameter = targetParameters[parameterIndex];
    if (sourceParameter.type === "tuple" && targetParameter.type === "tuple" && "components" in sourceParameter && "components" in targetParameter)
      return getAmbiguousTypes(sourceParameter.components, targetParameter.components, args[parameterIndex]);
    const types2 = [sourceParameter.type, targetParameter.type];
    const ambiguous = (() => {
      if (types2.includes("address") && types2.includes("bytes20"))
        return true;
      if (types2.includes("address") && types2.includes("string"))
        return isAddress(args[parameterIndex], { strict: false });
      if (types2.includes("address") && types2.includes("bytes"))
        return isAddress(args[parameterIndex], { strict: false });
      return false;
    })();
    if (ambiguous)
      return types2;
  }
  return;
}
var init_getAbiItem = __esm({
  "node_modules/viem/_esm/utils/abi/getAbiItem.js"() {
    init_abi();
    init_isHex();
    init_isAddress();
    init_toEventSelector();
    init_toFunctionSelector();
  }
});

// node_modules/viem/_esm/utils/abi/prepareEncodeFunctionData.js
function prepareEncodeFunctionData(parameters) {
  const { abi, args, functionName } = parameters;
  let abiItem = abi[0];
  if (functionName) {
    const item = getAbiItem({
      abi,
      args,
      name: functionName
    });
    if (!item)
      throw new AbiFunctionNotFoundError(functionName, { docsPath });
    abiItem = item;
  }
  if (abiItem.type !== "function")
    throw new AbiFunctionNotFoundError(void 0, { docsPath });
  return {
    abi: [abiItem],
    functionName: toFunctionSelector(formatAbiItem2(abiItem))
  };
}
var docsPath;
var init_prepareEncodeFunctionData = __esm({
  "node_modules/viem/_esm/utils/abi/prepareEncodeFunctionData.js"() {
    init_abi();
    init_toFunctionSelector();
    init_formatAbiItem2();
    init_getAbiItem();
    docsPath = "/docs/contract/encodeFunctionData";
  }
});

// node_modules/viem/_esm/utils/abi/encodeFunctionData.js
function encodeFunctionData(parameters) {
  const { args } = parameters;
  const { abi, functionName } = (() => {
    if (parameters.abi.length === 1 && parameters.functionName?.startsWith("0x"))
      return parameters;
    return prepareEncodeFunctionData(parameters);
  })();
  const abiItem = abi[0];
  const signature = functionName;
  const data = "inputs" in abiItem && abiItem.inputs ? encodeAbiParameters(abiItem.inputs, args ?? []) : void 0;
  return concatHex([signature, data ?? "0x"]);
}
var init_encodeFunctionData = __esm({
  "node_modules/viem/_esm/utils/abi/encodeFunctionData.js"() {
    init_concat();
    init_encodeAbiParameters();
    init_prepareEncodeFunctionData();
  }
});

// node_modules/viem/_esm/errors/cursor.js
var NegativeOffsetError, PositionOutOfBoundsError, RecursiveReadLimitExceededError;
var init_cursor = __esm({
  "node_modules/viem/_esm/errors/cursor.js"() {
    init_base();
    NegativeOffsetError = class extends BaseError2 {
      constructor({ offset }) {
        super(`Offset \`${offset}\` cannot be negative.`, {
          name: "NegativeOffsetError"
        });
      }
    };
    PositionOutOfBoundsError = class extends BaseError2 {
      constructor({ length, position }) {
        super(`Position \`${position}\` is out of bounds (\`0 < position < ${length}\`).`, { name: "PositionOutOfBoundsError" });
      }
    };
    RecursiveReadLimitExceededError = class extends BaseError2 {
      constructor({ count, limit }) {
        super(`Recursive read limit of \`${limit}\` exceeded (recursive read count: \`${count}\`).`, { name: "RecursiveReadLimitExceededError" });
      }
    };
  }
});

// node_modules/viem/_esm/utils/cursor.js
function createCursor(bytes, { recursiveReadLimit = 8192 } = {}) {
  const cursor = Object.create(staticCursor);
  cursor.bytes = bytes;
  cursor.dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  cursor.positionReadCount = /* @__PURE__ */ new Map();
  cursor.recursiveReadLimit = recursiveReadLimit;
  return cursor;
}
var staticCursor;
var init_cursor2 = __esm({
  "node_modules/viem/_esm/utils/cursor.js"() {
    init_cursor();
    staticCursor = {
      bytes: new Uint8Array(),
      dataView: new DataView(new ArrayBuffer(0)),
      position: 0,
      positionReadCount: /* @__PURE__ */ new Map(),
      recursiveReadCount: 0,
      recursiveReadLimit: Number.POSITIVE_INFINITY,
      assertReadLimit() {
        if (this.recursiveReadCount >= this.recursiveReadLimit)
          throw new RecursiveReadLimitExceededError({
            count: this.recursiveReadCount + 1,
            limit: this.recursiveReadLimit
          });
      },
      assertPosition(position) {
        if (position < 0 || position > this.bytes.length - 1)
          throw new PositionOutOfBoundsError({
            length: this.bytes.length,
            position
          });
      },
      decrementPosition(offset) {
        if (offset < 0)
          throw new NegativeOffsetError({ offset });
        const position = this.position - offset;
        this.assertPosition(position);
        this.position = position;
      },
      getReadCount(position) {
        return this.positionReadCount.get(position || this.position) || 0;
      },
      incrementPosition(offset) {
        if (offset < 0)
          throw new NegativeOffsetError({ offset });
        const position = this.position + offset;
        this.assertPosition(position);
        this.position = position;
      },
      inspectByte(position_) {
        const position = position_ ?? this.position;
        this.assertPosition(position);
        return this.bytes[position];
      },
      inspectBytes(length, position_) {
        const position = position_ ?? this.position;
        this.assertPosition(position + length - 1);
        return this.bytes.subarray(position, position + length);
      },
      inspectUint8(position_) {
        const position = position_ ?? this.position;
        this.assertPosition(position);
        return this.bytes[position];
      },
      inspectUint16(position_) {
        const position = position_ ?? this.position;
        this.assertPosition(position + 1);
        return this.dataView.getUint16(position);
      },
      inspectUint24(position_) {
        const position = position_ ?? this.position;
        this.assertPosition(position + 2);
        return (this.dataView.getUint16(position) << 8) + this.dataView.getUint8(position + 2);
      },
      inspectUint32(position_) {
        const position = position_ ?? this.position;
        this.assertPosition(position + 3);
        return this.dataView.getUint32(position);
      },
      pushByte(byte) {
        this.assertPosition(this.position);
        this.bytes[this.position] = byte;
        this.position++;
      },
      pushBytes(bytes) {
        this.assertPosition(this.position + bytes.length - 1);
        this.bytes.set(bytes, this.position);
        this.position += bytes.length;
      },
      pushUint8(value) {
        this.assertPosition(this.position);
        this.bytes[this.position] = value;
        this.position++;
      },
      pushUint16(value) {
        this.assertPosition(this.position + 1);
        this.dataView.setUint16(this.position, value);
        this.position += 2;
      },
      pushUint24(value) {
        this.assertPosition(this.position + 2);
        this.dataView.setUint16(this.position, value >> 8);
        this.dataView.setUint8(this.position + 2, value & ~4294967040);
        this.position += 3;
      },
      pushUint32(value) {
        this.assertPosition(this.position + 3);
        this.dataView.setUint32(this.position, value);
        this.position += 4;
      },
      readByte() {
        this.assertReadLimit();
        this._touch();
        const value = this.inspectByte();
        this.position++;
        return value;
      },
      readBytes(length, size2) {
        this.assertReadLimit();
        this._touch();
        const value = this.inspectBytes(length);
        this.position += size2 ?? length;
        return value;
      },
      readUint8() {
        this.assertReadLimit();
        this._touch();
        const value = this.inspectUint8();
        this.position += 1;
        return value;
      },
      readUint16() {
        this.assertReadLimit();
        this._touch();
        const value = this.inspectUint16();
        this.position += 2;
        return value;
      },
      readUint24() {
        this.assertReadLimit();
        this._touch();
        const value = this.inspectUint24();
        this.position += 3;
        return value;
      },
      readUint32() {
        this.assertReadLimit();
        this._touch();
        const value = this.inspectUint32();
        this.position += 4;
        return value;
      },
      get remaining() {
        return this.bytes.length - this.position;
      },
      setPosition(position) {
        const oldPosition = this.position;
        this.assertPosition(position);
        this.position = position;
        return () => this.position = oldPosition;
      },
      _touch() {
        if (this.recursiveReadLimit === Number.POSITIVE_INFINITY)
          return;
        const count = this.getReadCount();
        this.positionReadCount.set(this.position, count + 1);
        if (count > 0)
          this.recursiveReadCount++;
      }
    };
  }
});

// node_modules/viem/_esm/utils/encoding/fromBytes.js
function bytesToBigInt(bytes, opts = {}) {
  if (typeof opts.size !== "undefined")
    assertSize(bytes, { size: opts.size });
  const hex = bytesToHex(bytes, opts);
  return hexToBigInt(hex, opts);
}
function bytesToBool(bytes_, opts = {}) {
  let bytes = bytes_;
  if (typeof opts.size !== "undefined") {
    assertSize(bytes, { size: opts.size });
    bytes = trim(bytes);
  }
  if (bytes.length > 1 || bytes[0] > 1)
    throw new InvalidBytesBooleanError(bytes);
  return Boolean(bytes[0]);
}
function bytesToNumber(bytes, opts = {}) {
  if (typeof opts.size !== "undefined")
    assertSize(bytes, { size: opts.size });
  const hex = bytesToHex(bytes, opts);
  return hexToNumber(hex, opts);
}
function bytesToString(bytes_, opts = {}) {
  let bytes = bytes_;
  if (typeof opts.size !== "undefined") {
    assertSize(bytes, { size: opts.size });
    bytes = trim(bytes, { dir: "right" });
  }
  return new TextDecoder().decode(bytes);
}
var init_fromBytes = __esm({
  "node_modules/viem/_esm/utils/encoding/fromBytes.js"() {
    init_encoding();
    init_trim();
    init_fromHex();
    init_toHex();
  }
});

// node_modules/viem/_esm/utils/abi/decodeAbiParameters.js
function decodeAbiParameters(params, data) {
  const bytes = typeof data === "string" ? hexToBytes(data) : data;
  const cursor = createCursor(bytes);
  if (size(bytes) === 0 && params.length > 0)
    throw new AbiDecodingZeroDataError();
  if (size(data) && size(data) < 32)
    throw new AbiDecodingDataSizeTooSmallError({
      data: typeof data === "string" ? data : bytesToHex(data),
      params,
      size: size(data)
    });
  let consumed = 0;
  const values = [];
  for (let i = 0; i < params.length; ++i) {
    const param = params[i];
    cursor.setPosition(consumed);
    const [data2, consumed_] = decodeParameter(cursor, param, {
      staticPosition: 0
    });
    consumed += consumed_;
    values.push(data2);
  }
  return values;
}
function decodeParameter(cursor, param, { staticPosition }) {
  const arrayComponents = getArrayComponents(param.type);
  if (arrayComponents) {
    const [length, type] = arrayComponents;
    return decodeArray(cursor, { ...param, type }, { length, staticPosition });
  }
  if (param.type === "tuple")
    return decodeTuple(cursor, param, { staticPosition });
  if (param.type === "address")
    return decodeAddress(cursor);
  if (param.type === "bool")
    return decodeBool(cursor);
  if (param.type.startsWith("bytes"))
    return decodeBytes(cursor, param, { staticPosition });
  if (param.type.startsWith("uint") || param.type.startsWith("int"))
    return decodeNumber(cursor, param);
  if (param.type === "string")
    return decodeString(cursor, { staticPosition });
  throw new InvalidAbiDecodingTypeError(param.type, {
    docsPath: "/docs/contract/decodeAbiParameters"
  });
}
function decodeAddress(cursor) {
  const value = cursor.readBytes(32);
  return [checksumAddress(bytesToHex(sliceBytes(value, -20))), 32];
}
function decodeArray(cursor, param, { length, staticPosition }) {
  if (!length) {
    const offset = bytesToNumber(cursor.readBytes(sizeOfOffset));
    const start = staticPosition + offset;
    const startOfData = start + sizeOfLength;
    cursor.setPosition(start);
    const length2 = bytesToNumber(cursor.readBytes(sizeOfLength));
    const dynamicChild = hasDynamicChild(param);
    let consumed2 = 0;
    const value2 = [];
    for (let i = 0; i < length2; ++i) {
      cursor.setPosition(startOfData + (dynamicChild ? i * 32 : consumed2));
      const [data, consumed_] = decodeParameter(cursor, param, {
        staticPosition: startOfData
      });
      consumed2 += consumed_;
      value2.push(data);
    }
    cursor.setPosition(staticPosition + 32);
    return [value2, 32];
  }
  if (hasDynamicChild(param)) {
    const offset = bytesToNumber(cursor.readBytes(sizeOfOffset));
    const start = staticPosition + offset;
    const value2 = [];
    for (let i = 0; i < length; ++i) {
      cursor.setPosition(start + i * 32);
      const [data] = decodeParameter(cursor, param, {
        staticPosition: start
      });
      value2.push(data);
    }
    cursor.setPosition(staticPosition + 32);
    return [value2, 32];
  }
  let consumed = 0;
  const value = [];
  for (let i = 0; i < length; ++i) {
    const [data, consumed_] = decodeParameter(cursor, param, {
      staticPosition: staticPosition + consumed
    });
    consumed += consumed_;
    value.push(data);
  }
  return [value, consumed];
}
function decodeBool(cursor) {
  return [bytesToBool(cursor.readBytes(32), { size: 32 }), 32];
}
function decodeBytes(cursor, param, { staticPosition }) {
  const [_, size2] = param.type.split("bytes");
  if (!size2) {
    const offset = bytesToNumber(cursor.readBytes(32));
    cursor.setPosition(staticPosition + offset);
    const length = bytesToNumber(cursor.readBytes(32));
    if (length === 0) {
      cursor.setPosition(staticPosition + 32);
      return ["0x", 32];
    }
    const data = cursor.readBytes(length);
    cursor.setPosition(staticPosition + 32);
    return [bytesToHex(data), 32];
  }
  const value = bytesToHex(cursor.readBytes(Number.parseInt(size2), 32));
  return [value, 32];
}
function decodeNumber(cursor, param) {
  const signed = param.type.startsWith("int");
  const size2 = Number.parseInt(param.type.split("int")[1] || "256");
  const value = cursor.readBytes(32);
  return [
    size2 > 48 ? bytesToBigInt(value, { signed }) : bytesToNumber(value, { signed }),
    32
  ];
}
function decodeTuple(cursor, param, { staticPosition }) {
  const hasUnnamedChild = param.components.length === 0 || param.components.some(({ name }) => !name);
  const value = hasUnnamedChild ? [] : {};
  let consumed = 0;
  if (hasDynamicChild(param)) {
    const offset = bytesToNumber(cursor.readBytes(sizeOfOffset));
    const start = staticPosition + offset;
    for (let i = 0; i < param.components.length; ++i) {
      const component = param.components[i];
      cursor.setPosition(start + consumed);
      const [data, consumed_] = decodeParameter(cursor, component, {
        staticPosition: start
      });
      consumed += consumed_;
      value[hasUnnamedChild ? i : component?.name] = data;
    }
    cursor.setPosition(staticPosition + 32);
    return [value, 32];
  }
  for (let i = 0; i < param.components.length; ++i) {
    const component = param.components[i];
    const [data, consumed_] = decodeParameter(cursor, component, {
      staticPosition
    });
    value[hasUnnamedChild ? i : component?.name] = data;
    consumed += consumed_;
  }
  return [value, consumed];
}
function decodeString(cursor, { staticPosition }) {
  const offset = bytesToNumber(cursor.readBytes(32));
  const start = staticPosition + offset;
  cursor.setPosition(start);
  const length = bytesToNumber(cursor.readBytes(32));
  if (length === 0) {
    cursor.setPosition(staticPosition + 32);
    return ["", 32];
  }
  const data = cursor.readBytes(length, 32);
  const value = bytesToString(trim(data));
  cursor.setPosition(staticPosition + 32);
  return [value, 32];
}
function hasDynamicChild(param) {
  const { type } = param;
  if (type === "string")
    return true;
  if (type === "bytes")
    return true;
  if (type.endsWith("[]"))
    return true;
  if (type === "tuple")
    return param.components?.some(hasDynamicChild);
  const arrayComponents = getArrayComponents(param.type);
  if (arrayComponents && hasDynamicChild({ ...param, type: arrayComponents[1] }))
    return true;
  return false;
}
var sizeOfLength, sizeOfOffset;
var init_decodeAbiParameters = __esm({
  "node_modules/viem/_esm/utils/abi/decodeAbiParameters.js"() {
    init_abi();
    init_getAddress();
    init_cursor2();
    init_size();
    init_slice();
    init_trim();
    init_fromBytes();
    init_toBytes();
    init_toHex();
    init_encodeAbiParameters();
    sizeOfLength = 32;
    sizeOfOffset = 32;
  }
});

// node_modules/viem/_esm/utils/abi/decodeFunctionResult.js
function decodeFunctionResult(parameters) {
  const { abi, args, functionName, data } = parameters;
  let abiItem = abi[0];
  if (functionName) {
    const item = getAbiItem({ abi, args, name: functionName });
    if (!item)
      throw new AbiFunctionNotFoundError(functionName, { docsPath: docsPath2 });
    abiItem = item;
  }
  if (abiItem.type !== "function")
    throw new AbiFunctionNotFoundError(void 0, { docsPath: docsPath2 });
  if (!abiItem.outputs)
    throw new AbiFunctionOutputsNotFoundError(abiItem.name, { docsPath: docsPath2 });
  const values = decodeAbiParameters(abiItem.outputs, data);
  if (values && values.length > 1)
    return values;
  if (values && values.length === 1)
    return values[0];
  return void 0;
}
var docsPath2;
var init_decodeFunctionResult = __esm({
  "node_modules/viem/_esm/utils/abi/decodeFunctionResult.js"() {
    init_abi();
    init_decodeAbiParameters();
    init_getAbiItem();
    docsPath2 = "/docs/contract/decodeFunctionResult";
  }
});

// node_modules/postgres-array/index.js
var require_postgres_array = __commonJS({
  "node_modules/postgres-array/index.js"(exports) {
    "use strict";
    exports.parse = function(source, transform) {
      return new ArrayParser(source, transform).parse();
    };
    var ArrayParser = class _ArrayParser {
      constructor(source, transform) {
        this.source = source;
        this.transform = transform || identity;
        this.position = 0;
        this.entries = [];
        this.recorded = [];
        this.dimension = 0;
      }
      isEof() {
        return this.position >= this.source.length;
      }
      nextCharacter() {
        var character = this.source[this.position++];
        if (character === "\\") {
          return {
            value: this.source[this.position++],
            escaped: true
          };
        }
        return {
          value: character,
          escaped: false
        };
      }
      record(character) {
        this.recorded.push(character);
      }
      newEntry(includeEmpty) {
        var entry;
        if (this.recorded.length > 0 || includeEmpty) {
          entry = this.recorded.join("");
          if (entry === "NULL" && !includeEmpty) {
            entry = null;
          }
          if (entry !== null) entry = this.transform(entry);
          this.entries.push(entry);
          this.recorded = [];
        }
      }
      consumeDimensions() {
        if (this.source[0] === "[") {
          while (!this.isEof()) {
            var char = this.nextCharacter();
            if (char.value === "=") break;
          }
        }
      }
      parse(nested) {
        var character, parser, quote;
        this.consumeDimensions();
        while (!this.isEof()) {
          character = this.nextCharacter();
          if (character.value === "{" && !quote) {
            this.dimension++;
            if (this.dimension > 1) {
              parser = new _ArrayParser(this.source.substr(this.position - 1), this.transform);
              this.entries.push(parser.parse(true));
              this.position += parser.position - 2;
            }
          } else if (character.value === "}" && !quote) {
            this.dimension--;
            if (!this.dimension) {
              this.newEntry();
              if (nested) return this.entries;
            }
          } else if (character.value === '"' && !character.escaped) {
            if (quote) this.newEntry(true);
            quote = !quote;
          } else if (character.value === "," && !quote) {
            this.newEntry();
          } else {
            this.record(character.value);
          }
        }
        if (this.dimension !== 0) {
          throw new Error("array dimension not balanced");
        }
        return this.entries;
      }
    };
    function identity(value) {
      return value;
    }
  }
});

// node_modules/pg-types/lib/arrayParser.js
var require_arrayParser = __commonJS({
  "node_modules/pg-types/lib/arrayParser.js"(exports, module) {
    var array = require_postgres_array();
    module.exports = {
      create: function(source, transform) {
        return {
          parse: function() {
            return array.parse(source, transform);
          }
        };
      }
    };
  }
});

// node_modules/postgres-date/index.js
var require_postgres_date = __commonJS({
  "node_modules/postgres-date/index.js"(exports, module) {
    "use strict";
    var DATE_TIME = /(\d{1,})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(\.\d{1,})?.*?( BC)?$/;
    var DATE = /^(\d{1,})-(\d{2})-(\d{2})( BC)?$/;
    var TIME_ZONE = /([Z+-])(\d{2})?:?(\d{2})?:?(\d{2})?/;
    var INFINITY = /^-?infinity$/;
    module.exports = function parseDate(isoDate) {
      if (INFINITY.test(isoDate)) {
        return Number(isoDate.replace("i", "I"));
      }
      var matches = DATE_TIME.exec(isoDate);
      if (!matches) {
        return getDate(isoDate) || null;
      }
      var isBC = !!matches[8];
      var year = parseInt(matches[1], 10);
      if (isBC) {
        year = bcYearToNegativeYear(year);
      }
      var month = parseInt(matches[2], 10) - 1;
      var day = matches[3];
      var hour = parseInt(matches[4], 10);
      var minute = parseInt(matches[5], 10);
      var second = parseInt(matches[6], 10);
      var ms = matches[7];
      ms = ms ? 1e3 * parseFloat(ms) : 0;
      var date;
      var offset = timeZoneOffset(isoDate);
      if (offset != null) {
        date = new Date(Date.UTC(year, month, day, hour, minute, second, ms));
        if (is0To99(year)) {
          date.setUTCFullYear(year);
        }
        if (offset !== 0) {
          date.setTime(date.getTime() - offset);
        }
      } else {
        date = new Date(year, month, day, hour, minute, second, ms);
        if (is0To99(year)) {
          date.setFullYear(year);
        }
      }
      return date;
    };
    function getDate(isoDate) {
      var matches = DATE.exec(isoDate);
      if (!matches) {
        return;
      }
      var year = parseInt(matches[1], 10);
      var isBC = !!matches[4];
      if (isBC) {
        year = bcYearToNegativeYear(year);
      }
      var month = parseInt(matches[2], 10) - 1;
      var day = matches[3];
      var date = new Date(year, month, day);
      if (is0To99(year)) {
        date.setFullYear(year);
      }
      return date;
    }
    function timeZoneOffset(isoDate) {
      if (isoDate.endsWith("+00")) {
        return 0;
      }
      var zone = TIME_ZONE.exec(isoDate.split(" ")[1]);
      if (!zone) return;
      var type = zone[1];
      if (type === "Z") {
        return 0;
      }
      var sign = type === "-" ? -1 : 1;
      var offset = parseInt(zone[2], 10) * 3600 + parseInt(zone[3] || 0, 10) * 60 + parseInt(zone[4] || 0, 10);
      return offset * sign * 1e3;
    }
    function bcYearToNegativeYear(year) {
      return -(year - 1);
    }
    function is0To99(num) {
      return num >= 0 && num < 100;
    }
  }
});

// node_modules/xtend/mutable.js
var require_mutable = __commonJS({
  "node_modules/xtend/mutable.js"(exports, module) {
    module.exports = extend;
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    function extend(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];
        for (var key in source) {
          if (hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }
      return target;
    }
  }
});

// node_modules/postgres-interval/index.js
var require_postgres_interval = __commonJS({
  "node_modules/postgres-interval/index.js"(exports, module) {
    "use strict";
    var extend = require_mutable();
    module.exports = PostgresInterval;
    function PostgresInterval(raw) {
      if (!(this instanceof PostgresInterval)) {
        return new PostgresInterval(raw);
      }
      extend(this, parse(raw));
    }
    var properties = ["seconds", "minutes", "hours", "days", "months", "years"];
    PostgresInterval.prototype.toPostgres = function() {
      var filtered = properties.filter(this.hasOwnProperty, this);
      if (this.milliseconds && filtered.indexOf("seconds") < 0) {
        filtered.push("seconds");
      }
      if (filtered.length === 0) return "0";
      return filtered.map(function(property) {
        var value = this[property] || 0;
        if (property === "seconds" && this.milliseconds) {
          value = (value + this.milliseconds / 1e3).toFixed(6).replace(/\.?0+$/, "");
        }
        return value + " " + property;
      }, this).join(" ");
    };
    var propertiesISOEquivalent = {
      years: "Y",
      months: "M",
      days: "D",
      hours: "H",
      minutes: "M",
      seconds: "S"
    };
    var dateProperties = ["years", "months", "days"];
    var timeProperties = ["hours", "minutes", "seconds"];
    PostgresInterval.prototype.toISOString = PostgresInterval.prototype.toISO = function() {
      var datePart = dateProperties.map(buildProperty, this).join("");
      var timePart = timeProperties.map(buildProperty, this).join("");
      return "P" + datePart + "T" + timePart;
      function buildProperty(property) {
        var value = this[property] || 0;
        if (property === "seconds" && this.milliseconds) {
          value = (value + this.milliseconds / 1e3).toFixed(6).replace(/0+$/, "");
        }
        return value + propertiesISOEquivalent[property];
      }
    };
    var NUMBER = "([+-]?\\d+)";
    var YEAR = NUMBER + "\\s+years?";
    var MONTH = NUMBER + "\\s+mons?";
    var DAY2 = NUMBER + "\\s+days?";
    var TIME = "([+-])?([\\d]*):(\\d\\d):(\\d\\d)\\.?(\\d{1,6})?";
    var INTERVAL = new RegExp([YEAR, MONTH, DAY2, TIME].map(function(regexString) {
      return "(" + regexString + ")?";
    }).join("\\s*"));
    var positions = {
      years: 2,
      months: 4,
      days: 6,
      hours: 9,
      minutes: 10,
      seconds: 11,
      milliseconds: 12
    };
    var negatives = ["hours", "minutes", "seconds", "milliseconds"];
    function parseMilliseconds(fraction) {
      var microseconds = fraction + "000000".slice(fraction.length);
      return parseInt(microseconds, 10) / 1e3;
    }
    function parse(interval) {
      if (!interval) return {};
      var matches = INTERVAL.exec(interval);
      var isNegative = matches[8] === "-";
      return Object.keys(positions).reduce(function(parsed, property) {
        var position = positions[property];
        var value = matches[position];
        if (!value) return parsed;
        value = property === "milliseconds" ? parseMilliseconds(value) : parseInt(value, 10);
        if (!value) return parsed;
        if (isNegative && ~negatives.indexOf(property)) {
          value *= -1;
        }
        parsed[property] = value;
        return parsed;
      }, {});
    }
  }
});

// node_modules/postgres-bytea/index.js
var require_postgres_bytea = __commonJS({
  "node_modules/postgres-bytea/index.js"(exports, module) {
    "use strict";
    var bufferFrom = Buffer.from || Buffer;
    module.exports = function parseBytea(input) {
      if (/^\\x/.test(input)) {
        return bufferFrom(input.substr(2), "hex");
      }
      var output = "";
      var i = 0;
      while (i < input.length) {
        if (input[i] !== "\\") {
          output += input[i];
          ++i;
        } else {
          if (/[0-7]{3}/.test(input.substr(i + 1, 3))) {
            output += String.fromCharCode(parseInt(input.substr(i + 1, 3), 8));
            i += 4;
          } else {
            var backslashes = 1;
            while (i + backslashes < input.length && input[i + backslashes] === "\\") {
              backslashes++;
            }
            for (var k = 0; k < Math.floor(backslashes / 2); ++k) {
              output += "\\";
            }
            i += Math.floor(backslashes / 2) * 2;
          }
        }
      }
      return bufferFrom(output, "binary");
    };
  }
});

// node_modules/pg-types/lib/textParsers.js
var require_textParsers = __commonJS({
  "node_modules/pg-types/lib/textParsers.js"(exports, module) {
    var array = require_postgres_array();
    var arrayParser = require_arrayParser();
    var parseDate = require_postgres_date();
    var parseInterval = require_postgres_interval();
    var parseByteA = require_postgres_bytea();
    function allowNull(fn) {
      return function nullAllowed(value) {
        if (value === null) return value;
        return fn(value);
      };
    }
    function parseBool(value) {
      if (value === null) return value;
      return value === "TRUE" || value === "t" || value === "true" || value === "y" || value === "yes" || value === "on" || value === "1";
    }
    function parseBoolArray(value) {
      if (!value) return null;
      return array.parse(value, parseBool);
    }
    function parseBaseTenInt(string) {
      return parseInt(string, 10);
    }
    function parseIntegerArray(value) {
      if (!value) return null;
      return array.parse(value, allowNull(parseBaseTenInt));
    }
    function parseBigIntegerArray(value) {
      if (!value) return null;
      return array.parse(value, allowNull(function(entry) {
        return parseBigInteger(entry).trim();
      }));
    }
    var parsePointArray = function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value, function(entry) {
        if (entry !== null) {
          entry = parsePoint(entry);
        }
        return entry;
      });
      return p.parse();
    };
    var parseFloatArray = function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value, function(entry) {
        if (entry !== null) {
          entry = parseFloat(entry);
        }
        return entry;
      });
      return p.parse();
    };
    var parseStringArray = function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value);
      return p.parse();
    };
    var parseDateArray = function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value, function(entry) {
        if (entry !== null) {
          entry = parseDate(entry);
        }
        return entry;
      });
      return p.parse();
    };
    var parseIntervalArray = function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value, function(entry) {
        if (entry !== null) {
          entry = parseInterval(entry);
        }
        return entry;
      });
      return p.parse();
    };
    var parseByteAArray = function(value) {
      if (!value) {
        return null;
      }
      return array.parse(value, allowNull(parseByteA));
    };
    var parseInteger = function(value) {
      return parseInt(value, 10);
    };
    var parseBigInteger = function(value) {
      var valStr = String(value);
      if (/^\d+$/.test(valStr)) {
        return valStr;
      }
      return value;
    };
    var parseJsonArray = function(value) {
      if (!value) {
        return null;
      }
      return array.parse(value, allowNull(JSON.parse));
    };
    var parsePoint = function(value) {
      if (value[0] !== "(") {
        return null;
      }
      value = value.substring(1, value.length - 1).split(",");
      return {
        x: parseFloat(value[0]),
        y: parseFloat(value[1])
      };
    };
    var parseCircle = function(value) {
      if (value[0] !== "<" && value[1] !== "(") {
        return null;
      }
      var point = "(";
      var radius = "";
      var pointParsed = false;
      for (var i = 2; i < value.length - 1; i++) {
        if (!pointParsed) {
          point += value[i];
        }
        if (value[i] === ")") {
          pointParsed = true;
          continue;
        } else if (!pointParsed) {
          continue;
        }
        if (value[i] === ",") {
          continue;
        }
        radius += value[i];
      }
      var result = parsePoint(point);
      result.radius = parseFloat(radius);
      return result;
    };
    var init = function(register) {
      register(20, parseBigInteger);
      register(21, parseInteger);
      register(23, parseInteger);
      register(26, parseInteger);
      register(700, parseFloat);
      register(701, parseFloat);
      register(16, parseBool);
      register(1082, parseDate);
      register(1114, parseDate);
      register(1184, parseDate);
      register(600, parsePoint);
      register(651, parseStringArray);
      register(718, parseCircle);
      register(1e3, parseBoolArray);
      register(1001, parseByteAArray);
      register(1005, parseIntegerArray);
      register(1007, parseIntegerArray);
      register(1028, parseIntegerArray);
      register(1016, parseBigIntegerArray);
      register(1017, parsePointArray);
      register(1021, parseFloatArray);
      register(1022, parseFloatArray);
      register(1231, parseFloatArray);
      register(1014, parseStringArray);
      register(1015, parseStringArray);
      register(1008, parseStringArray);
      register(1009, parseStringArray);
      register(1040, parseStringArray);
      register(1041, parseStringArray);
      register(1115, parseDateArray);
      register(1182, parseDateArray);
      register(1185, parseDateArray);
      register(1186, parseInterval);
      register(1187, parseIntervalArray);
      register(17, parseByteA);
      register(114, JSON.parse.bind(JSON));
      register(3802, JSON.parse.bind(JSON));
      register(199, parseJsonArray);
      register(3807, parseJsonArray);
      register(3907, parseStringArray);
      register(2951, parseStringArray);
      register(791, parseStringArray);
      register(1183, parseStringArray);
      register(1270, parseStringArray);
    };
    module.exports = {
      init
    };
  }
});

// node_modules/pg-int8/index.js
var require_pg_int8 = __commonJS({
  "node_modules/pg-int8/index.js"(exports, module) {
    "use strict";
    var BASE = 1e6;
    function readInt8(buffer) {
      var high = buffer.readInt32BE(0);
      var low = buffer.readUInt32BE(4);
      var sign = "";
      if (high < 0) {
        high = ~high + (low === 0);
        low = ~low + 1 >>> 0;
        sign = "-";
      }
      var result = "";
      var carry;
      var t;
      var digits;
      var pad3;
      var l;
      var i;
      {
        carry = high % BASE;
        high = high / BASE >>> 0;
        t = 4294967296 * carry + low;
        low = t / BASE >>> 0;
        digits = "" + (t - BASE * low);
        if (low === 0 && high === 0) {
          return sign + digits + result;
        }
        pad3 = "";
        l = 6 - digits.length;
        for (i = 0; i < l; i++) {
          pad3 += "0";
        }
        result = pad3 + digits + result;
      }
      {
        carry = high % BASE;
        high = high / BASE >>> 0;
        t = 4294967296 * carry + low;
        low = t / BASE >>> 0;
        digits = "" + (t - BASE * low);
        if (low === 0 && high === 0) {
          return sign + digits + result;
        }
        pad3 = "";
        l = 6 - digits.length;
        for (i = 0; i < l; i++) {
          pad3 += "0";
        }
        result = pad3 + digits + result;
      }
      {
        carry = high % BASE;
        high = high / BASE >>> 0;
        t = 4294967296 * carry + low;
        low = t / BASE >>> 0;
        digits = "" + (t - BASE * low);
        if (low === 0 && high === 0) {
          return sign + digits + result;
        }
        pad3 = "";
        l = 6 - digits.length;
        for (i = 0; i < l; i++) {
          pad3 += "0";
        }
        result = pad3 + digits + result;
      }
      {
        carry = high % BASE;
        t = 4294967296 * carry + low;
        digits = "" + t % BASE;
        return sign + digits + result;
      }
    }
    module.exports = readInt8;
  }
});

// node_modules/pg-types/lib/binaryParsers.js
var require_binaryParsers = __commonJS({
  "node_modules/pg-types/lib/binaryParsers.js"(exports, module) {
    var parseInt64 = require_pg_int8();
    var parseBits = function(data, bits, offset, invert, callback) {
      offset = offset || 0;
      invert = invert || false;
      callback = callback || function(lastValue, newValue, bits2) {
        return lastValue * Math.pow(2, bits2) + newValue;
      };
      var offsetBytes = offset >> 3;
      var inv = function(value) {
        if (invert) {
          return ~value & 255;
        }
        return value;
      };
      var mask = 255;
      var firstBits = 8 - offset % 8;
      if (bits < firstBits) {
        mask = 255 << 8 - bits & 255;
        firstBits = bits;
      }
      if (offset) {
        mask = mask >> offset % 8;
      }
      var result = 0;
      if (offset % 8 + bits >= 8) {
        result = callback(0, inv(data[offsetBytes]) & mask, firstBits);
      }
      var bytes = bits + offset >> 3;
      for (var i = offsetBytes + 1; i < bytes; i++) {
        result = callback(result, inv(data[i]), 8);
      }
      var lastBits = (bits + offset) % 8;
      if (lastBits > 0) {
        result = callback(result, inv(data[bytes]) >> 8 - lastBits, lastBits);
      }
      return result;
    };
    var parseFloatFromBits = function(data, precisionBits, exponentBits) {
      var bias = Math.pow(2, exponentBits - 1) - 1;
      var sign = parseBits(data, 1);
      var exponent = parseBits(data, exponentBits, 1);
      if (exponent === 0) {
        return 0;
      }
      var precisionBitsCounter = 1;
      var parsePrecisionBits = function(lastValue, newValue, bits) {
        if (lastValue === 0) {
          lastValue = 1;
        }
        for (var i = 1; i <= bits; i++) {
          precisionBitsCounter /= 2;
          if ((newValue & 1 << bits - i) > 0) {
            lastValue += precisionBitsCounter;
          }
        }
        return lastValue;
      };
      var mantissa = parseBits(data, precisionBits, exponentBits + 1, false, parsePrecisionBits);
      if (exponent == Math.pow(2, exponentBits + 1) - 1) {
        if (mantissa === 0) {
          return sign === 0 ? Infinity : -Infinity;
        }
        return NaN;
      }
      return (sign === 0 ? 1 : -1) * Math.pow(2, exponent - bias) * mantissa;
    };
    var parseInt16 = function(value) {
      if (parseBits(value, 1) == 1) {
        return -1 * (parseBits(value, 15, 1, true) + 1);
      }
      return parseBits(value, 15, 1);
    };
    var parseInt32 = function(value) {
      if (parseBits(value, 1) == 1) {
        return -1 * (parseBits(value, 31, 1, true) + 1);
      }
      return parseBits(value, 31, 1);
    };
    var parseFloat32 = function(value) {
      return parseFloatFromBits(value, 23, 8);
    };
    var parseFloat64 = function(value) {
      return parseFloatFromBits(value, 52, 11);
    };
    var parseNumeric = function(value) {
      var sign = parseBits(value, 16, 32);
      if (sign == 49152) {
        return NaN;
      }
      var weight = Math.pow(1e4, parseBits(value, 16, 16));
      var result = 0;
      var digits = [];
      var ndigits = parseBits(value, 16);
      for (var i = 0; i < ndigits; i++) {
        result += parseBits(value, 16, 64 + 16 * i) * weight;
        weight /= 1e4;
      }
      var scale = Math.pow(10, parseBits(value, 16, 48));
      return (sign === 0 ? 1 : -1) * Math.round(result * scale) / scale;
    };
    var parseDate = function(isUTC, value) {
      var sign = parseBits(value, 1);
      var rawValue = parseBits(value, 63, 1);
      var result = new Date((sign === 0 ? 1 : -1) * rawValue / 1e3 + 9466848e5);
      if (!isUTC) {
        result.setTime(result.getTime() + result.getTimezoneOffset() * 6e4);
      }
      result.usec = rawValue % 1e3;
      result.getMicroSeconds = function() {
        return this.usec;
      };
      result.setMicroSeconds = function(value2) {
        this.usec = value2;
      };
      result.getUTCMicroSeconds = function() {
        return this.usec;
      };
      return result;
    };
    var parseArray = function(value) {
      var dim = parseBits(value, 32);
      var flags = parseBits(value, 32, 32);
      var elementType = parseBits(value, 32, 64);
      var offset = 96;
      var dims = [];
      for (var i = 0; i < dim; i++) {
        dims[i] = parseBits(value, 32, offset);
        offset += 32;
        offset += 32;
      }
      var parseElement = function(elementType2) {
        var length = parseBits(value, 32, offset);
        offset += 32;
        if (length == 4294967295) {
          return null;
        }
        var result;
        if (elementType2 == 23 || elementType2 == 20) {
          result = parseBits(value, length * 8, offset);
          offset += length * 8;
          return result;
        } else if (elementType2 == 25) {
          result = value.toString(this.encoding, offset >> 3, (offset += length << 3) >> 3);
          return result;
        } else {
          console.log("ERROR: ElementType not implemented: " + elementType2);
        }
      };
      var parse = function(dimension, elementType2) {
        var array = [];
        var i2;
        if (dimension.length > 1) {
          var count = dimension.shift();
          for (i2 = 0; i2 < count; i2++) {
            array[i2] = parse(dimension, elementType2);
          }
          dimension.unshift(count);
        } else {
          for (i2 = 0; i2 < dimension[0]; i2++) {
            array[i2] = parseElement(elementType2);
          }
        }
        return array;
      };
      return parse(dims, elementType);
    };
    var parseText = function(value) {
      return value.toString("utf8");
    };
    var parseBool = function(value) {
      if (value === null) return null;
      return parseBits(value, 8) > 0;
    };
    var init = function(register) {
      register(20, parseInt64);
      register(21, parseInt16);
      register(23, parseInt32);
      register(26, parseInt32);
      register(1700, parseNumeric);
      register(700, parseFloat32);
      register(701, parseFloat64);
      register(16, parseBool);
      register(1114, parseDate.bind(null, false));
      register(1184, parseDate.bind(null, true));
      register(1e3, parseArray);
      register(1007, parseArray);
      register(1016, parseArray);
      register(1008, parseArray);
      register(1009, parseArray);
      register(25, parseText);
    };
    module.exports = {
      init
    };
  }
});

// node_modules/pg-types/lib/builtins.js
var require_builtins = __commonJS({
  "node_modules/pg-types/lib/builtins.js"(exports, module) {
    module.exports = {
      BOOL: 16,
      BYTEA: 17,
      CHAR: 18,
      INT8: 20,
      INT2: 21,
      INT4: 23,
      REGPROC: 24,
      TEXT: 25,
      OID: 26,
      TID: 27,
      XID: 28,
      CID: 29,
      JSON: 114,
      XML: 142,
      PG_NODE_TREE: 194,
      SMGR: 210,
      PATH: 602,
      POLYGON: 604,
      CIDR: 650,
      FLOAT4: 700,
      FLOAT8: 701,
      ABSTIME: 702,
      RELTIME: 703,
      TINTERVAL: 704,
      CIRCLE: 718,
      MACADDR8: 774,
      MONEY: 790,
      MACADDR: 829,
      INET: 869,
      ACLITEM: 1033,
      BPCHAR: 1042,
      VARCHAR: 1043,
      DATE: 1082,
      TIME: 1083,
      TIMESTAMP: 1114,
      TIMESTAMPTZ: 1184,
      INTERVAL: 1186,
      TIMETZ: 1266,
      BIT: 1560,
      VARBIT: 1562,
      NUMERIC: 1700,
      REFCURSOR: 1790,
      REGPROCEDURE: 2202,
      REGOPER: 2203,
      REGOPERATOR: 2204,
      REGCLASS: 2205,
      REGTYPE: 2206,
      UUID: 2950,
      TXID_SNAPSHOT: 2970,
      PG_LSN: 3220,
      PG_NDISTINCT: 3361,
      PG_DEPENDENCIES: 3402,
      TSVECTOR: 3614,
      TSQUERY: 3615,
      GTSVECTOR: 3642,
      REGCONFIG: 3734,
      REGDICTIONARY: 3769,
      JSONB: 3802,
      REGNAMESPACE: 4089,
      REGROLE: 4096
    };
  }
});

// node_modules/pg-types/index.js
var require_pg_types = __commonJS({
  "node_modules/pg-types/index.js"(exports) {
    var textParsers = require_textParsers();
    var binaryParsers = require_binaryParsers();
    var arrayParser = require_arrayParser();
    var builtinTypes = require_builtins();
    exports.getTypeParser = getTypeParser;
    exports.setTypeParser = setTypeParser;
    exports.arrayParser = arrayParser;
    exports.builtins = builtinTypes;
    var typeParsers = {
      text: {},
      binary: {}
    };
    function noParse(val) {
      return String(val);
    }
    function getTypeParser(oid, format) {
      format = format || "text";
      if (!typeParsers[format]) {
        return noParse;
      }
      return typeParsers[format][oid] || noParse;
    }
    function setTypeParser(oid, format, parseFn) {
      if (typeof format == "function") {
        parseFn = format;
        format = "text";
      }
      typeParsers[format][oid] = parseFn;
    }
    textParsers.init(function(oid, converter) {
      typeParsers.text[oid] = converter;
    });
    binaryParsers.init(function(oid, converter) {
      typeParsers.binary[oid] = converter;
    });
  }
});

// node_modules/pg/lib/defaults.js
var require_defaults = __commonJS({
  "node_modules/pg/lib/defaults.js"(exports, module) {
    "use strict";
    var user;
    try {
      user = process.platform === "win32" ? process.env.USERNAME : process.env.USER;
    } catch {
    }
    module.exports = {
      // database host. defaults to localhost
      host: "localhost",
      // database user's name
      user,
      // name of database to connect
      database: void 0,
      // database user's password
      password: null,
      // a Postgres connection string to be used instead of setting individual connection items
      // NOTE:  Setting this value will cause it to override any other value (such as database or user) defined
      // in the defaults object.
      connectionString: void 0,
      // database port
      port: 5432,
      // number of rows to return at a time from a prepared statement's
      // portal. 0 will return all rows at once
      rows: 0,
      // binary result mode
      binary: false,
      // Connection pool options - see https://github.com/brianc/node-pg-pool
      // number of connections to use in connection pool
      // 0 will disable connection pooling
      max: 10,
      // max milliseconds a client can go unused before it is removed
      // from the pool and destroyed
      idleTimeoutMillis: 3e4,
      client_encoding: "",
      ssl: false,
      // SSL negotiation style: 'postgres' (traditional SSLRequest) or 'direct'
      sslnegotiation: void 0,
      application_name: void 0,
      fallback_application_name: void 0,
      options: void 0,
      parseInputDatesAsUTC: false,
      // max milliseconds any query using this connection will execute for before timing out in error.
      // false=unlimited
      statement_timeout: false,
      // Abort any statement that waits longer than the specified duration in milliseconds while attempting to acquire a lock.
      // false=unlimited
      lock_timeout: false,
      // Terminate any session with an open transaction that has been idle for longer than the specified duration in milliseconds
      // false=unlimited
      idle_in_transaction_session_timeout: false,
      // max milliseconds to wait for query to complete (client side)
      query_timeout: false,
      connect_timeout: 0,
      keepalives: 1,
      keepalives_idle: 0
    };
    var pgTypes = require_pg_types();
    var parseBigInteger = pgTypes.getTypeParser(20, "text");
    var parseBigIntegerArray = pgTypes.getTypeParser(1016, "text");
    module.exports.__defineSetter__("parseInt8", function(val) {
      pgTypes.setTypeParser(20, "text", val ? pgTypes.getTypeParser(23, "text") : parseBigInteger);
      pgTypes.setTypeParser(1016, "text", val ? pgTypes.getTypeParser(1007, "text") : parseBigIntegerArray);
    });
  }
});

// node_modules/pg/lib/utils.js
var require_utils = __commonJS({
  "node_modules/pg/lib/utils.js"(exports, module) {
    "use strict";
    var defaults2 = require_defaults();
    var nodeUtils = __require("util");
    var { isDate } = __require("util/types");
    var invalidDateDeprecationNotice = nodeUtils.deprecate(
      () => {
      },
      "Sending an invalid date to Postgres is deprecated and will throw an error in the next major version of pg. Ensure any Date object passed as a query parameter is valid.",
      "PG_INVALID_DATE"
    );
    function escapeElement(elementRepresentation) {
      const escaped = elementRepresentation.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      return '"' + escaped + '"';
    }
    function arrayString(val) {
      let result = "{";
      for (let i = 0; i < val.length; i++) {
        if (i > 0) {
          result += ",";
        }
        let item = val[i];
        if (item == null) {
          result += "NULL";
        } else if (Array.isArray(item)) {
          result += arrayString(item);
        } else if (ArrayBuffer.isView(item)) {
          if (!(item instanceof Buffer)) {
            item = Buffer.from(item.buffer, item.byteOffset, item.byteLength);
          }
          result += "\\\\x" + item.toString("hex");
        } else {
          result += escapeElement(prepareValue(item));
        }
      }
      result += "}";
      return result;
    }
    var prepareValue = function(val, seen) {
      if (val == null) {
        return null;
      }
      if (typeof val === "object") {
        if (val instanceof Buffer) {
          return val;
        }
        if (ArrayBuffer.isView(val)) {
          return Buffer.from(val.buffer, val.byteOffset, val.byteLength);
        }
        if (isDate(val)) {
          if (isNaN(val.getTime())) {
            invalidDateDeprecationNotice();
          }
          if (defaults2.parseInputDatesAsUTC) {
            return dateToStringUTC(val);
          } else {
            return dateToString(val);
          }
        }
        if (Array.isArray(val)) {
          return arrayString(val);
        }
        return prepareObject(val, seen);
      }
      return val.toString();
    };
    function prepareObject(val, seen) {
      if (val && typeof val.toPostgres === "function") {
        seen = seen || [];
        if (seen.indexOf(val) !== -1) {
          throw new Error('circular reference detected while preparing "' + val + '" for query');
        }
        seen.push(val);
        return prepareValue(val.toPostgres(prepareValue), seen);
      }
      return JSON.stringify(val);
    }
    function dateToString(date) {
      let offset = -date.getTimezoneOffset();
      let year = date.getFullYear();
      const isBCYear = year < 1;
      if (isBCYear) year = Math.abs(year) + 1;
      let ret = String(year).padStart(4, "0") + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0") + "T" + String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0") + ":" + String(date.getSeconds()).padStart(2, "0") + "." + String(date.getMilliseconds()).padStart(3, "0");
      if (offset < 0) {
        ret += "-";
        offset *= -1;
      } else {
        ret += "+";
      }
      ret += String(Math.floor(offset / 60)).padStart(2, "0") + ":" + String(offset % 60).padStart(2, "0");
      if (isBCYear) ret += " BC";
      return ret;
    }
    function dateToStringUTC(date) {
      let year = date.getUTCFullYear();
      const isBCYear = year < 1;
      if (isBCYear) year = Math.abs(year) + 1;
      let ret = String(year).padStart(4, "0") + "-" + String(date.getUTCMonth() + 1).padStart(2, "0") + "-" + String(date.getUTCDate()).padStart(2, "0") + "T" + String(date.getUTCHours()).padStart(2, "0") + ":" + String(date.getUTCMinutes()).padStart(2, "0") + ":" + String(date.getUTCSeconds()).padStart(2, "0") + "." + String(date.getUTCMilliseconds()).padStart(3, "0");
      ret += "+00:00";
      if (isBCYear) ret += " BC";
      return ret;
    }
    function normalizeQueryConfig(config, values, callback) {
      config = typeof config === "string" ? { text: config } : cloneQueryConfig(config);
      if (values) {
        if (typeof values === "function") {
          config.callback = values;
        } else {
          config.values = values;
        }
      }
      if (callback) {
        config.callback = callback;
      }
      return config;
    }
    function cloneQueryConfig(config) {
      if (config == null) {
        return config;
      }
      return Object.defineProperties(Object.create(Object.getPrototypeOf(config)), Object.getOwnPropertyDescriptors(config));
    }
    var escapeIdentifier2 = function(str) {
      return '"' + str.replace(/"/g, '""') + '"';
    };
    var escapeLiteral2 = function(str) {
      let hasBackslash = false;
      let escaped = "'";
      if (str == null) {
        return "''";
      }
      if (typeof str !== "string") {
        return "''";
      }
      for (let i = 0; i < str.length; i++) {
        const c = str[i];
        if (c === "'") {
          escaped += c + c;
        } else if (c === "\\") {
          escaped += c + c;
          hasBackslash = true;
        } else {
          escaped += c;
        }
      }
      escaped += "'";
      if (hasBackslash === true) {
        escaped = " E" + escaped;
      }
      return escaped;
    };
    module.exports = {
      prepareValue: function prepareValueWrapper(value) {
        return prepareValue(value);
      },
      normalizeQueryConfig,
      escapeIdentifier: escapeIdentifier2,
      escapeLiteral: escapeLiteral2
    };
  }
});

// node_modules/pg/lib/crypto/utils.js
var require_utils2 = __commonJS({
  "node_modules/pg/lib/crypto/utils.js"(exports, module) {
    var nodeCrypto = __require("crypto");
    module.exports = {
      postgresMd5PasswordHash,
      randomBytes,
      deriveKey,
      sha256,
      hashByName,
      hmacSha256,
      md5
    };
    var webCrypto = nodeCrypto.webcrypto || globalThis.crypto;
    var subtleCrypto = webCrypto.subtle;
    var textEncoder = new TextEncoder();
    function randomBytes(length) {
      return webCrypto.getRandomValues(Buffer.alloc(length));
    }
    async function md5(string) {
      try {
        return nodeCrypto.createHash("md5").update(string, "utf-8").digest("hex");
      } catch (e2) {
        const data = typeof string === "string" ? textEncoder.encode(string) : string;
        const hash2 = await subtleCrypto.digest("MD5", data);
        return Array.from(new Uint8Array(hash2)).map((b) => b.toString(16).padStart(2, "0")).join("");
      }
    }
    async function postgresMd5PasswordHash(user, password, salt2) {
      const inner = await md5(password + user);
      const outer = await md5(Buffer.concat([Buffer.from(inner), salt2]));
      return "md5" + outer;
    }
    async function sha256(text) {
      return await subtleCrypto.digest("SHA-256", text);
    }
    async function hashByName(hashName, text) {
      return await subtleCrypto.digest(hashName, text);
    }
    async function hmacSha256(keyBuffer, msg) {
      const key = await subtleCrypto.importKey("raw", keyBuffer, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      return await subtleCrypto.sign("HMAC", key, textEncoder.encode(msg));
    }
    async function deriveKey(password, salt2, iterations) {
      const key = await subtleCrypto.importKey("raw", textEncoder.encode(password), "PBKDF2", false, ["deriveBits"]);
      const params = { name: "PBKDF2", hash: "SHA-256", salt: salt2, iterations };
      return await subtleCrypto.deriveBits(params, key, 32 * 8, ["deriveBits"]);
    }
  }
});

// node_modules/pg/lib/crypto/cert-signatures.js
var require_cert_signatures = __commonJS({
  "node_modules/pg/lib/crypto/cert-signatures.js"(exports, module) {
    function x509Error(msg, cert) {
      return new Error("SASL channel binding: " + msg + " when parsing public certificate " + cert.toString("base64"));
    }
    function readASN1Length(data, index) {
      let length = data[index++];
      if (length < 128) return { length, index };
      const lengthBytes = length & 127;
      if (lengthBytes > 4) throw x509Error("bad length", data);
      length = 0;
      for (let i = 0; i < lengthBytes; i++) {
        length = length << 8 | data[index++];
      }
      return { length, index };
    }
    function readASN1OID(data, index) {
      if (data[index++] !== 6) throw x509Error("non-OID data", data);
      const { length: OIDLength, index: indexAfterOIDLength } = readASN1Length(data, index);
      index = indexAfterOIDLength;
      const lastIndex = index + OIDLength;
      const byte1 = data[index++];
      let oid = (byte1 / 40 >> 0) + "." + byte1 % 40;
      while (index < lastIndex) {
        let value = 0;
        while (index < lastIndex) {
          const nextByte = data[index++];
          value = value << 7 | nextByte & 127;
          if (nextByte < 128) break;
        }
        oid += "." + value;
      }
      return { oid, index };
    }
    function expectASN1Seq(data, index) {
      if (data[index++] !== 48) throw x509Error("non-sequence data", data);
      return readASN1Length(data, index);
    }
    function signatureAlgorithmHashFromCertificate(data, index) {
      if (index === void 0) index = 0;
      index = expectASN1Seq(data, index).index;
      const { length: certInfoLength, index: indexAfterCertInfoLength } = expectASN1Seq(data, index);
      index = indexAfterCertInfoLength + certInfoLength;
      index = expectASN1Seq(data, index).index;
      const { oid, index: indexAfterOID } = readASN1OID(data, index);
      switch (oid) {
        // RSA
        case "1.2.840.113549.1.1.4":
          return "MD5";
        case "1.2.840.113549.1.1.5":
          return "SHA-1";
        case "1.2.840.113549.1.1.11":
          return "SHA-256";
        case "1.2.840.113549.1.1.12":
          return "SHA-384";
        case "1.2.840.113549.1.1.13":
          return "SHA-512";
        case "1.2.840.113549.1.1.14":
          return "SHA-224";
        case "1.2.840.113549.1.1.15":
          return "SHA512-224";
        case "1.2.840.113549.1.1.16":
          return "SHA512-256";
        // ECDSA
        case "1.2.840.10045.4.1":
          return "SHA-1";
        case "1.2.840.10045.4.3.1":
          return "SHA-224";
        case "1.2.840.10045.4.3.2":
          return "SHA-256";
        case "1.2.840.10045.4.3.3":
          return "SHA-384";
        case "1.2.840.10045.4.3.4":
          return "SHA-512";
        // RSASSA-PSS: hash is indicated separately
        case "1.2.840.113549.1.1.10": {
          index = indexAfterOID;
          index = expectASN1Seq(data, index).index;
          if (data[index++] !== 160) throw x509Error("non-tag data", data);
          index = readASN1Length(data, index).index;
          index = expectASN1Seq(data, index).index;
          const { oid: hashOID } = readASN1OID(data, index);
          switch (hashOID) {
            // standalone hash OIDs
            case "1.2.840.113549.2.5":
              return "MD5";
            case "1.3.14.3.2.26":
              return "SHA-1";
            case "2.16.840.1.101.3.4.2.1":
              return "SHA-256";
            case "2.16.840.1.101.3.4.2.2":
              return "SHA-384";
            case "2.16.840.1.101.3.4.2.3":
              return "SHA-512";
          }
          throw x509Error("unknown hash OID " + hashOID, data);
        }
        // Ed25519 -- see https://github.com/openssl/openssl/issues/15477
        case "1.3.101.110":
        case "1.3.101.112":
          return "SHA-512";
        // Ed448 -- still not in pg 17.2 (if supported, digest would be SHAKE256 x 64 bytes)
        case "1.3.101.111":
        case "1.3.101.113":
          throw x509Error("Ed448 certificate channel binding is not currently supported by Postgres");
      }
      throw x509Error("unknown OID " + oid, data);
    }
    module.exports = { signatureAlgorithmHashFromCertificate };
  }
});

// node_modules/pg/lib/crypto/sasl.js
var require_sasl = __commonJS({
  "node_modules/pg/lib/crypto/sasl.js"(exports, module) {
    "use strict";
    var crypto = require_utils2();
    var { signatureAlgorithmHashFromCertificate } = require_cert_signatures();
    function saslprep(password) {
      const nonAsciiSpace = /[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000]/g;
      const mappedToNothing = /[\u00AD\u034F\u1806\u180B\u180C\u180D\u200C\u200D\u2060\uFE00-\uFE0F\uFEFF]/g;
      return password.replace(nonAsciiSpace, " ").replace(mappedToNothing, "").normalize("NFKC");
    }
    var DEFAULT_MAX_SCRAM_ITERATIONS = 1e5;
    function startSession(mechanisms, stream, scramMaxIterations = DEFAULT_MAX_SCRAM_ITERATIONS) {
      const candidates = ["SCRAM-SHA-256"];
      if (stream) candidates.unshift("SCRAM-SHA-256-PLUS");
      const mechanism = candidates.find((candidate) => mechanisms.includes(candidate));
      if (!mechanism) {
        throw new Error("SASL: Only mechanism(s) " + candidates.join(" and ") + " are supported");
      }
      if (mechanism === "SCRAM-SHA-256-PLUS" && typeof stream.getPeerCertificate !== "function") {
        throw new Error("SASL: Mechanism SCRAM-SHA-256-PLUS requires a certificate");
      }
      const clientNonce = crypto.randomBytes(18).toString("base64");
      const gs2Header = mechanism === "SCRAM-SHA-256-PLUS" ? "p=tls-server-end-point" : stream ? "y" : "n";
      return {
        mechanism,
        clientNonce,
        response: gs2Header + ",,n=*,r=" + clientNonce,
        message: "SASLInitialResponse",
        scramMaxIterations
      };
    }
    async function continueSession(session, password, serverData, stream) {
      if (session.message !== "SASLInitialResponse") {
        throw new Error("SASL: Last message was not SASLInitialResponse");
      }
      if (typeof password !== "string") {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string");
      }
      if (password === "") {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a non-empty string");
      }
      if (typeof serverData !== "string") {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: serverData must be a string");
      }
      const sv = parseServerFirstMessage(serverData);
      if (!sv.nonce.startsWith(session.clientNonce)) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce does not start with client nonce");
      } else if (sv.nonce.length === session.clientNonce.length) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce is too short");
      }
      const scramMaxIterations = typeof session.scramMaxIterations === "number" ? session.scramMaxIterations : DEFAULT_MAX_SCRAM_ITERATIONS;
      if (scramMaxIterations !== 0 && sv.iteration > scramMaxIterations) {
        throw new Error(
          "SASL: SCRAM-SERVER-FIRST-MESSAGE: iteration count " + sv.iteration + " exceeds scramMaxIterations of " + scramMaxIterations
        );
      }
      const clientFirstMessageBare = "n=*,r=" + session.clientNonce;
      const serverFirstMessage = "r=" + sv.nonce + ",s=" + sv.salt + ",i=" + sv.iteration;
      let channelBinding = stream ? "eSws" : "biws";
      if (session.mechanism === "SCRAM-SHA-256-PLUS") {
        const peerCert = stream.getPeerCertificate().raw;
        let hashName = signatureAlgorithmHashFromCertificate(peerCert);
        if (hashName === "MD5" || hashName === "SHA-1") hashName = "SHA-256";
        const certHash = await crypto.hashByName(hashName, peerCert);
        const bindingData = Buffer.concat([Buffer.from("p=tls-server-end-point,,"), Buffer.from(certHash)]);
        channelBinding = bindingData.toString("base64");
      }
      const clientFinalMessageWithoutProof = "c=" + channelBinding + ",r=" + sv.nonce;
      const authMessage = clientFirstMessageBare + "," + serverFirstMessage + "," + clientFinalMessageWithoutProof;
      const saltBytes = Buffer.from(sv.salt, "base64");
      const saltedPassword = await crypto.deriveKey(saslprep(password), saltBytes, sv.iteration);
      const clientKey = await crypto.hmacSha256(saltedPassword, "Client Key");
      const storedKey = await crypto.sha256(clientKey);
      const clientSignature = await crypto.hmacSha256(storedKey, authMessage);
      const clientProof = xorBuffers(Buffer.from(clientKey), Buffer.from(clientSignature)).toString("base64");
      const serverKey = await crypto.hmacSha256(saltedPassword, "Server Key");
      const serverSignatureBytes = await crypto.hmacSha256(serverKey, authMessage);
      session.message = "SASLResponse";
      session.serverSignature = Buffer.from(serverSignatureBytes).toString("base64");
      session.response = clientFinalMessageWithoutProof + ",p=" + clientProof;
    }
    function finalizeSession(session, serverData) {
      if (session.message !== "SASLResponse") {
        throw new Error("SASL: Last message was not SASLResponse");
      }
      if (typeof serverData !== "string") {
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: serverData must be a string");
      }
      const { serverSignature } = parseServerFinalMessage(serverData);
      if (serverSignature !== session.serverSignature) {
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature does not match");
      }
    }
    function isPrintableChars(text) {
      if (typeof text !== "string") {
        throw new TypeError("SASL: text must be a string");
      }
      return text.split("").map((_, i) => text.charCodeAt(i)).every((c) => c >= 33 && c <= 43 || c >= 45 && c <= 126);
    }
    function isBase64(text) {
      return /^(?:[a-zA-Z0-9+/]{4})*(?:[a-zA-Z0-9+/]{2}==|[a-zA-Z0-9+/]{3}=)?$/.test(text);
    }
    function parseAttributePairs(text) {
      if (typeof text !== "string") {
        throw new TypeError("SASL: attribute pairs text must be a string");
      }
      return new Map(
        text.split(",").map((attrValue) => {
          if (!/^.=/.test(attrValue)) {
            throw new Error("SASL: Invalid attribute pair entry");
          }
          const name = attrValue[0];
          const value = attrValue.substring(2);
          return [name, value];
        })
      );
    }
    function parseServerFirstMessage(data) {
      const attrPairs = parseAttributePairs(data);
      const nonce = attrPairs.get("r");
      if (!nonce) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce missing");
      } else if (!isPrintableChars(nonce)) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce must only contain printable characters");
      }
      const salt2 = attrPairs.get("s");
      if (!salt2) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt missing");
      } else if (!isBase64(salt2)) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt must be base64");
      }
      const iterationText = attrPairs.get("i");
      if (!iterationText) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: iteration missing");
      } else if (!/^[1-9][0-9]*$/.test(iterationText)) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: invalid iteration count");
      }
      const iteration = parseInt(iterationText, 10);
      return {
        nonce,
        salt: salt2,
        iteration
      };
    }
    function parseServerFinalMessage(serverData) {
      const attrPairs = parseAttributePairs(serverData);
      const error = attrPairs.get("e");
      const serverSignature = attrPairs.get("v");
      if (error) {
        throw new Error(`SASL: SCRAM-SERVER-FINAL-MESSAGE: server returned error: "${error}"`);
      }
      if (!serverSignature) {
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature is missing");
      } else if (!isBase64(serverSignature)) {
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature must be base64");
      }
      return {
        serverSignature
      };
    }
    function xorBuffers(a, b) {
      if (!Buffer.isBuffer(a)) {
        throw new TypeError("first argument must be a Buffer");
      }
      if (!Buffer.isBuffer(b)) {
        throw new TypeError("second argument must be a Buffer");
      }
      if (a.length !== b.length) {
        throw new Error("Buffer lengths must match");
      }
      if (a.length === 0) {
        throw new Error("Buffers cannot be empty");
      }
      return Buffer.from(a.map((_, i) => a[i] ^ b[i]));
    }
    module.exports = {
      startSession,
      continueSession,
      finalizeSession,
      DEFAULT_MAX_SCRAM_ITERATIONS
    };
  }
});

// node_modules/pg/lib/type-overrides.js
var require_type_overrides = __commonJS({
  "node_modules/pg/lib/type-overrides.js"(exports, module) {
    "use strict";
    var types2 = require_pg_types();
    function TypeOverrides2(userTypes) {
      this._types = userTypes || types2;
      this.text = {};
      this.binary = {};
    }
    TypeOverrides2.prototype.getOverrides = function(format) {
      switch (format) {
        case "text":
          return this.text;
        case "binary":
          return this.binary;
        default:
          return {};
      }
    };
    TypeOverrides2.prototype.setTypeParser = function(oid, format, parseFn) {
      if (typeof format === "function") {
        parseFn = format;
        format = "text";
      }
      this.getOverrides(format)[oid] = parseFn;
    };
    TypeOverrides2.prototype.getTypeParser = function(oid, format) {
      format = format || "text";
      return this.getOverrides(format)[oid] || this._types.getTypeParser(oid, format);
    };
    module.exports = TypeOverrides2;
  }
});

// node_modules/pg-connection-string/index.js
var require_pg_connection_string = __commonJS({
  "node_modules/pg-connection-string/index.js"(exports, module) {
    "use strict";
    function parse(str, options = {}) {
      if (str.charAt(0) === "/") {
        const config2 = str.split(" ");
        return { host: config2[0], database: config2[1] };
      }
      const config = /* @__PURE__ */ Object.create(null);
      let result;
      let dummyHost = false;
      if (/ |%[^a-f0-9]|%[a-f0-9][^a-f0-9]/i.test(str)) {
        str = encodeURI(str).replace(/%25(\d\d)/g, "%$1");
      }
      try {
        try {
          result = new URL(str, "postgres://base");
        } catch (e2) {
          result = new URL(str.replace("@/", "@___DUMMY___/"), "postgres://base");
          dummyHost = true;
        }
      } catch (err4) {
        err4.input && (err4.input = "*****REDACTED*****");
        throw err4;
      }
      for (const entry of result.searchParams.entries()) {
        config[entry[0]] = entry[1];
      }
      config.user = config.user || decodeURIComponent(result.username);
      config.password = config.password || decodeURIComponent(result.password);
      if (result.protocol == "socket:") {
        config.host = decodeURI(result.pathname);
        config.database = result.searchParams.get("db");
        config.client_encoding = result.searchParams.get("encoding");
        return config;
      }
      const hostname = (dummyHost ? "" : result.hostname).replace(/^\[(.+)\]$/, "$1");
      if (!config.host) {
        config.host = decodeURIComponent(hostname);
      } else if (hostname && /^%2f/i.test(hostname)) {
        result.pathname = hostname + result.pathname;
      }
      if (!config.port) {
        config.port = result.port;
      }
      const pathname = result.pathname.slice(1) || null;
      config.database = pathname ? decodeURI(pathname) : null;
      if (config.ssl === "true" || config.ssl === "1") {
        config.ssl = true;
      }
      if (config.ssl === "0") {
        config.ssl = false;
      }
      if (config.sslcert || config.sslkey || config.sslrootcert || config.sslmode) {
        config.ssl = {};
      }
      if (config.sslnegotiation === "direct" && config.ssl === void 0) {
        config.ssl = true;
      }
      const fs = config.sslcert || config.sslkey || config.sslrootcert ? __require("fs") : null;
      if (config.sslcert) {
        config.ssl.cert = fs.readFileSync(config.sslcert).toString();
      }
      if (config.sslkey) {
        config.ssl.key = fs.readFileSync(config.sslkey).toString();
      }
      if (config.sslrootcert) {
        config.ssl.ca = fs.readFileSync(config.sslrootcert).toString();
      }
      if (options.useLibpqCompat && config.uselibpqcompat) {
        throw new Error("Both useLibpqCompat and uselibpqcompat are set. Please use only one of them.");
      }
      if (config.uselibpqcompat === "true" || options.useLibpqCompat) {
        switch (config.sslmode) {
          case "disable": {
            config.ssl = false;
            break;
          }
          case "prefer": {
            config.ssl.rejectUnauthorized = false;
            break;
          }
          case "require": {
            if (config.sslrootcert) {
              config.ssl.checkServerIdentity = function() {
              };
            } else {
              config.ssl.rejectUnauthorized = false;
            }
            break;
          }
          case "verify-ca": {
            if (!config.ssl.ca) {
              throw new Error(
                "SECURITY WARNING: Using sslmode=verify-ca requires specifying a CA with sslrootcert. If a public CA is used, verify-ca allows connections to a server that somebody else may have registered with the CA, making you vulnerable to Man-in-the-Middle attacks. Either specify a custom CA certificate with sslrootcert parameter or use sslmode=verify-full for proper security."
              );
            }
            config.ssl.checkServerIdentity = function() {
            };
            break;
          }
          case "verify-full": {
            break;
          }
        }
      } else {
        switch (config.sslmode) {
          case "disable": {
            config.ssl = false;
            break;
          }
          case "prefer":
          case "require":
          case "verify-ca":
          case "verify-full": {
            if (config.sslmode !== "verify-full") {
              deprecatedSslModeWarning(config.sslmode);
            }
            break;
          }
          case "no-verify": {
            config.ssl.rejectUnauthorized = false;
            break;
          }
        }
      }
      return config;
    }
    function toConnectionOptions(sslConfig) {
      const connectionOptions = Object.entries(sslConfig).reduce((c, [key, value]) => {
        if (value !== void 0 && value !== null) {
          c[key] = value;
        }
        return c;
      }, /* @__PURE__ */ Object.create(null));
      return connectionOptions;
    }
    function toClientConfig(config) {
      const poolConfig = Object.entries(config).reduce((c, [key, value]) => {
        if (key === "ssl") {
          const sslConfig = value;
          if (typeof sslConfig === "boolean") {
            c[key] = sslConfig;
          }
          if (typeof sslConfig === "object") {
            c[key] = toConnectionOptions(sslConfig);
          }
        } else if (value !== void 0 && value !== null) {
          if (key === "port") {
            if (value !== "") {
              const v = parseInt(value, 10);
              if (isNaN(v)) {
                throw new Error(`Invalid ${key}: ${value}`);
              }
              c[key] = v;
            }
          } else {
            c[key] = value;
          }
        }
        return c;
      }, /* @__PURE__ */ Object.create(null));
      return poolConfig;
    }
    function parseIntoClientConfig(str) {
      return toClientConfig(parse(str));
    }
    function deprecatedSslModeWarning(sslmode) {
      if (!deprecatedSslModeWarning.warned && typeof process !== "undefined" && process.emitWarning) {
        deprecatedSslModeWarning.warned = true;
        process.emitWarning(`SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.
In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.

To prepare for this change:
- If you want the current behavior, explicitly use 'sslmode=verify-full'
- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=${sslmode}'

See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.`);
      }
    }
    module.exports = parse;
    parse.parse = parse;
    parse.toClientConfig = toClientConfig;
    parse.parseIntoClientConfig = parseIntoClientConfig;
  }
});

// node_modules/pg/lib/connection-parameters.js
var require_connection_parameters = __commonJS({
  "node_modules/pg/lib/connection-parameters.js"(exports, module) {
    "use strict";
    var dns = __require("dns");
    var defaults2 = require_defaults();
    var parse = require_pg_connection_string().parse;
    var val = function(key, config, envVar) {
      if (config[key]) {
        return config[key];
      }
      if (envVar === void 0) {
        envVar = process.env["PG" + key.toUpperCase()];
      } else if (envVar === false) {
      } else {
        envVar = process.env[envVar];
      }
      return envVar || defaults2[key];
    };
    var readSSLConfigFromEnvironment = function() {
      switch (process.env.PGSSLMODE) {
        case "disable":
          return false;
        case "prefer":
        case "require":
        case "verify-ca":
        case "verify-full":
          return true;
        case "no-verify":
          return { rejectUnauthorized: false };
      }
      return defaults2.ssl;
    };
    var quoteParamValue = function(value) {
      return "'" + ("" + value).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
    };
    var add = function(params, config, paramName) {
      const value = config[paramName];
      if (value !== void 0 && value !== null) {
        params.push(paramName + "=" + quoteParamValue(value));
      }
    };
    var ConnectionParameters = class {
      constructor(config) {
        config = typeof config === "string" ? parse(config) : config || {};
        if (config.connectionString) {
          config = Object.assign({}, config, parse(config.connectionString));
        }
        this.user = val("user", config);
        this.database = val("database", config);
        if (this.database === void 0) {
          this.database = this.user;
        }
        this.port = parseInt(val("port", config), 10);
        this.host = val("host", config);
        Object.defineProperty(this, "password", {
          configurable: true,
          enumerable: false,
          writable: true,
          value: val("password", config)
        });
        this.binary = val("binary", config);
        this.options = val("options", config);
        this.ssl = typeof config.ssl === "undefined" ? readSSLConfigFromEnvironment() : config.ssl;
        if (typeof this.ssl === "string") {
          if (this.ssl === "true") {
            this.ssl = true;
          }
        }
        if (this.ssl === "no-verify") {
          this.ssl = { rejectUnauthorized: false };
        }
        if (this.ssl && this.ssl.key) {
          Object.defineProperty(this.ssl, "key", {
            enumerable: false
          });
        }
        this.sslnegotiation = val("sslnegotiation", config, "PGSSLNEGOTIATION");
        if (this.sslnegotiation !== void 0 && this.sslnegotiation !== "postgres" && this.sslnegotiation !== "direct") {
          throw new Error(
            `Invalid sslnegotiation value: "${this.sslnegotiation}". Valid values are "postgres" and "direct".`
          );
        }
        if (this.sslnegotiation === "direct" && !this.ssl) {
          throw new Error("sslnegotiation=direct requires SSL to be enabled");
        }
        this.client_encoding = val("client_encoding", config);
        this.replication = val("replication", config);
        this.isDomainSocket = !(this.host || "").indexOf("/");
        this.application_name = val("application_name", config, "PGAPPNAME");
        this.fallback_application_name = val("fallback_application_name", config, false);
        this.statement_timeout = val("statement_timeout", config, false);
        this.lock_timeout = val("lock_timeout", config, false);
        this.idle_in_transaction_session_timeout = val("idle_in_transaction_session_timeout", config, false);
        this.query_timeout = val("query_timeout", config, false);
        if (config.connectionTimeoutMillis === void 0) {
          this.connect_timeout = process.env.PGCONNECT_TIMEOUT || 0;
        } else {
          this.connect_timeout = Math.floor(config.connectionTimeoutMillis / 1e3);
        }
        if (config.keepAlive === false) {
          this.keepalives = 0;
        } else if (config.keepAlive === true) {
          this.keepalives = 1;
        }
        if (typeof config.keepAliveInitialDelayMillis === "number") {
          this.keepalives_idle = Math.floor(config.keepAliveInitialDelayMillis / 1e3);
        }
      }
      getLibpqConnectionString(cb) {
        const params = [];
        add(params, this, "user");
        add(params, this, "password");
        add(params, this, "port");
        add(params, this, "application_name");
        add(params, this, "fallback_application_name");
        add(params, this, "connect_timeout");
        add(params, this, "options");
        const ssl = typeof this.ssl === "object" ? this.ssl : this.ssl ? { sslmode: this.ssl } : {};
        add(params, ssl, "sslmode");
        add(params, ssl, "sslca");
        add(params, ssl, "sslkey");
        add(params, ssl, "sslcert");
        add(params, ssl, "sslrootcert");
        add(params, this, "sslnegotiation");
        if (this.database) {
          params.push("dbname=" + quoteParamValue(this.database));
        }
        if (this.replication) {
          params.push("replication=" + quoteParamValue(this.replication));
        }
        if (this.host) {
          params.push("host=" + quoteParamValue(this.host));
        }
        if (this.isDomainSocket) {
          return cb(null, params.join(" "));
        }
        if (this.client_encoding) {
          params.push("client_encoding=" + quoteParamValue(this.client_encoding));
        }
        dns.lookup(this.host, function(err4, address) {
          if (err4) return cb(err4, null);
          params.push("hostaddr=" + quoteParamValue(address));
          return cb(null, params.join(" "));
        });
      }
    };
    module.exports = ConnectionParameters;
  }
});

// node_modules/pg/lib/result.js
var require_result = __commonJS({
  "node_modules/pg/lib/result.js"(exports, module) {
    "use strict";
    var types2 = require_pg_types();
    var matchRegexp = /^([A-Za-z]+)(?: (\d+))?(?: (\d+))?/;
    var Result2 = class {
      constructor(rowMode, types3) {
        this.command = null;
        this.rowCount = null;
        this.oid = null;
        this.rows = [];
        this.fields = [];
        this._parsers = void 0;
        this._types = types3;
        this.RowCtor = null;
        this.rowAsArray = rowMode === "array";
        if (this.rowAsArray) {
          this.parseRow = this._parseRowAsArray;
        }
        this._prebuiltEmptyResultObject = null;
      }
      // adds a command complete message
      addCommandComplete(msg) {
        let match;
        if (msg.text) {
          match = matchRegexp.exec(msg.text);
        } else {
          match = matchRegexp.exec(msg.command);
        }
        if (match) {
          this.command = match[1];
          if (match[3]) {
            this.oid = parseInt(match[2], 10);
            this.rowCount = parseInt(match[3], 10);
          } else if (match[2]) {
            this.rowCount = parseInt(match[2], 10);
          }
        }
      }
      _parseRowAsArray(rowData) {
        const row = new Array(rowData.length);
        for (let i = 0, len = rowData.length; i < len; i++) {
          const rawValue = rowData[i];
          if (rawValue !== null) {
            row[i] = this._parsers[i](rawValue);
          } else {
            row[i] = null;
          }
        }
        return row;
      }
      parseRow(rowData) {
        const row = { ...this._prebuiltEmptyResultObject };
        for (let i = 0, len = rowData.length; i < len; i++) {
          const rawValue = rowData[i];
          const field = this.fields[i].name;
          if (rawValue !== null) {
            const v = this.fields[i].format === "binary" ? Buffer.from(rawValue) : rawValue;
            row[field] = this._parsers[i](v);
          } else {
            row[field] = null;
          }
        }
        return row;
      }
      addRow(row) {
        this.rows.push(row);
      }
      addFields(fieldDescriptions) {
        this.fields = fieldDescriptions;
        if (this.fields.length) {
          this._parsers = new Array(fieldDescriptions.length);
        }
        const row = /* @__PURE__ */ Object.create(null);
        for (let i = 0; i < fieldDescriptions.length; i++) {
          const desc = fieldDescriptions[i];
          row[desc.name] = null;
          if (this._types) {
            this._parsers[i] = this._types.getTypeParser(desc.dataTypeID, desc.format || "text");
          } else {
            this._parsers[i] = types2.getTypeParser(desc.dataTypeID, desc.format || "text");
          }
        }
        this._prebuiltEmptyResultObject = { ...row };
      }
    };
    module.exports = Result2;
  }
});

// node_modules/pg/lib/query.js
var require_query = __commonJS({
  "node_modules/pg/lib/query.js"(exports, module) {
    "use strict";
    var { EventEmitter } = __require("events");
    var Result2 = require_result();
    var utils = require_utils();
    var Query2 = class extends EventEmitter {
      constructor(config, values, callback) {
        super();
        config = utils.normalizeQueryConfig(config, values, callback);
        this.text = config.text;
        this.values = config.values;
        this.rows = config.rows;
        this.types = config.types;
        this.name = config.name;
        this.queryMode = config.queryMode;
        this.binary = config.binary;
        this.portal = config.portal || "";
        this.callback = config.callback;
        this._rowMode = config.rowMode;
        if (process.domain && config.callback) {
          this.callback = process.domain.bind(config.callback);
        }
        this._result = new Result2(this._rowMode, this.types);
        this._results = this._result;
        this._canceledDueToError = false;
      }
      requiresPreparation() {
        if (this.queryMode === "extended") {
          return true;
        }
        if (this.name) {
          return true;
        }
        if (this.rows) {
          return true;
        }
        if (!this.text) {
          return false;
        }
        if (!this.values) {
          return false;
        }
        return this.values.length > 0;
      }
      _checkForMultirow() {
        if (this._result.command) {
          if (!Array.isArray(this._results)) {
            this._results = [this._result];
          }
          this._result = new Result2(this._rowMode, this._result._types);
          this._results.push(this._result);
        }
      }
      // associates row metadata from the supplied
      // message with this query object
      // metadata used when parsing row results
      handleRowDescription(msg) {
        this._checkForMultirow();
        this._result.addFields(msg.fields);
        this._accumulateRows = this.callback || !this.listeners("row").length;
      }
      handleDataRow(msg) {
        let row;
        if (this._canceledDueToError) {
          return;
        }
        try {
          row = this._result.parseRow(msg.fields);
        } catch (err4) {
          this._canceledDueToError = err4;
          return;
        }
        this.emit("row", row, this._result);
        if (this._accumulateRows) {
          this._result.addRow(row);
        }
      }
      handleCommandComplete(msg, connection) {
        this._checkForMultirow();
        this._result.addCommandComplete(msg);
        if (this.rows) {
          connection.sync();
        }
      }
      // if a named prepared statement is created with empty query text
      // the backend will send an emptyQuery message but *not* a command complete message
      // since we pipeline sync immediately after execute we don't need to do anything here
      // unless we have rows specified, in which case we did not pipeline the initial sync call
      handleEmptyQuery(connection) {
        if (this.rows) {
          connection.sync();
        }
      }
      handleError(err4, connection) {
        if (this._canceledDueToError) {
          err4 = this._canceledDueToError;
          this._canceledDueToError = false;
        }
        if (this.callback) {
          return this.callback(err4);
        }
        this.emit("error", err4);
      }
      handleReadyForQuery(con) {
        if (this._canceledDueToError) {
          return this.handleError(this._canceledDueToError, con);
        }
        if (this.callback) {
          try {
            this.callback(null, this._results);
          } catch (err4) {
            process.nextTick(() => {
              throw err4;
            });
          }
        }
        this.emit("end", this._results);
      }
      submit(connection) {
        if (typeof this.text !== "string" && typeof this.name !== "string") {
          return new Error("A query must have either text or a name. Supplying neither is unsupported.");
        }
        const previous = connection.parsedStatements[this.name] || connection.submittedNamedStatements[this.name];
        if (this.text && previous && this.text !== previous) {
          return new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`);
        }
        if (this.values && !Array.isArray(this.values)) {
          return new Error("Query values must be an array");
        }
        if (this.requiresPreparation()) {
          connection.stream.cork && connection.stream.cork();
          try {
            this.prepare(connection);
          } finally {
            connection.stream.uncork && connection.stream.uncork();
          }
        } else {
          connection.query(this.text);
        }
        return null;
      }
      hasBeenParsed(connection) {
        return this.name && (connection.parsedStatements[this.name] !== void 0 || connection.submittedNamedStatements[this.name] !== void 0);
      }
      handlePortalSuspended(connection) {
        this._getRows(connection, this.rows);
      }
      _getRows(connection, rows) {
        connection.execute({
          portal: this.portal,
          rows
        });
        if (!rows) {
          connection.sync();
        } else {
          connection.flush();
        }
      }
      // http://developer.postgresql.org/pgdocs/postgres/protocol-flow.html#PROTOCOL-FLOW-EXT-QUERY
      prepare(connection) {
        if (!this.hasBeenParsed(connection)) {
          connection.parse({
            text: this.text,
            name: this.name,
            types: this.types
          });
          if (this.name) {
            connection.submittedNamedStatements[this.name] = this.text;
          }
        }
        try {
          connection.bind({
            portal: this.portal,
            statement: this.name,
            values: this.values,
            binary: this.binary,
            valueMapper: utils.prepareValue
          });
        } catch (err4) {
          connection.close({ type: "S", name: this.name });
          connection.sync();
          this.handleError(err4, connection);
          return;
        }
        connection.describe({
          type: "P",
          name: this.portal || ""
        });
        this._getRows(connection, this.rows);
      }
      handleCopyInResponse(connection) {
        connection.sendCopyFail("No source stream defined");
      }
      handleCopyData(msg, connection) {
      }
    };
    module.exports = Query2;
  }
});

// node_modules/pg-protocol/dist/messages.js
var require_messages = __commonJS({
  "node_modules/pg-protocol/dist/messages.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NoticeMessage = exports.DataRowMessage = exports.CommandCompleteMessage = exports.ReadyForQueryMessage = exports.NotificationResponseMessage = exports.BackendKeyDataMessage = exports.AuthenticationMD5Password = exports.ParameterStatusMessage = exports.ParameterDescriptionMessage = exports.RowDescriptionMessage = exports.Field = exports.CopyResponse = exports.CopyDataMessage = exports.DatabaseError = exports.copyDone = exports.emptyQuery = exports.replicationStart = exports.portalSuspended = exports.noData = exports.closeComplete = exports.bindComplete = exports.parseComplete = void 0;
    exports.parseComplete = {
      name: "parseComplete",
      length: 5
    };
    exports.bindComplete = {
      name: "bindComplete",
      length: 5
    };
    exports.closeComplete = {
      name: "closeComplete",
      length: 5
    };
    exports.noData = {
      name: "noData",
      length: 5
    };
    exports.portalSuspended = {
      name: "portalSuspended",
      length: 5
    };
    exports.replicationStart = {
      name: "replicationStart",
      length: 4
    };
    exports.emptyQuery = {
      name: "emptyQuery",
      length: 4
    };
    exports.copyDone = {
      name: "copyDone",
      length: 4
    };
    var DatabaseError2 = class extends Error {
      constructor(message, length, name) {
        super(message);
        this.length = length;
        this.name = name;
      }
    };
    exports.DatabaseError = DatabaseError2;
    var CopyDataMessage = class {
      constructor(length, chunk) {
        this.length = length;
        this.chunk = chunk;
        this.name = "copyData";
      }
    };
    exports.CopyDataMessage = CopyDataMessage;
    var CopyResponse = class {
      constructor(length, name, binary, columnCount) {
        this.length = length;
        this.name = name;
        this.binary = binary;
        this.columnTypes = new Array(columnCount);
      }
    };
    exports.CopyResponse = CopyResponse;
    var Field = class {
      constructor(name, tableID, columnID, dataTypeID, dataTypeSize, dataTypeModifier, format) {
        this.name = name;
        this.tableID = tableID;
        this.columnID = columnID;
        this.dataTypeID = dataTypeID;
        this.dataTypeSize = dataTypeSize;
        this.dataTypeModifier = dataTypeModifier;
        this.format = format;
      }
    };
    exports.Field = Field;
    var RowDescriptionMessage = class {
      constructor(length, fieldCount) {
        this.length = length;
        this.fieldCount = fieldCount;
        this.name = "rowDescription";
        this.fields = new Array(this.fieldCount);
      }
    };
    exports.RowDescriptionMessage = RowDescriptionMessage;
    var ParameterDescriptionMessage = class {
      constructor(length, parameterCount) {
        this.length = length;
        this.parameterCount = parameterCount;
        this.name = "parameterDescription";
        this.dataTypeIDs = new Array(this.parameterCount);
      }
    };
    exports.ParameterDescriptionMessage = ParameterDescriptionMessage;
    var ParameterStatusMessage = class {
      constructor(length, parameterName, parameterValue) {
        this.length = length;
        this.parameterName = parameterName;
        this.parameterValue = parameterValue;
        this.name = "parameterStatus";
      }
    };
    exports.ParameterStatusMessage = ParameterStatusMessage;
    var AuthenticationMD5Password = class {
      constructor(length, salt2) {
        this.length = length;
        this.salt = salt2;
        this.name = "authenticationMD5Password";
      }
    };
    exports.AuthenticationMD5Password = AuthenticationMD5Password;
    var BackendKeyDataMessage = class {
      constructor(length, processID, secretKey) {
        this.length = length;
        this.processID = processID;
        this.secretKey = secretKey;
        this.name = "backendKeyData";
      }
    };
    exports.BackendKeyDataMessage = BackendKeyDataMessage;
    var NotificationResponseMessage = class {
      constructor(length, processId, channel, payload) {
        this.length = length;
        this.processId = processId;
        this.channel = channel;
        this.payload = payload;
        this.name = "notification";
      }
    };
    exports.NotificationResponseMessage = NotificationResponseMessage;
    var ReadyForQueryMessage = class {
      constructor(length, status) {
        this.length = length;
        this.status = status;
        this.name = "readyForQuery";
      }
    };
    exports.ReadyForQueryMessage = ReadyForQueryMessage;
    var CommandCompleteMessage = class {
      constructor(length, text) {
        this.length = length;
        this.text = text;
        this.name = "commandComplete";
      }
    };
    exports.CommandCompleteMessage = CommandCompleteMessage;
    var DataRowMessage = class {
      constructor(length, fields) {
        this.length = length;
        this.fields = fields;
        this.name = "dataRow";
        this.fieldCount = fields.length;
      }
    };
    exports.DataRowMessage = DataRowMessage;
    var NoticeMessage = class {
      constructor(length, message) {
        this.length = length;
        this.message = message;
        this.name = "notice";
      }
    };
    exports.NoticeMessage = NoticeMessage;
  }
});

// node_modules/pg-protocol/dist/buffer-writer.js
var require_buffer_writer = __commonJS({
  "node_modules/pg-protocol/dist/buffer-writer.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Writer = void 0;
    var Writer = class {
      constructor(size2 = 256) {
        this.size = size2;
        this.offset = 5;
        this.headerPosition = 0;
        this.buffer = Buffer.allocUnsafe(size2);
      }
      ensure(size2) {
        const remaining = this.buffer.length - this.offset;
        if (remaining < size2) {
          const oldBuffer = this.buffer;
          const newSize = oldBuffer.length + (oldBuffer.length >> 1) + size2;
          this.buffer = Buffer.allocUnsafe(newSize);
          oldBuffer.copy(this.buffer, 0, 0, this.offset);
        }
      }
      addInt32(num) {
        this.ensure(4);
        this.buffer[this.offset++] = num >>> 24 & 255;
        this.buffer[this.offset++] = num >>> 16 & 255;
        this.buffer[this.offset++] = num >>> 8 & 255;
        this.buffer[this.offset++] = num >>> 0 & 255;
        return this;
      }
      addInt16(num) {
        this.ensure(2);
        this.buffer[this.offset++] = num >>> 8 & 255;
        this.buffer[this.offset++] = num >>> 0 & 255;
        return this;
      }
      addCString(string) {
        if (!string) {
          this.ensure(1);
        } else {
          const len = Buffer.byteLength(string);
          this.ensure(len + 1);
          this.buffer.write(string, this.offset, "utf-8");
          this.offset += len;
        }
        this.buffer[this.offset++] = 0;
        return this;
      }
      addString(string = "") {
        const len = Buffer.byteLength(string);
        this.ensure(len);
        this.buffer.write(string, this.offset);
        this.offset += len;
        return this;
      }
      // Write an Int32 byte-length prefix immediately followed by the string's UTF-8
      // bytes. Postgres' Bind wire format prefixes every parameter with its length,
      // and doing it in one method computes Buffer.byteLength ONCE — the previous
      // `addInt32(Buffer.byteLength(s)).addString(s)` pairing scanned the string
      // three times (byteLength for the prefix, byteLength again inside addString,
      // then the encode), which is costly for large text parameters.
      addInt32PrefixedString(string) {
        const len = Buffer.byteLength(string);
        this.ensure(4 + len);
        const buffer = this.buffer;
        let offset = this.offset;
        buffer[offset++] = len >>> 24 & 255;
        buffer[offset++] = len >>> 16 & 255;
        buffer[offset++] = len >>> 8 & 255;
        buffer[offset++] = len >>> 0 & 255;
        buffer.write(string, offset, "utf-8");
        this.offset = offset + len;
        return this;
      }
      add(otherBuffer) {
        this.ensure(otherBuffer.length);
        otherBuffer.copy(this.buffer, this.offset);
        this.offset += otherBuffer.length;
        return this;
      }
      /**
       * Appends an uninitialized block of {@link size} bytes to the buffer and returns its offset.
       */
      reserveUnsafe(size2) {
        const offset = this.offset;
        this.ensure(size2);
        this.offset += size2;
        return offset;
      }
      join(code) {
        if (code) {
          this.buffer[this.headerPosition] = code;
          const length = this.offset - (this.headerPosition + 1);
          this.buffer.writeInt32BE(length, this.headerPosition + 1);
        }
        return this.buffer.slice(code ? 0 : 5, this.offset);
      }
      flush(code) {
        const result = this.join(code);
        this.offset = 5;
        this.headerPosition = 0;
        this.buffer = Buffer.allocUnsafe(this.size);
        return result;
      }
      clear() {
        this.offset = 5;
        this.headerPosition = 0;
      }
    };
    exports.Writer = Writer;
  }
});

// node_modules/pg-protocol/dist/serializer.js
var require_serializer = __commonJS({
  "node_modules/pg-protocol/dist/serializer.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.serialize = void 0;
    var buffer_writer_1 = require_buffer_writer();
    var writer = new buffer_writer_1.Writer();
    var startup = (opts) => {
      writer.addInt16(3).addInt16(0);
      for (const key of Object.keys(opts)) {
        writer.addCString(key).addCString(opts[key]);
      }
      writer.addCString("client_encoding").addCString("UTF8");
      const bodyBuffer = writer.addCString("").flush();
      const length = bodyBuffer.length + 4;
      return new buffer_writer_1.Writer().addInt32(length).add(bodyBuffer).flush();
    };
    var requestSsl = () => {
      const response = Buffer.allocUnsafe(8);
      response.writeInt32BE(8, 0);
      response.writeInt32BE(80877103, 4);
      return response;
    };
    var password = (password2) => {
      return writer.addCString(password2).flush(
        112
        /* code.startup */
      );
    };
    var sendSASLInitialResponseMessage = function(mechanism, initialResponse) {
      writer.addCString(mechanism).addInt32PrefixedString(initialResponse);
      return writer.flush(
        112
        /* code.startup */
      );
    };
    var sendSCRAMClientFinalMessage = function(additionalData) {
      return writer.addString(additionalData).flush(
        112
        /* code.startup */
      );
    };
    var query = (text) => {
      return writer.addCString(text).flush(
        81
        /* code.query */
      );
    };
    var emptyArray = [];
    var parse = (query2) => {
      const name = query2.name || "";
      if (name.length > 63) {
        console.error("Warning! Postgres only supports 63 characters for query names.");
        console.error("You supplied %s (%s)", name, name.length);
        console.error("This can cause conflicts and silent errors executing queries");
      }
      const types2 = query2.types || emptyArray;
      const len = types2.length;
      const buffer = writer.addCString(name).addCString(query2.text).addInt16(len);
      for (let i = 0; i < len; i++) {
        buffer.addInt32(types2[i]);
      }
      return writer.flush(
        80
        /* code.parse */
      );
    };
    var writeValues = function(values, valueMapper, formatsOffset) {
      const len = values.length;
      for (let i = 0; i < len; i++) {
        const mappedVal = valueMapper ? valueMapper(values[i], i) : values[i];
        let formatByte = 0;
        if (mappedVal == null) {
          writer.addInt32(-1);
        } else if (mappedVal instanceof Buffer) {
          formatByte = 1;
          writer.addInt32(mappedVal.length);
          writer.add(mappedVal);
        } else {
          writer.addInt32PrefixedString(mappedVal);
        }
        const buf = writer.buffer;
        buf[formatsOffset++] = 0;
        buf[formatsOffset++] = formatByte;
      }
    };
    var bind = (config = {}) => {
      const portal = config.portal || "";
      const statement = config.statement || "";
      const binary = config.binary || false;
      const values = config.values || emptyArray;
      const len = values.length;
      writer.addCString(portal).addCString(statement);
      writer.addInt16(len);
      const formatsOffset = writer.reserveUnsafe(len * 2);
      writer.addInt16(len);
      try {
        writeValues(values, config.valueMapper, formatsOffset);
      } catch (err4) {
        writer.clear();
        throw err4;
      }
      writer.addInt16(1);
      writer.addInt16(
        binary ? 1 : 0
        /* ParamType.STRING */
      );
      return writer.flush(
        66
        /* code.bind */
      );
    };
    var emptyExecute = Buffer.from([69, 0, 0, 0, 9, 0, 0, 0, 0, 0]);
    var execute = (config) => {
      if (!config || !config.portal && !config.rows) {
        return emptyExecute;
      }
      const portal = config.portal || "";
      const rows = config.rows || 0;
      const portalLength = Buffer.byteLength(portal);
      const len = 4 + portalLength + 1 + 4;
      const buff = Buffer.allocUnsafe(1 + len);
      buff[0] = 69;
      buff.writeInt32BE(len, 1);
      buff.write(portal, 5, "utf-8");
      buff[portalLength + 5] = 0;
      buff.writeUInt32BE(rows, buff.length - 4);
      return buff;
    };
    var cancel = (processID, secretKey) => {
      const buffer = Buffer.allocUnsafe(16);
      buffer.writeInt32BE(16, 0);
      buffer.writeInt16BE(1234, 4);
      buffer.writeInt16BE(5678, 6);
      buffer.writeInt32BE(processID, 8);
      buffer.writeInt32BE(secretKey, 12);
      return buffer;
    };
    var cstringMessage = (code, string) => {
      const stringLen = Buffer.byteLength(string);
      const len = 4 + stringLen + 1;
      const buffer = Buffer.allocUnsafe(1 + len);
      buffer[0] = code;
      buffer.writeInt32BE(len, 1);
      buffer.write(string, 5, "utf-8");
      buffer[len] = 0;
      return buffer;
    };
    var emptyDescribePortal = writer.addCString("P").flush(
      68
      /* code.describe */
    );
    var emptyDescribeStatement = writer.addCString("S").flush(
      68
      /* code.describe */
    );
    var describe = (msg) => {
      return msg.name ? cstringMessage(68, `${msg.type}${msg.name || ""}`) : msg.type === "P" ? emptyDescribePortal : emptyDescribeStatement;
    };
    var close = (msg) => {
      const text = `${msg.type}${msg.name || ""}`;
      return cstringMessage(67, text);
    };
    var copyData = (chunk) => {
      return writer.add(chunk).flush(
        100
        /* code.copyFromChunk */
      );
    };
    var copyFail = (message) => {
      return cstringMessage(102, message);
    };
    var codeOnlyBuffer = (code) => Buffer.from([code, 0, 0, 0, 4]);
    var flushBuffer = codeOnlyBuffer(
      72
      /* code.flush */
    );
    var syncBuffer = codeOnlyBuffer(
      83
      /* code.sync */
    );
    var endBuffer = codeOnlyBuffer(
      88
      /* code.end */
    );
    var copyDoneBuffer = codeOnlyBuffer(
      99
      /* code.copyDone */
    );
    var serialize = {
      startup,
      password,
      requestSsl,
      sendSASLInitialResponseMessage,
      sendSCRAMClientFinalMessage,
      query,
      parse,
      bind,
      execute,
      describe,
      close,
      flush: () => flushBuffer,
      sync: () => syncBuffer,
      end: () => endBuffer,
      copyData,
      copyDone: () => copyDoneBuffer,
      copyFail,
      cancel
    };
    exports.serialize = serialize;
  }
});

// node_modules/pg-protocol/dist/buffer-reader.js
var require_buffer_reader = __commonJS({
  "node_modules/pg-protocol/dist/buffer-reader.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BufferReader = void 0;
    var BufferReader = class {
      constructor(offset = 0) {
        this.offset = offset;
        this.buffer = Buffer.allocUnsafe(0);
        this.encoding = "utf-8";
      }
      setBuffer(offset, buffer) {
        this.offset = offset;
        this.buffer = buffer;
      }
      int16() {
        const result = this.buffer.readInt16BE(this.offset);
        this.offset += 2;
        return result;
      }
      byte() {
        const result = this.buffer[this.offset];
        this.offset++;
        return result;
      }
      int32() {
        const result = this.buffer.readInt32BE(this.offset);
        this.offset += 4;
        return result;
      }
      uint32() {
        const result = this.buffer.readUInt32BE(this.offset);
        this.offset += 4;
        return result;
      }
      string(length) {
        const result = this.buffer.toString(this.encoding, this.offset, this.offset + length);
        this.offset += length;
        return result;
      }
      cstring() {
        const start = this.offset;
        let end = start;
        while (this.buffer[end++]) {
        }
        this.offset = end;
        return this.buffer.toString(this.encoding, start, end - 1);
      }
      bytes(length) {
        const result = this.buffer.slice(this.offset, this.offset + length);
        this.offset += length;
        return result;
      }
    };
    exports.BufferReader = BufferReader;
  }
});

// node_modules/pg-protocol/dist/parser.js
var require_parser = __commonJS({
  "node_modules/pg-protocol/dist/parser.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Parser = void 0;
    var messages_1 = require_messages();
    var buffer_reader_1 = require_buffer_reader();
    var CODE_LENGTH = 1;
    var LEN_LENGTH = 4;
    var HEADER_LENGTH = CODE_LENGTH + LEN_LENGTH;
    var LATEINIT_LENGTH = -1;
    var emptyBuffer = Buffer.allocUnsafe(0);
    var Parser = class {
      constructor(opts) {
        this.buffer = emptyBuffer;
        this.bufferLength = 0;
        this.bufferOffset = 0;
        this.reader = new buffer_reader_1.BufferReader();
        if ((opts === null || opts === void 0 ? void 0 : opts.mode) === "binary") {
          throw new Error("Binary mode not supported yet");
        }
        this.mode = (opts === null || opts === void 0 ? void 0 : opts.mode) || "text";
      }
      parse(buffer, callback) {
        this.mergeBuffer(buffer);
        const bufferFullLength = this.bufferOffset + this.bufferLength;
        let offset = this.bufferOffset;
        while (offset + HEADER_LENGTH <= bufferFullLength) {
          const code = this.buffer[offset];
          const length = this.buffer.readUInt32BE(offset + CODE_LENGTH);
          const fullMessageLength = CODE_LENGTH + length;
          if (fullMessageLength + offset <= bufferFullLength) {
            const message = this.handlePacket(offset + HEADER_LENGTH, code, length, this.buffer);
            callback(message);
            offset += fullMessageLength;
          } else {
            break;
          }
        }
        if (offset === bufferFullLength) {
          this.buffer = emptyBuffer;
          this.bufferLength = 0;
          this.bufferOffset = 0;
        } else {
          this.bufferLength = bufferFullLength - offset;
          this.bufferOffset = offset;
        }
      }
      mergeBuffer(buffer) {
        if (this.bufferLength > 0) {
          const newLength = this.bufferLength + buffer.byteLength;
          const newFullLength = newLength + this.bufferOffset;
          if (newFullLength > this.buffer.byteLength) {
            let newBuffer;
            if (newLength <= this.buffer.byteLength && this.bufferOffset >= this.bufferLength) {
              newBuffer = this.buffer;
            } else {
              let newBufferLength = this.buffer.byteLength * 2;
              while (newLength >= newBufferLength) {
                newBufferLength *= 2;
              }
              newBuffer = Buffer.allocUnsafe(newBufferLength);
            }
            this.buffer.copy(newBuffer, 0, this.bufferOffset, this.bufferOffset + this.bufferLength);
            this.buffer = newBuffer;
            this.bufferOffset = 0;
          }
          buffer.copy(this.buffer, this.bufferOffset + this.bufferLength);
          this.bufferLength = newLength;
        } else {
          this.buffer = buffer;
          this.bufferOffset = 0;
          this.bufferLength = buffer.byteLength;
        }
      }
      handlePacket(offset, code, length, bytes) {
        const { reader } = this;
        reader.setBuffer(offset, bytes);
        let message;
        switch (code) {
          case 50:
            message = messages_1.bindComplete;
            break;
          case 49:
            message = messages_1.parseComplete;
            break;
          case 51:
            message = messages_1.closeComplete;
            break;
          case 110:
            message = messages_1.noData;
            break;
          case 115:
            message = messages_1.portalSuspended;
            break;
          case 99:
            message = messages_1.copyDone;
            break;
          case 87:
            message = messages_1.replicationStart;
            break;
          case 73:
            message = messages_1.emptyQuery;
            break;
          case 68:
            message = parseDataRowMessage(reader);
            break;
          case 67:
            message = parseCommandCompleteMessage(reader);
            break;
          case 90:
            message = parseReadyForQueryMessage(reader);
            break;
          case 65:
            message = parseNotificationMessage(reader);
            break;
          case 82:
            message = parseAuthenticationResponse(reader, length);
            break;
          case 83:
            message = parseParameterStatusMessage(reader);
            break;
          case 75:
            message = parseBackendKeyData(reader);
            break;
          case 69:
            message = parseErrorMessage(reader, "error");
            break;
          case 78:
            message = parseErrorMessage(reader, "notice");
            break;
          case 84:
            message = parseRowDescriptionMessage(reader);
            break;
          case 116:
            message = parseParameterDescriptionMessage(reader);
            break;
          case 71:
            message = parseCopyInMessage(reader);
            break;
          case 72:
            message = parseCopyOutMessage(reader);
            break;
          case 100:
            message = parseCopyData(reader, length);
            break;
          default:
            return new messages_1.DatabaseError("received invalid response: " + code.toString(16), length, "error");
        }
        reader.setBuffer(0, emptyBuffer);
        message.length = length;
        return message;
      }
    };
    exports.Parser = Parser;
    var parseReadyForQueryMessage = (reader) => {
      const status = reader.string(1);
      return new messages_1.ReadyForQueryMessage(LATEINIT_LENGTH, status);
    };
    var parseCommandCompleteMessage = (reader) => {
      const text = reader.cstring();
      return new messages_1.CommandCompleteMessage(LATEINIT_LENGTH, text);
    };
    var parseCopyData = (reader, length) => {
      const chunk = reader.bytes(length - 4);
      return new messages_1.CopyDataMessage(LATEINIT_LENGTH, chunk);
    };
    var parseCopyInMessage = (reader) => parseCopyMessage(reader, "copyInResponse");
    var parseCopyOutMessage = (reader) => parseCopyMessage(reader, "copyOutResponse");
    var parseCopyMessage = (reader, messageName) => {
      const isBinary = reader.byte() !== 0;
      const columnCount = reader.int16();
      const message = new messages_1.CopyResponse(LATEINIT_LENGTH, messageName, isBinary, columnCount);
      for (let i = 0; i < columnCount; i++) {
        message.columnTypes[i] = reader.int16();
      }
      return message;
    };
    var parseNotificationMessage = (reader) => {
      const processId = reader.int32();
      const channel = reader.cstring();
      const payload = reader.cstring();
      return new messages_1.NotificationResponseMessage(LATEINIT_LENGTH, processId, channel, payload);
    };
    var parseRowDescriptionMessage = (reader) => {
      const fieldCount = reader.int16();
      const message = new messages_1.RowDescriptionMessage(LATEINIT_LENGTH, fieldCount);
      for (let i = 0; i < fieldCount; i++) {
        message.fields[i] = parseField(reader);
      }
      return message;
    };
    var parseField = (reader) => {
      const name = reader.cstring();
      const tableID = reader.uint32();
      const columnID = reader.int16();
      const dataTypeID = reader.uint32();
      const dataTypeSize = reader.int16();
      const dataTypeModifier = reader.int32();
      const mode = reader.int16() === 0 ? "text" : "binary";
      return new messages_1.Field(name, tableID, columnID, dataTypeID, dataTypeSize, dataTypeModifier, mode);
    };
    var parseParameterDescriptionMessage = (reader) => {
      const parameterCount = reader.int16();
      const message = new messages_1.ParameterDescriptionMessage(LATEINIT_LENGTH, parameterCount);
      for (let i = 0; i < parameterCount; i++) {
        message.dataTypeIDs[i] = reader.uint32();
      }
      return message;
    };
    var parseDataRowMessage = (reader) => {
      const fieldCount = reader.int16();
      const fields = new Array(fieldCount);
      for (let i = 0; i < fieldCount; i++) {
        const len = reader.int32();
        fields[i] = len === -1 ? null : reader.string(len);
      }
      return new messages_1.DataRowMessage(LATEINIT_LENGTH, fields);
    };
    var parseParameterStatusMessage = (reader) => {
      const name = reader.cstring();
      const value = reader.cstring();
      return new messages_1.ParameterStatusMessage(LATEINIT_LENGTH, name, value);
    };
    var parseBackendKeyData = (reader) => {
      const processID = reader.int32();
      const secretKey = reader.int32();
      return new messages_1.BackendKeyDataMessage(LATEINIT_LENGTH, processID, secretKey);
    };
    var parseAuthenticationResponse = (reader, length) => {
      const code = reader.int32();
      const message = {
        name: "authenticationOk",
        length
      };
      switch (code) {
        case 0:
          break;
        case 3:
          if (message.length === 8) {
            message.name = "authenticationCleartextPassword";
          }
          break;
        case 5:
          if (message.length === 12) {
            message.name = "authenticationMD5Password";
            const salt2 = reader.bytes(4);
            return new messages_1.AuthenticationMD5Password(LATEINIT_LENGTH, salt2);
          }
          break;
        case 10:
          {
            message.name = "authenticationSASL";
            message.mechanisms = [];
            let mechanism;
            do {
              mechanism = reader.cstring();
              if (mechanism) {
                message.mechanisms.push(mechanism);
              }
            } while (mechanism);
          }
          break;
        case 11:
          message.name = "authenticationSASLContinue";
          message.data = reader.string(length - 8);
          break;
        case 12:
          message.name = "authenticationSASLFinal";
          message.data = reader.string(length - 8);
          break;
        default:
          throw new Error("Unknown authenticationOk message type " + code);
      }
      return message;
    };
    var parseErrorMessage = (reader, name) => {
      const fields = {};
      let fieldType = reader.string(1);
      while (fieldType !== "\0") {
        fields[fieldType] = reader.cstring();
        fieldType = reader.string(1);
      }
      const messageValue = fields.M;
      const message = name === "notice" ? new messages_1.NoticeMessage(LATEINIT_LENGTH, messageValue) : new messages_1.DatabaseError(messageValue, LATEINIT_LENGTH, name);
      message.severity = fields.S;
      message.code = fields.C;
      message.detail = fields.D;
      message.hint = fields.H;
      message.position = fields.P;
      message.internalPosition = fields.p;
      message.internalQuery = fields.q;
      message.where = fields.W;
      message.schema = fields.s;
      message.table = fields.t;
      message.column = fields.c;
      message.dataType = fields.d;
      message.constraint = fields.n;
      message.file = fields.F;
      message.line = fields.L;
      message.routine = fields.R;
      return message;
    };
  }
});

// node_modules/pg-protocol/dist/index.js
var require_dist = __commonJS({
  "node_modules/pg-protocol/dist/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DatabaseError = exports.serialize = void 0;
    exports.parse = parse;
    var messages_1 = require_messages();
    Object.defineProperty(exports, "DatabaseError", { enumerable: true, get: function() {
      return messages_1.DatabaseError;
    } });
    var serializer_1 = require_serializer();
    Object.defineProperty(exports, "serialize", { enumerable: true, get: function() {
      return serializer_1.serialize;
    } });
    var parser_1 = require_parser();
    function parse(stream, callback) {
      const parser = new parser_1.Parser();
      stream.on("data", (buffer) => parser.parse(buffer, callback));
      return new Promise((resolve) => stream.on("end", () => resolve()));
    }
  }
});

// node_modules/pg-cloudflare/dist/empty.js
var require_empty = __commonJS({
  "node_modules/pg-cloudflare/dist/empty.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = {};
  }
});

// node_modules/pg/lib/stream.js
var require_stream = __commonJS({
  "node_modules/pg/lib/stream.js"(exports, module) {
    var { getStream, getSecureStream } = getStreamFuncs();
    module.exports = {
      /**
       * Get a socket stream compatible with the current runtime environment.
       * @returns {Duplex}
       */
      getStream,
      /**
       * Get a TLS secured socket, compatible with the current environment,
       * using the socket and other settings given in `options`.
       * @returns {Duplex}
       */
      getSecureStream
    };
    function getNodejsStreamFuncs() {
      function getStream2(ssl) {
        const net = __require("net");
        return new net.Socket();
      }
      function getSecureStream2(options) {
        const tls2 = __require("tls");
        return tls2.connect(options);
      }
      return {
        getStream: getStream2,
        getSecureStream: getSecureStream2
      };
    }
    function getCloudflareStreamFuncs() {
      function getStream2(ssl) {
        const { CloudflareSocket } = require_empty();
        return new CloudflareSocket(ssl);
      }
      function getSecureStream2(options) {
        options.socket.startTls(options);
        return options.socket;
      }
      return {
        getStream: getStream2,
        getSecureStream: getSecureStream2
      };
    }
    function isCloudflareRuntime() {
      if (typeof navigator === "object" && navigator !== null && typeof navigator.userAgent === "string") {
        return navigator.userAgent === "Cloudflare-Workers";
      }
      if (typeof Response === "function") {
        const resp = new Response(null, { cf: { thing: true } });
        if (typeof resp.cf === "object" && resp.cf !== null && resp.cf.thing) {
          return true;
        }
      }
      return false;
    }
    function getStreamFuncs() {
      if (isCloudflareRuntime()) {
        return getCloudflareStreamFuncs();
      }
      return getNodejsStreamFuncs();
    }
  }
});

// node_modules/pg/lib/connection.js
var require_connection = __commonJS({
  "node_modules/pg/lib/connection.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events").EventEmitter;
    var { parse, serialize } = require_dist();
    var stream = require_stream();
    var { getStream } = stream;
    var flushBuffer = serialize.flush();
    var syncBuffer = serialize.sync();
    var endBuffer = serialize.end();
    var Connection2 = class extends EventEmitter {
      constructor(config) {
        super();
        config = config || {};
        this.stream = config.stream || getStream(config.ssl);
        if (typeof this.stream === "function") {
          this.stream = this.stream(config);
        }
        this._keepAlive = config.keepAlive;
        this._keepAliveInitialDelayMillis = config.keepAliveInitialDelayMillis;
        this.parsedStatements = {};
        this.submittedNamedStatements = {};
        this.ssl = config.ssl || false;
        this.sslNegotiation = config.sslNegotiation || "postgres";
        this._ending = false;
        this._emitMessage = false;
        const self = this;
        this.on("newListener", function(eventName) {
          if (eventName === "message") {
            self._emitMessage = true;
          }
        });
      }
      connect(port, host) {
        const self = this;
        this._connecting = true;
        this.stream.setNoDelay(true);
        this.stream.connect(port, host);
        this.stream.once("connect", function() {
          if (self._keepAlive) {
            self.stream.setKeepAlive(true, self._keepAliveInitialDelayMillis);
          }
          self.emit("connect");
        });
        const reportStreamError = function(error) {
          if (self._ending && (error.code === "ECONNRESET" || error.code === "EPIPE")) {
            return;
          }
          self.emit("error", error);
        };
        this.stream.on("error", reportStreamError);
        this.stream.on("close", function() {
          self.emit("end");
        });
        if (!this.ssl) {
          return this.attachListeners(this.stream);
        }
        if (this.sslNegotiation === "direct") {
          return this.stream.once("connect", function() {
            self.upgradeToSSL(host, reportStreamError);
          });
        }
        this.stream.once("data", function(buffer) {
          const responseCode = buffer.toString("utf8");
          switch (responseCode) {
            case "S":
              break;
            case "N":
              self.stream.end();
              return self.emit("error", new Error("The server does not support SSL connections"));
            default:
              self.stream.end();
              return self.emit("error", new Error("There was an error establishing an SSL connection"));
          }
          self.upgradeToSSL(host, reportStreamError);
        });
      }
      upgradeToSSL(host, reportStreamError) {
        const self = this;
        const options = {
          socket: self.stream,
          // tls.connect checks the server identity against `servername`, falling
          // back to `host` and then to 'localhost'. `servername` must stay unset
          // for IP addresses (see below), so `host` is needed to keep certificate
          // validation working when connecting to an IP address.
          host
        };
        if (self.ssl !== true) {
          Object.assign(options, self.ssl);
          if ("key" in self.ssl) {
            options.key = self.ssl.key;
          }
        }
        if (self.sslNegotiation === "direct") {
          options.ALPNProtocols = ["postgresql"];
        }
        const net = __require("net");
        if (net.isIP && net.isIP(host) === 0) {
          options.servername = host;
        }
        try {
          self.stream = stream.getSecureStream(options);
        } catch (err4) {
          return self.emit("error", err4);
        }
        self.attachListeners(self.stream);
        self.stream.on("error", reportStreamError);
        self.emit("sslconnect");
      }
      attachListeners(stream2) {
        parse(stream2, (msg) => {
          const eventName = msg.name === "error" ? "errorMessage" : msg.name;
          if (this._emitMessage) {
            this.emit("message", msg);
          }
          this.emit(eventName, msg);
        });
      }
      requestSsl() {
        this.stream.write(serialize.requestSsl());
      }
      startup(config) {
        this.stream.write(serialize.startup(config));
      }
      cancel(processID, secretKey) {
        this._send(serialize.cancel(processID, secretKey));
      }
      password(password) {
        this._send(serialize.password(password));
      }
      sendSASLInitialResponseMessage(mechanism, initialResponse) {
        this._send(serialize.sendSASLInitialResponseMessage(mechanism, initialResponse));
      }
      sendSCRAMClientFinalMessage(additionalData) {
        this._send(serialize.sendSCRAMClientFinalMessage(additionalData));
      }
      _send(buffer) {
        if (!this.stream.writable) {
          return false;
        }
        return this.stream.write(buffer);
      }
      query(text) {
        this._send(serialize.query(text));
      }
      // send parse message
      parse(query) {
        this._send(serialize.parse(query));
      }
      // send bind message
      bind(config) {
        this._send(serialize.bind(config));
      }
      // send execute message
      execute(config) {
        this._send(serialize.execute(config));
      }
      flush() {
        if (this.stream.writable) {
          this.stream.write(flushBuffer);
        }
      }
      sync() {
        this._send(syncBuffer);
      }
      ref() {
        this.stream.ref();
      }
      unref() {
        this.stream.unref();
      }
      end() {
        this._ending = true;
        if (!this._connecting || !this.stream.writable) {
          this.stream.end();
          return;
        }
        return this.stream.write(endBuffer, () => {
          this.stream.end();
        });
      }
      close(msg) {
        this._send(serialize.close(msg));
      }
      describe(msg) {
        this._send(serialize.describe(msg));
      }
      sendCopyFromChunk(chunk) {
        this._send(serialize.copyData(chunk));
      }
      endCopyFrom() {
        this._send(serialize.copyDone());
      }
      sendCopyFail(msg) {
        this._send(serialize.copyFail(msg));
      }
    };
    module.exports = Connection2;
  }
});

// node_modules/split2/index.js
var require_split2 = __commonJS({
  "node_modules/split2/index.js"(exports, module) {
    "use strict";
    var { Transform } = __require("stream");
    var { StringDecoder } = __require("string_decoder");
    var kLast = /* @__PURE__ */ Symbol("last");
    var kDecoder = /* @__PURE__ */ Symbol("decoder");
    function transform(chunk, enc, cb) {
      let list;
      if (this.overflow) {
        const buf = this[kDecoder].write(chunk);
        list = buf.split(this.matcher);
        if (list.length === 1) return cb();
        list.shift();
        this.overflow = false;
      } else {
        this[kLast] += this[kDecoder].write(chunk);
        list = this[kLast].split(this.matcher);
      }
      this[kLast] = list.pop();
      for (let i = 0; i < list.length; i++) {
        try {
          push(this, this.mapper(list[i]));
        } catch (error) {
          return cb(error);
        }
      }
      this.overflow = this[kLast].length > this.maxLength;
      if (this.overflow && !this.skipOverflow) {
        cb(new Error("maximum buffer reached"));
        return;
      }
      cb();
    }
    function flush(cb) {
      this[kLast] += this[kDecoder].end();
      if (this[kLast]) {
        try {
          push(this, this.mapper(this[kLast]));
        } catch (error) {
          return cb(error);
        }
      }
      cb();
    }
    function push(self, val) {
      if (val !== void 0) {
        self.push(val);
      }
    }
    function noop(incoming) {
      return incoming;
    }
    function split2(matcher, mapper, options) {
      matcher = matcher || /\r?\n/;
      mapper = mapper || noop;
      options = options || {};
      switch (arguments.length) {
        case 1:
          if (typeof matcher === "function") {
            mapper = matcher;
            matcher = /\r?\n/;
          } else if (typeof matcher === "object" && !(matcher instanceof RegExp) && !matcher[Symbol.split]) {
            options = matcher;
            matcher = /\r?\n/;
          }
          break;
        case 2:
          if (typeof matcher === "function") {
            options = mapper;
            mapper = matcher;
            matcher = /\r?\n/;
          } else if (typeof mapper === "object") {
            options = mapper;
            mapper = noop;
          }
      }
      options = Object.assign({}, options);
      options.autoDestroy = true;
      options.transform = transform;
      options.flush = flush;
      options.readableObjectMode = true;
      const stream = new Transform(options);
      stream[kLast] = "";
      stream[kDecoder] = new StringDecoder("utf8");
      stream.matcher = matcher;
      stream.mapper = mapper;
      stream.maxLength = options.maxLength;
      stream.skipOverflow = options.skipOverflow || false;
      stream.overflow = false;
      stream._destroy = function(err4, cb) {
        this._writableState.errorEmitted = false;
        cb(err4);
      };
      return stream;
    }
    module.exports = split2;
  }
});

// node_modules/pgpass/lib/helper.js
var require_helper = __commonJS({
  "node_modules/pgpass/lib/helper.js"(exports, module) {
    "use strict";
    var path = __require("path");
    var Stream = __require("stream").Stream;
    var split2 = require_split2();
    var util = __require("util");
    var defaultPort = 5432;
    var isWin = process.platform === "win32";
    var warnStream = process.stderr;
    var S_IRWXG = 56;
    var S_IRWXO = 7;
    var S_IFMT = 61440;
    var S_IFREG = 32768;
    function isRegFile(mode) {
      return (mode & S_IFMT) == S_IFREG;
    }
    var fieldNames = ["host", "port", "database", "user", "password"];
    var nrOfFields = fieldNames.length;
    var passKey = fieldNames[nrOfFields - 1];
    function warn() {
      var isWritable = warnStream instanceof Stream && true === warnStream.writable;
      if (isWritable) {
        var args = Array.prototype.slice.call(arguments).concat("\n");
        warnStream.write(util.format.apply(util, args));
      }
    }
    Object.defineProperty(module.exports, "isWin", {
      get: function() {
        return isWin;
      },
      set: function(val) {
        isWin = val;
      }
    });
    module.exports.warnTo = function(stream) {
      var old = warnStream;
      warnStream = stream;
      return old;
    };
    module.exports.getFileName = function(rawEnv) {
      var env = rawEnv || process.env;
      var file = env.PGPASSFILE || (isWin ? path.join(env.APPDATA || "./", "postgresql", "pgpass.conf") : path.join(env.HOME || "./", ".pgpass"));
      return file;
    };
    module.exports.usePgPass = function(stats2, fname) {
      if (Object.prototype.hasOwnProperty.call(process.env, "PGPASSWORD")) {
        return false;
      }
      if (isWin) {
        return true;
      }
      fname = fname || "<unkn>";
      if (!isRegFile(stats2.mode)) {
        warn('WARNING: password file "%s" is not a plain file', fname);
        return false;
      }
      if (stats2.mode & (S_IRWXG | S_IRWXO)) {
        warn('WARNING: password file "%s" has group or world access; permissions should be u=rw (0600) or less', fname);
        return false;
      }
      return true;
    };
    var matcher = module.exports.match = function(connInfo, entry) {
      return fieldNames.slice(0, -1).reduce(function(prev, field, idx) {
        if (idx == 1) {
          if (Number(connInfo[field] || defaultPort) === Number(entry[field])) {
            return prev && true;
          }
        }
        return prev && (entry[field] === "*" || entry[field] === connInfo[field]);
      }, true);
    };
    module.exports.getPassword = function(connInfo, stream, cb) {
      var pass;
      var lineStream = stream.pipe(split2());
      function onLine(line) {
        var entry = parseLine(line);
        if (entry && isValidEntry(entry) && matcher(connInfo, entry)) {
          pass = entry[passKey];
          lineStream.end();
        }
      }
      var onEnd = function() {
        stream.destroy();
        cb(pass);
      };
      var onErr = function(err4) {
        stream.destroy();
        warn("WARNING: error on reading file: %s", err4);
        cb(void 0);
      };
      stream.on("error", onErr);
      lineStream.on("data", onLine).on("end", onEnd).on("error", onErr);
    };
    var parseLine = module.exports.parseLine = function(line) {
      if (line.length < 11 || line.match(/^\s+#/)) {
        return null;
      }
      var curChar = "";
      var prevChar = "";
      var fieldIdx = 0;
      var startIdx = 0;
      var endIdx = 0;
      var obj = {};
      var isLastField = false;
      var addToObj = function(idx, i0, i1) {
        var field = line.substring(i0, i1);
        if (!Object.hasOwnProperty.call(process.env, "PGPASS_NO_DEESCAPE")) {
          field = field.replace(/\\([:\\])/g, "$1");
        }
        obj[fieldNames[idx]] = field;
      };
      for (var i = 0; i < line.length - 1; i += 1) {
        curChar = line.charAt(i + 1);
        prevChar = line.charAt(i);
        isLastField = fieldIdx == nrOfFields - 1;
        if (isLastField) {
          addToObj(fieldIdx, startIdx);
          break;
        }
        if (i >= 0 && curChar == ":" && prevChar !== "\\") {
          addToObj(fieldIdx, startIdx, i + 1);
          startIdx = i + 2;
          fieldIdx += 1;
        }
      }
      obj = Object.keys(obj).length === nrOfFields ? obj : null;
      return obj;
    };
    var isValidEntry = module.exports.isValidEntry = function(entry) {
      var rules = {
        // host
        0: function(x) {
          return x.length > 0;
        },
        // port
        1: function(x) {
          if (x === "*") {
            return true;
          }
          x = Number(x);
          return isFinite(x) && x > 0 && x < 9007199254740992 && Math.floor(x) === x;
        },
        // database
        2: function(x) {
          return x.length > 0;
        },
        // username
        3: function(x) {
          return x.length > 0;
        },
        // password
        4: function(x) {
          return x.length > 0;
        }
      };
      for (var idx = 0; idx < fieldNames.length; idx += 1) {
        var rule = rules[idx];
        var value = entry[fieldNames[idx]] || "";
        var res = rule(value);
        if (!res) {
          return false;
        }
      }
      return true;
    };
  }
});

// node_modules/pgpass/lib/index.js
var require_lib = __commonJS({
  "node_modules/pgpass/lib/index.js"(exports, module) {
    "use strict";
    var path = __require("path");
    var fs = __require("fs");
    var helper = require_helper();
    module.exports = function(connInfo, cb) {
      var file = helper.getFileName();
      fs.stat(file, function(err4, stat) {
        if (err4 || !helper.usePgPass(stat, file)) {
          return cb(void 0);
        }
        var st = fs.createReadStream(file);
        helper.getPassword(connInfo, st, cb);
      });
    };
    module.exports.warnTo = helper.warnTo;
  }
});

// node_modules/pg/lib/client.js
var require_client = __commonJS({
  "node_modules/pg/lib/client.js"(exports, module) {
    var EventEmitter = __require("events").EventEmitter;
    var utils = require_utils();
    var nodeUtils = __require("util");
    var sasl = require_sasl();
    var TypeOverrides2 = require_type_overrides();
    var ConnectionParameters = require_connection_parameters();
    var Query2 = require_query();
    var defaults2 = require_defaults();
    var Connection2 = require_connection();
    var crypto = require_utils2();
    var activeQueryDeprecationNotice = nodeUtils.deprecate(
      () => {
      },
      "Client.activeQuery is deprecated and will be removed in pg@9.0"
    );
    var queryQueueDeprecationNotice = nodeUtils.deprecate(
      () => {
      },
      "Client.queryQueue is deprecated and will be removed in pg@9.0."
    );
    var pgPassDeprecationNotice = nodeUtils.deprecate(
      () => {
      },
      "pgpass support is deprecated and will be removed in pg@9.0. You can provide an async function as the password property to the Client/Pool constructor that returns a password instead. Within this function you can call the pgpass module in your own code."
    );
    var byoPromiseDeprecationNotice = nodeUtils.deprecate(
      () => {
      },
      "Passing a custom Promise implementation to the Client/Pool constructor is deprecated and will be removed in pg@9.0."
    );
    var queryQueueLengthDeprecationNotice = nodeUtils.deprecate(
      () => {
      },
      "Calling client.query() when the client is already executing a query is deprecated and will be removed in pg@9.0. Use async/await or an external async flow control mechanism instead."
    );
    function coerceNumberOrDefault(value, defaultValue) {
      if (typeof value === "number") {
        return Number.isFinite(value) ? value : defaultValue;
      }
      if (typeof value === "string" && value.trim() !== "") {
        const n = Number(value);
        return Number.isFinite(n) ? n : defaultValue;
      }
      return defaultValue;
    }
    var Client2 = class extends EventEmitter {
      constructor(config) {
        super();
        this.connectionParameters = new ConnectionParameters(config);
        this.user = this.connectionParameters.user;
        this.database = this.connectionParameters.database;
        this.port = this.connectionParameters.port;
        this.host = this.connectionParameters.host;
        Object.defineProperty(this, "password", {
          configurable: true,
          enumerable: false,
          writable: true,
          value: this.connectionParameters.password
        });
        this.replication = this.connectionParameters.replication;
        const c = config || {};
        if (c.Promise) {
          byoPromiseDeprecationNotice();
        }
        this._Promise = c.Promise || global.Promise;
        this._types = new TypeOverrides2(c.types);
        this._ending = false;
        this._ended = false;
        this._connecting = false;
        this._connected = false;
        this._connectionError = false;
        this._queryable = true;
        this._activeQuery = null;
        this._txStatus = null;
        this.enableChannelBinding = Boolean(c.enableChannelBinding);
        this.scramMaxIterations = coerceNumberOrDefault(c.scramMaxIterations, sasl.DEFAULT_MAX_SCRAM_ITERATIONS);
        this.connection = c.connection || new Connection2({
          stream: c.stream,
          ssl: this.connectionParameters.ssl,
          sslNegotiation: this.connectionParameters.sslnegotiation,
          keepAlive: c.keepAlive || false,
          keepAliveInitialDelayMillis: c.keepAliveInitialDelayMillis || 0,
          encoding: this.connectionParameters.client_encoding || "utf8"
        });
        this._queryQueue = [];
        this._sentQueryQueue = [];
        this.pipeline = Boolean(c.pipeline);
        this.binary = c.binary || defaults2.binary;
        this.processID = null;
        this.secretKey = null;
        this.ssl = this.connectionParameters.ssl || false;
        this.sslNegotiation = this.connectionParameters.sslnegotiation || "postgres";
        if (this.ssl && this.ssl.key) {
          Object.defineProperty(this.ssl, "key", {
            enumerable: false
          });
        }
        this._connectionTimeoutMillis = c.connectionTimeoutMillis || 0;
      }
      get activeQuery() {
        activeQueryDeprecationNotice();
        return this._activeQuery;
      }
      set activeQuery(val) {
        activeQueryDeprecationNotice();
        this._activeQuery = val;
      }
      _getActiveQuery() {
        return this._activeQuery;
      }
      _errorAllQueries(err4) {
        const enqueueError = (query) => {
          process.nextTick(() => {
            query.handleError(err4, this.connection);
          });
        };
        const activeQuery = this._getActiveQuery();
        if (activeQuery) {
          enqueueError(activeQuery);
          this._activeQuery = null;
        }
        this._sentQueryQueue.forEach(enqueueError);
        this._sentQueryQueue.length = 0;
        this._queryQueue.forEach(enqueueError);
        this._queryQueue.length = 0;
      }
      _connect(callback) {
        const self = this;
        const con = this.connection;
        this._connectionCallback = callback;
        if (this._connecting || this._connected) {
          const err4 = new Error("Client has already been connected. You cannot reuse a client.");
          process.nextTick(() => {
            callback(err4);
          });
          return;
        }
        this._connecting = true;
        if (this._connectionTimeoutMillis > 0) {
          this.connectionTimeoutHandle = setTimeout(() => {
            con._ending = true;
            con.stream.destroy(new Error("timeout expired"));
          }, this._connectionTimeoutMillis);
          if (this.connectionTimeoutHandle.unref) {
            this.connectionTimeoutHandle.unref();
          }
        }
        if (this.host && this.host.indexOf("/") === 0) {
          con.connect(this.host + "/.s.PGSQL." + this.port);
        } else {
          con.connect(this.port, this.host);
        }
        con.on("connect", function() {
          if (self.ssl) {
            if (self.sslNegotiation !== "direct") {
              con.requestSsl();
            }
          } else {
            con.startup(self.getStartupConf());
          }
        });
        con.on("sslconnect", function() {
          con.startup(self.getStartupConf());
        });
        this._attachListeners(con);
        con.once("end", () => {
          const error = this._ending ? new Error("Connection terminated") : new Error("Connection terminated unexpectedly");
          clearTimeout(this.connectionTimeoutHandle);
          this._errorAllQueries(error);
          this._ended = true;
          if (!this._ending) {
            if (this._connecting && !this._connectionError) {
              if (this._connectionCallback) {
                this._connectionCallback(error);
              } else {
                this._handleErrorEvent(error);
              }
            } else if (!this._connectionError) {
              this._handleErrorEvent(error);
            }
          }
          process.nextTick(() => {
            this.emit("end");
          });
        });
      }
      connect(callback) {
        if (callback) {
          this._connect(callback);
          return;
        }
        return new this._Promise((resolve, reject) => {
          this._connect((error) => {
            if (error) {
              reject(error);
            } else {
              resolve(this);
            }
          });
        });
      }
      _attachListeners(con) {
        con.on("authenticationCleartextPassword", this._handleAuthCleartextPassword.bind(this));
        con.on("authenticationMD5Password", this._handleAuthMD5Password.bind(this));
        con.on("authenticationSASL", this._handleAuthSASL.bind(this));
        con.on("authenticationSASLContinue", this._handleAuthSASLContinue.bind(this));
        con.on("authenticationSASLFinal", this._handleAuthSASLFinal.bind(this));
        con.on("backendKeyData", this._handleBackendKeyData.bind(this));
        con.on("error", this._handleErrorEvent.bind(this));
        con.on("errorMessage", this._handleErrorMessage.bind(this));
        con.on("readyForQuery", this._handleReadyForQuery.bind(this));
        con.on("notice", this._handleNotice.bind(this));
        con.on("rowDescription", this._handleRowDescription.bind(this));
        con.on("dataRow", this._handleDataRow.bind(this));
        con.on("portalSuspended", this._handlePortalSuspended.bind(this));
        con.on("emptyQuery", this._handleEmptyQuery.bind(this));
        con.on("commandComplete", this._handleCommandComplete.bind(this));
        con.on("parseComplete", this._handleParseComplete.bind(this));
        con.on("copyInResponse", this._handleCopyInResponse.bind(this));
        con.on("copyData", this._handleCopyData.bind(this));
        con.on("notification", this._handleNotification.bind(this));
      }
      _getPassword(cb) {
        const con = this.connection;
        if (typeof this.password === "function") {
          this._Promise.resolve().then(() => this.password(this.connectionParameters)).then((pass) => {
            if (pass !== void 0) {
              if (typeof pass !== "string") {
                con.emit("error", new TypeError("Password must be a string"));
                return;
              }
              this.connectionParameters.password = this.password = pass;
            } else {
              this.connectionParameters.password = this.password = null;
            }
            cb();
          }).catch((err4) => {
            con.emit("error", err4);
          });
        } else if (this.password !== null) {
          cb();
        } else {
          try {
            const pgPass = require_lib();
            pgPass(this.connectionParameters, (pass) => {
              if (void 0 !== pass) {
                pgPassDeprecationNotice();
                this.connectionParameters.password = this.password = pass;
              }
              cb();
            });
          } catch (e2) {
            this.emit("error", e2);
          }
        }
      }
      _handleAuthCleartextPassword(msg) {
        this._getPassword(() => {
          this.connection.password(this.password);
        });
      }
      _handleAuthMD5Password(msg) {
        this._getPassword(async () => {
          try {
            const hashedPassword = await crypto.postgresMd5PasswordHash(this.user, this.password, msg.salt);
            this.connection.password(hashedPassword);
          } catch (e2) {
            this.emit("error", e2);
          }
        });
      }
      _handleAuthSASL(msg) {
        this._getPassword(() => {
          try {
            this.saslSession = sasl.startSession(
              msg.mechanisms,
              this.enableChannelBinding && this.connection.stream,
              this.scramMaxIterations
            );
            this.connection.sendSASLInitialResponseMessage(this.saslSession.mechanism, this.saslSession.response);
          } catch (err4) {
            this.connection.emit("error", err4);
          }
        });
      }
      async _handleAuthSASLContinue(msg) {
        try {
          await sasl.continueSession(
            this.saslSession,
            this.password,
            msg.data,
            this.enableChannelBinding && this.connection.stream
          );
          this.connection.sendSCRAMClientFinalMessage(this.saslSession.response);
        } catch (err4) {
          this.connection.emit("error", err4);
        }
      }
      _handleAuthSASLFinal(msg) {
        try {
          sasl.finalizeSession(this.saslSession, msg.data);
          this.saslSession = null;
        } catch (err4) {
          this.connection.emit("error", err4);
        }
      }
      _handleBackendKeyData(msg) {
        this.processID = msg.processID;
        this.secretKey = msg.secretKey;
      }
      _handleReadyForQuery(msg) {
        if (this._connecting) {
          this._connecting = false;
          this._connected = true;
          clearTimeout(this.connectionTimeoutHandle);
          if (this._connectionCallback) {
            this._connectionCallback(null, this);
            this._connectionCallback = null;
          }
          this.emit("connect");
        }
        const activeQuery = this._getActiveQuery();
        this._activeQuery = null;
        this._txStatus = msg?.status ?? null;
        this.readyForQuery = true;
        if (activeQuery) {
          activeQuery.handleReadyForQuery(this.connection);
        }
        this._pulseQueryQueue();
      }
      // if we receive an error event or error message
      // during the connection process we handle it here
      _handleErrorWhileConnecting(err4) {
        if (this._connectionError) {
          return;
        }
        this._connectionError = true;
        clearTimeout(this.connectionTimeoutHandle);
        if (this._connectionCallback) {
          return this._connectionCallback(err4);
        }
        this.emit("error", err4);
      }
      // if we're connected and we receive an error event from the connection
      // this means the socket is dead - do a hard abort of all queries and emit
      // the socket error on the client as well
      _handleErrorEvent(err4) {
        if (this._connecting) {
          return this._handleErrorWhileConnecting(err4);
        }
        this._queryable = false;
        this._errorAllQueries(err4);
        this.emit("error", err4);
      }
      // handle error messages from the postgres backend
      _handleErrorMessage(msg) {
        if (this._connecting) {
          return this._handleErrorWhileConnecting(msg);
        }
        const activeQuery = this._getActiveQuery();
        if (!activeQuery) {
          this._handleErrorEvent(msg);
          return;
        }
        this._activeQuery = null;
        if (activeQuery.name) {
          delete this.connection.submittedNamedStatements[activeQuery.name];
        }
        activeQuery.handleError(msg, this.connection);
      }
      _handleRowDescription(msg) {
        const activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          const error = new Error("Received unexpected rowDescription message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        activeQuery.handleRowDescription(msg);
      }
      _handleDataRow(msg) {
        const activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          const error = new Error("Received unexpected dataRow message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        activeQuery.handleDataRow(msg);
      }
      _handlePortalSuspended(msg) {
        const activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          const error = new Error("Received unexpected portalSuspended message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        activeQuery.handlePortalSuspended(this.connection);
      }
      _handleEmptyQuery(msg) {
        const activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          const error = new Error("Received unexpected emptyQuery message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        activeQuery.handleEmptyQuery(this.connection);
      }
      _handleCommandComplete(msg) {
        const activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          const error = new Error("Received unexpected commandComplete message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        activeQuery.handleCommandComplete(msg, this.connection);
      }
      _handleParseComplete() {
        const activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          const error = new Error("Received unexpected parseComplete message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        if (activeQuery.name) {
          this.connection.parsedStatements[activeQuery.name] = activeQuery.text;
          delete this.connection.submittedNamedStatements[activeQuery.name];
        }
      }
      _handleCopyInResponse(msg) {
        const activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          const error = new Error("Received unexpected copyInResponse message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        activeQuery.handleCopyInResponse(this.connection);
      }
      _handleCopyData(msg) {
        const activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          const error = new Error("Received unexpected copyData message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        activeQuery.handleCopyData(msg, this.connection);
      }
      _handleNotification(msg) {
        this.emit("notification", msg);
      }
      _handleNotice(msg) {
        this.emit("notice", msg);
      }
      getStartupConf() {
        const params = this.connectionParameters;
        const data = {
          user: params.user,
          database: params.database
        };
        const appName = params.application_name || params.fallback_application_name;
        if (appName) {
          data.application_name = appName;
        }
        if (params.replication) {
          data.replication = "" + params.replication;
        }
        if (params.statement_timeout) {
          data.statement_timeout = String(parseInt(params.statement_timeout, 10));
        }
        if (params.lock_timeout) {
          data.lock_timeout = String(parseInt(params.lock_timeout, 10));
        }
        if (params.idle_in_transaction_session_timeout) {
          data.idle_in_transaction_session_timeout = String(parseInt(params.idle_in_transaction_session_timeout, 10));
        }
        if (params.options) {
          data.options = params.options;
        }
        return data;
      }
      cancel(client, query) {
        if (client.activeQuery === query) {
          const con = this.connection;
          if (this.host && this.host.indexOf("/") === 0) {
            con.connect(this.host + "/.s.PGSQL." + this.port);
          } else {
            con.connect(this.port, this.host);
          }
          con.on("connect", function() {
            con.cancel(client.processID, client.secretKey);
          });
        } else if (client._queryQueue.indexOf(query) !== -1) {
          client._queryQueue.splice(client._queryQueue.indexOf(query), 1);
        } else if (client._sentQueryQueue.indexOf(query) !== -1) {
          query.callback = () => {
          };
        }
      }
      setTypeParser(oid, format, parseFn) {
        return this._types.setTypeParser(oid, format, parseFn);
      }
      getTypeParser(oid, format) {
        return this._types.getTypeParser(oid, format);
      }
      // escapeIdentifier and escapeLiteral moved to utility functions & exported
      // on PG
      // re-exported here for backwards compatibility
      escapeIdentifier(str) {
        return utils.escapeIdentifier(str);
      }
      escapeLiteral(str) {
        return utils.escapeLiteral(str);
      }
      _pulseQueryQueue() {
        if (this.pipeline) {
          this._pulsePipelinedQueryQueue();
          return;
        }
        if (this.readyForQuery === true) {
          this._activeQuery = this._queryQueue.shift();
          const activeQuery = this._getActiveQuery();
          if (activeQuery) {
            this.readyForQuery = false;
            this.hasExecuted = true;
            const queryError = activeQuery.submit(this.connection);
            if (queryError) {
              process.nextTick(() => {
                activeQuery.handleError(queryError, this.connection);
                this.readyForQuery = true;
                this._pulseQueryQueue();
              });
            }
          } else if (this.hasExecuted) {
            this._activeQuery = null;
            this.emit("drain");
          }
        }
      }
      _pulsePipelinedQueryQueue() {
        if (!this._connected || !this._queryable) {
          return;
        }
        while (this._queryQueue.length > 0) {
          const query = this._queryQueue.shift();
          this.hasExecuted = true;
          const queryError = query.submit(this.connection);
          if (queryError) {
            process.nextTick(() => {
              query.handleError(queryError, this.connection);
            });
            continue;
          }
          this._sentQueryQueue.push(query);
        }
        if (this.readyForQuery && !this._activeQuery && this._sentQueryQueue.length > 0) {
          this._activeQuery = this._sentQueryQueue.shift();
          this.readyForQuery = false;
        }
        if (!this._activeQuery && this._sentQueryQueue.length === 0 && this._queryQueue.length === 0 && this.hasExecuted) {
          this.emit("drain");
        }
      }
      query(config, values, callback) {
        let query;
        let result;
        if (config == null) {
          throw new TypeError("Client was passed a null or undefined query");
        }
        if (typeof config.submit === "function") {
          result = query = config;
          if (!query.callback) {
            if (typeof values === "function") {
              query.callback = values;
            } else if (callback) {
              query.callback = callback;
            }
          }
        } else {
          query = new Query2(config, values, callback);
          if (!query.callback) {
            result = new this._Promise((resolve, reject) => {
              query.callback = (err4, res) => err4 ? reject(err4) : resolve(res);
            }).catch((err4) => {
              Error.captureStackTrace(err4);
              throw err4;
            });
          } else if (typeof query.callback !== "function") {
            throw new TypeError("callback is not a function");
          }
        }
        const readTimeout = config.query_timeout || this.connectionParameters.query_timeout;
        if (readTimeout) {
          const queryCallback = query.callback || (() => {
          });
          const readTimeoutTimer = setTimeout(() => {
            const error = new Error("Query read timeout");
            process.nextTick(() => {
              query.handleError(error, this.connection);
            });
            queryCallback(error);
            query.callback = () => {
            };
            const index = this._queryQueue.indexOf(query);
            if (index > -1) {
              this._queryQueue.splice(index, 1);
            } else if (this.pipeline) {
              this.connection.stream.destroy();
              return;
            }
            this._pulseQueryQueue();
          }, readTimeout);
          query.callback = (err4, res) => {
            clearTimeout(readTimeoutTimer);
            queryCallback(err4, res);
          };
        }
        if (this.binary && !query.binary) {
          query.binary = true;
        }
        if (query._result && !query._result._types) {
          query._result._types = this._types;
        }
        if (this.pipeline) {
          const portalQuery = typeof config.submit === "function" && !(query instanceof Query2) ? "Custom query classes such as pg-cursor and pg-query-stream are" : query.rows ? "The `rows` option is" : null;
          if (portalQuery) {
            process.nextTick(() => {
              query.handleError(new Error(`${portalQuery} not supported in pipeline mode`), this.connection);
            });
            return result;
          }
        }
        if (!this._queryable) {
          process.nextTick(() => {
            query.handleError(new Error("Client has encountered a connection error and is not queryable"), this.connection);
          });
          return result;
        }
        if (this._ending) {
          process.nextTick(() => {
            query.handleError(new Error("Client was closed and is not queryable"), this.connection);
          });
          return result;
        }
        if (this._queryQueue.length > 0 && !this.pipeline) {
          queryQueueLengthDeprecationNotice();
        }
        this._queryQueue.push(query);
        this._pulseQueryQueue();
        return result;
      }
      ref() {
        this.connection.ref();
      }
      unref() {
        this.connection.unref();
      }
      getTransactionStatus() {
        return this._txStatus;
      }
      end(cb) {
        this._ending = true;
        if (!this.connection._connecting || this._ended) {
          if (cb) {
            cb();
            return;
          } else {
            return this._Promise.resolve();
          }
        }
        if (!this._queryable) {
          this.connection.stream.destroy();
        } else if (this.pipeline && (this._getActiveQuery() || this._sentQueryQueue.length > 0 || this._queryQueue.length > 0)) {
          this.once("drain", () => this.connection.end());
        } else if (this._getActiveQuery()) {
          this.connection.stream.destroy();
        } else {
          this.connection.end();
        }
        if (cb) {
          this.connection.once("end", cb);
        } else {
          return new this._Promise((resolve) => {
            this.connection.once("end", resolve);
          });
        }
      }
      get queryQueue() {
        queryQueueDeprecationNotice();
        return this._queryQueue;
      }
    };
    Client2.Query = Query2;
    module.exports = Client2;
  }
});

// node_modules/pg-pool/index.js
var require_pg_pool = __commonJS({
  "node_modules/pg-pool/index.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events").EventEmitter;
    var NOOP = function() {
    };
    var removeWhere = (list, predicate) => {
      const i = list.findIndex(predicate);
      return i === -1 ? void 0 : list.splice(i, 1)[0];
    };
    var IdleItem = class {
      constructor(client, idleListener, timeoutId) {
        this.client = client;
        this.idleListener = idleListener;
        this.timeoutId = timeoutId;
      }
    };
    var PendingItem = class {
      constructor(callback) {
        this.callback = callback;
      }
    };
    function throwOnDoubleRelease() {
      throw new Error("Release called on client which has already been released to the pool.");
    }
    function promisify(Promise2, callback) {
      if (callback) {
        return { callback, result: void 0 };
      }
      let rej;
      let res;
      const cb = function(err4, client) {
        err4 ? rej(err4) : res(client);
      };
      const result = new Promise2(function(resolve, reject) {
        res = resolve;
        rej = reject;
      }).catch((err4) => {
        Error.captureStackTrace(err4);
        throw err4;
      });
      return { callback: cb, result };
    }
    function makeIdleListener(pool, client) {
      return function idleListener(err4) {
        err4.client = client;
        client.removeListener("error", idleListener);
        client.on("error", () => {
          pool.log("additional client error after disconnection due to error", err4);
        });
        pool._remove(client);
        pool.emit("error", err4, client);
      };
    }
    var Pool2 = class extends EventEmitter {
      constructor(options, Client2) {
        super();
        this.options = Object.assign({}, options);
        if (options != null && "password" in options) {
          Object.defineProperty(this.options, "password", {
            configurable: true,
            enumerable: false,
            writable: true,
            value: options.password
          });
        }
        if (options != null && options.ssl && options.ssl.key) {
          Object.defineProperty(this.options.ssl, "key", {
            enumerable: false
          });
        }
        this.options.max = this.options.max || this.options.poolSize || 10;
        this.options.min = this.options.min || 0;
        this.options.maxUses = this.options.maxUses || Infinity;
        this.options.allowExitOnIdle = this.options.allowExitOnIdle || false;
        this.options.maxLifetimeSeconds = this.options.maxLifetimeSeconds || 0;
        this.log = this.options.log || function() {
        };
        this.Client = this.options.Client || Client2 || require_lib2().Client;
        this.Promise = this.options.Promise || global.Promise;
        if (typeof this.options.idleTimeoutMillis === "undefined") {
          this.options.idleTimeoutMillis = 1e4;
        }
        this._clients = [];
        this._idle = [];
        this._expired = /* @__PURE__ */ new WeakSet();
        this._pendingQueue = [];
        this._endCallback = void 0;
        this.ending = false;
        this.ended = false;
      }
      _promiseTry(f) {
        const Promise2 = this.Promise;
        if (typeof Promise2.try === "function") {
          return Promise2.try(f);
        }
        return new Promise2((resolve) => resolve(f()));
      }
      _isFull() {
        return this._clients.length >= this.options.max;
      }
      _isAboveMin() {
        return this._clients.length > this.options.min;
      }
      _pulseQueue() {
        this.log("pulse queue");
        if (this.ended) {
          this.log("pulse queue ended");
          return;
        }
        if (this.ending) {
          this.log("pulse queue on ending");
          if (this._idle.length) {
            this._idle.slice().map((item) => {
              this._remove(item.client);
            });
          }
          if (!this._clients.length) {
            this.ended = true;
            this._endCallback();
          }
          return;
        }
        if (!this._pendingQueue.length) {
          this.log("no queued requests");
          return;
        }
        if (!this._idle.length && this._isFull()) {
          return;
        }
        const pendingItem = this._pendingQueue.shift();
        if (this._idle.length) {
          const idleItem = this._idle.pop();
          clearTimeout(idleItem.timeoutId);
          const client = idleItem.client;
          client.ref && client.ref();
          const idleListener = idleItem.idleListener;
          return this._acquireClient(client, pendingItem, idleListener, false);
        }
        if (!this._isFull()) {
          return this.newClient(pendingItem);
        }
        throw new Error("unexpected condition");
      }
      _remove(client, callback) {
        const removed = removeWhere(this._idle, (item) => item.client === client);
        if (removed !== void 0) {
          clearTimeout(removed.timeoutId);
        }
        this._clients = this._clients.filter((c) => c !== client);
        const context = this;
        client.end(() => {
          context.emit("remove", client);
          if (typeof callback === "function") {
            callback();
          }
        });
      }
      connect(cb) {
        if (this.ending) {
          const err4 = new Error("Cannot use a pool after calling end on the pool");
          return cb ? cb(err4) : this.Promise.reject(err4);
        }
        const response = promisify(this.Promise, cb);
        const result = response.result;
        if (this._isFull() || this._idle.length) {
          if (this._idle.length) {
            process.nextTick(() => this._pulseQueue());
          }
          if (!this.options.connectionTimeoutMillis) {
            this._pendingQueue.push(new PendingItem(response.callback));
            return result;
          }
          const queueCallback = (err4, res, done) => {
            clearTimeout(tid);
            response.callback(err4, res, done);
          };
          const pendingItem = new PendingItem(queueCallback);
          const tid = setTimeout(() => {
            removeWhere(this._pendingQueue, (i) => i.callback === queueCallback);
            pendingItem.timedOut = true;
            response.callback(new Error("timeout exceeded when trying to connect"));
          }, this.options.connectionTimeoutMillis);
          if (tid.unref) {
            tid.unref();
          }
          this._pendingQueue.push(pendingItem);
          return result;
        }
        this.newClient(new PendingItem(response.callback));
        return result;
      }
      newClient(pendingItem) {
        const client = new this.Client(this.options);
        this._clients.push(client);
        const idleListener = makeIdleListener(this, client);
        this.log("checking client timeout");
        let tid;
        let timeoutHit = false;
        if (this.options.connectionTimeoutMillis) {
          tid = setTimeout(() => {
            if (client.connection) {
              this.log("ending client due to timeout");
              timeoutHit = true;
              client.connection.stream.destroy();
            } else if (!client.isConnected()) {
              this.log("ending client due to timeout");
              timeoutHit = true;
              client.end();
            }
          }, this.options.connectionTimeoutMillis);
        }
        this.log("connecting new client");
        client.connect((err4) => {
          if (tid) {
            clearTimeout(tid);
          }
          client.on("error", idleListener);
          if (err4) {
            this.log("client failed to connect", err4);
            this._clients = this._clients.filter((c) => c !== client);
            if (timeoutHit) {
              err4 = new Error("Connection terminated due to connection timeout", { cause: err4 });
            }
            this._pulseQueue();
            if (!pendingItem.timedOut) {
              pendingItem.callback(err4, void 0, NOOP);
            }
          } else {
            this.log("new client connected");
            if (this.options.onConnect) {
              this._promiseTry(() => this.options.onConnect(client)).then(
                () => {
                  this._afterConnect(client, pendingItem, idleListener);
                },
                (hookErr) => {
                  this._clients = this._clients.filter((c) => c !== client);
                  client.end(() => {
                    this._pulseQueue();
                    if (!pendingItem.timedOut) {
                      pendingItem.callback(hookErr, void 0, NOOP);
                    }
                  });
                }
              );
              return;
            }
            return this._afterConnect(client, pendingItem, idleListener);
          }
        });
      }
      _afterConnect(client, pendingItem, idleListener) {
        if (this.options.maxLifetimeSeconds !== 0) {
          const maxLifetimeTimeout = setTimeout(() => {
            this.log("ending client due to expired lifetime");
            this._expired.add(client);
            const idleIndex = this._idle.findIndex((idleItem) => idleItem.client === client);
            if (idleIndex !== -1) {
              this._acquireClient(
                client,
                new PendingItem((err4, client2, clientRelease) => clientRelease()),
                idleListener,
                false
              );
            }
          }, this.options.maxLifetimeSeconds * 1e3);
          maxLifetimeTimeout.unref();
          client.once("end", () => clearTimeout(maxLifetimeTimeout));
        }
        return this._acquireClient(client, pendingItem, idleListener, true);
      }
      // acquire a client for a pending work item
      _acquireClient(client, pendingItem, idleListener, isNew) {
        if (isNew) {
          this.emit("connect", client);
        }
        this.emit("acquire", client);
        client.release = this._releaseOnce(client, idleListener);
        client.removeListener("error", idleListener);
        if (!pendingItem.timedOut) {
          if (isNew && this.options.verify) {
            this.options.verify(client, (err4) => {
              if (err4) {
                client.release(err4);
                return pendingItem.callback(err4, void 0, NOOP);
              }
              pendingItem.callback(void 0, client, client.release);
            });
          } else {
            pendingItem.callback(void 0, client, client.release);
          }
        } else {
          if (isNew && this.options.verify) {
            this.options.verify(client, client.release);
          } else {
            client.release();
          }
        }
      }
      // returns a function that wraps _release and throws if called more than once
      _releaseOnce(client, idleListener) {
        let released = false;
        return (err4) => {
          if (released) {
            throwOnDoubleRelease();
          }
          released = true;
          this._release(client, idleListener, err4);
        };
      }
      // release a client back to the poll, include an error
      // to remove it from the pool
      _release(client, idleListener, err4) {
        client.on("error", idleListener);
        client._poolUseCount = (client._poolUseCount || 0) + 1;
        this.emit("release", err4, client);
        if (err4 || this.ending || !client._queryable || client._ending || client._poolUseCount >= this.options.maxUses) {
          if (client._poolUseCount >= this.options.maxUses) {
            this.log("remove expended client");
          }
          return this._remove(client, this._pulseQueue.bind(this));
        }
        const isExpired = this._expired.has(client);
        if (isExpired) {
          this.log("remove expired client");
          this._expired.delete(client);
          return this._remove(client, this._pulseQueue.bind(this));
        }
        let tid;
        if (this.options.idleTimeoutMillis && this._isAboveMin()) {
          tid = setTimeout(() => {
            if (this._isAboveMin()) {
              this.log("remove idle client");
              this._remove(client, this._pulseQueue.bind(this));
            }
          }, this.options.idleTimeoutMillis);
          if (this.options.allowExitOnIdle) {
            tid.unref();
          }
        }
        if (this.options.allowExitOnIdle) {
          client.unref();
        }
        this._idle.push(new IdleItem(client, idleListener, tid));
        this._pulseQueue();
      }
      query(text, values, cb) {
        if (typeof text === "function") {
          const response2 = promisify(this.Promise, text);
          setImmediate(function() {
            return response2.callback(new Error("Passing a function as the first parameter to pool.query is not supported"));
          });
          return response2.result;
        }
        if (typeof values === "function") {
          cb = values;
          values = void 0;
        }
        const response = promisify(this.Promise, cb);
        cb = response.callback;
        this.connect((err4, client) => {
          if (err4) {
            return cb(err4);
          }
          let clientReleased = false;
          const onError = (err5) => {
            if (clientReleased) {
              return;
            }
            clientReleased = true;
            client.release(err5);
            cb(err5);
          };
          client.once("error", onError);
          this.log("dispatching query");
          try {
            client.query(text, values, (err5, res) => {
              this.log("query dispatched");
              client.removeListener("error", onError);
              if (clientReleased) {
                return;
              }
              clientReleased = true;
              client.release(err5);
              if (err5) {
                return cb(err5);
              }
              return cb(void 0, res);
            });
          } catch (err5) {
            client.release(err5);
            return cb(err5);
          }
        });
        return response.result;
      }
      end(cb) {
        this.log("ending");
        if (this.ending) {
          const err4 = new Error("Called end on pool more than once");
          return cb ? cb(err4) : this.Promise.reject(err4);
        }
        this.ending = true;
        const promised = promisify(this.Promise, cb);
        this._endCallback = promised.callback;
        this._pulseQueue();
        return promised.result;
      }
      get waitingCount() {
        return this._pendingQueue.length;
      }
      get idleCount() {
        return this._idle.length;
      }
      get expiredCount() {
        return this._clients.reduce((acc, client) => acc + (this._expired.has(client) ? 1 : 0), 0);
      }
      get totalCount() {
        return this._clients.length;
      }
    };
    module.exports = Pool2;
  }
});

// node_modules/pg/lib/native/query.js
var require_query2 = __commonJS({
  "node_modules/pg/lib/native/query.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events").EventEmitter;
    var util = __require("util");
    var utils = require_utils();
    var NativeQuery = module.exports = function(config, values, callback) {
      EventEmitter.call(this);
      config = utils.normalizeQueryConfig(config, values, callback);
      this.text = config.text;
      this.values = config.values;
      this.name = config.name;
      this.queryMode = config.queryMode;
      this.callback = config.callback;
      this.state = "new";
      this._arrayMode = config.rowMode === "array";
      this._emitRowEvents = false;
      this.on(
        "newListener",
        function(event) {
          if (event === "row") this._emitRowEvents = true;
        }.bind(this)
      );
    };
    util.inherits(NativeQuery, EventEmitter);
    var errorFieldMap = {
      sqlState: "code",
      statementPosition: "position",
      messagePrimary: "message",
      messageDetail: "detail",
      messageHint: "hint",
      context: "where",
      schemaName: "schema",
      tableName: "table",
      columnName: "column",
      dataTypeName: "dataType",
      constraintName: "constraint",
      sourceFile: "file",
      sourceLine: "line",
      sourceFunction: "routine"
    };
    NativeQuery.prototype.handleError = function(err4) {
      const fields = this.native && this.native.pq.resultErrorFields();
      if (fields) {
        for (const key in fields) {
          const normalizedFieldName = errorFieldMap[key] || key;
          err4[normalizedFieldName] = fields[key];
        }
      }
      if (this.callback) {
        this.callback(err4);
      } else {
        this.emit("error", err4);
      }
      this.state = "error";
    };
    NativeQuery.prototype.then = function(onSuccess, onFailure) {
      return this._getPromise().then(onSuccess, onFailure);
    };
    NativeQuery.prototype.catch = function(callback) {
      return this._getPromise().catch(callback);
    };
    NativeQuery.prototype._getPromise = function() {
      if (this._promise) return this._promise;
      this._promise = new Promise(
        function(resolve, reject) {
          this._once("end", resolve);
          this._once("error", reject);
        }.bind(this)
      );
      return this._promise;
    };
    NativeQuery.prototype.submit = function(client) {
      this.state = "running";
      const self = this;
      this.native = client.native;
      client.native.arrayMode = this._arrayMode;
      let after = function(err4, rows, results) {
        client.native.arrayMode = false;
        setImmediate(function() {
          self.emit("_done");
        });
        if (err4) {
          return self.handleError(err4);
        }
        if (self._emitRowEvents) {
          if (results.length > 1) {
            rows.forEach((rowOfRows, i) => {
              rowOfRows.forEach((row) => {
                self.emit("row", row, results[i]);
              });
            });
          } else {
            rows.forEach(function(row) {
              self.emit("row", row, results);
            });
          }
        }
        self.state = "end";
        self.emit("end", results);
        if (self.callback) {
          self.callback(null, results);
        }
      };
      if (process.domain) {
        after = process.domain.bind(after);
      }
      if (this.name) {
        if (this.name.length > 63) {
          console.error("Warning! Postgres only supports 63 characters for query names.");
          console.error("You supplied %s (%s)", this.name, this.name.length);
          console.error("This can cause conflicts and silent errors executing queries");
        }
        const values = (this.values || []).map(utils.prepareValue);
        if (client.namedQueries[this.name] !== void 0) {
          if (this.text && client.namedQueries[this.name] !== this.text) {
            const err4 = new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`);
            return after(err4);
          }
          return client.native.execute(this.name, values, after);
        }
        return client.native.prepare(this.name, this.text, values.length, function(err4) {
          if (err4) return after(err4);
          client.namedQueries[self.name] = self.text;
          return self.native.execute(self.name, values, after);
        });
      } else if (this.values) {
        if (!Array.isArray(this.values)) {
          const err4 = new Error("Query values must be an array");
          return after(err4);
        }
        const vals = this.values.map(utils.prepareValue);
        client.native.query(this.text, vals, after);
      } else if (this.queryMode === "extended") {
        client.native.query(this.text, [], after);
      } else {
        client.native.query(this.text, after);
      }
    };
  }
});

// node_modules/pg/lib/native/client.js
var require_client2 = __commonJS({
  "node_modules/pg/lib/native/client.js"(exports, module) {
    var nodeUtils = __require("util");
    var Native;
    try {
      Native = __require("pg-native");
    } catch (e2) {
      throw e2;
    }
    var TypeOverrides2 = require_type_overrides();
    var EventEmitter = __require("events").EventEmitter;
    var util = __require("util");
    var ConnectionParameters = require_connection_parameters();
    var NativeQuery = require_query2();
    var queryQueueLengthDeprecationNotice = nodeUtils.deprecate(
      () => {
      },
      "Calling client.query() when the client is already executing a query is deprecated and will be removed in pg@9.0. Use async/await or an external async flow control mechanism instead."
    );
    var Client2 = module.exports = function(config) {
      EventEmitter.call(this);
      config = config || {};
      this._Promise = config.Promise || global.Promise;
      this._types = new TypeOverrides2(config.types);
      this.native = new Native({
        types: this._types
      });
      this._queryQueue = [];
      this._ending = false;
      this._connecting = false;
      this._connected = false;
      this._queryable = true;
      this.pipeline = Boolean(config.pipeline);
      this._pipelineInFlight = false;
      const cp = this.connectionParameters = new ConnectionParameters(config);
      if (config.nativeConnectionString) cp.nativeConnectionString = config.nativeConnectionString;
      this.user = cp.user;
      Object.defineProperty(this, "password", {
        configurable: true,
        enumerable: false,
        writable: true,
        value: cp.password
      });
      this.database = cp.database;
      this.host = cp.host;
      this.port = cp.port;
      this.namedQueries = {};
    };
    Client2.Query = NativeQuery;
    util.inherits(Client2, EventEmitter);
    Client2.prototype._errorAllQueries = function(err4) {
      const enqueueError = (query) => {
        process.nextTick(() => {
          query.native = this.native;
          query.handleError(err4);
        });
      };
      if (this._hasActiveQuery()) {
        enqueueError(this._activeQuery);
        this._activeQuery = null;
      }
      this._queryQueue.forEach(enqueueError);
      this._queryQueue.length = 0;
    };
    Client2.prototype._connect = function(cb) {
      const self = this;
      if (this._connecting) {
        process.nextTick(() => cb(new Error("Client has already been connected. You cannot reuse a client.")));
        return;
      }
      this._connecting = true;
      this.connectionParameters.getLibpqConnectionString(function(err4, conString) {
        if (self.connectionParameters.nativeConnectionString) conString = self.connectionParameters.nativeConnectionString;
        if (err4) return cb(err4);
        self.native.connect(conString, function(err5) {
          if (err5) {
            self.native.end();
            return cb(err5);
          }
          self._connected = true;
          self.native.on("error", function(err6) {
            self._queryable = false;
            self._errorAllQueries(err6);
            self.emit("error", err6);
          });
          self.native.on("notification", function(msg) {
            self.emit("notification", {
              channel: msg.relname,
              payload: msg.extra
            });
          });
          self.emit("connect");
          self._pulseQueryQueue(true);
          cb(null, this);
        });
      });
    };
    Client2.prototype.connect = function(callback) {
      if (callback) {
        this._connect(callback);
        return;
      }
      return new this._Promise((resolve, reject) => {
        this._connect((error) => {
          if (error) {
            reject(error);
          } else {
            resolve(this);
          }
        });
      });
    };
    Client2.prototype.query = function(config, values, callback) {
      let query;
      let result;
      let readTimeout;
      let readTimeoutTimer;
      let queryCallback;
      if (config === null || config === void 0) {
        throw new TypeError("Client was passed a null or undefined query");
      } else if (typeof config.submit === "function") {
        readTimeout = config.query_timeout || this.connectionParameters.query_timeout;
        result = query = config;
        if (typeof values === "function") {
          config.callback = values;
        }
      } else {
        readTimeout = config.query_timeout || this.connectionParameters.query_timeout;
        query = new NativeQuery(config, values, callback);
        if (!query.callback) {
          let resolveOut, rejectOut;
          result = new this._Promise((resolve, reject) => {
            resolveOut = resolve;
            rejectOut = reject;
          }).catch((err4) => {
            Error.captureStackTrace(err4);
            throw err4;
          });
          query.callback = (err4, res) => err4 ? rejectOut(err4) : resolveOut(res);
        }
      }
      if (readTimeout) {
        queryCallback = query.callback || (() => {
        });
        readTimeoutTimer = setTimeout(() => {
          const error = new Error("Query read timeout");
          process.nextTick(() => {
            query.handleError(error, this.connection);
          });
          queryCallback(error);
          query.callback = () => {
          };
          const index = this._queryQueue.indexOf(query);
          if (index > -1) {
            this._queryQueue.splice(index, 1);
          }
          this._pulseQueryQueue();
        }, readTimeout);
        query.callback = (err4, res) => {
          clearTimeout(readTimeoutTimer);
          queryCallback(err4, res);
        };
      }
      if (!this._queryable) {
        query.native = this.native;
        process.nextTick(() => {
          query.handleError(new Error("Client has encountered a connection error and is not queryable"));
        });
        return result;
      }
      if (this._ending) {
        query.native = this.native;
        process.nextTick(() => {
          query.handleError(new Error("Client was closed and is not queryable"));
        });
        return result;
      }
      if (this._queryQueue.length > 0 && !this.pipeline) {
        queryQueueLengthDeprecationNotice();
      }
      this._queryQueue.push(query);
      this._pulseQueryQueue();
      return result;
    };
    Client2.prototype.end = function(cb) {
      const self = this;
      this._ending = true;
      if (this._connecting && !this._connected) {
        this.once("connect", () => {
          this.end(() => {
          });
        });
      }
      let result;
      if (!cb) {
        result = new this._Promise(function(resolve, reject) {
          cb = (err4) => err4 ? reject(err4) : resolve();
        });
      }
      const doEnd = function() {
        self.native.end(function() {
          self._connected = false;
          self._errorAllQueries(new Error("Connection terminated"));
          process.nextTick(() => {
            self.emit("end");
            if (cb) cb();
          });
        });
      };
      if (this.pipeline && (this._pipelineInFlight || this._queryQueue.length > 0)) {
        this.once("drain", doEnd);
      } else {
        doEnd();
      }
      return result;
    };
    Client2.prototype._hasActiveQuery = function() {
      return this._activeQuery && this._activeQuery.state !== "error" && this._activeQuery.state !== "end";
    };
    Client2.prototype._pulseQueryQueue = function(initialConnection) {
      if (!this._connected) {
        return;
      }
      if (this.pipeline && !initialConnection) {
        return this._pulsePipelinedQueryQueue();
      }
      if (this._hasActiveQuery()) {
        return;
      }
      const query = this._queryQueue.shift();
      if (!query) {
        if (!initialConnection) {
          this.emit("drain");
        }
        return;
      }
      this._activeQuery = query;
      query.submit(this);
      const self = this;
      query.once("_done", function() {
        self._pulseQueryQueue();
      });
    };
    Client2.prototype._pulsePipelinedQueryQueue = function() {
      if (!this._connected || this._pipelineInFlight) {
        return;
      }
      if (this._queryQueue.length === 0) {
        if (this.hasExecuted) {
          this.emit("drain");
        }
        return;
      }
      this._pipelineInFlight = true;
      const self = this;
      const queries = [];
      const nativeQueries = [];
      const utils = require_utils();
      while (this._queryQueue.length > 0) {
        const query = this._queryQueue.shift();
        this.hasExecuted = true;
        nativeQueries.push(query);
        const values = query.values ? query.values.map(utils.prepareValue) : null;
        const pipelineEntry = { text: query.text, name: query.name, arrayMode: query._arrayMode };
        if (values) {
          pipelineEntry.values = values;
        }
        if (query.name && this.namedQueries[query.name]) {
          pipelineEntry._alreadyPrepared = true;
        }
        queries.push(pipelineEntry);
      }
      this.native.pipeline(queries, function(err4, results) {
        self._pipelineInFlight = false;
        if (err4) {
          self._connected = false;
          self._queryable = false;
          for (let i = 0; i < nativeQueries.length; i++) {
            const q = nativeQueries[i];
            q.native = self.native;
            q.handleError(err4);
          }
          self._errorAllQueries(err4);
          self.emit("error", err4);
          self.emit("end");
          return;
        }
        for (let i = 0; i < nativeQueries.length; i++) {
          const q = nativeQueries[i];
          const r = results[i];
          q.native = self.native;
          if (r.err) {
            q.handleError(r.err);
          } else {
            if (q.name) {
              self.namedQueries[q.name] = q.text;
            }
            q.state = "end";
            q.emit("end", r.result);
            if (q.callback) {
              q.callback(null, r.result);
            }
          }
          setImmediate(function() {
            q.emit("_done");
          });
        }
        self._pulsePipelinedQueryQueue();
      });
    };
    Client2.prototype.cancel = function(query) {
      if (this._activeQuery === query) {
        this.native.cancel(function() {
        });
      } else if (this._queryQueue.indexOf(query) !== -1) {
        this._queryQueue.splice(this._queryQueue.indexOf(query), 1);
      }
    };
    Client2.prototype.ref = function() {
    };
    Client2.prototype.unref = function() {
    };
    Client2.prototype.setTypeParser = function(oid, format, parseFn) {
      return this._types.setTypeParser(oid, format, parseFn);
    };
    Client2.prototype.getTypeParser = function(oid, format) {
      return this._types.getTypeParser(oid, format);
    };
    Client2.prototype.isConnected = function() {
      return this._connected;
    };
    Client2.prototype.getTransactionStatus = function() {
      return this.native.getTransactionStatus();
    };
  }
});

// node_modules/pg/lib/native/index.js
var require_native = __commonJS({
  "node_modules/pg/lib/native/index.js"(exports, module) {
    "use strict";
    module.exports = require_client2();
  }
});

// node_modules/pg/lib/index.js
var require_lib2 = __commonJS({
  "node_modules/pg/lib/index.js"(exports, module) {
    "use strict";
    var Client2 = require_client();
    var defaults2 = require_defaults();
    var Connection2 = require_connection();
    var Result2 = require_result();
    var utils = require_utils();
    var Pool2 = require_pg_pool();
    var TypeOverrides2 = require_type_overrides();
    var { DatabaseError: DatabaseError2 } = require_dist();
    var { escapeIdentifier: escapeIdentifier2, escapeLiteral: escapeLiteral2 } = require_utils();
    var poolFactory = (Client3) => {
      return class BoundPool extends Pool2 {
        constructor(options) {
          super(options, Client3);
        }
      };
    };
    var PG = function(clientConstructor2) {
      this.defaults = defaults2;
      this.Client = clientConstructor2;
      this.Query = this.Client.Query;
      this.Pool = poolFactory(this.Client);
      this._pools = [];
      this.Connection = Connection2;
      this.types = require_pg_types();
      this.DatabaseError = DatabaseError2;
      this.TypeOverrides = TypeOverrides2;
      this.escapeIdentifier = escapeIdentifier2;
      this.escapeLiteral = escapeLiteral2;
      this.Result = Result2;
      this.utils = utils;
    };
    var clientConstructor = Client2;
    var forceNative = false;
    try {
      forceNative = !!process.env.NODE_PG_FORCE_NATIVE;
    } catch {
    }
    if (forceNative) {
      clientConstructor = require_native();
    }
    module.exports = new PG(clientConstructor);
    Object.defineProperty(module.exports, "native", {
      configurable: true,
      enumerable: false,
      get() {
        let native = null;
        try {
          native = new PG(require_native());
        } catch (err4) {
          if (err4.code !== "MODULE_NOT_FOUND") {
            throw err4;
          }
        }
        Object.defineProperty(module.exports, "native", {
          value: native
        });
        return native;
      }
    });
  }
});

// src/config.ts
var CHAIN_ID = 8453;
var RPC_URL = process.env.BASE_RPC_URL || "https://mainnet.base.org";
var RPC_AUTH_HEADERS = process.env.BASE_RPC_BEARER ? { authorization: `Bearer ${process.env.BASE_RPC_BEARER}` } : {};
var RPC_PUBLIC_LABEL = new URL(RPC_URL).origin;
var ALLOWED_HOSTS = /* @__PURE__ */ new Set([
  "mainnet.base.org",
  "api.coinbase.com",
  "data.sec.gov",
  "efts.sec.gov",
  "www.sec.gov",
  "api.supabase.com",
  ...process.env.BASE_RPC_URL ? [new URL(process.env.BASE_RPC_URL).host] : []
]);
var SEC_USER_AGENT = process.env.SEC_USER_AGENT || "Keldrin-Phase1-Research/0.1 (contact pending)";
var WAD = 10n ** 18n;
var LIMITS = {
  maxResponseBytes: 32 * 1024 * 1024,
  httpTimeoutMs: 3e4,
  maxAttempts: 4,
  rpcMinIntervalMs: 120,
  // throttle against the public RPC's request limit
  secMinIntervalMs: 250,
  // SEC fair access: well under 10 req/s
  samplePoints: 8
  // extra multiplier samples per token to catch A→B→A changes
};
var SCHEMA_VERSION = "0.2";

// openapi/keldrin.v1.json
var keldrin_v1_default = {
  openapi: "3.1.0",
  info: {
    title: "Keldrin API",
    version: "0.7.0",
    description: "Verified corporate-action records for Coinbase tokenized stocks (B20) on Base. Read-only, informational; not an oracle or investment advice. Only independently CONFIRMED records are served. WAD values are exact integer strings scaled by 1e18. Read-only. Rate limited per client; successful reads are cached up to 60 s at the CDN.",
    "x-guidance": "Free one-stock routes under /v1. One-call snapshot (/v1/snapshot) and report (/v1/report?token=) give 3 free complete answers per client per day, then 402 FREE_TRIES_USED with the paid links. Paid: GET /api/snapshot and /api/report (forward to Bankr x402 Cloud): x402 v2, scheme exact, network eip155:8453, USDC, amount 50000 ($0.05), payTo 0x8AEE621035D93Deb3C0C1177fac252dC2dd501a0. Sign once, never re-sign automatically; only a 2xx is charged. Agent guide: https://keldrin.vercel.app/skill.md"
  },
  servers: [
    {
      url: "https://{host}",
      variables: {
        host: {
          default: "keldrin.vercel.app",
          description: "deployment host (set at deploy time)"
        }
      }
    },
    {
      url: "http://127.0.0.1:8787",
      description: "local"
    }
  ],
  paths: {
    "/health": {
      get: {
        operationId: "getHealth",
        summary: "Coverage, last run and limitations",
        responses: {
          "200": {
            description: "Health",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "data",
                    "meta"
                  ],
                  properties: {
                    data: {
                      type: "object"
                    },
                    meta: {
                      $ref: "#/components/schemas/Meta"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/v1/assets": {
      get: {
        operationId: "listAssets",
        summary: "Tracked tokens with identity state and current multiplier",
        responses: {
          "200": {
            description: "Assets",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "data",
                    "meta"
                  ],
                  properties: {
                    data: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/Asset"
                      }
                    },
                    meta: {
                      $ref: "#/components/schemas/Meta"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/v1/assets/{contract}": {
      get: {
        operationId: "getAsset",
        parameters: [
          {
            name: "contract",
            in: "path",
            required: true,
            schema: {
              type: "string",
              pattern: "^0x[0-9a-fA-F]{40}$"
            }
          }
        ],
        responses: {
          "200": {
            description: "Asset with identity checks",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "data",
                    "meta"
                  ],
                  properties: {
                    data: {
                      $ref: "#/components/schemas/Asset"
                    },
                    meta: {
                      $ref: "#/components/schemas/Meta"
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Bad address",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            description: "Unknown asset",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    },
    "/v1/actions": {
      get: {
        operationId: "listActions",
        summary: "Confirmed corporate actions, newest first",
        parameters: [
          {
            name: "contract",
            in: "query",
            schema: {
              type: "string",
              pattern: "^0x[0-9a-fA-F]{40}$"
            }
          },
          {
            name: "symbol",
            in: "query",
            description: "Exact token symbol (e.g. GOOGLc). Prefer contract.",
            schema: {
              type: "string"
            }
          },
          {
            name: "limit",
            in: "query",
            schema: {
              type: "integer",
              minimum: 1,
              maximum: 200,
              default: 50
            }
          },
          {
            name: "cursor",
            in: "query",
            schema: {
              type: "string"
            }
          }
        ],
        responses: {
          "200": {
            description: "Page of issuer_action records",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "data",
                    "meta"
                  ],
                  properties: {
                    data: {
                      type: "array",
                      items: {
                        $ref: "https://keldrin.invalid/schemas/issuer-action-v0.2.schema.json"
                      }
                    },
                    meta: {
                      $ref: "#/components/schemas/Meta"
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Bad input",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            description: "Unknown symbol",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            description: "Ambiguous symbol",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    },
    "/v1/actions/{record_id}": {
      get: {
        operationId: "getAction",
        parameters: [
          {
            name: "record_id",
            in: "path",
            required: true,
            schema: {
              type: "string"
            }
          }
        ],
        responses: {
          "200": {
            description: "Record, review, revisions and company context",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "data",
                    "meta"
                  ],
                  properties: {
                    data: {
                      type: "object",
                      required: [
                        "record",
                        "review",
                        "revisions",
                        "company_context"
                      ],
                      properties: {
                        record: {
                          $ref: "https://keldrin.invalid/schemas/issuer-action-v0.2.schema.json"
                        },
                        review: {
                          type: "object"
                        },
                        revisions: {
                          type: "array"
                        },
                        company_context: {
                          type: [
                            "object",
                            "null"
                          ],
                          description: "SEC reconciliation (record_type=reconciliation); null when none is confirmed for this revision."
                        }
                      }
                    },
                    meta: {
                      $ref: "#/components/schemas/Meta"
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Bad record id",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            description: "No confirmed record",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    },
    "/llms.txt": {
      get: {
        operationId: "getLlmsTxt",
        responses: {
          "200": {
            description: "Agent index",
            content: {
              "text/plain": {
                schema: {
                  type: "string"
                }
              }
            }
          }
        }
      }
    },
    "/openapi.json": {
      get: {
        operationId: "getOpenApi",
        responses: {
          "200": {
            description: "This document",
            content: {
              "application/json": {
                schema: {
                  type: "object"
                }
              }
            }
          }
        }
      }
    },
    "/v1/calendar": {
      get: {
        operationId: "getCalendar",
        summary: "Declared dividends and the date each token is expected to adjust (leading calendar)",
        description: "Entries come from SEC filing text (quote, document URL and sha256) and are independently re-verified. expected_adjustment_date is the payable date: an observed issuer pattern whose measured rate is stated in each entry's basis, not a guarantee.",
        parameters: [
          {
            name: "contract",
            in: "query",
            schema: {
              type: "string",
              pattern: "^0x[0-9a-fA-F]{40}$"
            }
          },
          {
            name: "state",
            in: "query",
            schema: {
              enum: [
                "upcoming",
                "applied",
                "not_observed"
              ]
            }
          }
        ],
        responses: {
          "200": {
            description: "Calendar entries",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "data",
                    "meta"
                  ],
                  properties: {
                    data: {
                      type: "array",
                      items: {
                        type: "object"
                      }
                    },
                    meta: {
                      $ref: "#/components/schemas/Meta"
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Bad input",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    },
    "/v1/events": {
      get: {
        operationId: "listEvents",
        summary: "Applied and upcoming corporate actions in one list",
        parameters: [
          {
            name: "contract",
            in: "query",
            schema: {
              type: "string",
              pattern: "^0x[0-9a-fA-F]{40}$"
            }
          },
          {
            name: "status",
            in: "query",
            schema: {
              enum: [
                "predicted",
                "confirmed_onchain",
                "verified_matched",
                "late",
                "unknown"
              ]
            }
          }
        ],
        responses: {
          "200": {
            description: "Events",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "data",
                    "meta"
                  ],
                  properties: {
                    data: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/Event"
                      }
                    },
                    meta: {
                      $ref: "#/components/schemas/Meta"
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Bad input",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          },
          "429": {
            description: "Rate limited (see retry-after)",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    },
    "/v1/changes": {
      get: {
        operationId: "listChanges",
        summary: "Events added or whose status changed since a timestamp (poll with meta.as_of)",
        parameters: [
          {
            name: "since",
            in: "query",
            required: true,
            schema: {
              type: "string",
              format: "date-time"
            }
          },
          {
            name: "contract",
            in: "query",
            schema: {
              type: "string",
              pattern: "^0x[0-9a-fA-F]{40}$"
            }
          },
          {
            name: "status",
            in: "query",
            schema: {
              enum: [
                "predicted",
                "confirmed_onchain",
                "verified_matched",
                "late",
                "unknown"
              ]
            }
          }
        ],
        responses: {
          "200": {
            description: "Changed events",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "data",
                    "meta"
                  ],
                  properties: {
                    data: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/Event"
                      }
                    },
                    meta: {
                      $ref: "#/components/schemas/Meta"
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Bad input",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          },
          "429": {
            description: "Rate limited (see retry-after)",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    },
    "/v1/assets/{contract}/nav/history": {
      get: {
        summary: "Chainlink NAV history for one token (verified feeds only)",
        description: "Verbatim Chainlink rounds with feed, phase, aggregator and round id per point, so each value can be re-read onchain with getRoundData. Total-return NAV: it already includes dividends and splits. Official rounds only by default: inside the window in which the proxy served that aggregator, from an aggregator whose decimals match the proxy. interval=daily returns the last official round inside each New York trading day's regular session; trading days without one are listed in meta.quality.missing_trading_days and never filled. Served only when the feed's latest independent review is CONFIRMED, and only rounds that review covered. Returns 503 NAV_NOT_ENABLED until enabled by the operator.",
        parameters: [
          {
            name: "contract",
            in: "path",
            required: true,
            schema: {
              type: "string",
              pattern: "^0x[0-9a-fA-F]{40}$"
            }
          },
          {
            name: "interval",
            in: "query",
            schema: {
              type: "string",
              enum: [
                "daily",
                "round"
              ],
              default: "daily"
            }
          },
          {
            name: "from",
            in: "query",
            schema: {
              type: "string",
              format: "date"
            },
            description: "Default: 90 days before `to` (daily) or 2026-01-01 (round)"
          },
          {
            name: "to",
            in: "query",
            schema: {
              type: "string",
              format: "date"
            },
            description: "Default: today (UTC)"
          },
          {
            name: "limit",
            in: "query",
            schema: {
              type: "integer",
              minimum: 1,
              maximum: 1e3,
              default: 500
            },
            description: "round interval only"
          },
          {
            name: "include",
            in: "query",
            schema: {
              type: "string",
              enum: [
                "official",
                "all"
              ],
              default: "official"
            },
            description: "all (interval=round only) also returns non-official rounds with official/proxy_live/decimals_ok flags"
          },
          {
            name: "cursor",
            in: "query",
            schema: {
              type: "string",
              pattern: "^\\d{1,12}-\\d{1,30}$"
            },
            description: "round interval only; pass meta.next_cursor back unchanged (order: updated_at, then round_id)"
          }
        ],
        responses: {
          "200": {
            description: "NAV points",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "data",
                    "meta"
                  ],
                  properties: {
                    data: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/NavPoint"
                      }
                    },
                    meta: {
                      type: "object",
                      properties: {
                        token: {
                          type: "string"
                        },
                        symbol: {
                          type: "string"
                        },
                        feed: {
                          type: "string"
                        },
                        decimals: {
                          type: "integer"
                        },
                        interval: {
                          type: "string"
                        },
                        semantics: {
                          type: "string"
                        },
                        next_cursor: {
                          type: [
                            "string",
                            "null"
                          ]
                        },
                        quality: {
                          type: "object",
                          properties: {
                            rounds_indexed: {
                              type: "integer"
                            },
                            first_round_at: {
                              type: [
                                "string",
                                "null"
                              ]
                            },
                            last_round_at: {
                              type: [
                                "string",
                                "null"
                              ]
                            },
                            missing_trading_days: {
                              type: "array",
                              items: {
                                type: "string"
                              }
                            },
                            not_covered_days: {
                              type: "array",
                              items: {
                                type: "string"
                              }
                            },
                            verification: {
                              type: "object"
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Bad input",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            description: "Unknown token (UNKNOWN_ASSET) or no NAV feed (NO_NAV_FEED)",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            description: "Not enabled (NAV_NOT_ENABLED) or feed not independently verified (NAV_NOT_VERIFIED)",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    },
    "/v1/market/session": {
      get: {
        summary: "US equity session right now (NYSE calendar 2026-2027)",
        responses: {
          "200": {
            description: "Session",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        session: {
                          type: "string",
                          enum: [
                            "open",
                            "pre",
                            "after",
                            "closed",
                            "weekend",
                            "holiday",
                            "calendar_not_covered"
                          ]
                        },
                        ny_date: {
                          type: "string"
                        },
                        ny_time: {
                          type: "string"
                        },
                        is_trading_day: {
                          type: [
                            "boolean",
                            "null"
                          ]
                        },
                        early_close: {
                          type: "boolean"
                        },
                        next_open: {
                          type: [
                            "string",
                            "null"
                          ]
                        },
                        next_close: {
                          type: [
                            "string",
                            "null"
                          ]
                        },
                        last_close: {
                          type: [
                            "string",
                            "null"
                          ]
                        },
                        calendar_version: {
                          type: "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/v1/assets/{contract}/market-context": {
      get: {
        summary: "Session, latest Chainlink NAV (live, with round id and age) and staleness for one token",
        description: "The latest round is read live from Base's public RPC (reused up to 30 s in the server; responses are not CDN-cached) and served only if its phase was covered by the latest CONFIRMED review with matching decimals. staleness (method v2): trading (regular-session) seconds since the round, across days, against threshold = max(2 \xD7 the feed's p99 in-session gap, 30 min): fresh | expected_closed | unexpectedly_stale | unknown | calendar_not_covered. Failures degrade to nav: null with nav_unavailable_reason (no_nav_feed, feed_not_verified, rpc_unavailable, rpc_result_invalid, phase_not_reviewed, aggregator_decimals_differ_from_proxy). dex: the main verified pool's price, venue, pool, block, 2% depth and nav_premium_pct (DEX vs last published NAV), with a note when the market is closed. Returns 503 NAV_NOT_ENABLED until enabled.",
        parameters: [
          {
            name: "contract",
            in: "path",
            required: true,
            schema: {
              type: "string",
              pattern: "^0x[0-9a-fA-F]{40}$"
            }
          }
        ],
        responses: {
          "200": {
            description: "Market context"
          },
          "400": {
            description: "Bad address",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            description: "UNKNOWN_ASSET",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            description: "NAV_NOT_ENABLED",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    },
    "/v1/assets/{contract}/corporate-actions": {
      get: {
        summary: "One token's verified corporate actions with multiplier and uiMultiplier detail",
        description: "Same events as /v1/events for the token, plus operator description, announced_at, effective block/time, ui_multiplier_before/after_wad and its effective time (when the UIMultiplierUpdated event exists), announcement transactions and evidence links (onchain tx, Coinbase issuer record, SEC filing, Keldrin record).",
        parameters: [
          {
            name: "contract",
            in: "path",
            required: true,
            schema: {
              type: "string",
              pattern: "^0x[0-9a-fA-F]{40}$"
            }
          }
        ],
        responses: {
          "200": {
            description: "Corporate actions"
          },
          "400": {
            description: "Bad address",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            description: "UNKNOWN_ASSET",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    },
    "/v1/assets/{contract}/dex": {
      get: {
        summary: "Live DEX price of a tokenized stock on Base (onchain, one pinned block)",
        description: "Reads Keldrin's independently verified pools (Uniswap v3, Aerodrome v2, Aerodrome Slipstream and plain no-hook Uniswap v4 pools against USDC, WETH or ETH) at one block from Base's public RPC. Per pool: price per token in the quote and in USD (ETH priced from the Uniswap v3 WETH/USDC 0.05% pool), estimated 2% depth in USD, status (ok, too_thin, outlier, unsupported, unreadable). main = deepest pool with depth >= $100 and price within 0.25x-4x of the median; thin_market when depth < $1,000. Never CDN-cached.",
        parameters: [
          {
            name: "contract",
            in: "path",
            required: true,
            schema: {
              type: "string",
              pattern: "^0x[0-9a-fA-F]{40}$"
            }
          }
        ],
        responses: {
          "200": {
            description: "DEX price (main may be null with unavailable_reason)"
          },
          "400": {
            description: "Bad address",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            description: "UNKNOWN_ASSET",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    },
    "/mcp": {
      post: {
        summary: "Remote MCP server (Streamable HTTP, stateless JSON; no SSE)",
        description: "One JSON-RPC 2.0 message per POST (max 64 KB): initialize, ping, tools/list, tools/call. Read-only tools: list_assets, get_corporate_actions, get_nav_history, get_market_context, get_dex_price, get_market_session. Tool results carry a plain lead sentence, the JSON, and structuredContent; API errors come back as isError with the same codes as the REST API. Add with: claude mcp add --transport http keldrin https://keldrin.vercel.app/mcp",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "JSON-RPC response"
          },
          "202": {
            description: "Notification accepted"
          },
          "400": {
            description: "Parse error / invalid request"
          },
          "413": {
            description: "Body over 64 KB"
          }
        }
      }
    },
    "/v1/snapshot": {
      get: {
        operationId: "snapshotFreeTry",
        summary: "All verified stocks in one answer (3 free per day)",
        description: "Every Coinbase tokenized stock on Base with a verified Chainlink NAV feed, in one answer: latest NAV with round id and age, freshness, main DEX price with depth and gap vs NAV, next corporate action; plus the US session. 3 free complete answers per client per UTC day (shared with /v1/report), then 402 FREE_TRIES_USED with the paid x402 links. Incomplete answers are 503 and use no try.",
        responses: {
          "200": {
            description: "Complete snapshot; meta.free_tries_left_today"
          },
          "402": {
            description: "Error (never charged)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "object",
                      properties: {
                        code: {
                          type: "string"
                        },
                        message: {
                          type: "string"
                        },
                        hint: {
                          type: "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "503": {
            description: "Error (never charged)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "object",
                      properties: {
                        code: {
                          type: "string"
                        },
                        message: {
                          type: "string"
                        },
                        hint: {
                          type: "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/v1/report": {
      get: {
        operationId: "reportFreeTry",
        summary: "Everything on one stock (3 free per day)",
        description: "Everything keldrin verifies about one token in one answer: corporate actions with evidence, market context (live NAV, freshness, DEX gap), 30 daily NAV closes with round ids, every verified DEX pool. Same 3 free tries as /v1/snapshot, then 402.",
        parameters: [
          {
            name: "token",
            in: "query",
            required: true,
            schema: {
              type: "string"
            },
            description: "Exact symbol (e.g. NVDAc) or 0x contract address"
          }
        ],
        responses: {
          "200": {
            description: "Complete report"
          },
          "400": {
            description: "Error (never charged)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "object",
                      properties: {
                        code: {
                          type: "string"
                        },
                        message: {
                          type: "string"
                        },
                        hint: {
                          type: "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "402": {
            description: "Error (never charged)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "object",
                      properties: {
                        code: {
                          type: "string"
                        },
                        message: {
                          type: "string"
                        },
                        hint: {
                          type: "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "404": {
            description: "Error (never charged)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "object",
                      properties: {
                        code: {
                          type: "string"
                        },
                        message: {
                          type: "string"
                        },
                        hint: {
                          type: "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "409": {
            description: "Error (never charged)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "object",
                      properties: {
                        code: {
                          type: "string"
                        },
                        message: {
                          type: "string"
                        },
                        hint: {
                          type: "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "503": {
            description: "Error (never charged)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "object",
                      properties: {
                        code: {
                          type: "string"
                        },
                        message: {
                          type: "string"
                        },
                        hint: {
                          type: "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/snapshot": {
      get: {
        operationId: "snapshotPaid",
        summary: "All verified stocks in one answer ($0.05 USDC on Base, x402)",
        description: "Every Coinbase tokenized stock on Base with a verified Chainlink NAV feed, in one answer: latest NAV with round id and age, freshness, main DEX price with depth and gap vs NAV, next corporate action; plus the US session. Forwards to https://x402.bankr.bot/0xb98f0de777eea8c481b64e33d3e0066cea38fa91/keldrin-snapshot (same terms). Only a 2xx is charged.",
        "x-payment-info": {
          price: "0.05",
          currency: "USDC",
          network: "eip155:8453",
          scheme: "exact",
          x402Version: 2,
          amount: "50000",
          asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
          payTo: "0x8AEE621035D93Deb3C0C1177fac252dC2dd501a0",
          facilitator: "Bankr x402 Cloud"
        },
        responses: {
          "200": {
            description: "Complete snapshot (charged)"
          },
          "402": {
            description: "Payment required (x402 v2): terms in the payment-required header (base64 JSON). scheme exact, network eip155:8453, USDC, amount 50000 ($0.05), payTo 0x8AEE621035D93Deb3C0C1177fac252dC2dd501a0.",
            headers: {
              "payment-required": {
                schema: {
                  type: "string"
                },
                description: "Base64 JSON with the x402 payment requirements"
              }
            }
          },
          "503": {
            description: "Error (never charged)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "object",
                      properties: {
                        code: {
                          type: "string"
                        },
                        message: {
                          type: "string"
                        },
                        hint: {
                          type: "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/report": {
      get: {
        operationId: "reportPaid",
        summary: "Everything on one stock ($0.05 USDC on Base, x402)",
        description: "Everything keldrin verifies about one token in one answer: corporate actions with evidence, market context (live NAV, freshness, DEX gap), 30 daily NAV closes with round ids, every verified DEX pool. Forwards to https://x402.bankr.bot/0xb98f0de777eea8c481b64e33d3e0066cea38fa91/keldrin-report (same terms). Only a 2xx is charged.",
        parameters: [
          {
            name: "token",
            in: "query",
            required: true,
            schema: {
              type: "string"
            },
            description: "Exact symbol (e.g. NVDAc) or 0x contract address"
          }
        ],
        "x-payment-info": {
          price: "0.05",
          currency: "USDC",
          network: "eip155:8453",
          scheme: "exact",
          x402Version: 2,
          amount: "50000",
          asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
          payTo: "0x8AEE621035D93Deb3C0C1177fac252dC2dd501a0",
          facilitator: "Bankr x402 Cloud"
        },
        responses: {
          "200": {
            description: "Complete report (charged)"
          },
          "400": {
            description: "Error (never charged)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "object",
                      properties: {
                        code: {
                          type: "string"
                        },
                        message: {
                          type: "string"
                        },
                        hint: {
                          type: "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "402": {
            description: "Payment required (x402 v2): terms in the payment-required header (base64 JSON). scheme exact, network eip155:8453, USDC, amount 50000 ($0.05), payTo 0x8AEE621035D93Deb3C0C1177fac252dC2dd501a0.",
            headers: {
              "payment-required": {
                schema: {
                  type: "string"
                },
                description: "Base64 JSON with the x402 payment requirements"
              }
            }
          },
          "404": {
            description: "Error (never charged)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "object",
                      properties: {
                        code: {
                          type: "string"
                        },
                        message: {
                          type: "string"
                        },
                        hint: {
                          type: "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "409": {
            description: "Error (never charged)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "object",
                      properties: {
                        code: {
                          type: "string"
                        },
                        message: {
                          type: "string"
                        },
                        hint: {
                          type: "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "503": {
            description: "Error (never charged)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "object",
                      properties: {
                        code: {
                          type: "string"
                        },
                        message: {
                          type: "string"
                        },
                        hint: {
                          type: "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/v1/feedback": {
      post: {
        operationId: "feedback",
        summary: "Website feedback form",
        description: "Email required; X handle and message optional. 5 per client per day.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "email"
                ],
                properties: {
                  email: {
                    type: "string"
                  },
                  x: {
                    type: "string"
                  },
                  message: {
                    type: "string",
                    maxLength: 1e3
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Received"
          },
          "400": {
            description: "Error (never charged)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "object",
                      properties: {
                        code: {
                          type: "string"
                        },
                        message: {
                          type: "string"
                        },
                        hint: {
                          type: "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "429": {
            description: "Error (never charged)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "object",
                      properties: {
                        code: {
                          type: "string"
                        },
                        message: {
                          type: "string"
                        },
                        hint: {
                          type: "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "503": {
            description: "Error (never charged)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "object",
                      properties: {
                        code: {
                          type: "string"
                        },
                        message: {
                          type: "string"
                        },
                        hint: {
                          type: "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/skill.md": {
      get: {
        operationId: "skill",
        summary: "Agent guide (when to use keldrin, how to read answers, how to pay)",
        responses: {
          "200": {
            description: "Markdown"
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Error: {
        type: "object",
        required: [
          "error"
        ],
        properties: {
          error: {
            type: "object",
            required: [
              "code",
              "message"
            ],
            properties: {
              code: {
                type: "string"
              },
              message: {
                type: "string"
              },
              hint: {
                type: "string"
              }
            }
          }
        }
      },
      Meta: {
        type: "object",
        required: [
          "as_of",
          "schema_version",
          "served"
        ],
        properties: {
          as_of: {
            type: "string",
            format: "date-time"
          },
          schema_version: {
            type: "string"
          },
          served: {
            const: "independently_confirmed_records_only"
          },
          count: {
            type: "integer"
          },
          next_cursor: {
            type: [
              "string",
              "null"
            ],
            description: "Opaque; pass back unchanged as `cursor`."
          }
        }
      },
      Asset: {
        type: "object",
        required: [
          "chain_id",
          "contract_address",
          "symbol",
          "identity_state"
        ],
        properties: {
          chain_id: {
            const: 8453
          },
          contract_address: {
            type: "string"
          },
          symbol: {
            type: "string"
          },
          name: {
            type: "string"
          },
          isin: {
            type: [
              "string",
              "null"
            ]
          },
          identity_state: {
            enum: [
              "verified",
              "mismatch",
              "incomplete"
            ]
          },
          multiplier_wad: {
            type: [
              "string",
              "null"
            ]
          },
          observed_block: {
            type: "string"
          }
        }
      },
      Event: {
        type: "object",
        required: [
          "event_id",
          "chain_id",
          "ticker",
          "contract_address",
          "event_type",
          "status",
          "confidence",
          "expected_adjustment_date",
          "updated_at",
          "warnings"
        ],
        properties: {
          event_id: {
            type: "string"
          },
          chain_id: {
            const: 8453
          },
          ticker: {
            type: "string",
            description: "B20 token symbol, e.g. NVDAc. Store contract_address, not the ticker."
          },
          contract_address: {
            type: "string"
          },
          event_type: {
            enum: [
              "dividend",
              "split",
              "reverse_split",
              "other"
            ]
          },
          status: {
            enum: [
              "predicted",
              "confirmed_onchain",
              "verified_matched",
              "late",
              "unknown"
            ],
            description: "predicted: declared/announced, not applied yet. confirmed_onchain: applied, no dated company declaration matched. verified_matched: applied and matches the declared payable date. late: applied (or expected) more than 1 day after the payable date."
          },
          confidence: {
            enum: [
              "high",
              "medium",
              "unknown"
            ],
            description: "high: two independent sources agree (SEC declaration and onchain). medium: one source. Never guessed."
          },
          expected_adjustment_date: {
            type: [
              "string",
              "null"
            ],
            description: "Payable date of the declaration (observed issuer pattern, not a guarantee). null when no dated declaration is evidenced."
          },
          adjusted_at: {
            type: [
              "string",
              "null"
            ],
            format: "date-time"
          },
          multiplier_before_wad: {
            type: [
              "string",
              "null"
            ]
          },
          multiplier_after_wad: {
            type: [
              "string",
              "null"
            ]
          },
          multiplier_delta: {
            type: [
              "string",
              "null"
            ],
            description: "after/before as an exact decimal string"
          },
          per_share: {
            type: [
              "string",
              "null"
            ]
          },
          record_date: {
            type: [
              "string",
              "null"
            ]
          },
          payable_date: {
            type: [
              "string",
              "null"
            ]
          },
          sec_filing_url: {
            type: [
              "string",
              "null"
            ]
          },
          quoted_text: {
            type: [
              "string",
              "null"
            ]
          },
          onchain_tx: {
            type: [
              "string",
              "null"
            ]
          },
          issuer_corporate_action_uuid: {
            type: [
              "string",
              "null"
            ]
          },
          record_id: {
            type: [
              "string",
              "null"
            ]
          },
          basis: {
            type: "string"
          },
          updated_at: {
            type: "string",
            format: "date-time"
          },
          warnings: {
            type: "array",
            items: {
              type: "string"
            },
            description: "Anything that does not add up beyond timing, e.g. multiplier_change_unusually_large_for_cash_dividend. Any warning lowers confidence."
          }
        }
      },
      NavPoint: {
        type: "object",
        required: [
          "chain_id",
          "token",
          "feed",
          "round_id",
          "phase_id",
          "answer_raw",
          "decimals",
          "nav",
          "updated_at",
          "retrieved_at"
        ],
        properties: {
          session_day: {
            type: "string",
            format: "date",
            description: "daily interval only"
          },
          session_close: {
            type: "string",
            format: "date-time"
          },
          chain_id: {
            type: "integer"
          },
          token: {
            type: "string"
          },
          feed: {
            type: "string"
          },
          round_id: {
            type: "string",
            description: "proxy round id (phaseId<<64 | aggregatorRoundId), decimal string"
          },
          phase_id: {
            type: "integer"
          },
          aggregator_round_id: {
            type: "string"
          },
          aggregator: {
            type: "string"
          },
          answer_raw: {
            type: "string"
          },
          decimals: {
            type: "integer"
          },
          nav: {
            type: "string",
            description: "exact decimal"
          },
          started_at: {
            type: "string",
            format: "date-time"
          },
          updated_at: {
            type: "string",
            format: "date-time"
          },
          answered_in_round: {
            type: "string"
          },
          retrieved_at: {
            type: "string",
            format: "date-time"
          },
          retrieved_block: {
            type: "string"
          },
          provisional: {
            type: "boolean",
            description: "daily interval only: true while that session has not closed yet"
          },
          official: {
            type: "boolean",
            description: "include=all only: inside its phase's live window and decimals match the proxy"
          },
          proxy_live: {
            type: "boolean",
            description: "include=all only: the proxy served this round's aggregator when it was published"
          },
          decimals_ok: {
            type: "boolean",
            description: "include=all only: the aggregator's decimals equal the proxy's"
          }
        }
      }
    }
  }
};

// src/api/events.ts
function eventType(description) {
  const d = (description ?? "").toLowerCase();
  if (/reverse/.test(d) && /split/.test(d)) return "reverse_split";
  if (/split/.test(d)) return "split";
  if (/dividend/.test(d)) return "dividend";
  return "other";
}
var dayDiff = (a, b) => Math.round((Date.parse(a.slice(0, 10)) - Date.parse(b.slice(0, 10))) / 864e5);
var LARGE_DIVIDEND_CHANGE = 0.1;
function classifyApplied(adjustedAt, decl, opts = {}) {
  const warnings = [];
  if (opts.type === "dividend" && opts.ratio && Number(opts.ratio) - 1 > LARGE_DIVIDEND_CHANGE)
    warnings.push("multiplier_change_unusually_large_for_cash_dividend");
  const cap = (c) => warnings.length && c === "high" ? "medium" : c;
  if (!decl?.payable_date) return { status: "confirmed_onchain", confidence: cap("medium"), basis: "Applied onchain and independently verified; no dated company declaration matched.", warnings };
  const late = dayDiff(adjustedAt, decl.payable_date);
  if (late > 1) return { status: "late", confidence: cap("high"), basis: `Token adjusted ${late} days after the declared payable date ${decl.payable_date}.`, warnings };
  return { status: "verified_matched", confidence: cap("high"), basis: `Token adjusted on ${adjustedAt.slice(0, 10)}, matching the declared payable date ${decl.payable_date}.` + (warnings.length ? " The size of the multiplier change is not explained by the declaration." : ""), warnings };
}
async function listEvents(db2, f = {}) {
  const out = [];
  const applied = (await db2.query(
    "SELECT record_id, revision, payload, payload_sha256, reviewed_at FROM confirmed_records WHERE payload->'action'->>'status' = 'applied'"
  )).rows;
  for (const r of applied) {
    const recon = (await db2.query(
      "SELECT payload, created_at FROM reconciliations WHERE record_id=$1 AND record_payload_sha256=$2 AND review_verdict='CONFIRMED' ORDER BY created_at DESC LIMIT 1",
      [r.record_id, r.payload_sha256]
    )).rows[0];
    const a = r.payload.action;
    const decl = recon?.payload?.declaration ?? null;
    const cls = classifyApplied(a.effective.time, decl, { type: eventType(a.operator_description), ratio: a.ratio });
    const applyTx = (r.payload.announcements ?? []).find((x) => (x.inner_events ?? []).some((e2) => /Multiplier/.test(e2)))?.tx_hash ?? null;
    out.push({
      event_id: r.record_id,
      chain_id: 8453,
      ticker: r.payload.asset.symbol,
      contract_address: r.payload.asset.contract_address,
      event_type: eventType(a.operator_description),
      status: cls.status,
      confidence: cls.confidence,
      expected_adjustment_date: decl?.payable_date ?? null,
      adjusted_at: a.effective.time,
      multiplier_before_wad: a.multiplier_before_wad,
      multiplier_after_wad: a.multiplier_after_wad,
      multiplier_delta: a.ratio,
      per_share: decl?.per_share ?? null,
      record_date: decl?.record_date ?? null,
      payable_date: decl?.payable_date ?? null,
      sec_filing_url: decl?.document_url ?? null,
      quoted_text: decl?.quote ?? null,
      onchain_tx: applyTx,
      issuer_corporate_action_uuid: a.corporate_action_uuid,
      record_id: r.record_id,
      basis: cls.basis,
      warnings: cls.warnings,
      updated_at: new Date(Math.max(Date.parse(r.reviewed_at), recon ? Date.parse(recon.created_at) : 0)).toISOString()
    });
  }
  const snap = (await db2.query("SELECT snapshot_id FROM calendar_entries GROUP BY snapshot_id ORDER BY max(as_of) DESC LIMIT 1")).rows[0];
  if (snap) {
    const rows = (await db2.query(
      `SELECT c.payload, (SELECT min(x.as_of) FROM calendar_entries x WHERE x.entry_id = c.entry_id AND x.state = c.state AND x.review_verdict = 'CONFIRMED') AS first_seen
       FROM calendar_entries c WHERE c.snapshot_id = $1 AND c.review_verdict = 'CONFIRMED' AND c.state IN ('upcoming','announced','not_observed')`,
      [snap.snapshot_id]
    )).rows;
    for (const { payload: e2, first_seen } of rows) {
      const d = e2.declaration;
      const ia = e2.issuer_announcement;
      const both = !!d && !!ia;
      const status = e2.state === "not_observed" ? "late" : "predicted";
      out.push({
        event_id: e2.entry_id,
        chain_id: 8453,
        ticker: e2.token.symbol,
        contract_address: e2.token.contract_address,
        event_type: eventType(ia?.description ?? (d ? "dividend" : null)),
        status,
        confidence: status === "late" ? "high" : both ? "high" : "medium",
        expected_adjustment_date: e2.expected_adjustment_date,
        adjusted_at: null,
        multiplier_before_wad: null,
        multiplier_after_wad: null,
        multiplier_delta: null,
        per_share: d?.per_share ?? null,
        record_date: d?.record_date ?? null,
        payable_date: d?.payable_date ?? null,
        sec_filing_url: d?.document_url ?? null,
        quoted_text: d?.quote ?? null,
        onchain_tx: ia?.announcements?.at(-1)?.tx_hash ?? null,
        issuer_corporate_action_uuid: ia?.corporate_action_uuid ?? null,
        record_id: null,
        basis: e2.basis,
        warnings: [],
        updated_at: new Date(first_seen).toISOString()
      });
    }
  }
  const appliedUuids = new Set(out.filter((x) => x.adjusted_at).map((x) => x.issuer_corporate_action_uuid));
  return out.filter((x) => x.adjusted_at || !x.issuer_corporate_action_uuid || !appliedUuids.has(x.issuer_corporate_action_uuid)).filter((x) => !f.contract || x.contract_address.toLowerCase() === f.contract.toLowerCase()).filter((x) => !f.status || x.status === f.status).sort((a, b) => (b.adjusted_at ?? b.expected_adjustment_date ?? "").localeCompare(a.adjusted_at ?? a.expected_adjustment_date ?? "") || a.ticker.localeCompare(b.ticker));
}

// src/lib/sessions.ts
var CALENDAR_VERSION = "nyse-2026-2027.1";
var COVERAGE = { from: "2026-01-01", to: "2027-12-31" };
var HOLIDAYS = /* @__PURE__ */ new Set([
  "2026-01-01",
  "2026-01-19",
  "2026-02-16",
  "2026-04-03",
  "2026-05-25",
  "2026-06-19",
  "2026-07-03",
  "2026-09-07",
  "2026-11-26",
  "2026-12-25",
  "2027-01-01",
  "2027-01-18",
  "2027-02-15",
  "2027-03-26",
  "2027-05-31",
  "2027-06-18",
  "2027-07-05",
  "2027-09-06",
  "2027-11-25",
  "2027-12-24"
]);
var EARLY_CLOSES = /* @__PURE__ */ new Set(["2026-11-27", "2026-12-24", "2027-11-26"]);
var fmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit", weekday: "short", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
function nyParts(unixSec) {
  const p = Object.fromEntries(fmt.formatToParts(new Date(unixSec * 1e3)).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, weekday: p.weekday, minutes: Number(p.hour) * 60 + Number(p.minute) };
}
var covered = (date) => date >= COVERAGE.from && date <= COVERAGE.to;
function isTradingDay(date) {
  if (!covered(date)) return null;
  const wd = (/* @__PURE__ */ new Date(`${date}T12:00:00Z`)).getUTCDay();
  if (wd === 0 || wd === 6) return false;
  return !HOLIDAYS.has(date);
}
function nyTime(date, hh, mm) {
  const target = hh * 60 + mm;
  for (const offsetH of [4, 5]) {
    const t = Date.parse(`${date}T00:00:00Z`) / 1e3 + (target + offsetH * 60) * 60;
    const p = nyParts(t);
    if (p.date === date && p.minutes === target) return t;
  }
  throw new Error(`cannot place ${date} ${hh}:${mm} in New York time`);
}
var sessionOpen = (date) => nyTime(date, 9, 30);
var sessionClose = (date) => EARLY_CLOSES.has(date) ? nyTime(date, 13, 0) : nyTime(date, 16, 0);
function dateRange(from, to) {
  const out = [];
  for (let d = Date.parse(`${from}T12:00:00Z`); d <= Date.parse(`${to}T12:00:00Z`); d += 864e5) out.push(new Date(d).toISOString().slice(0, 10));
  return out;
}

// src/api/nav.ts
function formatNav(answer, decimals) {
  const neg = answer.startsWith("-");
  const digits = (neg ? answer.slice(1) : answer).padStart(decimals + 1, "0");
  const int = digits.slice(0, digits.length - decimals);
  const frac = digits.slice(digits.length - decimals).replace(/0+$/, "");
  return (neg ? "-" : "") + int + (frac ? "." + frac : "");
}
function dailyCloses(rows, from, to, nowSec = Math.floor(Date.now() / 1e3), indexedUntilSec = null, coveredFromSec = null) {
  const byDay = /* @__PURE__ */ new Map();
  for (const r of rows) {
    const t = Number(r.updated_unix);
    const day = nyParts(t).date;
    if (isTradingDay(day) !== true || t < sessionOpen(day) || t > sessionClose(day)) continue;
    const prev = byDay.get(day);
    if (!prev || Number(r.updated_unix) > Number(prev.updated_unix) || r.updated_unix === prev.updated_unix && BigInt(r.round_id) > BigInt(prev.round_id)) byDay.set(day, r);
  }
  const closes = [];
  const missing_trading_days = [];
  const not_covered_days = [];
  const not_yet_indexed_days = [];
  const before_coverage_days = [];
  for (const d of dateRange(from, to)) {
    const td = isTradingDay(d);
    if (td === null) not_covered_days.push(d);
    if (td !== true) continue;
    const r = byDay.get(d);
    if (!r && coveredFromSec !== null && sessionClose(d) < coveredFromSec) {
      before_coverage_days.push(d);
      continue;
    }
    if (r) closes.push({ session_day: d, session_close: new Date(sessionClose(d) * 1e3).toISOString(), provisional: sessionClose(d) > nowSec, row: r });
    else if (indexedUntilSec !== null && sessionOpen(d) > indexedUntilSec) not_yet_indexed_days.push(d);
    else if (sessionClose(d) <= nowSec) missing_trading_days.push(d);
  }
  return { closes, missing_trading_days, not_covered_days, not_yet_indexed_days, before_coverage_days };
}
var e = (status, code, message, hint) => ({ status, body: { error: { code, message, ...hint ? { hint } : {} } } });
var DAY = /^\d{4}-\d{2}-\d{2}$/;
var validDay = (d) => DAY.test(d) && !Number.isNaN(Date.parse(d + "T00:00:00Z")) && (/* @__PURE__ */ new Date(d + "T00:00:00Z")).toISOString().slice(0, 10) === d;
var iso = `'YYYY-MM-DD"T"HH24:MI:SS"Z"'`;
var isoMs = `'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'`;
async function navHistory(db2, contract, q, now = /* @__PURE__ */ new Date()) {
  const interval = q.get("interval") ?? "daily";
  if (interval !== "daily" && interval !== "round") return e(400, "BAD_INTERVAL", "interval must be daily or round");
  const include = q.get("include") ?? "official";
  if (include !== "official" && include !== "all") return e(400, "BAD_INCLUDE", "include must be official or all");
  if (include === "all" && interval !== "round") return e(400, "BAD_INCLUDE", "include=all is only available with interval=round");
  const today = now.toISOString().slice(0, 10);
  const to = q.get("to") ?? today;
  const from = q.get("from") ?? (interval === "daily" ? new Date(Date.parse(to + "T00:00:00Z") - 90 * 864e5).toISOString().slice(0, 10) : "2026-01-01");
  if (!validDay(from) || !validDay(to)) return e(400, "BAD_DATE", "from and to must be real dates (YYYY-MM-DD)");
  if (from > to) return e(400, "BAD_RANGE", "from must be on or before to");
  if (interval === "daily" && Date.parse(to) - Date.parse(from) > 400 * 864e5) return e(400, "RANGE_TOO_LONG", "daily ranges are limited to 400 days", "page by date range");
  const limit = Number(q.get("limit") ?? 500);
  if (!Number.isInteger(limit) || limit < 1 || limit > 1e3) return e(400, "BAD_LIMIT", "limit must be an integer 1-1000");
  const cursor = q.get("cursor");
  if (cursor !== null && !/^\d{1,12}-\d{1,30}$/.test(cursor)) return e(400, "BAD_CURSOR", "cursor is opaque; pass meta.next_cursor back unchanged");
  const known = (await db2.query("SELECT count(*)::int AS n FROM assets WHERE lower(contract_address)=lower($1)", [contract])).rows[0].n;
  if (!known) return e(404, "UNKNOWN_ASSET", `no tracked asset ${contract}`, "GET /v1/assets lists tracked tokens");
  const feed = (await db2.query(
    "SELECT feed_address, token_address, symbol, decimals, description FROM nav_feeds WHERE chain_id=$1 AND lower(token_address)=lower($2) ORDER BY discovered_at DESC LIMIT 1",
    [CHAIN_ID, contract]
  )).rows[0];
  if (!feed) return e(404, "NO_NAV_FEED", `no Chainlink NAV feed is indexed for ${contract}`, "about 14 tokenized stocks have a NAV feed; corporate actions cover all tokens");
  const rev = (await db2.query(
    `SELECT review_id, verdict, sampled, mismatches, to_char(checked_at AT TIME ZONE 'UTC', ${isoMs}) AS checked_at, detail FROM nav_reviews WHERE chain_id=$1 AND feed_address=$2 ORDER BY checked_at DESC LIMIT 1`,
    [CHAIN_ID, feed.feed_address]
  )).rows[0];
  const detail = typeof rev?.detail === "string" ? JSON.parse(rev.detail) : rev?.detail;
  if (!rev || rev.verdict !== "CONFIRMED" || !Array.isArray(detail?.covered)) return e(503, "NAV_NOT_VERIFIED", `NAV history for ${feed.symbol} is not independently verified (${rev ? rev.verdict : "no review yet"})`, "Keldrin fails closed; read the feed onchain meanwhile: " + feed.feed_address);
  const covered2 = JSON.stringify(detail.covered);
  const phCte = (cov) => `ph AS (SELECT DISTINCT ON (phase_id) phase_id, live_from_time, live_to_time, aggregator_decimals,
                     (aggregator_decimals IS NOT NULL AND aggregator_decimals = proxy_decimals) AS dec_ok
                     FROM nav_phases WHERE chain_id=$1 AND feed_address=$2
                       AND observed_block <= COALESCE((SELECT (c->>'phase_observed_block')::bigint FROM jsonb_array_elements(${cov}::jsonb) c WHERE (c->>'phase')::int = nav_phases.phase_id), -1)
                     ORDER BY phase_id, observed_block DESC)`;
  const ph = phCte("$5");
  const liveExpr = "(ph.live_from_time IS NULL OR r.updated_at >= ph.live_from_time) AND (ph.live_to_time IS NULL OR r.updated_at < ph.live_to_time)";
  const cols = `r.round_id::text AS round_id, r.phase_id, r.aggregator_round_id::text AS aggregator_round_id, r.aggregator_address, r.answer::text AS answer, r.decimals,
    to_char(r.started_at AT TIME ZONE 'UTC', ${iso}) AS started_at, to_char(r.updated_at AT TIME ZONE 'UTC', ${iso}) AS updated_at, r.answered_in_round::text AS answered_in_round,
    to_char(r.retrieved_at AT TIME ZONE 'UTC', ${iso}) AS retrieved_at, r.retrieved_block::text AS retrieved_block, extract(epoch from r.updated_at)::bigint::text AS updated_unix,
    (${liveExpr}) AS proxy_live, ph.dec_ok AS decimals_ok, ph.aggregator_decimals AS aggregator_decimals`;
  const coveredExpr = "r.round_id <= (SELECT (c->>'max_round_id')::numeric FROM jsonb_array_elements($5::jsonb) c WHERE (c->>'phase')::int = r.phase_id)";
  const officialExpr = `(${liveExpr}) AND ph.dec_ok`;
  const lo = interval === "daily" ? new Date(Date.parse(from + "T00:00:00Z") - 864e5).toISOString() : from + "T00:00:00Z";
  const hi = new Date(Date.parse(to + "T00:00:00Z") + (interval === "daily" ? 2 : 1) * 864e5).toISOString();
  const ny = "(r.updated_at AT TIME ZONE 'America/New_York')";
  let rows;
  if (interval === "round") {
    const [cu, cr] = cursor ? cursor.split("-") : [null, null];
    rows = (await db2.query(
      `WITH ${ph} SELECT ${cols} FROM nav_rounds r JOIN ph ON ph.phase_id = r.phase_id
       WHERE r.chain_id=$1 AND r.feed_address=$2 AND r.updated_at >= $3::timestamptz AND r.updated_at < $4::timestamptz AND ${coveredExpr}
         ${include === "official" ? "AND " + officialExpr : ""}
         AND ($6::bigint IS NULL OR (extract(epoch from r.updated_at)::bigint, r.round_id) > ($6::bigint, $7::numeric))
       ORDER BY r.updated_at, r.round_id LIMIT ${limit + 1}`,
      [CHAIN_ID, feed.feed_address, lo, hi, covered2, cu, cr]
    )).rows;
  } else {
    rows = (await db2.query(
      `WITH ${ph} SELECT DISTINCT ON (${ny}::date, ${ny}::time <= '13:00') ${cols} FROM nav_rounds r JOIN ph ON ph.phase_id = r.phase_id
       WHERE r.chain_id=$1 AND r.feed_address=$2 AND r.updated_at >= $3::timestamptz AND r.updated_at < $4::timestamptz AND ${coveredExpr} AND ${officialExpr}
         AND ${ny}::time >= '09:30' AND ${ny}::time <= '16:00'
       ORDER BY ${ny}::date, ${ny}::time <= '13:00', r.updated_at DESC, r.round_id DESC`,
      [CHAIN_ID, feed.feed_address, lo, hi, covered2]
    )).rows;
  }
  const item = (r, flags) => {
    const dec = r.aggregator_decimals ?? r.decimals;
    return {
      chain_id: CHAIN_ID,
      token: feed.token_address,
      feed: feed.feed_address,
      round_id: r.round_id,
      phase_id: r.phase_id,
      aggregator_round_id: r.aggregator_round_id,
      aggregator: r.aggregator_address,
      answer_raw: r.answer,
      decimals: dec,
      nav: r.decimals_ok === false ? null : formatNav(r.answer, dec),
      ...r.decimals_ok === false ? { nav_unavailable_reason: "aggregator_decimals_differ_from_proxy" } : {},
      started_at: r.started_at,
      updated_at: r.updated_at,
      answered_in_round: r.answered_in_round,
      retrieved_at: r.retrieved_at,
      retrieved_block: r.retrieved_block,
      ...flags ? { official: Boolean(r.proxy_live && r.decimals_ok), proxy_live: Boolean(r.proxy_live), decimals_ok: Boolean(r.decimals_ok) } : {}
    };
  };
  const span = (await db2.query(
    `WITH ${phCte("$3")} SELECT to_char(min(r.updated_at) AT TIME ZONE 'UTC', ${iso}) AS first, to_char(max(r.updated_at) AT TIME ZONE 'UTC', ${iso}) AS last, count(*)::int AS n
     FROM nav_rounds r JOIN ph ON ph.phase_id = r.phase_id WHERE r.chain_id=$1 AND r.feed_address=$2 AND ${coveredExpr.replace("$5", "$3")} AND ${officialExpr}`,
    [CHAIN_ID, feed.feed_address, covered2]
  )).rows[0];
  const phases = (await db2.query(
    `SELECT DISTINCT ON (phase_id) phase_id, aggregator_address AS aggregator, aggregator_decimals, proxy_decimals, live_from_block::text AS live_from_block,
            to_char(live_from_time AT TIME ZONE 'UTC', ${iso}) AS live_from, live_to_block::text AS live_to_block, to_char(live_to_time AT TIME ZONE 'UTC', ${iso}) AS live_to
     FROM nav_phases WHERE chain_id=$1 AND feed_address=$2 ORDER BY phase_id, observed_block DESC`,
    [CHAIN_ID, feed.feed_address]
  )).rows;
  const stats2 = detail.stats ?? {};
  const quality = {
    official_rounds: span.n,
    first_official_round_at: span.first,
    last_official_round_at: span.last,
    missing_round_ids: (stats2.missing_round_ids ?? []).slice(0, 50),
    missing_round_ids_count: (stats2.missing_round_ids ?? []).length,
    max_in_session_gap_s: stats2.max_in_session_gap_s ?? null,
    p99_in_session_gap_s: stats2.p99_in_session_gap_s ?? null,
    overlap_rounds_excluded: stats2.overlap_rounds_excluded ?? null,
    decimals_conflict_phases: stats2.decimals_conflict_phases ?? [],
    phases,
    coverage_note: "History starts at the feed's first official round. Rounds an aggregator published outside the window in which the proxy served it, or from an aggregator whose decimals differ from the proxy's, are not official: they are excluded from daily closes and shown only with interval=round&include=all.",
    verification: { verdict: rev.verdict, review_id: rev.review_id, checked_at: rev.checked_at, sampled: rev.sampled, mismatches: rev.mismatches }
  };
  const meta = {
    token: feed.token_address,
    symbol: feed.symbol,
    feed: feed.feed_address,
    feed_description: feed.description,
    decimals: feed.decimals,
    interval,
    include,
    from,
    to,
    semantics: "Chainlink total-return NAV per token: it already includes dividends and splits, so do not apply the multiplier again. A last published value outside market hours is a reference, not a live equity price.",
    source: "Derived from public onchain Chainlink data on Base (feed listed by Coinbase /v1/tokenized-stocks/nav-feeds, cross-checked onchain); every point carries its round id so it can be re-read with getRoundData."
  };
  if (interval === "round") {
    const page = rows.slice(0, limit);
    const last = page[page.length - 1];
    meta.next_cursor = rows.length > limit && last ? `${last.updated_unix}-${last.round_id}` : null;
    meta.order = "updated_at, then round_id";
    return { status: 200, body: { data: page.map((r) => item(r, include === "all")), meta: { ...meta, count: page.length, quality } } };
  }
  const d = dailyCloses(rows, from, to, Math.floor(now.getTime() / 1e3), span.last ? Date.parse(span.last) / 1e3 : null, span.first ? Date.parse(span.first) / 1e3 : null);
  quality.missing_trading_days = d.missing_trading_days;
  quality.not_yet_indexed_days = d.not_yet_indexed_days;
  quality.not_covered_days = d.not_covered_days;
  quality.before_coverage = d.before_coverage_days.length ? { trading_days: d.before_coverage_days.length, first: d.before_coverage_days[0], last: d.before_coverage_days[d.before_coverage_days.length - 1], note: "trading days before the feed's first official round; not missing data" } : null;
  meta.calendar_version = CALENDAR_VERSION;
  meta.daily_rule = "last official round inside each New York trading day's regular session (09:30 to 16:00, or 13:00 on early closes); weekends and NYSE holidays excluded; a day with no official in-session round is listed in quality.missing_trading_days; provisional=true while that session has not closed yet; limit and cursor do not apply";
  return { status: 200, body: { data: d.closes.map((c) => ({ session_day: c.session_day, session_close: c.session_close, provisional: c.provisional, ...item(c.row, false) })), meta: { ...meta, count: d.closes.length, quality } } };
}

// src/lib/retry.ts
async function retryOnce(fn, pauseMs = 250) {
  try {
    return await fn();
  } catch {
    await new Promise((r) => setTimeout(r, pauseMs + Math.floor(Math.random() * pauseMs)));
    return fn();
  }
}
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

// src/lib/marketSession.ts
var isoS = (s) => s === null ? null : new Date(s * 1e3).toISOString();
var dayShift = (date, n) => new Date(Date.parse(date + "T12:00:00Z") + n * 864e5).toISOString().slice(0, 10);
function lastSessionClose(nowSec) {
  const today = nyParts(nowSec).date;
  for (let i = 0; i <= 10; i++) {
    const d = dayShift(today, -i);
    const td = isTradingDay(d);
    if (td === null) return null;
    if (td && sessionClose(d) <= nowSec) return sessionClose(d);
  }
  return null;
}
function nextSession(nowSec) {
  const today = nyParts(nowSec).date;
  for (let i = 0; i <= 10; i++) {
    const d = dayShift(today, i);
    const td = isTradingDay(d);
    if (td === null) return null;
    if (td && sessionOpen(d) > nowSec) return { open: sessionOpen(d), close: sessionClose(d) };
  }
  return null;
}
function marketNow(nowSec) {
  const p = nyParts(nowSec);
  const td = isTradingDay(p.date);
  const early = EARLY_CLOSES.has(p.date);
  const hhmm = `${String(Math.floor(p.minutes / 60)).padStart(2, "0")}:${String(p.minutes % 60).padStart(2, "0")}`;
  const base = { ny_date: p.date, ny_time: hhmm, is_trading_day: td, early_close: early, calendar_version: CALENDAR_VERSION, calendar_coverage: { from: COVERAGE.from, to: COVERAGE.to } };
  if (td === null) return { ...base, session: "calendar_not_covered", next_open: null, next_close: null, last_close: null, note: "date outside the maintained NYSE calendar" };
  let session;
  if (!td) session = p.weekday === "Sat" || p.weekday === "Sun" ? "weekend" : "holiday";
  else if (nowSec >= sessionOpen(p.date) && nowSec < sessionClose(p.date)) session = "open";
  else if (nowSec >= nyTime(p.date, 4, 0) && nowSec < sessionOpen(p.date)) session = "pre";
  else if (nowSec >= sessionClose(p.date) && nowSec < (early ? nyTime(p.date, 17, 0) : nyTime(p.date, 20, 0))) session = "after";
  else session = "closed";
  const nxt = nextSession(nowSec);
  const lc = lastSessionClose(nowSec);
  const nextClose = session === "open" ? sessionClose(p.date) : nxt?.close ?? null;
  return {
    ...base,
    session,
    next_open: isoS(nxt?.open ?? null),
    next_close: isoS(nextClose),
    last_close: isoS(lc),
    note: !nxt || lc === null ? "a neighbouring date is outside the maintained NYSE calendar (" + COVERAGE.from + " to " + COVERAGE.to + "); null means unknown, not none" : null
  };
}
var STALENESS_METHOD = "v2: count only regular-session (trading) seconds between the last round and now, across days. threshold = max(2 \xD7 the feed's p99 in-session gap between official rounds, 30 min). fresh (market open) / expected_closed (market closed) while that trading time is within the threshold; unexpectedly_stale once it exceeds it, open or closed. A NAV stuck through whole sessions accumulates trading time and is flagged.";
function tradingSecondsBetween(fromSec, toSec) {
  if (toSec <= fromSec) return 0;
  let total = 0;
  const first = nyParts(fromSec).date;
  const last = nyParts(toSec).date;
  for (let d = first, i = 0; d <= last && i < 400; d = dayShift(d, 1), i++) {
    const td = isTradingDay(d);
    if (td === null) return null;
    if (!td) continue;
    const a = Math.max(fromSec, sessionOpen(d));
    const b = Math.min(toSec, sessionClose(d));
    if (b > a) total += b - a;
  }
  return total;
}
function classifyStaleness(nowSec, updatedSec, p99GapS) {
  const m = marketNow(nowSec);
  if (m.session === "calendar_not_covered") return { state: "calendar_not_covered", threshold_s: null, trading_seconds_since_round: null };
  if (p99GapS === null || p99GapS <= 0) return { state: "unknown", threshold_s: null, trading_seconds_since_round: null };
  const threshold = Math.max(2 * p99GapS, 1800);
  const elapsed = tradingSecondsBetween(updatedSec, nowSec);
  if (elapsed === null) return { state: "calendar_not_covered", threshold_s: threshold, trading_seconds_since_round: null };
  if (elapsed > threshold) return { state: "unexpectedly_stale", threshold_s: threshold, trading_seconds_since_round: elapsed };
  return { state: m.session === "open" ? "fresh" : "expected_closed", threshold_s: threshold, trading_seconds_since_round: elapsed };
}

// node_modules/viem/_esm/index.js
init_exports();
init_decodeFunctionResult();
init_encodeFunctionData();

// src/api/dex.ts
var DEX_RPC_URL = process.env.MARKET_RPC_URL || "https://mainnet.base.org";
var MULTICALL3 = "0xcA11bde05977b3631167028862bE2a173976CA11";
var STATE_VIEW = "0xA3c0c9b65baD0b08107Aa264b0f3dB444b867A71";
var UNI_V3_FACTORY = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD";
var WETH = "0x4200000000000000000000000000000000000006";
var USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
var ETH_USD_POOL = "0xd0b53D9277642d899DF5C87A3966A349A798F224";
var MIN_DEPTH_USD = 100;
var THIN_DEPTH_USD = 1e3;
var MAX_FEE_PPM = 1e4;
var AGREE_PCT = 2;
var BAND_PCT = 20;
var MAX_DECIMALS = 36;
var CACHE_MS = 8e3;
var SQRT_102_MINUS_1 = Math.sqrt(1.02) - 1;
var Q96 = 2n ** 96n;
var ABI = parseAbi([
  "function aggregate3((address target, bool allowFailure, bytes callData)[] calls) payable returns ((bool success, bytes returnData)[])",
  "function slot0() view returns (uint160, int24, uint16, uint16, uint16, uint8, bool)",
  "function liquidity() view returns (uint128)",
  "function getReserves() view returns (uint256, uint256, uint256)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function getSlot0(bytes32) view returns (uint160, int24, uint24, uint24)",
  "function getLiquidity(bytes32) view returns (uint128)",
  "function getPool(address,address,uint24) view returns (address)",
  "function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)"
]);
var firstWord = (hex) => BigInt("0x" + hex.slice(2, 66));
var publicRpc = (method, params) => retryOnce(() => rpcOnce(method, params));
var rpcOnce = async (method, params) => {
  const r = await fetch(DEX_RPC_URL, { method: "POST", signal: AbortSignal.timeout(6e3), headers: { "content-type": "application/json", "user-agent": "Keldrin-API/0.6" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
  const j = await r.json();
  if (j.error || j.result === void 0) throw new Error("rpc_unavailable");
  return j.result;
};
async function multicall(rpc, calls, block) {
  const data = encodeFunctionData({ abi: ABI, functionName: "aggregate3", args: [calls.map((c) => ({ target: c.target, allowFailure: true, callData: encodeFunctionData({ abi: ABI, functionName: c.fn, args: c.args ?? [] }) }))] });
  const raw = await rpc("eth_call", [{ to: MULTICALL3, data }, "0x" + block.toString(16)]);
  const res = decodeFunctionResult({ abi: ABI, functionName: "aggregate3", data: raw });
  return res.map((r) => r.success && r.returnData !== "0x" ? r.returnData : null);
}
function priceFromSqrt(sqrtP, stockIsToken0, decStock, decQuote) {
  const S = 10n ** 18n;
  const sq = sqrtP * sqrtP;
  const shift = decStock - decQuote;
  const up = shift >= 0 ? 10n ** BigInt(shift) : 1n;
  const down = shift < 0 ? 10n ** BigInt(-shift) : 1n;
  const v = stockIsToken0 ? sq * S * up / (2n ** 192n * down) : 2n ** 192n * S * up / (sq * down);
  return fmt18(v);
}
function fmt18(v) {
  const s = v.toString().padStart(19, "0");
  const f = s.slice(-18).replace(/0+$/, "");
  return s.slice(0, -18) + (f ? "." + f : "");
}
function depth2pctConcentrated(L, sqrtP, stockIsToken0, decQuote) {
  if (L === 0n || sqrtP === 0n) return 0;
  const raw = stockIsToken0 ? Number(L) * Number(sqrtP) * SQRT_102_MINUS_1 / Number(Q96) : Number(L) * Number(Q96) * SQRT_102_MINUS_1 / Number(sqrtP);
  return raw / 10 ** decQuote;
}
function selectMain(out) {
  for (const x of out) if (x.status === "ok" && (x.depth_2pct_usd ?? 0) < MIN_DEPTH_USD) x.status = "too_thin";
  const eligible = out.filter((x) => x.status === "ok");
  const capped = eligible.filter((x) => x.depth_capped_by_balance);
  const refPrices = (capped.length ? capped : eligible).map((x) => Number(x.price_usd)).sort((a, b) => a - b);
  const median = refPrices.length ? refPrices[Math.floor(refPrices.length / 2)] : null;
  for (const x of eligible) if (median !== null && Math.abs(Number(x.price_usd) / median - 1) * 100 > BAND_PCT) x.status = "outlier";
  const ok2 = out.filter((x) => x.status === "ok");
  const corroborated = (x) => ok2.some((y) => y !== x && Math.abs(Number(y.price_usd) / Number(x.price_usd) - 1) * 100 <= AGREE_PCT);
  const candidates = ok2.filter((x) => x.depth_capped_by_balance || corroborated(x)).sort((a, b) => (b.depth_2pct_usd ?? 0) - (a.depth_2pct_usd ?? 0));
  const m = candidates[0];
  if (!m) return { main: null, reason: ok2.length ? "uncorroborated_uncapped_pools_only" : "no_pool_with_usable_depth" };
  return { main: { ...m, corroborated: corroborated(m), single_pool: ok2.length === 1 } };
}
var cache = /* @__PURE__ */ new Map();
async function liveDex(db2, contract, rpc = publicRpc) {
  const key = contract.toLowerCase();
  const useCache = rpc === publicRpc;
  const hit = useCache ? cache.get(key) : void 0;
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;
  const value = await liveDexUncached(db2, contract, rpc);
  const d = value.body?.data;
  if (useCache && value.status === 200 && d?.block) {
    if (cache.size > 500) cache.clear();
    cache.set(key, { at: Date.now(), value });
  }
  return value;
}
async function liveDexUncached(db2, contract, rpc) {
  const prep = await prepareDex(db2, contract);
  if ("done" in prep) return prep.done;
  let block;
  let raw;
  try {
    block = BigInt(await rpc("eth_blockNumber", []));
    raw = await multicall(rpc, prep.calls, block);
  } catch {
    return { status: 200, body: { data: { ...prep.base, main: null, pools: [], unavailable_reason: "rpc_unavailable" } } };
  }
  return finishDex(prep, raw, block);
}
async function prepareDex(db2, contract) {
  const asset = (await db2.query("SELECT contract_address, symbol FROM assets WHERE lower(contract_address)=lower($1)", [contract])).rows[0];
  if (!asset) return { done: { status: 404, body: { error: { code: "UNKNOWN_ASSET", message: `no tracked asset ${contract}`, hint: "GET /v1/assets lists tracked tokens" } } } };
  const rev = (await db2.query(
    "SELECT verdict, detail, checked_at::text AS checked_at FROM dex_reviews WHERE chain_id=$1 AND lower(token_address)=lower($2) ORDER BY checked_at DESC LIMIT 1",
    [CHAIN_ID, contract]
  )).rows[0];
  const detail = typeof rev?.detail === "string" ? JSON.parse(rev.detail) : rev?.detail;
  const base = { token: asset.contract_address, symbol: asset.symbol };
  if (!rev || rev.verdict !== "CONFIRMED" || !Array.isArray(detail?.covered) || detail.covered.length === 0) return { done: { status: 200, body: { data: { ...base, main: null, pools: [], unavailable_reason: rev ? "pools_not_verified" : "no_verified_pools" } } } };
  const covered2 = new Set(detail.covered.map((x) => x.toLowerCase()));
  const pools = (await db2.query(
    "SELECT venue, pool_ref, currency0, currency1, quote, fee, stable FROM dex_pools WHERE chain_id=$1 AND lower(token_address)=lower($2) ORDER BY venue, pool_ref",
    [CHAIN_ID, contract]
  )).rows.filter((p) => covered2.has(`${p.venue}:${p.pool_ref}`.toLowerCase()));
  const calls = [
    { target: asset.contract_address, fn: "decimals" },
    { target: UNI_V3_FACTORY, fn: "getPool", args: [WETH, USDC, 500] },
    { target: ETH_USD_POOL, fn: "slot0", raw: true }
  ];
  const idx = [];
  for (const p of pools) {
    idx.push(calls.length);
    const bal = { target: asset.contract_address, fn: "balanceOf", args: [p.pool_ref] };
    if (p.venue === "uniswap_v4") calls.push({ target: STATE_VIEW, fn: "getSlot0", args: [p.pool_ref] }, { target: STATE_VIEW, fn: "getLiquidity", args: [p.pool_ref] });
    else if (p.venue === "aerodrome_v2") calls.push({ target: p.pool_ref, fn: "getReserves" }, bal);
    else calls.push({ target: p.pool_ref, fn: "slot0", raw: true }, { target: p.pool_ref, fn: "liquidity" }, bal);
  }
  return { asset, base, pools, calls, idx, checkedAt: rev.checked_at };
}
function finishDex(prep, raw, block) {
  const { asset, base, pools, idx } = prep;
  const rev = { checked_at: prep.checkedAt };
  const decRaw = raw[0] ? firstWord(raw[0]) : null;
  if (decRaw === null) return { status: 200, body: { data: { ...base, main: null, pools: [], unavailable_reason: "rpc_unavailable" } } };
  if (decRaw > BigInt(MAX_DECIMALS)) return { status: 200, body: { data: { ...base, main: null, pools: [], unavailable_reason: "token_decimals_out_of_range" } } };
  const dec = Number(decRaw);
  const refOk = raw[1] !== null && "0x" + raw[1].slice(-40).toLowerCase() === ETH_USD_POOL.toLowerCase() && raw[2] !== null;
  const ethUsd = refOk ? priceFromSqrt(firstWord(raw[2]), true, 18, 6) : null;
  const out = pools.map((p, i) => {
    const stockIsToken0 = p.currency0.toLowerCase() === asset.contract_address.toLowerCase();
    const decQuote = p.quote === "USDC" ? 6 : 18;
    const usdPer = p.quote === "USDC" ? 1 : ethUsd === null ? null : Number(ethUsd);
    const q = { venue: p.venue, pool: p.pool_ref, quote: p.quote, fee: p.fee, price_quote: null, price_usd: null, depth_2pct_usd: null, depth_capped_by_balance: false, status: "unreadable" };
    if (p.fee !== null && p.fee > MAX_FEE_PPM) return { ...q, status: "high_fee", note: `fee ${(p.fee / 1e4).toFixed(2)}% is above 1%: not a market price` };
    const a = raw[idx[i]];
    const b = raw[idx[i] + 1];
    if (a === null || b === null) return q;
    if (usdPer === null) return { ...q, status: "no_eth_usd", note: "ETH/USD reference pool unreadable at this block" };
    let stockBal = null;
    if (p.venue === "aerodrome_v2") {
      if (p.stable) return { ...q, status: "unsupported", note: "stable-curve pool: price is not x*y" };
      const r0 = firstWord(a);
      const r1 = BigInt("0x" + a.slice(66, 130));
      const [rs, rq] = stockIsToken0 ? [r0, r1] : [r1, r0];
      if (rs === 0n || rq === 0n) return { ...q, status: "too_thin" };
      const v = rq * 10n ** 18n * 10n ** BigInt(dec) / (rs * 10n ** BigInt(decQuote));
      q.price_quote = fmt18(v);
      q.depth_2pct_usd = Number(rq) / 10 ** decQuote * SQRT_102_MINUS_1 * usdPer;
      stockBal = firstWord(b);
    } else {
      const sqrtP = firstWord(a);
      const L = firstWord(b);
      if (sqrtP === 0n) return { ...q, status: "too_thin" };
      q.price_quote = priceFromSqrt(sqrtP, stockIsToken0, dec, decQuote);
      q.depth_2pct_usd = depth2pctConcentrated(L, sqrtP, stockIsToken0, decQuote) * usdPer;
      const c = raw[idx[i] + 2];
      if (p.venue !== "uniswap_v4" && c !== null && c !== void 0) stockBal = firstWord(c);
    }
    q.price_usd = (Number(q.price_quote) * usdPer).toFixed(8);
    if (stockBal !== null) {
      const heldUsd = Number(stockBal) / 10 ** dec * Number(q.price_usd);
      if (heldUsd < (q.depth_2pct_usd ?? 0)) q.depth_2pct_usd = heldUsd;
      q.depth_capped_by_balance = true;
    }
    q.status = "ok";
    return q;
  });
  const { main, reason } = selectMain(out);
  out.sort((x, y) => (y.depth_2pct_usd ?? -1) - (x.depth_2pct_usd ?? -1));
  return {
    status: 200,
    body: {
      data: {
        ...base,
        block: block.toString(),
        main: main ? { ...main, thin_market: (main.depth_2pct_usd ?? 0) < THIN_DEPTH_USD } : null,
        ...main ? {} : { unavailable_reason: reason },
        eth_usd: ethUsd,
        pools: out.slice(0, 10),
        pools_total: out.length,
        method: `Read onchain at block ${block} (Base public RPC). Price per token from slot0/getReserves; depth_2pct_usd = estimated quote needed to move the price up 2% (assumes constant active liquidity over the move), capped by the pool's real stock balance where readable (not Uniswap v4, whose pools share one balance). Pools above 1% fee are excluded. Main market = deepest pool with depth >= $${MIN_DEPTH_USD}, within \xB1${BAND_PCT}% of the median of balance-capped pools, and, if its depth is uncapped, corroborated by another pool within \xB1${AGREE_PCT}%. Pools come from canonical factories and plain (no-hook) Uniswap v4 pools, independently re-derived (review ${rev.checked_at}).`
      }
    }
  };
}
async function batchRead(db2, tokens, feeds, rpc = publicRpc) {
  const preps = await Promise.all(tokens.map((c) => prepareDex(db2, c)));
  const calls = [];
  const offsets = [];
  for (const pr of preps) {
    offsets.push(calls.length);
    if (!("done" in pr)) calls.push(...pr.calls);
  }
  const navAt = calls.length;
  for (const f of feeds) calls.push({ target: f, fn: "latestRoundData" });
  const block = BigInt(await rpc("eth_blockNumber", []));
  const raw = await multicall(rpc, calls, block);
  const dex = /* @__PURE__ */ new Map();
  preps.forEach((pr, i) => {
    const key = tokens[i].toLowerCase();
    if ("done" in pr) dex.set(key, pr.done);
    else dex.set(key, finishDex(pr, raw.slice(offsets[i], offsets[i] + pr.calls.length), block));
  });
  const rounds = /* @__PURE__ */ new Map();
  const readAt = (/* @__PURE__ */ new Date()).toISOString();
  feeds.forEach((f, i) => {
    const r = raw[navAt + i];
    if (!r || r.length < 2 + 64 * 5) return;
    const w = (n) => BigInt("0x" + r.slice(2 + n * 64, 2 + (n + 1) * 64));
    const a = w(1);
    rounds.set(f.toLowerCase(), { round_id: w(0).toString(), answer_raw: (a >= 1n << 255n ? a - (1n << 256n) : a).toString(), updated_unix: Number(w(3)), read_at: readAt });
  });
  return { block, dex, rounds };
}

// src/api/marketContext.ts
var PUBLIC_RPC_URL = process.env.MARKET_RPC_URL || "https://mainnet.base.org";
var cache2 = /* @__PURE__ */ new Map();
var CACHE_MS2 = 3e4;
var word = (hex, i) => BigInt("0x" + hex.slice(2 + i * 64, 2 + (i + 1) * 64));
var liveLatestRound = async (feed) => {
  const hit = cache2.get(feed);
  if (hit && Date.now() - hit.at < CACHE_MS2) return hit.value;
  const result = await retryOnce(async () => {
    const r = await fetch(PUBLIC_RPC_URL, {
      method: "POST",
      signal: AbortSignal.timeout(5e3),
      headers: { "content-type": "application/json", "user-agent": "Keldrin-API/0.4" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to: feed, data: "0xfeaf968c" }, "latest"] })
    });
    const j2 = await r.json();
    if (!j2.result || j2.result.length < 2 + 64 * 5) throw new Error("rpc_unavailable");
    return j2.result;
  });
  const j = { result };
  const a = word(j.result, 1);
  const value = { round_id: word(j.result, 0).toString(), answer_raw: (a >= 1n << 255n ? a - (1n << 256n) : a).toString(), updated_unix: Number(word(j.result, 3)), read_at: (/* @__PURE__ */ new Date()).toISOString() };
  cache2.set(feed, { at: Date.now(), value });
  return value;
};
async function marketContext(db2, contract, now = /* @__PURE__ */ new Date(), readRound = liveLatestRound, readDex = liveDex) {
  const asset = (await db2.query("SELECT contract_address, symbol FROM assets WHERE lower(contract_address)=lower($1)", [contract])).rows[0];
  if (!asset) return { status: 404, body: { error: { code: "UNKNOWN_ASSET", message: `no tracked asset ${contract}`, hint: "GET /v1/assets lists tracked tokens" } } };
  const nowSec = Math.floor(now.getTime() / 1e3);
  const market = marketNow(nowSec);
  const feed = (await db2.query("SELECT feed_address, decimals FROM nav_feeds WHERE chain_id=$1 AND lower(token_address)=lower($2) ORDER BY discovered_at DESC LIMIT 1", [CHAIN_ID, contract])).rows[0];
  let dex = { price_usd: null, nav_premium_pct: null, unavailable_reason: "no_verified_pools" };
  try {
    const d = (await readDex(db2, contract)).body;
    const mn = d?.data?.main;
    dex = mn && mn.price_usd ? { price_usd: mn.price_usd, venue: mn.venue, pool: mn.pool, quote: mn.quote, depth_2pct_usd: mn.depth_2pct_usd, thin_market: mn.thin_market ?? null, block: d.data.block, nav_premium_pct: null } : { price_usd: null, nav_premium_pct: null, unavailable_reason: d?.data?.unavailable_reason ?? "no_verified_pools" };
  } catch {
    dex = { price_usd: null, nav_premium_pct: null, unavailable_reason: "rpc_unavailable" };
  }
  const base = { token: asset.contract_address, symbol: asset.symbol, market, dex };
  if (!feed) return { status: 200, body: { data: { ...base, feed: null, nav: null, nav_unavailable_reason: "no_nav_feed", staleness: { state: "unknown", threshold_s: null } } } };
  const rev = (await db2.query(
    "SELECT verdict, detail FROM nav_reviews WHERE chain_id=$1 AND feed_address=$2 ORDER BY checked_at DESC LIMIT 1",
    [CHAIN_ID, feed.feed_address]
  )).rows[0];
  const detail = typeof rev?.detail === "string" ? JSON.parse(rev.detail) : rev?.detail;
  if (!rev || rev.verdict !== "CONFIRMED") return { status: 200, body: { data: { ...base, feed: feed.feed_address, nav: null, nav_unavailable_reason: "feed_not_verified", staleness: { state: "unknown", threshold_s: null } } } };
  const p99 = detail?.stats?.p99_in_session_gap_s ?? null;
  let round;
  try {
    round = await readRound(feed.feed_address);
  } catch (e2) {
    const reason = e2.message === "rpc_result_invalid" ? "rpc_result_invalid" : "rpc_unavailable";
    return { status: 200, body: { data: { ...base, feed: feed.feed_address, nav: null, nav_unavailable_reason: reason, staleness: { state: "unknown", threshold_s: null } } } };
  }
  if (BigInt(round.answer_raw) <= 0n || round.updated_unix <= 0 || round.updated_unix > nowSec + 60) {
    cache2.delete(feed.feed_address);
    return { status: 200, body: { data: { ...base, feed: feed.feed_address, nav: null, nav_unavailable_reason: "rpc_result_invalid", staleness: { state: "unknown", threshold_s: null } } } };
  }
  const id = BigInt(round.round_id);
  const livePhase = Number(id >> 64n);
  const reviewed = Array.isArray(detail?.covered) && detail.covered.some((c) => Number(c.phase) === livePhase);
  const ph = (await db2.query(
    "SELECT (aggregator_decimals IS NOT NULL AND aggregator_decimals = proxy_decimals) AS ok FROM nav_phases WHERE chain_id=$1 AND feed_address=$2 AND phase_id=$3 ORDER BY observed_block DESC LIMIT 1",
    [CHAIN_ID, feed.feed_address, livePhase]
  )).rows[0];
  if (!reviewed || !ph?.ok) return { status: 200, body: { data: { ...base, feed: feed.feed_address, nav: null, nav_unavailable_reason: !reviewed ? "phase_not_reviewed" : "aggregator_decimals_differ_from_proxy", staleness: { state: "unknown", threshold_s: null } } } };
  const st = classifyStaleness(nowSec, round.updated_unix, p99);
  if (dex.price_usd && (st.state === "unexpectedly_stale" || st.state === "unknown")) {
    dex.nav_premium_pct = null;
    dex.premium_unavailable_reason = `nav_${st.state}`;
  } else if (dex.price_usd) {
    const navNum = Number(formatNav(round.answer_raw, feed.decimals));
    dex.nav_premium_pct = Number(((Number(dex.price_usd) / navNum - 1) * 100).toFixed(4));
    const when = `DEX at block ${dex.block} vs the NAV round updated ${new Date(round.updated_unix * 1e3).toISOString()}.`;
    dex.premium_note = (market.session === "open" ? "DEX price vs the last published NAV during the regular session. " : "Market closed: the NAV is held at its last value while the DEX keeps trading, so the gap reflects the closure, not necessarily mispricing. ") + when;
  }
  return {
    status: 200,
    body: {
      data: {
        ...base,
        feed: feed.feed_address,
        nav: {
          round_id: round.round_id,
          phase_id: Number(id >> 64n),
          answer_raw: round.answer_raw,
          decimals: feed.decimals,
          nav: formatNav(round.answer_raw, feed.decimals),
          updated_at: new Date(round.updated_unix * 1e3).toISOString(),
          age_s: Math.max(0, nowSec - round.updated_unix),
          read_at: round.read_at,
          source: "latestRoundData() on the Chainlink proxy, read live from Base's public RPC (reused for up to 30 s inside the server; responses are not CDN-cached)",
          label: "Last published total-return reference per token, not a live equity price. It already includes dividends and splits."
        },
        staleness: { state: st.state, threshold_s: st.threshold_s, trading_seconds_since_round: st.trading_seconds_since_round, p99_in_session_gap_s: p99, method: STALENESS_METHOD }
      }
    }
  };
}

// src/api/assetActions.ts
async function assetCorporateActions(db2, contract) {
  const asset = (await db2.query("SELECT contract_address, symbol, multiplier_wad::text AS multiplier_wad FROM assets WHERE lower(contract_address)=lower($1)", [contract])).rows[0];
  if (!asset) return { status: 404, body: { error: { code: "UNKNOWN_ASSET", message: `no tracked asset ${contract}`, hint: "GET /v1/assets lists tracked tokens" } } };
  const events = await listEvents(db2, { contract });
  const ids = [...new Set(events.map((e2) => e2.record_id).filter((x) => !!x))];
  const recs = /* @__PURE__ */ new Map();
  for (const id of ids) {
    const r = (await db2.query("SELECT payload, review_id FROM confirmed_records WHERE record_id=$1", [id])).rows[0];
    if (r) recs.set(id, { payload: typeof r.payload === "string" ? JSON.parse(r.payload) : r.payload, review_id: r.review_id });
  }
  const data = events.map((e2) => {
    const rec = e2.record_id ? recs.get(e2.record_id) : void 0;
    const p = rec?.payload;
    const evBlock = p?.action?.scheduling_block ?? p?.action?.effective?.block;
    const ui = p?.multiplier_events?.find((m) => m.event === "UIMultiplierUpdated" && String(m.block) === String(evBlock) && m.args?.newMultiplier === p?.action?.multiplier_after_wad);
    const uuid = e2.issuer_corporate_action_uuid;
    return {
      ...e2,
      effective_block: p?.action?.effective?.block ?? null,
      effective_at: p?.action?.effective?.time ?? null,
      effective_at_scheduled: p?.action?.effective_at_scheduled ?? null,
      ui_multiplier_before_wad: ui?.args?.oldMultiplier ?? null,
      ui_multiplier_after_wad: ui?.args?.newMultiplier ?? null,
      ui_multiplier_effective_at: ui?.args?.effectiveAtTimestamp ? new Date(Number(ui.args.effectiveAtTimestamp) * 1e3).toISOString() : null,
      ...p && !ui ? { ui_multiplier_unavailable_reason: p.flags?.includes("legacy_event_only") ? "legacy_event_only" : "no_matching_ui_multiplier_event" } : {},
      issuer_context: p ? { operator_description: p.action?.operator_description ?? null, operator_description_source: "operator-supplied text in the onchain announcement; not verified", announced_at: p.issuer_record?.announced_at ?? null, announced_at_source: "Coinbase issuer record (api.coinbase.com corporate action)" } : null,
      announcements: (p?.announcements ?? []).map((a) => ({ id: a.id, block: a.block, tx_hash: a.tx_hash, uri: a.uri })),
      evidence: {
        onchain_tx: e2.onchain_tx,
        issuer_record_url: uuid ? `https://api.coinbase.com/v1/tokenized-stocks/corporate-actions/${uuid}` : null,
        sec_filing_url: e2.sec_filing_url,
        keldrin_record: e2.record_id ? `/v1/actions/${encodeURIComponent(e2.record_id)}` : null
      },
      verification: rec ? { state: "confirmed", review_id: rec.review_id } : { state: "confirmed_calendar_entry", basis: e2.sec_filing_url ? "SEC declaration" : "issuer announcement onchain", note: "from an independently CONFIRMED calendar entry; no applied onchain record yet" }
    };
  });
  return {
    status: 200,
    body: {
      data,
      meta: {
        token: asset.contract_address,
        symbol: asset.symbol,
        current_multiplier_wad: asset.multiplier_wad,
        count: data.length,
        accounting_note: "The token's balance never changes for a dividend or split: the multiplier (WAD, 1e18) does. Shares per token = multiplier / 1e18. The Chainlink NAV is already total-return (it includes the multiplier): never apply the multiplier to the NAV again."
      }
    }
  };
}

// src/version.ts
var PACKAGE_VERSION = "0.7.0";

// src/api/trial.ts
import { createHash } from "node:crypto";

// node_modules/pg/esm/index.mjs
var import_lib = __toESM(require_lib2(), 1);
var Client = import_lib.default.Client;
var Pool = import_lib.default.Pool;
var Connection = import_lib.default.Connection;
var types = import_lib.default.types;
var Query = import_lib.default.Query;
var DatabaseError = import_lib.default.DatabaseError;
var escapeIdentifier = import_lib.default.escapeIdentifier;
var escapeLiteral = import_lib.default.escapeLiteral;
var Result = import_lib.default.Result;
var TypeOverrides = import_lib.default.TypeOverrides;
var defaults = import_lib.default.defaults;
var esm_default = import_lib.default;

// src/db/pg.ts
function tls() {
  return process.env.PGSSL_NO_VERIFY === "1" ? { rejectUnauthorized: false } : { rejectUnauthorized: true, ...process.env.DATABASE_CA_CERT ? { ca: process.env.DATABASE_CA_CERT } : {} };
}
var TRIAL_CONSUME_SQL = "SELECT trial_consume($1, $2::date) AS n";
var FEEDBACK_SQL = "SELECT feedback_submit($1, $2, $3, $4) AS result";
var WRITE_ALLOWED = /* @__PURE__ */ new Set([TRIAL_CONSUME_SQL, FEEDBACK_SQL]);
function openPg(connectionString) {
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  const ssl = tls();
  const pool = new esm_default.Pool({ connectionString, ssl, max: 3, idleTimeoutMillis: 1e4, connectionTimeoutMillis: 8e3, statement_timeout: 8e3 });
  pool.on("connect", (c) => {
    void c.query("SET search_path TO keldrin, public; SET default_transaction_read_only = on");
  });
  return {
    async query(sql, params = []) {
      const r = await pool.query(sql, params);
      return { rows: r.rows };
    },
    async exec() {
      throw new Error("read-only connection: exec is not allowed");
    },
    async writeOne(sql, params = []) {
      if (!WRITE_ALLOWED.has(sql)) throw new Error("writeOne only runs the free-try counter and the feedback insert");
      const c = await pool.connect();
      try {
        await c.query("BEGIN READ WRITE");
        const r = await c.query(sql, params);
        await c.query("COMMIT");
        return { rows: r.rows };
      } catch (e2) {
        await c.query("ROLLBACK").catch(() => {
        });
        throw e2;
      } finally {
        c.release();
      }
    },
    async close() {
      await pool.end();
    }
  };
}

// src/api/trial.ts
var FREE_TRIES_PER_DAY = 3;
var PAID = {
  price: "0.05 USDC on Base",
  protocol: "x402",
  snapshot: "https://x402.bankr.bot/0xb98f0de777eea8c481b64e33d3e0066cea38fa91/keldrin-snapshot",
  report: "https://x402.bankr.bot/0xb98f0de777eea8c481b64e33d3e0066cea38fa91/keldrin-report"
};
var ADDR = /^0x[0-9a-fA-F]{40}$/;
var TRANSIENT = /* @__PURE__ */ new Set(["rpc_unavailable", "rpc_result_invalid"]);
var UNVERIFIED = /* @__PURE__ */ new Set(["feed_not_verified", "phase_not_reviewed", "aggregator_decimals_differ_from_proxy"]);
var err = (status, code, message, hint) => ({ status, body: { error: { code, message, ...hint ? { hint } : {} } } });
var incomplete = (why) => err(503, "INCOMPLETE", `could not build a complete answer right now (${why}); this did not use a free try`, "retry in a minute");
var dayOf = (now) => now.toISOString().slice(0, 10);
function salt() {
  if (process.env.TRIAL_SALT) return process.env.TRIAL_SALT;
  if (process.env.DATABASE_URL) return createHash("sha256").update("keldrin-trial-salt|" + process.env.DATABASE_URL).digest("hex");
  if (process.env.VERCEL) throw new Error("no secret salt configured");
  return "keldrin-local-test-only";
}
function clientHash(client) {
  return createHash("sha256").update(salt() + "|" + client).digest("hex").slice(0, 32);
}
async function triesLeft(db2, client, now = /* @__PURE__ */ new Date()) {
  try {
    const r = await db2.query("SELECT trial_used($1, $2::date) AS n", [clientHash(client), dayOf(now)]);
    return Math.max(0, FREE_TRIES_PER_DAY - Number(r.rows[0]?.n ?? 0));
  } catch (e2) {
    console.warn("free-try counter unavailable (failing closed):", e2.message);
    return -1;
  }
}
async function useTry(db2, client, now = /* @__PURE__ */ new Date()) {
  try {
    const args = [clientHash(client), dayOf(now)];
    const r = db2.writeOne ? await db2.writeOne(TRIAL_CONSUME_SQL, args) : await db2.query(TRIAL_CONSUME_SQL, args);
    const n = Number(r.rows[0]?.n ?? FREE_TRIES_PER_DAY + 1);
    return Math.max(0, FREE_TRIES_PER_DAY - n);
  } catch (e2) {
    console.warn("free-try counter write failed:", e2.message);
    return 0;
  }
}
var trialUnavailable = () => ({
  status: 503,
  body: { error: { code: "FREE_TRIES_UNAVAILABLE", message: "free tries can't be counted right now, so none are given; this did not use a try", hint: "retry in a minute, use the paid link, or use the free one-stock routes" }, pay: PAID }
});
var trialUsedUp = () => ({
  status: 402,
  body: { error: { code: "FREE_TRIES_USED", message: `the ${FREE_TRIES_PER_DAY} free tries for today are used; each further answer is ${PAID.price} via x402`, hint: "call the paid endpoint with an x402 client (e.g. Bankr); the one-stock routes under /v1/assets stay free" }, pay: PAID }
});
async function withDeadline(p, ms) {
  let t;
  try {
    return await Promise.race([p, new Promise((_, rej) => t = setTimeout(() => rej(new Error("deadline")), ms))]);
  } finally {
    clearTimeout(t);
  }
}
async function nextAction(db2, token) {
  const ca = await assetCorporateActions(db2, token);
  if (ca.status !== 200) throw new Error("corporate actions");
  const e2 = (ca.body.data ?? []).filter((x) => x.status === "predicted").sort((a, b) => String(a.expected_adjustment_date ?? "").localeCompare(String(b.expected_adjustment_date ?? "")))[0];
  return e2 ? { event_type: e2.event_type, expected_adjustment_date: e2.expected_adjustment_date ?? null, per_share: e2.per_share ?? null } : null;
}
async function snapshot(db2, now = /* @__PURE__ */ new Date(), readRound = liveLatestRound, readDex = liveDex) {
  if (process.env.NAV_HISTORY_PUBLIC !== "true") return err(503, "NAV_NOT_ENABLED", "NAV data is not enabled on this server");
  const feeds = (await db2.query("SELECT DISTINCT f.token_address FROM nav_feeds f JOIN assets a ON lower(a.contract_address)=lower(f.token_address) WHERE f.chain_id=$1", [CHAIN_ID])).rows;
  if (readRound === liveLatestRound && readDex === liveDex) {
    try {
      const feedRows = (await db2.query("SELECT DISTINCT ON (lower(token_address)) token_address, feed_address FROM nav_feeds WHERE chain_id=$1 ORDER BY lower(token_address), discovered_at DESC", [CHAIN_ID])).rows;
      const b = await withDeadline(batchRead(db2, feeds.map((f) => f.token_address), feedRows.map((f) => f.feed_address)), 8e3);
      readRound = async (feed) => {
        const r = b.rounds.get(feed.toLowerCase());
        if (!r) throw new Error("rpc_unavailable");
        return r;
      };
      readDex = async (_db, c) => b.dex.get(c.toLowerCase()) ?? { status: 200, body: { data: { main: null, pools: [], unavailable_reason: "rpc_unavailable" } } };
    } catch {
    }
  }
  try {
    const stocks = await withDeadline(mapLimit(feeds, 4, async (f) => {
      const mc = await marketContext(db2, f.token_address, now, readRound, readDex);
      if (mc.status !== 200) throw new Error("market context");
      const d = mc.body.data;
      if (TRANSIENT.has(d.nav_unavailable_reason) || TRANSIENT.has(d.dex?.unavailable_reason)) throw new Error(`live read ${d.symbol}`);
      return { symbol: d.symbol, token: d.token, nav: d.nav, nav_unavailable_reason: d.nav_unavailable_reason ?? null, staleness: d.staleness, dex: d.dex, next_corporate_action: await nextAction(db2, f.token_address) };
    }), 12e3);
    const verified = stocks.filter((s) => !UNVERIFIED.has(s.nav_unavailable_reason)).sort((a, b) => a.symbol.localeCompare(b.symbol));
    return { status: 200, body: { data: { market: marketNow(Math.floor(now.getTime() / 1e3)), count: verified.length, stocks: verified }, meta: { note: "Verified data with provenance, not advice. The NAV is Chainlink's last published total-return reference, not a live equity price." } } };
  } catch (e2) {
    return incomplete(e2.message);
  }
}
async function report(db2, token, now = /* @__PURE__ */ new Date(), readRound = liveLatestRound, readDex = liveDex) {
  const t = token.trim();
  if (!t || t.length > 64) return err(400, "TOKEN_REQUIRED", "pass ?token=<exact symbol or 0x contract address>, e.g. NVDAc");
  const rows = (await db2.query(ADDR.test(t) ? "SELECT contract_address, symbol FROM assets WHERE lower(contract_address)=lower($1)" : "SELECT contract_address, symbol FROM assets WHERE symbol=$1", [t])).rows;
  if (rows.length === 0) return err(404, "UNKNOWN_ASSET", `no tracked token ${t.slice(0, 64)}`, "GET /v1/assets lists tracked tokens");
  if (rows.length > 1) return err(409, "AMBIGUOUS_SYMBOL", `${rows.length} tokens use symbol ${t.slice(0, 40)}`, "pass the contract address");
  const a = rows[0];
  const hasFeed = (await db2.query("SELECT 1 FROM nav_feeds WHERE chain_id=$1 AND lower(token_address)=lower($2) LIMIT 1", [CHAIN_ID, a.contract_address])).rows.length > 0;
  if (hasFeed && process.env.NAV_HISTORY_PUBLIC !== "true") return err(503, "NAV_NOT_ENABLED", "NAV data is not enabled on this server");
  try {
    return await withDeadline((async () => {
      const dex = await readDex(db2, a.contract_address);
      if (dex.status !== 200) return incomplete("dex");
      const dexData = dex.body.data;
      if (TRANSIENT.has(dexData?.unavailable_reason)) return incomplete("live dex read");
      const once = async () => dex;
      const [ca, mc] = await Promise.all([assetCorporateActions(db2, a.contract_address), marketContext(db2, a.contract_address, now, readRound, once)]);
      if (ca.status !== 200 || mc.status !== 200) return incomplete("section");
      const c = mc.body.data;
      if (TRANSIENT.has(c.nav_unavailable_reason)) return incomplete("live NAV read");
      let history = null;
      if (hasFeed) {
        const nh = await navHistory(db2, a.contract_address, new URLSearchParams({ interval: "daily", from: new Date(now.getTime() - 30 * 864e5).toISOString().slice(0, 10) }), now);
        if (nh.status !== 200) return incomplete("nav history");
        history = nh.body;
      }
      return { status: 200, body: { data: { token: a.contract_address, symbol: a.symbol, corporate_actions: ca.body.data, market_context: c, nav_daily_30d: history, ...hasFeed ? {} : { nav_unavailable_reason: "no_nav_feed" }, dex_pools: dexData }, meta: { note: "Verified data with provenance, not advice." } } };
    })(), 1e4);
  } catch (e2) {
    return incomplete(e2.message);
  }
}

// src/api/mcp.ts
var PROTOCOL_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];
var tokenArg = { type: "string", description: "Token contract address (0x\u2026) or exact Coinbase symbol, e.g. NVDAc. Addresses are preferred." };
var ro = { readOnlyHint: true, idempotentHint: true, openWorldHint: false };
var TOOLS = [
  { name: "list_assets", title: "List tokenized stocks", description: "Coinbase tokenized stocks on Base that Keldrin tracks: symbol, contract address, current multiplier (WAD) and whether a verified Chainlink NAV feed exists. Optional `query` filters by symbol or name.", inputSchema: { type: "object", properties: { query: { type: "string", description: "Optional case-insensitive filter on symbol or name" }, with_nav_only: { type: "boolean", description: "Only tokens with an indexed Chainlink NAV feed" } }, additionalProperties: false }, annotations: ro },
  { name: "get_corporate_actions", title: "Corporate actions for a token", description: "Verified dividends, splits and multiplier changes for one token, applied and upcoming: multiplier before/after (WAD), effective time, SEC filing, onchain tx and evidence links. Balances never change; the multiplier does.", inputSchema: { type: "object", properties: { token: tokenArg }, required: ["token"], additionalProperties: false }, annotations: ro },
  { name: "get_nav_history", title: "Chainlink NAV history with proof", description: "Official Chainlink total-return NAV history for one token, each point with feed, phase, aggregator and round id (re-readable with getRoundData). interval=daily gives the last official in-session round per NYSE trading day; interval=round gives every official round. Missing days are listed, never filled. The NAV already includes dividends and splits.", inputSchema: { type: "object", properties: { token: tokenArg, interval: { type: "string", enum: ["daily", "round"], default: "daily" }, from: { type: "string", description: "YYYY-MM-DD" }, to: { type: "string", description: "YYYY-MM-DD" }, limit: { type: "integer", minimum: 1, maximum: 1e3, description: "round interval only" } }, required: ["token"], additionalProperties: false }, annotations: ro },
  { name: "get_market_context", title: "Market context for a token", description: "US session now (open/pre/after/closed/weekend/holiday), next open/close, the latest Chainlink NAV read live with round id and age, staleness (fresh / expected_closed / unexpectedly_stale), and the main DEX price with its gap vs NAV. The NAV is the last published reference, not a live equity price.", inputSchema: { type: "object", properties: { token: tokenArg }, required: ["token"], additionalProperties: false }, annotations: { ...ro, idempotentHint: false } },
  { name: "get_dex_price", title: "Live DEX price on Base", description: "Live DEX price of one token read onchain at one block from Keldrin's verified pools (Uniswap v3, Aerodrome, Slipstream, plain Uniswap v4 vs USDC/WETH/ETH): price per token in USD, estimated 2% depth, the main (deepest usable) pool and every pool's status.", inputSchema: { type: "object", properties: { token: tokenArg }, required: ["token"], additionalProperties: false }, annotations: { ...ro, idempotentHint: false } },
  { name: "get_snapshot", title: "All verified stocks in one answer", description: "Every Coinbase tokenized stock on Base with a verified Chainlink NAV feed: latest NAV with round id, freshness, main DEX price with gap vs NAV, next corporate action, plus the US session. Uses the caller's 3 free snapshots/reports per day; after that it returns the paid x402 link ($0.05 USDC on Base) and never pays by itself.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { ...ro, idempotentHint: false } },
  { name: "get_report", title: "Everything on one stock", description: "Corporate actions with evidence, market context (live NAV, freshness, DEX gap), 30 daily NAV closes with round ids and every verified DEX pool, for one token. Uses the caller's 3 free snapshots/reports per day; after that it returns the paid x402 link and never pays by itself.", inputSchema: { type: "object", properties: { token: tokenArg }, required: ["token"], additionalProperties: false }, annotations: { ...ro, idempotentHint: false } },
  { name: "get_market_session", title: "US equity session now", description: "Whether the US stock market is open right now, with next open/close and last close (NYSE calendar 2026-2027; beyond it: calendar_not_covered).", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { ...ro, idempotentHint: false } }
];
var isObj = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
var ADDR2 = /^0x[0-9a-fA-F]{40}$/;
async function resolveToken(db2, token) {
  if (typeof token !== "string" || !token.trim()) throw new ToolError("token is required (contract address or exact symbol)");
  const t = token.trim();
  if (ADDR2.test(t)) return t;
  const m = (await db2.query("SELECT contract_address FROM assets WHERE symbol = $1", [t])).rows;
  if (m.length === 0) throw new ToolError(`no token with exact symbol ${t.slice(0, 40)}; use list_assets or a contract address`);
  if (m.length > 1) throw new ToolError(`${m.length} tokens use symbol ${t.slice(0, 40)}; pass the contract address`);
  return m[0].contract_address;
}
var ToolError = class extends Error {
};
function toolResult(out, lead) {
  const body = out.body;
  if (out.status !== 200) {
    const e2 = body?.error ?? { code: "ERROR", message: "request failed" };
    return { content: [{ type: "text", text: `${e2.code}: ${e2.message}${e2.hint ? " \u2192 " + e2.hint : ""}` }], isError: true };
  }
  return { content: [{ type: "text", text: lead(body) }, { type: "text", text: JSON.stringify(body) }], structuredContent: body, isError: false };
}
async function callTool(db2, name, args, client) {
  const navOn = process.env.NAV_HISTORY_PUBLIC === "true";
  const navOff = { status: 503, body: { error: { code: "NAV_NOT_ENABLED", message: "NAV data is not publicly enabled on this server" } } };
  try {
    switch (name) {
      case "list_assets": {
        const q = typeof args.query === "string" ? args.query.trim().toLowerCase() : "";
        const rows = (await db2.query(
          "SELECT a.symbol, a.contract_address, a.name, a.multiplier_wad::text AS multiplier_wad, EXISTS (SELECT 1 FROM nav_feeds f WHERE lower(f.token_address)=lower(a.contract_address)) AS has_nav FROM assets a ORDER BY a.symbol"
        )).rows.filter((r) => (!q || r.symbol.toLowerCase().includes(q) || (r.name ?? "").toLowerCase().includes(q)) && (!args.with_nav_only || r.has_nav));
        const body = { data: rows.slice(0, 200), meta: { count: rows.length, shown: Math.min(rows.length, 200) } };
        return toolResult({ status: 200, body }, () => `${rows.length} tracked token(s)${q ? ` matching "${q}"` : ""}; ${rows.filter((r) => r.has_nav).length} with an indexed Chainlink NAV feed.`);
      }
      case "get_corporate_actions": {
        const out = await assetCorporateActions(db2, await resolveToken(db2, args.token));
        return toolResult(out, (b) => `${b.meta.symbol}: ${b.meta.count} corporate action(s); next: ${b.data.find((e2) => e2.status === "predicted")?.expected_adjustment_date ?? "none announced"}. Shares per token = multiplier / 1e18.`);
      }
      case "get_nav_history": {
        if (!navOn) return toolResult(navOff, () => "");
        const q = new URLSearchParams();
        for (const k of ["interval", "from", "to"]) if (typeof args[k] === "string") q.set(k, args[k]);
        if (typeof args.limit === "number") q.set("limit", String(args.limit));
        const out = await navHistory(db2, await resolveToken(db2, args.token), q);
        return toolResult(out, (b) => `${b.meta.symbol}: ${b.meta.count} ${b.meta.interval} NAV point(s) ${b.meta.from}..${b.meta.to}; verification ${b.meta.quality.verification.verdict}; missing trading days: ${(b.meta.quality.missing_trading_days ?? []).length}. Total-return NAV: do not apply the multiplier again.`);
      }
      case "get_market_context": {
        if (!navOn) return toolResult(navOff, () => "");
        const out = await marketContext(db2, await resolveToken(db2, args.token));
        return toolResult(out, (b) => {
          const d = b.data;
          const nav = d.nav ? `last NAV $${d.nav.nav} (${Math.round(d.nav.age_s / 60)} min old, ${d.staleness.state})` : `NAV unavailable (${d.nav_unavailable_reason})`;
          const gap = typeof d.dex?.nav_premium_pct === "number" ? `${d.dex.nav_premium_pct >= 0 ? "+" : ""}${d.dex.nav_premium_pct}% vs NAV` : `gap vs NAV withheld: ${d.dex?.premium_unavailable_reason ?? "unavailable"}`;
          const dex = d.dex?.price_usd ? `; DEX $${Number(d.dex.price_usd).toFixed(2)} (${gap})` : "";
          return `${d.symbol}: market ${d.market.session}; ${nav}${dex}. The NAV is the last published reference, not a live equity price.`;
        });
      }
      case "get_dex_price": {
        const out = await liveDex(db2, await resolveToken(db2, args.token));
        return toolResult(out, (b) => {
          const d = b.data;
          return d.main ? `${d.symbol}: $${Number(d.main.price_usd).toFixed(2)} on ${d.main.venue} (${d.main.quote}), est. 2% depth $${Math.round(d.main.depth_2pct_usd)}${d.main.thin_market ? " (thin market)" : ""}, block ${d.block}.` : `${d.symbol}: no usable DEX price (${d.unavailable_reason}).`;
        });
      }
      case "get_snapshot":
      case "get_report": {
        const before = await triesLeft(db2, client);
        if (before === -1) return { content: [{ type: "text", text: `FREE_TRIES_UNAVAILABLE: free tries can't be counted right now, so none are given. Paid (${PAID.price}, x402, ask the user first): ${name === "get_snapshot" ? PAID.snapshot : PAID.report}` }], structuredContent: trialUnavailable().body, isError: true };
        if (before === 0) {
          const used = trialUsedUp();
          return { content: [{ type: "text", text: `FREE_TRIES_USED: today's 3 free snapshots/reports are used. Each further answer is ${PAID.price} via x402: ${name === "get_snapshot" ? PAID.snapshot : PAID.report}${name === "get_report" ? "?token=<token>" : ""}. Ask the user before paying; never pay automatically.` }], structuredContent: used.body, isError: true };
        }
        const out = name === "get_snapshot" ? await snapshot(db2) : await report(db2, typeof args.token === "string" ? args.token : "");
        if (out.status !== 200) return toolResult(out, () => "");
        const left = await useTry(db2, client);
        const body = out.body;
        const withMeta2 = { ...body, meta: { ...body.meta ?? {}, free_tries_left_today: left, paid: PAID } };
        return toolResult({ status: 200, body: withMeta2 }, (b) => name === "get_snapshot" ? `${b.data.count} verified stocks; market ${b.data.market.session}. ${left} free snapshot/report tries left today.` : `${b.data.symbol}: ${b.data.corporate_actions.length} corporate action(s), ${b.data.nav_daily_30d ? b.data.nav_daily_30d.meta.count + " daily NAV closes" : "no NAV feed"}, ${b.data.dex_pools?.pools_total ?? 0} DEX pools. ${left} free tries left today.`);
      }
      case "get_market_session": {
        const m = marketNow(Math.floor(Date.now() / 1e3));
        return toolResult({ status: 200, body: { data: m } }, () => `US market: ${m.session} (${m.ny_date} ${m.ny_time} New York); next open ${m.next_open ?? "unknown"}.`);
      }
      default:
        throw Object.assign(new Error(`Unknown tool: ${String(name).slice(0, 80)}`), { rpc: -32602 });
    }
  } catch (e2) {
    if (e2 instanceof ToolError) return { content: [{ type: "text", text: e2.message }], isError: true };
    throw e2;
  }
}
async function handleMcp(db2, raw, client = "mcp") {
  if (!isObj(raw)) return { status: 400, body: { jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid Request: one JSON-RPC object per POST (batches are not supported)" } } };
  const msg = raw;
  const isRequest = msg.id !== void 0 && msg.id !== null;
  const reply = (result) => ({ status: 200, body: { jsonrpc: "2.0", id: msg.id, result } });
  const error = (code, message) => ({ status: 200, body: { jsonrpc: "2.0", id: msg.id ?? null, error: { code, message } } });
  try {
    switch (msg.method) {
      case "initialize": {
        const asked = isObj(msg.params) ? msg.params.protocolVersion : void 0;
        const version3 = typeof asked === "string" && PROTOCOL_VERSIONS.includes(asked) ? asked : PROTOCOL_VERSIONS[0];
        return reply({
          protocolVersion: version3,
          capabilities: { tools: {} },
          serverInfo: { name: "keldrin", title: "Keldrin", version: PACKAGE_VERSION },
          instructions: "Keldrin is a verified record for Coinbase tokenized stocks on Base. Use get_corporate_actions for dividends/splits/multipliers, get_nav_history for Chainlink NAV with round ids, get_market_context for session + NAV freshness + DEX gap, get_dex_price for onchain DEX prices, get_snapshot / get_report for everything in one answer (3 free per day, then a paid x402 link; never pay without the user). Values are facts with provenance, not trade signals or advice. 'unknown' is a valid answer."
        });
      }
      case "ping":
        return reply({});
      case "tools/list":
        return reply({ tools: TOOLS });
      case "tools/call": {
        const p = isObj(msg.params) ? msg.params : {};
        return reply(await callTool(db2, p.name, isObj(p.arguments) ? p.arguments : {}, client));
      }
      default:
        if (!isRequest) return { status: 202, body: null };
        return error(-32601, `Method not found: ${String(msg.method).slice(0, 80)}`);
    }
  } catch (err4) {
    const code = err4.rpc ?? -32603;
    return isRequest ? error(code, code === -32603 ? "Internal error" : err4.message) : { status: 202, body: null };
  }
}

// src/api/feedback.ts
var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var err2 = (status, code, message) => ({ status, body: { error: { code, message } } });
async function submitFeedback(db2, raw, client) {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return err2(400, "BAD_REQUEST", "send a JSON object");
  const b = raw;
  if (typeof b.website === "string" && b.website.trim()) return { status: 200, body: { data: { received: true } } };
  const email = typeof b.email === "string" ? b.email.trim() : "";
  const x = typeof b.x === "string" ? b.x.trim().replace(/^@/, "") : "";
  const message = typeof b.message === "string" ? b.message.trim() : "";
  if (!EMAIL.test(email) || email.length > 200) return err2(400, "BAD_EMAIL", "Please enter a valid email.");
  if (x && !/^[A-Za-z0-9_]{1,15}$/.test(x)) return err2(400, "BAD_X_HANDLE", "An X handle is up to 15 letters, numbers or underscores.");
  if (message.length > 1e3) return err2(400, "TOO_LONG", "Please keep the message under 1,000 characters.");
  try {
    const args = [email, x, message, clientHash(client)];
    const r = db2.writeOne ? await db2.writeOne(FEEDBACK_SQL, args) : await db2.query(FEEDBACK_SQL, args);
    const result = r.rows[0]?.result;
    if (result === "rate_limited") return err2(429, "RATE_LIMITED", "Thanks, we already have your messages for today.");
    if (result !== "ok") return err2(503, "FEEDBACK_UNAVAILABLE", "Feedback could not be saved right now.");
    return { status: 200, body: { data: { received: true } } };
  } catch (e2) {
    console.warn("feedback not stored:", e2.message);
    return err2(503, "FEEDBACK_UNAVAILABLE", "Feedback isn't open yet. Please try again soon.");
  }
}

// src/api/stats.ts
var CONFIRMED_INTEGRATIONS = [];
var USDC2 = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
var ROUTER = "0x8aee621035d93deb3c0c1177fac252dc2dd501a0";
var PAYOUT = "0xb98f0de777eea8c481b64e33d3e0066cea38fa91";
var TRANSFER = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
var PAYMENTS_FROM_BLOCK = 63080000n;
var pad2 = (a) => "0x" + a.toLowerCase().replace(/^0x/, "").padStart(64, "0");
async function countPayments(rpc = publicRpc) {
  const head = BigInt(await rpc("eth_blockNumber", []));
  const forwards = [];
  for (let a = PAYMENTS_FROM_BLOCK; a <= head; a += 10000n) {
    const b = a + 9999n < head ? a + 9999n : head;
    forwards.push(...await rpc("eth_getLogs", [{ address: USDC2, topics: [TRANSFER, pad2(ROUTER), pad2(PAYOUT)], fromBlock: "0x" + a.toString(16), toBlock: "0x" + b.toString(16) }]));
  }
  const txs = [...new Set(forwards.map((l) => l.transactionHash))];
  const payers = [];
  const paidTxs = [];
  for (const tx of txs) {
    const rc = await rpc("eth_getTransactionReceipt", [tx]);
    const inbound = rc.logs.find((l) => l.address?.toLowerCase() === USDC2.toLowerCase() && l.topics[0] === TRANSFER && l.topics[2]?.toLowerCase() === pad2(ROUTER) && BigInt(l.data) === 50000n);
    if (inbound) {
      payers.push("0x" + inbound.topics[1].slice(26).toLowerCase());
      paidTxs.push(tx);
    }
  }
  const wallets = new Set(payers);
  return { payments: paidTxs.length, paying_wallets: wallets.size, external_paying_wallets: [...wallets].filter((w) => w !== PAYOUT).length, transactions: paidTxs, to_block: head.toString() };
}
async function stats(db2, rpc = publicRpc) {
  const one = async (sql, params = []) => (await db2.query(sql, params)).rows[0];
  const [assets, feeds, rounds, records, calendar, pools, runs] = await Promise.all([
    one("SELECT count(*)::int AS n FROM assets"),
    one("SELECT count(*)::int AS n, count(*) FILTER (WHERE v.verdict = 'CONFIRMED')::int AS confirmed FROM nav_feeds f LEFT JOIN LATERAL (SELECT verdict FROM nav_reviews r WHERE r.feed_address = f.feed_address ORDER BY checked_at DESC LIMIT 1) v ON true WHERE f.chain_id = $1", [CHAIN_ID]),
    one(`SELECT count(*)::int AS n, to_char(min(updated_at) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS first, to_char(max(updated_at) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS last FROM nav_rounds`),
    one("SELECT count(*)::int AS n FROM confirmed_records"),
    one("SELECT count(DISTINCT entry_id)::int AS n FROM calendar_entries"),
    one("SELECT count(*)::int AS n, count(DISTINCT lower(token_address))::int AS tokens FROM dex_pools WHERE chain_id = $1", [CHAIN_ID]),
    one(`SELECT count(*)::int AS n, count(*) FILTER (WHERE outcome = 'ok')::int AS ok, to_char(max(finished_at) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS last_at, (SELECT outcome FROM runs ORDER BY started_at DESC LIMIT 1) AS last_outcome FROM runs`)
  ]);
  let payments = null;
  let payments_unavailable_reason;
  try {
    payments = await countPayments(rpc);
  } catch {
    payments_unavailable_reason = "onchain read failed; try again later";
  }
  return {
    status: 200,
    body: {
      data: {
        assets_tracked: assets.n,
        nav_feeds: { total: feeds.n, independently_confirmed: feeds.confirmed },
        nav_rounds_indexed: { count: rounds.n, first: rounds.first, last: rounds.last },
        corporate_action_records_confirmed: records.n,
        calendar_entries: calendar.n,
        dex_pools_verified: { count: pools.n, tokens: pools.tokens },
        research_runs: { total: runs.n, ok: runs.ok, last_finished_at: runs.last_at, last_outcome: runs.last_outcome },
        x402_payments: payments,
        ...payments_unavailable_reason ? { x402_payments_unavailable_reason: payments_unavailable_reason } : {},
        confirmed_external_integrations: CONFIRMED_INTEGRATIONS
      },
      meta: { note: "Counts read from keldrin's database at request time (cached up to 10 min); payments counted onchain from USDC transfers. The founder's own test payments are included in `payments` and excluded from `external_paying_wallets`." }
    }
  };
}
async function overview(db2) {
  const s = await snapshot(db2);
  if (s.status !== 200) return s;
  const b = s.body;
  return { status: 200, body: { data: b.data, meta: { ...b.meta ?? {}, freshness: "cached up to 5 minutes; the paid snapshot (x402) and the per-stock routes are read live" } } };
}

// src/api/server.ts
var ADDR3 = /^0x[0-9a-fA-F]{40}$/;
function send(res, status, body, type = "application/json", cacheOverride) {
  const cache3 = cacheOverride ?? (status === 200 ? "public, max-age=30, s-maxage=60, stale-while-revalidate=300" : "no-store");
  res.writeHead(status, { "content-type": type, "cache-control": cache3, "x-content-type-options": "nosniff", "access-control-allow-origin": "*", "access-control-allow-methods": "GET, OPTIONS" });
  res.end(typeof body === "string" ? body : JSON.stringify(body, null, 1));
}
var RATE = { limit: Number(process.env.RATE_LIMIT_PER_MIN ?? 120), windowMs: 6e4 };
var hits = /* @__PURE__ */ new Map();
function rateLimited(client, now = Date.now()) {
  const h = hits.get(client);
  if (!h || now >= h.reset) {
    hits.set(client, { n: 1, reset: now + RATE.windowMs });
    if (hits.size > 1e4) {
      for (const [k, v] of hits) if (now >= v.reset) hits.delete(k);
    }
    return null;
  }
  h.n++;
  return h.n > RATE.limit ? Math.ceil((h.reset - now) / 1e3) : null;
}
var ok = (data, extra = {}) => ({ data, meta: { as_of: (/* @__PURE__ */ new Date()).toISOString(), schema_version: SCHEMA_VERSION, served: "independently_confirmed_records_only", ...extra } });
var withMeta = (body) => ({ ...body, meta: { as_of: (/* @__PURE__ */ new Date()).toISOString(), schema_version: SCHEMA_VERSION, ...body.meta ?? {} } });
var err3 = (code, message, hint) => ({ error: { code, message, ...hint ? { hint } : {} } });
var OPENAPI = keldrin_v1_default;
var LLMS_TXT = `# Keldrin
> Verified corporate-action records for Coinbase tokenized stocks (B20) on Base (chain 8453).
Corporate-action records are derived from chain state and independently re-verified; values are exact integers (WAD = 1e18). NAV and DEX values are read onchain at request time from independently checked feeds and pools.
Records state what is unknown instead of guessing. Informational only: not an oracle, not advice.

- GET /v1/events?status=predicted|verified_matched|late|confirmed_onchain&contract=0x... \u2014 one list of applied and upcoming corporate actions (ticker, event_type, status, confidence, expected_adjustment_date, multiplier_delta, sec_filing_url, quoted_text, onchain_tx)
- GET /v1/changes?since=2026-11-27T00:00:00Z \u2014 events added or changed since a timestamp (poll this)
- GET /v1/assets \u2014 tokens, identity checks, current multiplier (WAD)
- GET /v1/assets/{contract}/corporate-actions \u2014 one token's verified dividends, splits and multiplier changes (multiplier and uiMultiplier before/after in WAD, effective time, announcement txs, evidence links). Balances never change; the multiplier does
- GET /v1/assets/{contract}/market-context \u2014 US session now, next open/close, latest Chainlink NAV read live with round id and age, and staleness: fresh | expected_closed | unexpectedly_stale (judged against the feed's own verified update rhythm), plus the main DEX price and its gap vs NAV (withheld when the NAV is stale or its rhythm unknown)
- GET /v1/assets/{contract}/dex \u2014 live DEX price on Base read onchain at one pinned block: main market (deepest verified pool), price per token in USD, estimated 2% depth, every pool with venue/address; Uniswap v3, Aerodrome, Slipstream and plain (no-hook) Uniswap v4 pools, independently re-derived
- POST /mcp \u2014 remote MCP server (Streamable HTTP, stateless): tools list_assets, get_corporate_actions, get_nav_history, get_market_context, get_dex_price, get_market_session. Add with: claude mcp add --transport http keldrin https://keldrin.vercel.app/mcp
- GET /v1/market/session \u2014 the US equity session right now (NYSE calendar 2026-2027; beyond it: calendar_not_covered)
- GET /v1/snapshot \u2014 every stock with a verified Chainlink NAV feed in one answer: live NAV + freshness, main DEX price + gap vs NAV, next corporate action, plus the session. 3 free complete answers per client per day (shared with /v1/report), then HTTP 402 with the paid x402 link ($0.05 USDC on Base): https://x402.bankr.bot/0xb98f0de777eea8c481b64e33d3e0066cea38fa91/keldrin-snapshot
- GET /v1/report?token=<symbol or address> \u2014 everything about one token in one answer: corporate actions, market context, 30 daily NAV closes, DEX pools. Same 3 free tries, then $0.05 via x402: https://x402.bankr.bot/0xb98f0de777eea8c481b64e33d3e0066cea38fa91/keldrin-report
- Paid via x402 on our origin (forward to Bankr x402 Cloud, same terms): GET /api/snapshot and GET /api/report?token= \u2014 x402 v2, scheme exact, eip155:8453, USDC amount 50000 ($0.05), payTo 0x8AEE621035D93Deb3C0C1177fac252dC2dd501a0. Only a 2xx is charged; sign once, never re-sign automatically.
- GET /v1/overview \u2014 every verified stock's NAV, freshness, DEX price and gap, next corporate action (free, cached up to 5 min; the paid snapshot is live)
- GET /v1/stats \u2014 transparency counts from keldrin's records (assets, feeds, NAV rounds, confirmed records, pools, research runs) and x402 payments counted onchain
- GET /start.md \u2014 5-minute developer quick start (feeds, coverage, cURL)
- GET /skill.md \u2014 the agent guide: when to use keldrin, how to read every field, safety and payment rules
- GET /v1/assets/{contract}/nav/history?interval=daily|round&from=YYYY-MM-DD&to=YYYY-MM-DD \u2014 Chainlink NAV history with feed, phase and round id per point (re-readable onchain via getRoundData). Total-return NAV: already includes dividends and splits; never apply the multiplier again. Only independently verified feeds are served (503 NAV_NOT_VERIFIED otherwise); missing days are listed, never filled
- GET /v1/actions?contract=0x...&limit=50&cursor=... \u2014 confirmed corporate actions, newest first
- GET /v1/actions?symbol=GOOGLc \u2014 same, by exact token symbol (store the address, not the symbol)
- GET /v1/actions/{record_id} \u2014 full record, evidence, review claims, revisions, and company_context (SEC reconciliation, when confirmed)
- GET /openapi.json \u2014 OpenAPI 3.1 contract
- GET /v1/calendar?state=upcoming \u2014 declared dividends and the date each token is expected to adjust (observed pattern, stated with its rate)
- GET /health \u2014 coverage, last run, limitations
Errors: {"error":{"code","message","hint"}}. 404 unknown, 400 bad input, 409 ambiguous symbol.
`;
function dbFailureReason(e2) {
  const x = e2;
  const code = String(x?.code ?? "");
  const msg = String(x?.message ?? "").toLowerCase();
  if (code === "28P01" || code === "28000" || /password authentication|authentication failed|tenant or user not found/.test(msg)) return "auth_failed";
  if (/certificate|self[- ]signed|unable to verify|ssl|tls/.test(msg)) return "tls_verify_failed";
  if (code === "ENOTFOUND" || code === "EAI_AGAIN" || /getaddrinfo/.test(msg)) return "dns_failed";
  if (code === "ETIMEDOUT" || code === "ECONNREFUSED" || /timeout|timed out/.test(msg)) return "connect_timeout";
  if (code === "42501" || /permission denied/.test(msg)) return "permission_denied";
  if (code === "42P01" || code === "3F000" || /does not exist/.test(msg)) return "schema_missing";
  if (/database_url is not set/.test(msg)) return "not_configured";
  return "unknown";
}
async function readBody(req, max) {
  const pre = req.body;
  if (pre !== void 0 && pre !== null) {
    const s = typeof pre === "string" ? pre : Buffer.isBuffer(pre) ? pre.toString("utf8") : JSON.stringify(pre);
    return Buffer.byteLength(s) > max ? null : s;
  }
  let size2 = 0;
  const chunks = [];
  for await (const c of req) {
    size2 += c.length;
    if (size2 > max) return null;
    chunks.push(c);
  }
  return Buffer.concat(chunks).toString("utf8");
}
async function handle(db2, req, res) {
  try {
    if (req.method === "OPTIONS") return send(res, 204, "", "text/plain");
    const url = new URL(req.url ?? "/", "http://localhost");
    const p = url.pathname.replace(/\/+$/, "") || "/";
    const isMcp = p === "/mcp" && req.method === "POST";
    const isFeedback = p === "/v1/feedback" && req.method === "POST";
    if (req.method !== "GET" && !isMcp && !isFeedback) return send(res, 405, err3("METHOD_NOT_ALLOWED", "read-only API", p === "/mcp" ? "MCP: POST one JSON-RPC message (Streamable HTTP, stateless)" : "use GET"));
    const fwd = String(req.headers["x-forwarded-for"] ?? "").split(",")[0].trim();
    const retry = rateLimited(fwd || req.socket?.remoteAddress || "unknown");
    if (retry !== null) {
      res.setHeader("retry-after", String(retry));
      return send(res, 429, err3("RATE_LIMITED", `more than ${RATE.limit} requests per minute`, `retry after ${retry} s; cached responses are served by the CDN`));
    }
    if (isFeedback) {
      const raw = await readBody(req, 4 * 1024);
      if (raw === null) return send(res, 413, err3("TOO_LARGE", "request body over 4 KB"), void 0, "no-store");
      let body;
      try {
        body = JSON.parse(raw);
      } catch {
        return send(res, 400, err3("BAD_REQUEST", "send a JSON object"), void 0, "no-store");
      }
      const out = await submitFeedback(db2, body, fwd || req.socket?.remoteAddress || "unknown");
      return send(res, out.status, out.body, void 0, "no-store");
    }
    if (isMcp) {
      const raw = await readBody(req, 64 * 1024);
      if (raw === null) return send(res, 413, { jsonrpc: "2.0", id: null, error: { code: -32600, message: "request body over 64 KB" } }, void 0, "no-store");
      let msg;
      try {
        msg = JSON.parse(raw);
      } catch {
        return send(res, 400, { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, void 0, "no-store");
      }
      const out = await handleMcp(db2, msg, fwd || req.socket?.remoteAddress || "unknown");
      if (out.body === null) return send(res, 202, "", "text/plain", "no-store");
      return send(res, out.status, out.body, void 0, "no-store");
    }
    if (p === "/mcp") return send(res, 405, err3("METHOD_NOT_ALLOWED", "MCP endpoint", "POST one JSON-RPC message (Streamable HTTP, stateless JSON responses; no SSE)"), void 0, "no-store");
    if (p === "/" || p === "/v1") return send(res, 200, ok({ name: "Keldrin API", site: "/ (HTML, served statically on Vercel)", docs: "/llms.txt", openapi: "/openapi.json", endpoints: ["/v1/events", "/v1/changes", "/v1/calendar", "/v1/actions", "/v1/assets", "/v1/assets/{contract}/nav/history", "/v1/assets/{contract}/market-context", "/v1/assets/{contract}/corporate-actions", "/v1/assets/{contract}/dex", "/v1/market/session", "/v1/overview", "/v1/stats", "/v1/snapshot", "/v1/report?token=", "/mcp", "/health"] }));
    if (p === "/v1/events" || p === "/v1/changes") {
      const contract = url.searchParams.get("contract");
      if (contract && !ADDR3.test(contract)) return send(res, 400, err3("BAD_ADDRESS", "contract must be a 0x-prefixed 20-byte address"));
      const status = url.searchParams.get("status");
      if (status && !["predicted", "confirmed_onchain", "verified_matched", "late", "unknown"].includes(status)) return send(res, 400, err3("BAD_STATUS", "status must be predicted, confirmed_onchain, verified_matched, late or unknown"));
      let since = null;
      if (p === "/v1/changes") {
        const s = url.searchParams.get("since");
        since = s ? Date.parse(s) : NaN;
        if (!s || Number.isNaN(since)) return send(res, 400, err3("BAD_SINCE", "since must be an ISO 8601 timestamp", "use meta.as_of from your previous call"));
      }
      const events = (await listEvents(db2, { contract, status })).filter((e2) => since === null || Date.parse(e2.updated_at) > since);
      return send(res, 200, ok(events, { count: events.length, ...since !== null ? { since: new Date(since).toISOString() } : {} }));
    }
    if (p === "/llms.txt") return send(res, 200, LLMS_TXT, "text/plain; charset=utf-8");
    if (p === "/openapi.json") return send(res, 200, OPENAPI);
    if (p === "/v1/stats") {
      const out = await stats(db2);
      return send(res, out.status, out.status === 200 ? withMeta(out.body) : out.body, void 0, out.status === 200 ? "public, max-age=60, s-maxage=600, stale-while-revalidate=600" : "no-store");
    }
    if (p === "/v1/overview") {
      const out = await overview(db2);
      return send(res, out.status, out.status === 200 ? withMeta(out.body) : out.body, void 0, out.status === 200 ? "public, max-age=60, s-maxage=300, stale-while-revalidate=300" : "no-store");
    }
    if (p === "/health") {
      try {
        await db2.query("SELECT 1");
      } catch (e2) {
        console.error("keldrin health: database unavailable:", e2.stack ?? e2);
        return send(res, 503, { ...err3("DB_UNAVAILABLE", "database unavailable", "see reason"), reason: dbFailureReason(e2) });
      }
      const [a, r, c, run] = await Promise.all([
        db2.query("SELECT count(*)::int n, count(*) FILTER (WHERE identity_state='verified')::int verified FROM assets"),
        db2.query("SELECT count(*)::int n FROM records"),
        db2.query("SELECT count(*)::int n FROM confirmed_records"),
        db2.query("SELECT run_id, kind, started_at, finished_at, head_block::text, outcome, summary FROM runs ORDER BY started_at DESC LIMIT 1")
      ]);
      return send(res, 200, ok({
        status: run.rows[0]?.outcome === "ok" ? "ok" : "degraded",
        chain_id: CHAIN_ID,
        assets: a.rows[0].n,
        assets_identity_verified: a.rows[0].verified,
        records: r.rows[0].n,
        records_confirmed: c.rows[0].n,
        last_run: run.rows[0] ?? null,
        limitations: ["Local Phase 1 build; data is as fresh as the last run.", "Announcements without a multiplier effect are only covered when the issuer record lists them."]
      }));
    }
    if (p === "/v1/calendar") {
      const contract = url.searchParams.get("contract");
      if (contract && !ADDR3.test(contract)) return send(res, 400, err3("BAD_ADDRESS", "contract must be a 0x-prefixed 20-byte address"));
      const state = url.searchParams.get("state");
      if (state && !["upcoming", "applied", "not_observed", "announced"].includes(state)) return send(res, 400, err3("BAD_STATE", "state must be upcoming, applied, not_observed or announced"));
      const snap = (await db2.query("SELECT snapshot_id, max(as_of) AS as_of FROM calendar_entries GROUP BY snapshot_id ORDER BY 2 DESC LIMIT 1")).rows[0];
      if (!snap) return send(res, 200, ok([], { count: 0, snapshot_as_of: null }));
      const rows = (await db2.query(
        `SELECT payload, review FROM calendar_entries WHERE snapshot_id=$1 AND review_verdict='CONFIRMED'
         AND ($2::text IS NULL OR lower(contract_address)=lower($2)) AND ($3::text IS NULL OR state=$3) ORDER BY payable_date NULLS LAST, entry_id`,
        [snap.snapshot_id, contract, state]
      )).rows;
      return send(res, 200, ok(rows.map((r) => ({ ...r.payload, review: r.review })), { count: rows.length, snapshot_as_of: snap.as_of }));
    }
    if (p === "/v1/assets") {
      const rows = await db2.query("SELECT chain_id, contract_address, symbol, name, isin, identity_state, multiplier_wad::text, observed_block::text FROM assets ORDER BY symbol");
      return send(res, 200, ok(rows.rows, { count: rows.rows.length }));
    }
    const meta = (body) => ({ ...body, meta: { as_of: (/* @__PURE__ */ new Date()).toISOString(), schema_version: SCHEMA_VERSION, ...body.meta ?? {} } });
    if (p === "/v1/market/session") return send(res, 200, meta({ data: marketNow(Math.floor(Date.now() / 1e3)) }), void 0, "no-store");
    if (p === "/v1/snapshot" || p === "/v1/report") {
      const client = fwd || req.socket?.remoteAddress || "unknown";
      let left = await triesLeft(db2, client);
      if (left === -1) return send(res, 503, trialUnavailable().body, void 0, "no-store");
      if (left === 0) return send(res, 402, trialUsedUp().body, void 0, "no-store");
      const out = p === "/v1/snapshot" ? await snapshot(db2) : await report(db2, url.searchParams.get("token") ?? "");
      if (out.status === 200) left = await useTry(db2, client);
      if (out.status === 200) res.setHeader("x-keldrin-free-tries-left", String(left));
      const b = out.body;
      const body = out.status === 200 ? { ...b, meta: { as_of: (/* @__PURE__ */ new Date()).toISOString(), schema_version: SCHEMA_VERSION, ...b.meta ?? {}, free_tries_left_today: left, paid: PAID } } : b;
      return send(res, out.status, body, void 0, "no-store");
    }
    const dm = p.match(/^\/v1\/assets\/([^/]+)\/dex$/);
    if (dm) {
      if (!ADDR3.test(dm[1])) return send(res, 400, err3("BAD_ADDRESS", "contract must be a 0x-prefixed 20-byte address"));
      const out = await liveDex(db2, dm[1]);
      return send(res, out.status, out.status === 200 ? meta(out.body) : out.body, void 0, "no-store");
    }
    const cm = p.match(/^\/v1\/assets\/([^/]+)\/(market-context|corporate-actions)$/);
    if (cm) {
      if (!ADDR3.test(cm[1])) return send(res, 400, err3("BAD_ADDRESS", "contract must be a 0x-prefixed 20-byte address"));
      if (cm[2] === "market-context" && process.env.NAV_HISTORY_PUBLIC !== "true") return send(res, 503, err3("NAV_NOT_ENABLED", "market context with live NAV is not publicly enabled yet", "GET /v1/market/session gives the session alone"));
      const out = cm[2] === "market-context" ? await marketContext(db2, cm[1]) : await assetCorporateActions(db2, cm[1]);
      return send(res, out.status, out.status === 200 ? meta(out.body) : out.body, void 0, cm[2] === "market-context" ? "no-store" : void 0);
    }
    const nm = p.match(/^\/v1\/assets\/([^/]+)\/nav\/history$/);
    if (nm) {
      if (!ADDR3.test(nm[1])) return send(res, 400, err3("BAD_ADDRESS", "contract must be a 0x-prefixed 20-byte address"));
      if (process.env.NAV_HISTORY_PUBLIC !== "true") return send(res, 503, err3("NAV_NOT_ENABLED", "NAV history is not publicly enabled yet", "read the Chainlink feed onchain meanwhile; GET /llms.txt lists what is live"));
      const out = await navHistory(db2, nm[1], url.searchParams);
      const body = out.status === 200 ? { ...out.body, meta: { as_of: (/* @__PURE__ */ new Date()).toISOString(), schema_version: SCHEMA_VERSION, ...out.body.meta } } : out.body;
      return send(res, out.status, body);
    }
    const am = p.match(/^\/v1\/assets\/([^/]+)$/);
    if (am) {
      if (!ADDR3.test(am[1])) return send(res, 400, err3("BAD_ADDRESS", "contract must be a 0x-prefixed 20-byte address"));
      const row = (await db2.query("SELECT chain_id, contract_address, symbol, name, isin, identity_state, multiplier_wad::text, observed_block::text, identity FROM assets WHERE lower(contract_address)=lower($1)", [am[1]])).rows[0];
      if (!row) return send(res, 404, err3("UNKNOWN_ASSET", `no tracked asset ${am[1]}`, "GET /v1/assets lists tracked tokens"));
      return send(res, 200, ok(row));
    }
    if (p === "/v1/actions") {
      let contract = url.searchParams.get("contract");
      const symbol = url.searchParams.get("symbol");
      if (contract && !ADDR3.test(contract)) return send(res, 400, err3("BAD_ADDRESS", "contract must be a 0x-prefixed 20-byte address"));
      if (!contract && symbol) {
        const m = (await db2.query("SELECT contract_address FROM assets WHERE symbol = $1", [symbol])).rows;
        if (m.length === 0) return send(res, 404, err3("UNKNOWN_SYMBOL", `no token with exact symbol ${symbol}`, "symbols are exact token symbols such as GOOGLc; prefer contract="));
        if (m.length > 1) return send(res, 409, err3("AMBIGUOUS_SYMBOL", `${m.length} tokens use symbol ${symbol}`, "query by contract address"));
        contract = m[0].contract_address;
      }
      const limit = Number(url.searchParams.get("limit") ?? 50);
      if (!Number.isInteger(limit) || limit < 1 || limit > 200) return send(res, 400, err3("BAD_LIMIT", "limit must be an integer 1-200"));
      const rawCursor = url.searchParams.get("cursor");
      let cur = null;
      if (rawCursor) {
        try {
          const c = JSON.parse(Buffer.from(rawCursor, "base64url").toString("utf8"));
          if (!Array.isArray(c) || c.length !== 2 || !(c[0] === null || /^\d+$/.test(c[0])) || typeof c[1] !== "string") throw new Error("shape");
          cur = c;
        } catch {
          return send(res, 400, err3("BAD_CURSOR", "cursor is opaque; pass meta.next_cursor back unchanged"));
        }
      }
      const rows = (await db2.query(
        `SELECT payload, effective_block::text, record_id, review_id FROM confirmed_records
         WHERE ($1::text IS NULL OR lower(contract_address)=lower($1))
           AND ($4::boolean IS NOT TRUE OR (
             CASE WHEN $2::bigint IS NULL THEN effective_block IS NULL AND record_id > $3
                  ELSE effective_block < $2::bigint OR (effective_block = $2::bigint AND record_id > $3) OR effective_block IS NULL END))
         ORDER BY effective_block DESC NULLS LAST, record_id LIMIT $5`,
        [contract, cur?.[0] ?? null, cur?.[1] ?? "", cur !== null, limit + 1]
      )).rows;
      const page = rows.slice(0, limit);
      const last = page.at(-1);
      const next = rows.length > limit && last ? Buffer.from(JSON.stringify([last.effective_block, last.record_id])).toString("base64url") : null;
      return send(res, 200, ok(page.map((r) => ({ ...r.payload, verification: { ...r.payload.verification, state: "confirmed", review_id: r.review_id } })), { count: page.length, next_cursor: next }));
    }
    const xm = p.match(/^\/v1\/actions\/(.+)$/);
    if (xm) {
      let id;
      try {
        id = decodeURIComponent(xm[1]);
      } catch {
        return send(res, 400, err3("BAD_RECORD_ID", "record id is not valid percent-encoding"));
      }
      const rec = (await db2.query("SELECT payload, review_id, reviewed_at, revision FROM confirmed_records WHERE record_id=$1", [id])).rows[0];
      if (!rec) return send(res, 404, err3("UNKNOWN_RECORD", `no confirmed record ${id}`, "unreviewed, unsure and rejected records are never served"));
      const review = (await db2.query("SELECT review_id, verdict, reviewer, claims, checked_at, payload_sha256 FROM reviews WHERE review_id=$1", [rec.review_id])).rows[0];
      const revisions = (await db2.query("SELECT revision, payload_sha256, created_at FROM records WHERE record_id=$1 ORDER BY revision", [id])).rows;
      const recon = (await db2.query(
        `SELECT x.payload, x.review, x.created_at FROM reconciliations x JOIN records r ON r.record_id = x.record_id AND r.revision = $2
         WHERE x.record_id = $1 AND x.review_verdict = 'CONFIRMED' AND x.record_payload_sha256 = r.payload_sha256 ORDER BY x.created_at DESC LIMIT 1`,
        [id, rec.revision]
      )).rows[0];
      return send(res, 200, ok({ company_context: recon ? { ...recon.payload, review: recon.review, reconciled_at: recon.created_at } : null, record: { ...rec.payload, verification: { ...rec.payload.verification, state: "confirmed", review_id: rec.review_id, reviewed_at: rec.reviewed_at } }, review, revisions }));
    }
    return send(res, 404, err3("NOT_FOUND", `no route ${p}`, "see /llms.txt"));
  } catch (e2) {
    console.error("keldrin api error:", e2.stack ?? e2);
    return send(res, 500, err3("INTERNAL", "internal error", "retry later; if it persists the service is degraded (see /health)"));
  }
}

// src/api/vercel.ts
function normalisePath(url) {
  const u = new URL(url ?? "/", "http://x");
  const original = u.searchParams.get("__path");
  if (original !== null) {
    u.searchParams.delete("__path");
    const qs = u.searchParams.toString();
    const path = ("/" + original.replace(/^\/+/, "")).replace(/\/+$/, "") || "/";
    return path + (qs ? "?" + qs : "");
  }
  if (u.pathname === "/api" || u.pathname === "/api/index" || u.pathname.startsWith("/api/")) {
    const rest = u.pathname === "/api" || u.pathname === "/api/index" ? "/" : u.pathname.slice(4);
    return rest + u.search;
  }
  return u.pathname + u.search;
}
function createHandler(db2) {
  return (req, res) => {
    req.url = normalisePath(req.url);
    return handle(db2, req, res);
  };
}
var db = null;
async function handler(req, res) {
  db ??= openPg(process.env.DATABASE_URL ?? "");
  return createHandler(db)(req, res);
}
export {
  createHandler,
  handler as default,
  normalisePath
};
/*! Bundled license information:

@noble/hashes/esm/utils.js:
  (*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) *)
*/
