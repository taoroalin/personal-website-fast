// array/string stepper. interesting
function l(a) {
  var b = 0;
  return function () {
    return b < a.length ? { done: !1, value: a[b++] } : { done: !0 };
  };
}

function n(a) {
  var b = "undefined" != typeof Symbol && Symbol.iterator && a[Symbol.iterator];
  return b ? b.call(a) : { next: l(a) };
}
var p =
  "function" == typeof Object.defineProperties
    ? Object.defineProperty
    : function (a, b, d) {
        if (a == Array.prototype || a == Object.prototype) return a;
        a[b] = d.value;
        return a;
      };
function r(a) {
  a = [
    "object" == typeof globalThis && globalThis,
    a,
    "object" == typeof window && window,
    "object" == typeof self && self,
    "object" == typeof global && global,
  ];
  for (var b = 0; b < a.length; ++b) {
    var d = a[b];
    if (d && d.Math == Math) return d;
  }
  throw Error("Cannot find global object");
}
var u = r(this);
function v(a, b) {
  if (b)
    a: {
      var d = u;
      a = a.split(".");
      for (var e = 0; e < a.length - 1; e++) {
        var g = a[e];
        if (!(g in d)) break a;
        d = d[g];
      }
      a = a[a.length - 1];
      e = d[a];
      b = b(e);
      b != e &&
        null != b &&
        p(d, a, { configurable: !0, writable: !0, value: b });
    }
}
function x() {
  this.m = !1;
  this.g = null;
  this.s = void 0;
  this.h = 1;
  this.v = 0;
  this.i = null;
}
function y(a) {
  if (a.m) throw new TypeError("Generator is already running");
  a.m = !0;
}
x.prototype.o = function (a) {
  this.s = a;
};
function z(a, b) {
  a.i = { I: b, J: !0 };
  a.h = a.v;
}
x.prototype.return = function (a) {
  this.i = { return: a };
  this.h = this.v;
};
function A(a, b) {
  a.h = 2;
  return { value: b };
}
function B(a) {
  this.g = new x();
  this.h = a;
}
function C(a, b) {
  y(a.g);
  var d = a.g.g;
  if (d)
    return D(
      a,
      "return" in d
        ? d["return"]
        : function (e) {
            return { value: e, done: !0 };
          },
      b,
      a.g.return
    );
  a.g.return(b);
  return E(a);
}
function D(a, b, d, e) {
  try {
    var g = b.call(a.g.g, d);
    if (!(g instanceof Object))
      throw new TypeError("Iterator result " + g + " is not an object");
    if (!g.done) return (a.g.m = !1), g;
    var k = g.value;
  } catch (c) {
    return (a.g.g = null), z(a.g, c), E(a);
  }
  a.g.g = null;
  e.call(a.g, k);
  return E(a);
}
function E(a) {
  for (; a.g.h; )
    try {
      var b = a.h(a.g);
      if (b) return (a.g.m = !1), { value: b.value, done: !1 };
    } catch (d) {
      (a.g.s = void 0), z(a.g, d);
    }
  a.g.m = !1;
  if (a.g.i) {
    b = a.g.i;
    a.g.i = null;
    if (b.J) throw b.I;
    return { value: b.return, done: !0 };
  }
  return { value: void 0, done: !0 };
}
function F(a) {
  this.next = function (b) {
    y(a.g);
    a.g.g ? (b = D(a, a.g.g.next, b, a.g.o)) : (a.g.o(b), (b = E(a)));
    return b;
  };
  this.throw = function (b) {
    y(a.g);
    a.g.g ? (b = D(a, a.g.g["throw"], b, a.g.o)) : (z(a.g, b), (b = E(a)));
    return b;
  };
  this.return = function (b) {
    return C(a, b);
  };
  this[Symbol.iterator] = function () {
    return this;
  };
}
function G(a) {
  function b(e) {
    return a.next(e);
  }
  function d(e) {
    return a.throw(e);
  }
  return new Promise(function (e, g) {
    function k(c) {
      c.done ? e(c.value) : Promise.resolve(c.value).then(b, d).then(k, g);
    }
    k(a.next());
  });
}
v("Symbol", function (a) {
  function b(g) {
    if (this instanceof b) throw new TypeError("Symbol is not a constructor");
    return new d("jscomp_symbol_" + (g || "") + "_" + e++, g);
  }
  function d(g, k) {
    this.g = g;
    p(this, "description", { configurable: !0, writable: !0, value: k });
  }
  if (a) return a;
  d.prototype.toString = function () {
    return this.g;
  };
  var e = 0;
  return b;
});
v("Symbol.iterator", function (a) {
  if (a) return a;
  a = Symbol("Symbol.iterator");
  for (
    var b = "Array Int8Array Uint8Array Uint8ClampedArray Int16Array Uint16Array Int32Array Uint32Array Float32Array Float64Array".split(
        " "
      ),
      d = 0;
    d < b.length;
    d++
  ) {
    var e = u[b[d]];
    "function" === typeof e &&
      "function" != typeof e.prototype[a] &&
      p(e.prototype, a, {
        configurable: !0,
        writable: !0,
        value: function () {
          return H(l(this));
        },
      });
  }
  return a;
});
function H(a) {
  a = { next: a };
  a[Symbol.iterator] = function () {
    return this;
  };
  return a;
}
v("Promise", function (a) {
  function b(c) {
    this.h = 0;
    this.i = void 0;
    this.g = [];
    this.v = !1;
    var f = this.m();
    try {
      c(f.resolve, f.reject);
    } catch (h) {
      f.reject(h);
    }
  }
  function d() {
    this.g = null;
  }
  function e(c) {
    return c instanceof b
      ? c
      : new b(function (f) {
          f(c);
        });
  }
  if (a) return a;
  d.prototype.h = function (c) {
    if (null == this.g) {
      this.g = [];
      var f = this;
      this.i(function () {
        f.o();
      });
    }
    this.g.push(c);
  };
  var g = u.setTimeout;
  d.prototype.i = function (c) {
    g(c, 0);
  };
  d.prototype.o = function () {
    for (; this.g && this.g.length; ) {
      var c = this.g;
      this.g = [];
      for (var f = 0; f < c.length; ++f) {
        var h = c[f];
        c[f] = null;
        try {
          h();
        } catch (m) {
          this.m(m);
        }
      }
    }
    this.g = null;
  };
  d.prototype.m = function (c) {
    this.i(function () {
      throw c;
    });
  };
  b.prototype.m = function () {
    function c(m) {
      return function (q) {
        h || ((h = !0), m.call(f, q));
      };
    }
    var f = this,
      h = !1;
    return { resolve: c(this.D), reject: c(this.o) };
  };
  b.prototype.D = function (c) {
    if (c === this) this.o(new TypeError("A Promise cannot resolve to itself"));
    else if (c instanceof b) this.G(c);
    else {
      a: switch (typeof c) {
        case "object":
          var f = null != c;
          break a;
        case "function":
          f = !0;
          break a;
        default:
          f = !1;
      }
      f ? this.C(c) : this.s(c);
    }
  };
  b.prototype.C = function (c) {
    var f = void 0;
    try {
      f = c.then;
    } catch (h) {
      this.o(h);
      return;
    }
    "function" == typeof f ? this.H(f, c) : this.s(c);
  };
  b.prototype.o = function (c) {
    this.B(2, c);
  };
  b.prototype.s = function (c) {
    this.B(1, c);
  };
  b.prototype.B = function (c, f) {
    if (0 != this.h)
      throw Error(
        "Cannot settle(" +
          c +
          ", " +
          f +
          "): Promise already settled in state" +
          this.h
      );
    this.h = c;
    this.i = f;
    2 === this.h && this.F();
    this.L();
  };
  b.prototype.F = function () {
    var c = this;
    g(function () {
      if (c.M()) {
        var f = u.console;
        "undefined" !== typeof f && f.error(c.i);
      }
    }, 1);
  };
  b.prototype.M = function () {
    if (this.v) return !1;
    var c = u.CustomEvent,
      f = u.Event,
      h = u.dispatchEvent;
    if ("undefined" === typeof h) return !0;
    "function" === typeof c
      ? (c = new c("unhandledrejection", { cancelable: !0 }))
      : "function" === typeof f
      ? (c = new f("unhandledrejection", { cancelable: !0 }))
      : ((c = u.document.createEvent("CustomEvent")),
        c.initCustomEvent("unhandledrejection", !1, !0, c));
    c.promise = this;
    c.reason = this.i;
    return h(c);
  };
  b.prototype.L = function () {
    if (null != this.g) {
      for (var c = 0; c < this.g.length; ++c) k.h(this.g[c]);
      this.g = null;
    }
  };
  var k = new d();
  b.prototype.G = function (c) {
    var f = this.m();
    c.A(f.resolve, f.reject);
  };
  b.prototype.H = function (c, f) {
    var h = this.m();
    try {
      c.call(f, h.resolve, h.reject);
    } catch (m) {
      h.reject(m);
    }
  };
  b.prototype.then = function (c, f) {
    function h(t, w) {
      return "function" == typeof t
        ? function (L) {
            try {
              m(t(L));
            } catch (M) {
              q(M);
            }
          }
        : w;
    }
    var m,
      q,
      N = new b(function (t, w) {
        m = t;
        q = w;
      });
    this.A(h(c, m), h(f, q));
    return N;
  };
  b.prototype.catch = function (c) {
    return this.then(void 0, c);
  };
  b.prototype.A = function (c, f) {
    function h() {
      switch (m.h) {
        case 1:
          c(m.i);
          break;
        case 2:
          f(m.i);
          break;
        default:
          throw Error("Unexpected state: " + m.h);
      }
    }
    var m = this;
    null == this.g ? k.h(h) : this.g.push(h);
    this.v = !0;
  };
  b.resolve = e;
  b.reject = function (c) {
    return new b(function (f, h) {
      h(c);
    });
  };
  b.race = function (c) {
    return new b(function (f, h) {
      for (var m = n(c), q = m.next(); !q.done; q = m.next())
        e(q.value).A(f, h);
    });
  };
  b.all = function (c) {
    var f = n(c),
      h = f.next();
    return h.done
      ? e([])
      : new b(function (m, q) {
          function N(L) {
            return function (M) {
              t[L] = M;
              w--;
              0 == w && m(t);
            };
          }
          var t = [],
            w = 0;
          do
            t.push(void 0),
              w++,
              e(h.value).A(N(t.length - 1), q),
              (h = f.next());
          while (!h.done);
        });
  };
  return b;
});
v("Array.from", function (a) {
  return a
    ? a
    : function (b, d, e) {
        d =
          null != d
            ? d
            : function (f) {
                return f;
              };
        var g = [],
          k =
            "undefined" != typeof Symbol &&
            Symbol.iterator &&
            b[Symbol.iterator];
        if ("function" == typeof k) {
          b = k.call(b);
          for (var c = 0; !(k = b.next()).done; )
            g.push(d.call(e, k.value, c++));
        } else for (k = b.length, c = 0; c < k; c++) g.push(d.call(e, b[c], c));
        return g;
      };
});
v("String.prototype.matchAll", function (a) {
  return a
    ? a
    : function (b) {
        if (b instanceof RegExp && !b.global)
          throw new TypeError(
            "RegExp passed into String.prototype.matchAll() must have global tag."
          );
        var d = new RegExp(b, b instanceof RegExp ? void 0 : "g"),
          e = this,
          g = !1,
          k = {
            next: function () {
              var c = {},
                f = d.lastIndex;
              if (g) return { value: void 0, done: !0 };
              var h = d.exec(e);
              if (!h) return (g = !0), { value: void 0, done: !0 };
              d.lastIndex === f && (d.lastIndex += 1);
              c.value = h;
              c.done = !1;
              return c;
            },
          };
        k[Symbol.iterator] = function () {
          return k;
        };
        return k;
      };
});
v("Array.prototype.fill", function (a) {
  return a
    ? a
    : function (b, d, e) {
        var g = this.length || 0;
        0 > d && (d = Math.max(0, g + d));
        if (null == e || e > g) e = g;
        e = Number(e);
        0 > e && (e = Math.max(0, g + e));
        for (d = Number(d || 0); d < e; d++) this[d] = b;
        return this;
      };
});
function I(a) {
  return a ? a : Array.prototype.fill;
}
v("Int8Array.prototype.fill", I);
v("Uint8Array.prototype.fill", I);
v("Uint8ClampedArray.prototype.fill", I);
v("Int16Array.prototype.fill", I);
v("Uint16Array.prototype.fill", I);
v("Int32Array.prototype.fill", I);
v("Uint32Array.prototype.fill", I);
v("Float32Array.prototype.fill", I);
v("Float64Array.prototype.fill", I);
var J = [],
  K = [],
  O,
  P,
  Q = 0,
  R = 0,
  S = 0,
  T = 0,
  U = !0,
  V = 936,
  W = 969,
  X = 0,
  Y = 0,
  aa = 2 * Math.PI;
