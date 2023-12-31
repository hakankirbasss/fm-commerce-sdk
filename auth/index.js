"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _commerceSdkIsomorphic = require("commerce-sdk-isomorphic");
var _jwtDecode = _interopRequireDefault(require("jwt-decode"));
var _storage = require("./storage");
var _utils = require("@salesforce/commerce-sdk-react/utils");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; } /*
                                                                                                                                                                                                                                                                                                                                                                                                       * Copyright (c) 2023, Salesforce, Inc.
                                                                                                                                                                                                                                                                                                                                                                                                       * All rights reserved.
                                                                                                                                                                                                                                                                                                                                                                                                       * SPDX-License-Identifier: BSD-3-Clause
                                                                                                                                                                                                                                                                                                                                                                                                       * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
                                                                                                                                                                                                                                                                                                                                                                                                       */
/**
 * The extended field is not from api response, we manually store the auth type,
 * so we don't need to make another API call when we already have the data.
 * Plus, the getCustomer endpoint only works for registered user, it returns a 404 for a guest user,
 * and it's not easy to grab this info in user land, so we add it into the Auth object, and expose it via a hook
 */

/** A shopper could be guest or registered, so we store the refresh tokens individually. */

/**
 * A map of the data that this auth module stores. This maps the name of the property to
 * the storage type and the key when stored in that storage. You can also pass in a "callback"
 * function to do extra operation after a property is set.
 */
const DATA_MAP = {
  access_token: {
    storageType: 'local',
    key: 'access_token'
  },
  customer_id: {
    storageType: 'local',
    key: 'customer_id'
  },
  usid: {
    storageType: 'cookie',
    key: 'usid'
  },
  enc_user_id: {
    storageType: 'local',
    key: 'enc_user_id'
  },
  expires_in: {
    storageType: 'local',
    key: 'expires_in'
  },
  id_token: {
    storageType: 'local',
    key: 'id_token'
  },
  idp_access_token: {
    storageType: 'local',
    key: 'idp_access_token'
  },
  token_type: {
    storageType: 'local',
    key: 'token_type'
  },
  refresh_token_guest: {
    storageType: 'cookie',
    key: 'cc-nx-g',
    callback: store => {
      store.delete('cc-nx');
    }
  },
  refresh_token_registered: {
    storageType: 'cookie',
    key: 'cc-nx',
    callback: store => {
      store.delete('cc-nx-g');
    }
  },
  // For Hybrid setups, we need a mechanism to inform PWA Kit whenever customer login state changes on SFRA.
  // So we maintain a copy of the refersh_tokens in the local storage which is compared to the actual refresh_token stored in cookie storage.
  // If the key or value of the refresh_token in local storage is different from the one in cookie storage, this indicates a change in customer auth state and we invalidate the access_token in PWA Kit.
  // This triggers a new fetch for access_token using the current refresh_token from cookie storage and makes sure customer auth state is always in sync between SFRA and PWA sites in a hybrid setup.
  refresh_token_guest_copy: {
    storageType: 'local',
    key: 'cc-nx-g',
    callback: store => {
      store.delete('cc-nx');
    }
  },
  refresh_token_registered_copy: {
    storageType: 'local',
    key: 'cc-nx',
    callback: store => {
      store.delete('cc-nx-g');
    }
  },
  customer_type: {
    storageType: 'local',
    key: 'customer_type'
  }
};

/**
 * This class is used to handle shopper authentication.
 * It is responsible for initializing shopper session, manage access
 * and refresh tokens on server/browser environments. As well as providing
 * a mechanism to queue network calls before having a valid access token.
 *
 * @Internal
 */
