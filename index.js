"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});

var _exportNames = {
  CommerceApiProvider: true,
};

var _hooks = require("./hooks");
Object.keys(_hooks).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _hooks[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _hooks[key];
    },
  });
});
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}