function ba(a) {
  function b(g, k) {
    void 0 !== k.K &&
      Array.from(k.K.matchAll(/\[\[([^\]]+)\]\]/g)).forEach(function (c) {
        c = d[c[1]];
        if (void 0 !== c) {
          var f = g + 1e6 * c;
          void 0 === e[f] &&
            ((e[f] = !0), (J[g].u += 1), (J[c].u += 1), K.push([J[g], J[c]]));
        }
      });
    void 0 !== k.children &&
      k.children.forEach(function (c) {
        return b(g, c);
      });
  }
  var d = {};
  a.forEach(function (g, k) {
    return (d[g.title] = k);
  });
  J = a.map(function (g) {
    return {
      x: Math.random(),
      y: Math.random(),
      j: 0,
      l: 0,
      title: g.title,
      u: 0,
    };
  });
  K = [];
  var e = {};
  a.forEach(function (g) {
    void 0 !== g.children &&
      g.children.forEach(function (k) {
        return b(d[g.title], k);
      });
  });
}
function ca() {
  K.forEach(function (a) {
    var b = n(a);
    a = b.next().value;
    b = b.next().value;
    var d = 0.007 * (a.x - b.x),
      e = 0.007 * (a.y - b.y);
    a.j -= d;
    b.j += d;
    a.l -= e;
    b.l += e;
  });
  J.forEach(function (a) {
    return J.forEach(function (b) {
      var d =
          Math.abs((a.x - b.x) * (a.x - b.x) * (a.x - b.x)) +
          Math.abs((a.y - b.y) * (a.y - b.y) * (a.y - b.y)) +
          1e-4,
        e = ((a.x - b.x) / d) * 1e-7;
      d = ((a.y - b.y) / d) * 1e-7;
      a.j += e;
      b.j -= e;
      a.l += d;
      b.l -= d;
    });
  });
  J.forEach(function (a) {
    a.x += a.j;
    a.y += a.l;
    a.j *= 0.8;
    a.l *= 0.8;
  });
}
function da() {
  P.save();
  P.translate(-5e3, -5e3);
  P.clearRect(0, 0, 1e4, 1e4);
  P.restore();
  P.lineWidth = 0.002;
  K.forEach(function (a) {
    var b = n(a);
    a = b.next().value;
    b = b.next().value;
    P.beginPath();
    P.moveTo(a.x, a.y);
    P.lineTo(b.x, b.y);
    P.stroke();
  });
  P.fillStyle = "#555555";
  J.forEach(function (a) {
    P.beginPath();
    P.arc(a.x, a.y, 0.007 + 1e-4 * a.u, 0, aa, !1);
    P.fill();
  });
  P.fillStyle = "#eeeeee";
  J.forEach(function (a) {
    P.fillRect(a.x - 0.05, a.y, 0.1, 0.012);
  });
  P.font = "0.01px Verdana";
  P.fillStyle = "#000000";
  J.forEach(function (a) {
    P.fillText(a.title, a.x - 0.045, a.y + 0.01, 20);
  });
}
function Z() {
  U && ca();
  0 !== S && ((Y += R - T), (X += Q - S), (S = Q), (T = R));
  P.setTransform(V, 0, 0, W, X, Y);
  da();
  requestAnimationFrame(Z);
}
(function () {
  var a, b;
  return G(
    new F(
      new B(function (d) {
        if (1 == d.h)
          return (
            (O = document.getElementById("graph-canvas")),
            (P = O.getContext("2d")),
            P.scale(O.width, O.height),
            A(
              d,
              fetch("graphminer.json").then(function (e) {
                return e.json();
              })
            )
          );
        a = d.s;
        ba(a);
        O.addEventListener("mousemove", function (e) {
          Q = e.offsetX;
          R = e.offsetY;
        });
        O.addEventListener("mousedown", function (e) {
          S = e.offsetX;
          T = e.offsetY;
        });
        b = function () {
          T = S = 0;
        };
        O.addEventListener("mouseup", b);
        O.addEventListener("mouseleave", b);
        O.addEventListener("keypress", function (e) {
          "Space" == e.code && ((U = !U), e.stopPropagation());
        });
        O.addEventListener("wheel", function (e) {
          console.log(e.deltaY);
          var g = 1 / (1 + (e.deltaY / 100) * 0.15) - 1;
          e = W * (1 + g);
          g = V * (1 + g);
          X += (Q / 936) * V;
          Y += (R / 969) * W;
          V = g;
          W = e;
        });
        d.h = 0;
      })
    )
  );
})();
requestAnimationFrame(Z);