class Auth {
  REFRESH_TOKEN_EXPIRATION_DAYS_REGISTERED = 90;
  REFRESH_TOKEN_EXPIRATION_DAYS_GUEST = 30;
  constructor(config) {
    this.client = new _commerceSdkIsomorphic.ShopperLogin({
      proxy: config.proxy,
      parameters: {
        clientId: config.clientId,
        organizationId: config.organizationId,
        shortCode: config.shortCode,
        siteId: config.siteId
      },
      throwOnBadResponse: true,
      fetchOptions: config.fetchOptions
    });
    this.shopperCustomersClient = new _commerceSdkIsomorphic.ShopperCustomers({
      proxy: config.proxy,
      parameters: {
        clientId: config.clientId,
        organizationId: config.organizationId,
        shortCode: config.shortCode,
        siteId: config.siteId
      },
      throwOnBadResponse: false,
      fetchOptions: config.fetchOptions
    });
    const storageOptions = {
      keySuffix: config.siteId
    };
    const serverStorageOptions = {
      keySuffix: config.siteId,
      sharedContext: true // This allows use to reused guest authentication tokens accross lambda runs.
    };

    this.stores = (0, _utils.onClient)() ? {
      cookie: new _storage.CookieStorage(storageOptions),
      local: new _storage.LocalStorage(storageOptions),
      memory: new _storage.MemoryStorage(storageOptions)
    } : {
      // Always use MemoryStorage on the server.
      cookie: new _storage.MemoryStorage(serverStorageOptions),
      local: new _storage.MemoryStorage(serverStorageOptions),
      memory: new _storage.MemoryStorage(serverStorageOptions)
    };
    this.redirectURI = config.redirectURI;
    this.fetchedToken = config.fetchedToken || '';
    this.OCAPISessionsURL = config.OCAPISessionsURL || '';
  }
  get(name) {
    const {
      key,
      storageType
    } = DATA_MAP[name];
    const storage = this.stores[storageType];
    return storage.get(key);
  }
  set(name, value, options) {
    var _DATA_MAP$name$callba, _DATA_MAP$name;
    const {
      key,
      storageType
    } = DATA_MAP[name];
    const storage = this.stores[storageType];
    storage.set(key, value, options);
    (_DATA_MAP$name$callba = (_DATA_MAP$name = DATA_MAP[name]).callback) === null || _DATA_MAP$name$callba === void 0 ? void 0 : _DATA_MAP$name$callba.call(_DATA_MAP$name, storage);
  }
  clearStorage() {
    // Type assertion because Object.keys is silly and limited :(
    const keys = Object.keys(DATA_MAP);
    keys.forEach(keyName => {
      const {
        key,
        storageType
      } = DATA_MAP[keyName];
      const store = this.stores[storageType];
      store.delete(key);
    });
  }

  /**
   * Every method in this class that returns a `TokenResponse` constructs it via this getter.
   */
  get data() {
    return {
      access_token: this.get('access_token'),
      customer_id: this.get('customer_id'),
      enc_user_id: this.get('enc_user_id'),
      expires_in: parseInt(this.get('expires_in')),
      id_token: this.get('id_token'),
      idp_access_token: this.get('idp_access_token'),
      refresh_token: this.get('refresh_token_registered') || this.get('refresh_token_guest'),
      token_type: this.get('token_type'),
      usid: this.get('usid'),
      customer_type: this.get('customer_type')
    };
  }

  /**
   * Used to validate JWT token expiration.
   */
  isTokenExpired(token) {
    const {
      exp,
      iat
    } = (0, _jwtDecode.default)(token.replace('Bearer ', ''));
    const validTimeSeconds = exp - iat - 60;
    const tokenAgeSeconds = Date.now() / 1000 - iat;
    return validTimeSeconds <= tokenAgeSeconds;
  }

  /**
   * WARNING: This function is relevant to be used in Hybrid deployments only.
   * Compares the refresh_token keys for guest('cc-nx-g') and registered('cc-nx') login from the cookie received from SFRA with the copy stored in localstorage on PWA Kit
   * to determine if the login state of the shopper on SFRA site has changed. If the keys are different we return true considering the login state did change. If the keys are same,
   * we compare the values of the refresh_token to cover an edge case where the login state might have changed multiple times on SFRA and the eventual refresh_token key might be same
   * as that on PWA Kit which would incorrectly show both keys to be the same even though the sessions are different.
   * @returns {boolean} true if the keys do not match (login state changed), false otherwise.
   */
  hasSFRAAuthStateChanged() {
    const refreshTokenKey = this.get('refresh_token_registered') && 'refresh_token_registered' || 'refresh_token_guest';
    const refreshTokenCopyKey = this.get('refresh_token_registered_copy') && 'refresh_token_registered_copy' || 'refresh_token_guest_copy';
    if (DATA_MAP[refreshTokenKey].key !== DATA_MAP[refreshTokenCopyKey].key) {
      return true;
    }
    return this.get(refreshTokenKey) !== this.get(refreshTokenCopyKey);
  }

  /**
   * Used to validate JWT expiry and ensure auth state consistency with SFRA in a hybrid setup
   * @param token access_token received on SLAS authentication
   * @returns {boolean} true if JWT is valid; false otherwise
   */
  isTokenValidForHybrid(token) {
    return !this.isTokenExpired(token) && !this.hasSFRAAuthStateChanged();
  }

