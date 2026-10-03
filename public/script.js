var POLA = "MMLLPPLSSL".split(""),
  NAMA = ["Arif", "Ayup", "Hafiz", "Prima", "Wisnu", "Cadangan"],
  OFF = [8, 4, 0, 6, 2, 0],
  CAD = 5;
var NM = { P: "Pagi", S: "Sore", M: "Malam", L: "Libur", I: "Izin" };
var izin = {},
  tukarList = [],
  CUT = -1;
function base(n, i) {
  if (n === CAD) return "L";
  return POLA[(((i + OFF[n]) % 10) + 10) % 10];
}
var ST = { P: 7, S: 15, M: -1 },
  EN = { P: 15, S: 23, M: 7 };
function mulaiJam(sh, d) {
  return 24 * d + ST[sh];
}
function akhirJam(sh, d) {
  return 24 * d + EN[sh];
}
function minRest() {
  var v = parseInt(document.getElementById("minrest").value);
  return isNaN(v) ? 12 : v;
}
function hitung(days) {
  var LALU = document.getElementById("lalu").checked,
    LO = 0,
    HI = 0,
    HI2 = 0,
    MR = minRest(),
    ML = 99,
    idx = [0, 1, 2, 3, 4, 5],
    beban = [0, 0, 0, 0, 0, 0],
    notes = [],
    st = [],
    i,
    n;
  for (i = 0; i < days; i++)
    st.push(
      NAMA.map(function (_, n) {
        var b = base(n, i);
        return { c: b, orig: b };
      }),
    );
  function klon(a) {
    return a.map(function (r) {
      return r.map(function (x) {
        var o = {};
        for (var k in x) o[k] = x[k];
        return o;
      });
    });
  }
  function shiftAt(a, c, e) {
    return e >= 0 && e < days ? a[e][c].c : base(c, e);
  }
  function need(x, y) {
    return x === "M" && y !== x ? 3 : 1;
  }
  function konflik(a, c, sh, d) {
    var out = [];
    for (var e = d - 3; e <= d + 3; e++) {
      if (e === d) continue;
      var s = shiftAt(a, c, e);
      if (s === "L" || s === "I") continue;
      var gap =
        e < d
          ? mulaiJam(sh, d) - akhirJam(s, e)
          : mulaiJam(s, e) - akhirJam(sh, d);
      var nd = Math.abs(e - d),
        nb = e < d ? need(s, sh) : need(sh, s);
      if (gap < MR || nd < nb) out.push({ e: e, s: s });
    }
    return out;
  }
  function isiList(a, list, lvl, banned) {
    var cur = a,
      parts = [],
      cost = 0;
    for (var k = 0; k < list.length; k++) {
      var r = isi(cur, list[k].d, list[k].s, list[k].by, lvl, banned);
      if (!r) return null;
      cur = r.st;
      parts = parts.concat(r.parts);
      cost += r.cost;
    }
    return { st: cur, parts: parts, cost: cost };
  }
  function isi(a, d, sh, by, lvl, banned) {
    var best = null;
    var direct = idx.filter(function (c) {
      return (
        (c !== CAD || sh === "S") &&
        a[d][c].c === "L" &&
        !a[d][c].lock &&
        banned.indexOf(c) < 0 &&
        konflik(a, c, sh, d).length === 0
      );
    });
    if (direct.length) {
      var p = direct.reduce(function (x, y) {
        return beban[y] < beban[x] ? y : x;
      });
      var b = klon(a);
      b[d][p] = { c: sh, orig: "L", sub: true, by: NAMA[by] };
      return {
        st: b,
        cost: 1,
        parts: [{ d: d, p: p, by: by, sh: sh }],
        who: p,
      };
    }
    if (lvl >= ML) return null;
    idx.forEach(function (c) {
      var cur = a[d][c].c;
      if (c === CAD && sh !== "S") return;
      if (cur === "I" || cur === sh || banned.indexOf(c) >= 0) return;
      var freed = konflik(a, c, sh, d).map(function (x) {
        return { d: x.e, s: x.s, by: c };
      });
      if (cur !== "L") freed.unshift({ d: d, s: cur, by: c });
      if (!freed.length || freed.length > 2) return;
      for (var q = 0; q < freed.length; q++) {
        if (
          freed[q].d < LO ||
          freed[q].d > HI2 ||
          freed[q].d >= days ||
          freed[q].d <= CUT
        )
          return;
        if (a[freed[q].d][c].lock) return;
        if (!LALU && mulaiJam(freed[q].s, freed[q].d) < mulaiJam(sh, d)) return;
      }
      var b = klon(a);
      b[d][c] = { c: sh, orig: a[d][c].orig, sub: true, by: NAMA[by] };
      freed.forEach(function (f) {
        if (f.d !== d)
          b[f.d][c] = { c: "L", orig: a[f.d][c].orig, freed: true };
      });
      var r = isiList(b, freed, lvl + 1, banned.concat([c]));
      if (!r) return;
      var cost = 1 + r.cost;
      if (
        !best ||
        cost < best.cost ||
        (cost === best.cost && beban[c] < beban[best.who])
      )
        best = {
          st: r.st,
          cost: cost,
          parts: [{ d: d, p: c, by: by, sh: sh }].concat(r.parts),
          who: c,
        };
    });
    return best;
  }
  var slots = [],
    ORD = { M: 0, P: 1, S: 2 },
    tkr = [];
  tukarList
    .slice()
    .sort(function (a, b) {
      return (
        (a.iA === undefined ? a.i : a.iA) - (b.iA === undefined ? b.i : b.iA)
      );
    })
    .forEach(function (t) {
      var da = t.iA === undefined ? t.i : t.iA,
        db = t.iB === undefined ? da : t.iB;
      if (da < 0 || da >= days || db < 0 || db >= days) return;
      var ia = NAMA.indexOf(t.a),
        ib = NAMA.indexOf(t.b);
      if (ia < 0 || ib < 0 || ia === ib || ia === CAD || ib === CAD) return;
      var sa = st[da][ia].c,
        sb = st[db][ib].c;
      if (sa === sb && da === db) return;
      if (da === db) {
        if (st[da][ia].lock || st[db][ib].lock) return;
        st[da][ia] = {
          c: sb,
          orig: sb,
          tukar: true,
          lock: true,
          pair: NAMA[ib],
        };
        st[db][ib] = {
          c: sa,
          orig: sa,
          tukar: true,
          lock: true,
          pair: NAMA[ia],
        };
        tkr.push({ d: da, p: ia, swap: t }, { d: db, p: ib, swap: t });
      } else {
        if (
          st[da][ia].lock ||
          st[da][ib].lock ||
          st[db][ia].lock ||
          st[db][ib].lock ||
          sa === "L" ||
          sa === "I" ||
          sb === "L" ||
          sb === "I" ||
          st[da][ib].c === "I" ||
          st[db][ia].c === "I"
        )
          return;
        var shiftLamaB = st[da][ib].c,
          shiftLamaA = st[db][ia].c;
        st[da][ia] = {
          c: "L",
          orig: "L",
          tukar: true,
          lock: true,
          pair: NAMA[ib],
        };
        st[da][ib] = {
          c: sa,
          orig: sa,
          tukar: true,
          lock: true,
          pair: NAMA[ia],
        };
        st[db][ib] = {
          c: "L",
          orig: "L",
          tukar: true,
          lock: true,
          pair: NAMA[ia],
        };
        st[db][ia] = {
          c: sb,
          orig: sb,
          tukar: true,
          lock: true,
          pair: NAMA[ib],
        };
        tkr.push({ d: da, p: ib, swap: t }, { d: db, p: ia, swap: t });
        if (shiftLamaB !== "L" && shiftLamaB !== sa)
          notes.push({
            i: da,
            warn: true,
            t:
              "Peringatan: shift " +
              NM[shiftLamaB] +
              " milik " +
              NAMA[ib] +
              " diganti dan menjadi kosong.",
          });
        if (shiftLamaA !== "L" && shiftLamaA !== sb)
          notes.push({
            i: db,
            warn: true,
            t:
              "Peringatan: shift " +
              NM[shiftLamaA] +
              " milik " +
              NAMA[ia] +
              " diganti dan menjadi kosong.",
          });
      }
      notes.push({
        i: da,
        tk: true,
        t:
          "Tukar disepakati: " +
          NAMA[ia] +
          " " +
          NM[sa] +
          " (" +
          fmt(tgl(da)) +
          ") ↔ " +
          NAMA[ib] +
          " " +
          NM[sb] +
          " (" +
          fmt(tgl(db)) +
          ")",
      });
    });
  for (i = 0; i < days; i++)
    for (n = 0; n < NAMA.length; n++) {
      if (izin[i + "|" + n]) {
        if (st[i][n].orig !== "L")
          slots.push({ d: i, n: n, sh: st[i][n].orig });
        st[i][n] = { c: "I", orig: st[i][n].orig };
      }
    }
  var restWarnings = [];
  tkr.forEach(function (entry) {
    var shift = st[entry.d][entry.p].c;
    if (shift === "L" || shift === "I") return;
    konflik(st, entry.p, shift, entry.d).forEach(function (conflict) {
      var gap =
        conflict.e < entry.d
          ? mulaiJam(shift, entry.d) - akhirJam(conflict.s, conflict.e)
          : mulaiJam(conflict.s, conflict.e) - akhirJam(shift, entry.d);
      if (gap >= MR) return;
      var warning = restWarnings.find(function (item) {
        return item.swap === entry.swap;
      });
      if (!warning) {
        warning = {
          swap: entry.swap,
          day: entry.d,
          gap: gap,
          people: [],
        };
        restWarnings.push(warning);
      }
      if (gap < warning.gap) {
        warning.gap = gap;
        warning.people = [entry.p];
      } else if (
        gap === warning.gap &&
        warning.people.indexOf(entry.p) < 0
      ) {
        warning.people.push(entry.p);
      }
    });
  });
  restWarnings.forEach(function (warning) {
    notes.push({
      i: warning.day,
      warn: true,
      t:
        "Peringatan: " +
        warning.people
          .map(function (person) {
            return NAMA[person];
          })
          .join(" dan ") +
        " istirahatnya hanya " +
        Math.max(0, warning.gap) +
        " jam.",
    });
  });
  slots.sort(function (a, b) {
    return a.d - b.d || ORD[a.sh] - ORD[b.sh];
  });
  slots.forEach(function (x) {
    var dt = tgl(x.d);
    LO = Math.max(0, idxOf(dt.getFullYear(), dt.getMonth(), 1));
    HI = idxOf(dt.getFullYear(), dt.getMonth() + 1, 0);
    HI2 = idxOf(dt.getFullYear(), dt.getMonth() + 2, 0);
    var LALU0 = LALU;
    if (x.rep) LALU = false;
    var r = isi(st, x.d, x.sh, x.n, 0, [x.n, CAD]);
    var pakaiCad = false;
    if (!r) {
      r = isi(st, x.d, x.sh, x.n, 0, [x.n]);
      pakaiCad = !!r;
    }
    LALU = LALU0;
    if (r) {
      st = r.st;
      r.parts.forEach(function (q) {
        beban[q.p]++;
      });
      var txt = r.parts
        .map(function (q) {
          return (
            NAMA[q.p] +
            " gantiin " +
            NAMA[q.by] +
            " (" +
            NM[q.sh] +
            " " +
            fmt(tgl(q.d)) +
            ")"
          );
        })
        .join("; ");
      var multi = r.parts.length > 1 || pakaiCad;
      if (x.rep) txt = "Sesuaikan setelah tukar: " + txt;
      if (!x.rep && document.getElementById("balik").checked) {
        var p0 = r.parts[0].p,
          bE = -1,
          bD = 1e9;
        for (var e = Math.max(x.d, CUT) + 1; e <= HI && e < days; e++) {
          var cell = st[e][p0];
          if (cell.c === "L" || cell.c === "I" || cell.sub || cell.freed)
            continue;
          if (st[e][x.n].c !== "L" || konflik(st, x.n, cell.c, e).length)
            continue;
          var dist = e - x.d;
          if (dist < bD) {
            bD = dist;
            bE = e;
          }
        }
        if (bE >= 0) {
          var sB = st[bE][p0].c;
          st[bE][x.n] = { c: sB, orig: "L", sub: true, by: NAMA[p0] };
          st[bE][p0] = { c: "L", orig: st[bE][p0].orig, freed: true };
          beban[p0]--;
          multi = true;
          txt +=
            "; " +
            NAMA[x.n] +
            " tukar balik ambil " +
            NM[sB] +
            " " +
            NAMA[p0] +
            " (" +
            fmt(tgl(bE)) +
            ")";
        }
      }
      notes.push({ i: x.d, warn: multi, t: txt });
    } else {
      st[x.d][x.n].kosong = 1;
      notes.push({
        i: x.d,
        bad: 1,
        t: x.rep
          ? "Shift " +
            NM[x.sh] +
            " " +
            NAMA[x.n] +
            " kosong setelah tukar (bentrok istirahat). Tidak ada pengganti."
          : "Shift " +
            NM[x.sh] +
            " kosong, " +
            NAMA[x.n] +
            " izin. Tidak ada pengganti, termasuk tukar berantai dan cadangan.",
      });
    }
  });
  return { res: st, notes: notes };
}
var HR = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
var vy = 2026,
  vm = 9,
  BLN = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
