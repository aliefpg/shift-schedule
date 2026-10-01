var POLA = "MMLLPPLSSL".split(""),
  NAMA = ["Arif", "Ayup", "Hafiz", "Prima", "Wisnu", "Cadangan"],
  OFF = [8, 4, 0, 6, 2, 0],
  CAD = 5;
var NM = { P: "Pagi", S: "Sore", M: "Malam", L: "Libur", I: "Izin" };
var izin = {};
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
        if (freed[q].d < LO || freed[q].d > HI2 || freed[q].d >= days) return;
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
    ORD = { M: 0, P: 1, S: 2 };
  for (i = 0; i < days; i++)
    for (n = 0; n < NAMA.length; n++) {
      if (izin[i + "|" + n]) {
        if (st[i][n].orig !== "L")
          slots.push({ d: i, n: n, sh: st[i][n].orig });
        st[i][n] = { c: "I", orig: st[i][n].orig };
      }
    }
  slots.sort(function (a, b) {
    return a.d - b.d || ORD[a.sh] - ORD[b.sh];
  });
  slots.forEach(function (x) {
    var dt = tgl(x.d);
    LO = Math.max(0, idxOf(dt.getFullYear(), dt.getMonth(), 1));
    HI = idxOf(dt.getFullYear(), dt.getMonth() + 1, 0);
    HI2 = idxOf(dt.getFullYear(), dt.getMonth() + 2, 0);
    var r = isi(st, x.d, x.sh, x.n, 0, [x.n, CAD]);
    var pakaiCad = false;
    if (!r) {
      r = isi(st, x.d, x.sh, x.n, 0, [x.n]);
      pakaiCad = !!r;
    }
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
      if (document.getElementById("balik").checked) {
        var p0 = r.parts[0].p,
          bE = -1,
          bD = 1e9;
        for (var e = x.d + 1; e <= HI && e < days; e++) {
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
        t:
          "Shift " +
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
    i1 = idxOf(vy, vm + 1, 0);
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
      wk = d.getDay() === 0 || d.getDay() === 6;
    html +=
      "<tr><td class='d" +
      (wk ? " wk" : "") +
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
        "' data-i='" +
        i +
        "' data-n='" +
        n +
        "'" +
        (can ? " tabindex='0' role='button'" : "") +
        ">" +
        NM[c.c] +
        (c.sub
          ? "*<small>←" +
            c.by +
            (c.warn ? " · " + c.warn + "j" : "") +
            "</small>"
          : "") +
        (c.freed ? "<small>digantikan</small>" : "") +
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
            (x.bad ? " class='bad'" : x.warn ? " class='wr'" : "") +
            "><b>" +
            fmt(tgl(x.i)) +
            "</b> " +
            x.t +
            "</div>"
          );
        })
        .join("")
    : "<div>Belum ada izin bulan ini. Ketuk shift untuk menandai izin.</div>";
  document.getElementById("notes").innerHTML = "<b>Pergantian</b>" + nh;
}
function toggle(el) {
  if (!el || !el.dataset || el.dataset.i === undefined) return;
  var i = +el.dataset.i,
    n = +el.dataset.n;
  var k = i + "|" + n;
  if (izin[k]) delete izin[k];
  else izin[k] = 1;
  render();
}
document.getElementById("t").addEventListener("click", function (e) {
  toggle(e.target.closest("td.c"));
});
document.getElementById("t").addEventListener("keydown", function (e) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    toggle(e.target.closest("td.c"));
  }
});
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
document.getElementById("reset").addEventListener("click", function () {
  izin = {};
  render();
});

var INFO = {
  balik: {
    t: "Tukar balik",
    p: [
      "<b>Apa ini?</b> Kalau ada yang izin lalu digantiin, orang yang izin itu nanti gantian masuk di salah satu shift si pengganti, di tanggal lain setelah izin. Tujuannya biar pengganti tidak nambah shift terus.",
      "<b>Contoh:</b> Bulan November. Wisnu izin pagi tanggal 1. Ayup lagi libur, jadi dia gantiin pagi tanggal 1.",
      "<b>Nyala:</b> Wisnu nanti ambil sore Ayup tanggal 3, jadi Ayup libur di tanggal 3. Ayup kerja lebih di tanggal 1, tapi dapat libur di tanggal 3, jadi impas.",
      "<b>Mati:</b> Ayup gantiin pagi tanggal 1 saja. Sore Ayup tanggal 3 tetap jalan, jadi dia kerja 1 shift lebih banyak di bulan itu.",
      "Yang dipilih tanggal terdekat setelah izin yang lolos aturan istirahat, dan tetap di bulan yang sama.",
    ],
  },
  lalu: {
    t: "Boleh ubah shift sebelum tanggal izin",
    p: [
      "<b>Apa ini?</b> Saat cari pengganti, sistem kadang harus menukar shift orang lain dulu supaya istirahatnya cukup. Opsi ini menentukan boleh atau tidak menukar shift yang tanggalnya <b>sebelum</b> tanggal izin (masih di bulan yang sama).",
      "<b>Contoh:</b> Bulan November. <b>Wisnu izin pagi tanggal 1 dan Ayup (yang lagi libur) juga izin.</b> Kalau cuma Wisnu yang izin, Ayup langsung gantiin dan opsi ini tidak kepakai. Tapi kalau keduanya izin, tidak ada lagi yang cukup istirahat buat pagi tanggal 1.",
      "<b>Nyala:</b> Arif dipindah dari malam ke pagi tanggal 1, malam Arif diisi Hafiz, lalu rantainya lanjut sampai semua shift terisi (Cadangan ngisi yang sore). Lihat daftar Pergantian di bawah tabel.",
      "<b>Mati:</b> shift malam Arif tanggal 1 dianggap sudah jalan, tidak boleh diubah. Hasilnya pagi tanggal 1 jadi KOSONG dan kamu cari pengganti manual.",
      "<b>Kapan dinyalakan?</b> Kalau izin sudah diketahui dari jauh hari. Matikan kalau izinnya mendadak di hari-H.",
    ],
  },
};
function bukaInfo(k) {
  var x = INFO[k];
  document.getElementById("pt").textContent = x.t;
  document.getElementById("pp").innerHTML = x.p
    .map(function (t) {
      return "<p>" + t + "</p>";
    })
    .join("");
  document.getElementById("pop").firstChild.scrollTop = 0;
  document.getElementById("pop").hidden = false;
  document.getElementById("pc").focus();
}
function tutupInfo() {
  document.getElementById("pop").hidden = true;
}
Array.prototype.forEach.call(document.querySelectorAll(".info"), function (b) {
  b.addEventListener("click", function () {
    bukaInfo(b.dataset.k);
  });
});
document.getElementById("pc").addEventListener("click", tutupInfo);
document.getElementById("pop").addEventListener("click", function (e) {
  if (e.target === this) tutupInfo();
});
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") tutupInfo();
});
render();