  /**
   * This method stores the TokenResponse object retrived from SLAS, and
   * store the data in storage.
   */
  handleTokenResponse(res, isGuest) {
    this.set('access_token', res.access_token);
    this.set('customer_id', res.customer_id);
    this.set('enc_user_id', res.enc_user_id);
    this.set('expires_in', `${res.expires_in}`);
    this.set('id_token', res.id_token);
    this.set('idp_access_token', res.idp_access_token);
    this.set('token_type', res.token_type);
    this.set('usid', res.usid);
    this.set('customer_type', isGuest ? 'guest' : 'registered');
    const refreshTokenKey = isGuest ? 'refresh_token_guest' : 'refresh_token_registered';
    const refreshTokenCopyKey = isGuest ? 'refresh_token_guest_copy' : 'refresh_token_registered_copy';
    const refreshTokenExpiry = isGuest ? this.REFRESH_TOKEN_EXPIRATION_DAYS_GUEST : this.REFRESH_TOKEN_EXPIRATION_DAYS_REGISTERED;
    this.set(refreshTokenKey, res.refresh_token, {
      expires: refreshTokenExpiry
    });
    this.set(refreshTokenCopyKey, res.refresh_token, {
      expires: refreshTokenExpiry
    });
  }

  /**
   * This method queues the requests and handles the SLAS token response.
   *
   * It returns the queue.
   *
   * @Internal
   */
  queueRequest(fn, isGuest) {
    var _this = this;
    return _asyncToGenerator(function* () {
      const queue = _this.pendingToken ?? Promise.resolve();
      _this.pendingToken = queue.then( /*#__PURE__*/_asyncToGenerator(function* () {
        const token = yield fn();
        _this.handleTokenResponse(token, isGuest);
        if ((0, _utils.onClient)() && _this.OCAPISessionsURL) {
          void _this.createOCAPISession();
        }
        // Q: Why don't we just return token? Why re-construct the same object again?
        // A: because a user could open multiple tabs and the data in memory could be out-dated
        // We must always grab the data from the storage (cookie/localstorage) directly
        return _this.data;
      })).finally(() => {
        _this.pendingToken = undefined;
      });
      return _this.pendingToken;
    })();
  }

  /**
   * The ready function returns a promise that resolves with valid ShopperLogin
   * token response.
   *
   * When this method is called for the very first time, it initializes the session
   * by following the public client auth flow to get access token for the user.
   * The flow:
   * 1. If we have valid access token - use it
   * 2. If we have valid refresh token - refresh token flow
   * 3. PKCE flow
   */
  ready() {
    var _this2 = this;
    return _asyncToGenerator(function* () {
      if (_this2.fetchedToken && _this2.fetchedToken !== '') {
        const {
          isGuest,
          customerId,
          usid
        } = _this2.parseSlasJWT(_this2.fetchedToken);
        _this2.set('access_token', _this2.fetchedToken);
        _this2.set('customer_id', customerId);
        _this2.set('usid', usid);
        _this2.set('customer_type', isGuest ? 'guest' : 'registered');
        return _this2.data;
      }
      if (_this2.pendingToken) {
        return _this2.pendingToken;
      }
      const accessToken = _this2.get('access_token');
      if (accessToken && _this2.isTokenValidForHybrid(accessToken)) {
        return _this2.data;
      }
      const refreshTokenRegistered = _this2.get('refresh_token_registered');
      const refreshTokenGuest = _this2.get('refresh_token_guest');
      const refreshToken = refreshTokenRegistered || refreshTokenGuest;
      if (refreshToken) {
        try {
          return yield _this2.queueRequest(() => _commerceSdkIsomorphic.helpers.refreshAccessToken(_this2.client, {
            refreshToken
          }), !!refreshTokenGuest);
        } catch (error) {
          // If the refresh token is invalid, we need to re-login the user
          if (error instanceof Error && 'response' in error) {
            // commerce-sdk-isomorphic throws a `ResponseError`, but doesn't export the class.
            // We can't use `instanceof`, so instead we just check for the `response` property
            // and assume it is a fetch Response.
            const json = yield error['response'].json();
            if (json.message === 'invalid refresh_token') {
              // clean up storage and restart the login flow
              _this2.clearStorage();
            }
          }
        }
      }
      return _this2.queueRequest(() => _commerceSdkIsomorphic.helpers.loginGuestUser(_this2.client, {
        redirectURI: _this2.redirectURI
      }), true);
    })();
  }

  /**
   * Creates a function that only executes after a session is initialized.
   * @param fn Function that needs to wait until the session is initialized.
   * @returns Wrapped function
   */
  whenReady(fn) {
    var _this3 = this;
    return /*#__PURE__*/_asyncToGenerator(function* (...args) {
      yield _this3.ready();
      return yield fn(...args);
    });
  }