var ANCHOR = new Date(2026, 8, 30);
function tgl(i) {
  return new Date(2026, 8, 30 + i);
}
function idxOf(y, m, dd) {
  return Math.round((new Date(y, m, dd) - ANCHOR) / 86400000);
}
function fmt(d) {
  return (
    ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2)
  );
}
function render() {
  var i0 = Math.max(0, idxOf(vy, vm, 1)),
    i1 = idxOf(vy, vm + 1, 0),
    now = new Date();
  CUT = idxOf(now.getFullYear(), now.getMonth(), now.getDate());
  var h = hitung(i1 + 32),
    t = document.getElementById("t");
  document.getElementById("bln").textContent = BLN[vm] + " " + vy;
  document.getElementById("prev").disabled = vy === 2026 && vm <= 8;
  document.getElementById("next").disabled = vy === 2027 && vm >= 11;
  var html =
    "<tr><th></th>" +
    NAMA.map(function (n) {
      return "<th>" + n + "</th>";
    }).join("") +
    "</tr>";
  h.res.forEach(function (row, i) {
    if (i < i0 || i > i1) return;
    var d = tgl(i),
      wk = d.getDay() === 0 || d.getDay() === 6,
      lw = i <= CUT;
    html +=
      "<tr><td class='d" +
      (wk ? " wk" : "") +
      (lw ? " lewat" : "") +
      "'>" +
      HR[d.getDay()] +
      " " +
      fmt(d) +
      "</td>";
    row.forEach(function (c, n) {
      var can = true;
      html +=
        "<td class='c " +
        c.c +
        (c.sub ? " sub" : "") +
        (c.warn ? " warn" : "") +
        (c.freed ? " freed" : "") +
        (c.tukar ? " tukar" : "") +
        (lw ? " lewat" : "") +
        "' data-i='" +
        i +
        "' data-n='" +
        n +
        "'" +
        (can && !lw ? " tabindex='0' role='button'" : "") +
        ">" +
        NM[c.c] +
        (c.sub
          ? "*<small>←" +
            c.by +
            (c.warn ? " · " + c.warn + "j" : "") +
            "</small>"
          : "") +
        (c.freed ? "<small>digantikan</small>" : "") +
        (c.tukar ? "<small>↔" + c.pair + "</small>" : "") +
        (c.kosong ? "<small>KOSONG</small>" : "") +
        "</td>";
    });
    html += "</tr>";
  });
  t.innerHTML = html;
  var mn = h.notes.filter(function (x) {
    return x.i >= i0 && x.i <= i1;
  });
  var nh = mn.length
    ? mn
        .map(function (x) {
          return (
            "<div" +
            (x.bad
              ? " class='bad'"
              : x.tk
                ? " class='tk'"
                : x.warn
                  ? " class='wr'"
                  : "") +
            "><b>" +
            fmt(tgl(x.i)) +
            "</b> " +
            x.t +
            "</div>"
          );
        })
        .join("")
    : "<div>Belum ada izin atau tukar bulan ini. Ketuk sel untuk menandai izin.</div>";
  document.getElementById("notes").innerHTML = "<b>Pergantian</b>" + nh;
  isiPilihanTukar(i0, i1);
}
document.getElementById("prev").addEventListener("click", function () {
  vm--;
  if (vm < 0) {
    vm = 11;
    vy--;
  }
  render();
});
document.getElementById("next").addEventListener("click", function () {
  vm++;
  if (vm > 11) {
    vm = 0;
    vy++;
  }
  render();
});
document.getElementById("minrest").addEventListener("input", render);
document.getElementById("balik").addEventListener("change", render);
document.getElementById("lalu").addEventListener("change", render);

var aksiKonfirmasiTukar = null;
function bukaKonfirmasiTukar(pesan, lanjutkan) {
  document.getElementById("pt").textContent = "Konfirmasi tukar";
  document.getElementById("pp").textContent = pesan + " Tetap lanjutkan tukar?";
  document.getElementById("pc").hidden = true;
  document.getElementById("pactions").hidden = false;
  document.getElementById("pop").hidden = false;
  aksiKonfirmasiTukar = lanjutkan;
  document.getElementById("pno").focus();
}
function tutupInfo() {
  document.getElementById("pop").hidden = true;
  document.getElementById("pc").hidden = false;
  document.getElementById("pactions").hidden = true;
  aksiKonfirmasiTukar = null;
}
document.getElementById("pc").addEventListener("click", tutupInfo);
document.getElementById("pno").addEventListener("click", tutupInfo);
document.getElementById("pyes").addEventListener("click", function () {
  var lanjutkan = aksiKonfirmasiTukar;
  tutupInfo();
  if (lanjutkan) lanjutkan();
});
document.getElementById("pop").addEventListener("click", function (e) {
  if (e.target === this) tutupInfo();
});
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") tutupInfo();
});