"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.AuthHelpers = void 0;
exports.useAuthHelper = useAuthHelper;
var _reactQuery = require("@tanstack/react-query");
var _useAuthContext = _interopRequireDefault(require("./useAuthContext"));
var _utils = require("@salesforce/commerce-sdk-react/utils");
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}
/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * @group Helpers
 * @category Shopper Authentication
 * @enum
 */
const AuthHelpers = {
  LoginGuestUser: "loginGuestUser",
  LoginRegisteredUserB2C: "loginRegisteredUserB2C",
  Logout: "logout",
  Register: "register",
};
/**
 * @group Helpers
 * @category Shopper Authentication
 *
 */
exports.AuthHelpers = AuthHelpers;
const noop = () => ({});

/**
 * @internal
 */

/**
 * A hook for Public Client OAuth helpers.
 *
 * The hook calls the SLAS helpers imported from commerce-sdk-isomorphic.
 * For more, see https://github.com/SalesforceCommerceCloud/commerce-sdk-isomorphic/#public-client-shopper-login-helpers
 *
 * Avaliable helpers:
 * - loginRegisteredUserB2C
 * - loginGuestUser
 * - logout
 * - register
 *
 * @group Helpers
 * @category Shopper Authentication
 */
function useAuthHelper(mutation) {
  const auth = (0, _useAuthContext.default)();
  if (!auth[mutation])
    throw new Error(`Unknown login helper mutation: ${mutation}`);
  const queryClient = (0, _reactQuery.useQueryClient)();
  // I'm not sure if there's a way to avoid this type assertion, but, I'm fairly confident that
  // it is safe to do, as it seems to be simply re-asserting what we already know.
  const method = auth[mutation].bind(auth);
  return (0, _reactQuery.useMutation)(auth.whenReady(method), {
    onSuccess(data, options) {
      const getCacheUpdates = cacheUpdateMatrix[mutation];
      if (getCacheUpdates) {
        const cacheUpdates = getCacheUpdates(options, data);
        (0, _utils.updateCache)(queryClient, cacheUpdates, data);
      }
    },
  });
}
const cacheUpdateMatrix = {
  loginRegisteredUserB2C: noop,
  loginGuestUser: noop,
  logout() {
    return {
      remove: [
        {
          queryKey: ["/commerce-sdk-react"],
        },
      ],
    };
  },
  register: noop,
};