  /**
   * A wrapper method for commerce-sdk-isomorphic helper: loginGuestUser.
   *
   */
  loginGuestUser() {
    var _this4 = this;
    return _asyncToGenerator(function* () {
      const redirectURI = _this4.redirectURI;
      const usid = _this4.get('usid');
      const isGuest = true;
      return _this4.queueRequest(() => _commerceSdkIsomorphic.helpers.loginGuestUser(_this4.client, _objectSpread({
        redirectURI
      }, usid && {
        usid
      })), isGuest);
    })();
  }

  /**
   * This is a wrapper method for ShopperCustomer API registerCustomer endpoint.
   *
   */
  register(body) {
    var _this5 = this;
    return _asyncToGenerator(function* () {
      const {
        customer: {
          email
        },
        password
      } = body;

      // email is optional field from isomorphic library
      // type CustomerRegistration
      // here we had to guard it to avoid ts error
      if (!email) {
        throw new Error('Customer registration is missing email address.');
      }
      const res = yield _this5.shopperCustomersClient.registerCustomer({
        headers: {
          authorization: `Bearer ${_this5.get('access_token')}`
        },
        body
      });

      if (res.statusCode == 400) {
        throw new Error(res.statusMessage)
      } else {
        yield _this5.loginRegisteredUserB2C({
          username: email,
          password
        });
      }
      return res;
    })();
  }

  /**
   * A wrapper method for commerce-sdk-isomorphic helper: loginRegisteredUserB2C.
   *
   */
  loginRegisteredUserB2C(credentials) {
    var _this6 = this;
    return _asyncToGenerator(function* () {
      const redirectURI = _this6.redirectURI;
      const usid = _this6.get('usid');
      const isGuest = false;
      const token = yield _commerceSdkIsomorphic.helpers.loginRegisteredUserB2C(_this6.client, credentials, _objectSpread({
        redirectURI
      }, usid && {
        usid
      }));
      _this6.handleTokenResponse(token, isGuest);
      if ((0, _utils.onClient)() && _this6.OCAPISessionsURL) {
        void _this6.createOCAPISession();
      }
      return token;
    })();
  }

  /**
   * A wrapper method for commerce-sdk-isomorphic helper: logout.
   *
   */
  logout() {
    var _this7 = this;
    return _asyncToGenerator(function* () {
      // Not awaiting on purpose because there isn't much we can do if this fails.
      void _commerceSdkIsomorphic.helpers.logout(_this7.client, {
        accessToken: _this7.get('access_token'),
        refreshToken: _this7.get('refresh_token_registered')
      });
      _this7.clearStorage();
      return _this7.loginGuestUser();
    })();
  }

  /**
   * Make a post request to the OCAPI /session endpoint to bridge the session.
   *
   * The HTTP response contains a set-cookie header which sets the dwsid session cookie.
   * This cookie is used on SFRA, and it allows shoppers to navigate between SFRA and
   * this PWA site seamlessly; this is often used to enable hybrid deployment.
   *
   * (Note: this method is client side only, b/c MRT doesn't support set-cookie header right now)
   *
   * @returns {Promise}
   */
  createOCAPISession() {
    return fetch(this.OCAPISessionsURL, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + this.get('access_token')
      }
    });
  }

  /**
   * Decode SLAS JWT and extract information such as customer id, usid, etc.
   *
   */
  parseSlasJWT(jwt) {
    const payload = (0, _jwtDecode.default)(jwt);
    const {
      sub,
      isb
    } = payload;
    if (!sub || !isb) {
      throw new Error('Unable to parse access token payload: missing sub and isb.');
    }

    // ISB format
    // 'uido:ecom::upn:Guest||xxxEmailxxx::uidn:FirstName LastName::gcid:xxxGuestCustomerIdxxx::rcid:xxxRegisteredCustomerIdxxx::chid:xxxSiteIdxxx',
    const isbParts = isb.split('::');
    const isGuest = isbParts[1] === 'upn:Guest';
    const customerId = isGuest ? isbParts[3].replace('gcid:', '') : isbParts[4].replace('rcid:', '');
    // SUB format
    // cc-slas::zzrf_001::scid:c9c45bfd-0ed3-4aa2-xxxx-40f88962b836::usid:b4865233-de92-4039-xxxx-aa2dfc8c1ea5
    const usid = sub.split('::')[3].replace('usid:', '');
    return {
      isGuest,
      customerId,
      usid
    };
  }
}
var _default = Auth;
exports.default = _default;