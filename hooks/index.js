"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
var _exportNames = {};

var _useAuthHelper = require("./useAuthHelper");
Object.keys(_useAuthHelper).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _useAuthHelper[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _useAuthHelper[key];
    },
  });
});

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}
