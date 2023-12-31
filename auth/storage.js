"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MemoryStorage = exports.LocalStorage = exports.CookieStorage = exports.BaseStorage = void 0;
var _jsCookie = _interopRequireDefault(require("js-cookie"));
var _utils = require("@salesforce/commerce-sdk-react/utils");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); } /*
                                                                                                                                                                                                                                                                                                                                                                                           * Copyright (c) 2023, Salesforce, Inc.
                                                                                                                                                                                                                                                                                                                                                                                           * All rights reserved.
                                                                                                                                                                                                                                                                                                                                                                                           * SPDX-License-Identifier: BSD-3-Clause
                                                                                                                                                                                                                                                                                                                                                                                           * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
                                                                                                                                                                                                                                                                                                                                                                                           */
class BaseStorage {
  options = {};
  constructor(options) {
    this.options = {
      keySuffix: (options === null || options === void 0 ? void 0 : options.keySuffix) ?? ''
    };
  }
  getSuffixedKey(key) {
    return this.options.keySuffix ? `${key}_${this.options.keySuffix}` : key;
  }
}

/**
 * A normalized implementation for Cookie store. It implements the BaseStorage interface
 * which allows developers to easily switch between Cookie, LocalStorage, Memory store
 * or a customized storage. This class is mainly used for commerce-sdk-react library
 * to store authentication tokens.
 */
exports.BaseStorage = BaseStorage;
class CookieStorage extends BaseStorage {
  constructor(options) {
    super(options);
    if (typeof document === 'undefined') {
      throw new Error('CookieStorage is not avaliable on the current environment.');
    }
  }
  set(key, value, options) {
    const suffixedKey = this.getSuffixedKey(key);
    _jsCookie.default.set(suffixedKey, value, _objectSpread({
      // Deployed sites will always be HTTPS, but the local dev server is served over HTTP.
      // Ideally, this would be `secure: true`, because Chrome and Firefox both treat
      // localhost as a Secure context. But Safari doesn't, so here we are.
      secure: !(0, _utils.onClient)() || window.location.protocol === 'https:'
    }, options));
  }
  get(key) {
    const suffixedKey = this.getSuffixedKey(key);
    return _jsCookie.default.get(suffixedKey) || '';
  }
  delete(key) {
    const suffixedKey = this.getSuffixedKey(key);
    _jsCookie.default.remove(suffixedKey);
  }
}

/**
 * A normalized implementation for LocalStorage. It implements the BaseStorage interface
 * which allows developers to easily switch between Cookie, LocalStorage, Memory store
 * or a customized storage. This class is mainly used for commerce-sdk-react library
 * to store authentication tokens.
 */
exports.CookieStorage = CookieStorage;
class LocalStorage extends BaseStorage {
  constructor(options) {
    super(options);
    if (typeof window === 'undefined') {
      throw new Error('LocalStorage is not avaliable on the current environment.');
    }
  }
  set(key, value) {
    const oldValue = this.get(key);
    const suffixedKey = this.getSuffixedKey(key);
    window.localStorage.setItem(suffixedKey, value);
    const event = new StorageEvent('storage', {
      key: suffixedKey,
      oldValue: oldValue,
      newValue: value
    });
    window.dispatchEvent(event);
  }
  get(key) {
    const suffixedKey = this.getSuffixedKey(key);
    return window.localStorage.getItem(suffixedKey) || '';
  }
  delete(key) {
    const suffixedKey = this.getSuffixedKey(key);
    const oldValue = this.get(suffixedKey);
    window.localStorage.removeItem(suffixedKey);
    const event = new StorageEvent('storage', {
      key: suffixedKey,
      oldValue: oldValue,
      newValue: null
    });
    window.dispatchEvent(event);
  }
}
exports.LocalStorage = LocalStorage;
const globalMap = new Map();
class MemoryStorage extends BaseStorage {
  constructor(options) {
    super(options);
    this.map = options !== null && options !== void 0 && options.sharedContext ? globalMap : new Map();
  }
  set(key, value) {
    const suffixedKey = this.getSuffixedKey(key);
    this.map.set(suffixedKey, value);
  }
  get(key) {
    const suffixedKey = this.getSuffixedKey(key);
    return this.map.get(suffixedKey) || '';
  }
  delete(key) {
    const suffixedKey = this.getSuffixedKey(key);
    this.map.delete(suffixedKey);
  }
}
exports.MemoryStorage = MemoryStorage;