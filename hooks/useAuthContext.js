"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireDefault(require("react"));
var _provider = require("@salesforce/commerce-sdk-react/provider");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * TBD
 *
 * @internal
 */
const useAuthContext = () => {
  const context = _react.default.useContext(_provider.AuthContext);
  if (!context) {
    throw new Error('Missing CommerceApiProvider. You probably forget to render the provider.');
  }
  return context;
};
var _default = useAuthContext;
exports.default = _default;