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
function toggle(el) {
  if (!el || !el.dataset || el.dataset.i === undefined) return;
  if (+el.dataset.i <= CUT) {
    status(
      "Tanggal " + fmt(tgl(+el.dataset.i)) + " sudah lewat, tidak bisa diubah",
      true,
    );
    return;
  }
  var k = +el.dataset.i + "|" + +el.dataset.n,
    on = !izin[k];
  if (on) izin[k] = 1;
  else delete izin[k];
  render();
  store
    .simpan(k, on)
    .then(function () {
      status(sb ? "Tersimpan di Supabase" : "Tersimpan di browser");
    })
    .catch(function () {
      if (on) delete izin[k];
      else izin[k] = 1;
      render();
      status("Gagal menyimpan, coba lagi", true);
    });
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
  if (!confirm("Hapus semua izin?")) return;
  store
    .hapusSemua()
    .then(function () {
      izin = {};
      tukarList = [];
      render();
      status("Semua izin dan tukar dihapus");
    })
    .catch(function () {
      status("Gagal menghapus", true);
    });
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
function bukaInfo(k) {
  var x = INFO[k];
  document.getElementById("pt").textContent = x.t;
  document.getElementById("pp").innerHTML = x.p
    .map(function (t) {
      return "<p>" + t + "</p>";
    })
    .join("");
  document.getElementById("pc").hidden = false;
  document.getElementById("pactions").hidden = true;
  document.getElementById("pop").firstChild.scrollTop = 0;
  document.getElementById("pop").hidden = false;
  document.getElementById("pc").focus();
}
function tutupInfo() {
  document.getElementById("pop").hidden = true;
  document.getElementById("pc").hidden = false;
  document.getElementById("pactions").hidden = true;
  aksiKonfirmasiTukar = null;
}
Array.prototype.forEach.call(document.querySelectorAll(".info"), function (b) {
  b.addEventListener("click", function () {
    bukaInfo(b.dataset.k);
  });
});
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
/* ===== Tukar jadwal yang sudah disepakati ===== */
/* ===== Tukar jadwal yang sudah disepakati ===== */
function $(id){return document.getElementById(id);}
function isiPilihanTukar(i0,i1){
  var h="",i;
  for(i=Math.max(i0,CUT+1);i<=i1;i++){var d=tgl(i);h+="<option value='"+i+"'>"+HR[d.getDay()]+" "+fmt(d)+"</option>";}
  ["tkTglA","tkTglB"].forEach(function(id){
    var sel=$(id),cur=sel.value;
    sel.innerHTML=h;
    if(cur&&sel.querySelector("option[value='"+cur+"']"))sel.value=cur;
  });
  ["tkA","tkB"].forEach(function(id,k){
    var s=$(id),c=s.value;
    if(!s.options.length){s.innerHTML=NAMA.slice(0,CAD).map(function(n,j){return "<option value='"+j+"'>"+n+"</option>";}).join("");s.value=k;}
    else if(c)s.value=c;
  });
  previewTukar();
  $("tkList").innerHTML=tukarList.filter(function(t){var da=t.iA===undefined?t.i:t.iA;return da>=i0&&da<=i1;}).map(function(t){
    var ia=NAMA.indexOf(t.a),ib=NAMA.indexOf(t.b),da=t.iA===undefined?t.i:t.iA,db=t.iB===undefined?da:t.iB;
    return "<div class='tkit'><span>"+t.a+" "+NM[t.sa||base(ia,da)]+" ("+fmt(tgl(da))+") ↔ "+t.b+" "+NM[t.sb||base(ib,db)]+" ("+fmt(tgl(db))+")</span><button type='button' class='tkdel' data-ia='"+da+"' data-ib='"+db+"' data-a='"+t.a+"' data-b='"+t.b+"' aria-label='Batalkan tukar'>✕</button></div>";
  }).join("");
}
function pesanIstirahatTerpendek(view, perubahan, orangList, awal, akhir) {
  var jeda = [];
  orangList.forEach(function (orang) {
    var shifts = [];
    for (var d = Math.max(0, awal - 3); d <= akhir + 3; d++) {
      var key = d + "|" + orang;
      var sh = Object.prototype.hasOwnProperty.call(perubahan, key)
        ? perubahan[key]
        : view[d] && view[d][orang]
          ? view[d][orang].c
          : base(orang, d);
      if (sh !== "L" && sh !== "I") shifts.push({ d: d, s: sh });
    }
    shifts.sort(function (x, y) {
      return mulaiJam(x.s, x.d) - mulaiJam(y.s, y.d);
    });
    for (var j = 1; j < shifts.length; j++) {
      var prev = shifts[j - 1],
        next = shifts[j];
      jeda.push({
        orang: orang,
        jam: mulaiJam(next.s, next.d) - akhirJam(prev.s, prev.d),
      });
    }
  });
  if (!jeda.length) return "";
  var jamMin = Math.min.apply(
    null,
    jeda.map(function (x) {
      return x.jam;
    }),
  );
  if (jamMin >= minRest()) return "";
  var orangTerpendek = [];
  jeda.forEach(function (x) {
    if (x.jam === jamMin && orangTerpendek.indexOf(x.orang) < 0)
      orangTerpendek.push(x.orang);
  });
  return (
    "Peringatan: " +
    orangTerpendek
      .map(function (orang) {
        return NAMA[orang];
      })
      .join(" dan ") +
    " istirahatnya hanya " +
    Math.max(0, jamMin) +
    " jam."
  );
}
function previewTukar(){
  var da=+$("tkTglA").value,db=+$("tkTglB").value,a=+$("tkA").value,b=+$("tkB").value,el=$("tkPrev");
  if(!$("tkTglA").value||!$("tkTglB").value){el.textContent="Semua tanggal bulan ini sudah lewat, tidak bisa ditukar.";return false;}
  if(a===b){el.textContent="Pilih dua orang yang berbeda.";return false;}
  var view=hitung(idxOf(vy,vm+1,0)+32).res,ca=view[da][a],cb=view[db][b],sa=ca.c,sb=cb.c;
  if(ca.lock||cb.lock){el.textContent="Salah satu shift itu sudah termasuk tukar lain.";return false;}
  if(da===db&&sa===sb){el.textContent="Shift mereka sama ("+NM[sa]+"), tidak ada yang ditukar.";return false;}
  if(da!==db){
    var bAtA=view[da][b],aAtB=view[db][a];
    if(sa==="L"||sa==="I"||sb==="L"||sb==="I"){
      el.textContent="Untuk tukar beda tanggal, kedua sel yang ditukar harus berisi shift kerja.";return false;
    }
    if(bAtA.c==="I"||aAtB.c==="I"||bAtA.lock||aAtB.lock||bAtA.sub||aAtB.sub||bAtA.freed||aAtB.freed){
      el.textContent="Salah satu shift penerima sedang izin atau sudah termasuk tukar lain.";return false;
    }
    var shiftKosong=[];
    if(bAtA.c!=="L"&&bAtA.c!==sa)shiftKosong.push(NM[bAtA.c]+" milik "+NAMA[b]+" "+fmt(tgl(da))+" akan menjadi kosong");
    if(aAtB.c!=="L"&&aAtB.c!==sb)shiftKosong.push(NM[aAtB.c]+" milik "+NAMA[a]+" "+fmt(tgl(db))+" akan menjadi kosong");
    var perubahan = {};
    perubahan[da + "|" + a] = "L";
    perubahan[da + "|" + b] = sa;
    perubahan[db + "|" + b] = "L";
    perubahan[db + "|" + a] = sb;
    var peringatan = pesanIstirahatTerpendek(
      view,
      perubahan,
      [a, b],
      Math.min(da, db),
      Math.max(da, db),
    );
    el.textContent=NAMA[a]+" "+NM[sa]+" "+fmt(tgl(da))+" → libur; "+NAMA[b]+" mengisi "+NM[sa]+". Lalu "+NAMA[b]+" "+NM[sb]+" "+fmt(tgl(db))+" → libur; "+NAMA[a]+" mengisi "+NM[sb]+"."+(shiftKosong.length ? " Dampak: "+shiftKosong.join("; ")+"." : "")+(peringatan ? " "+peringatan : " Istirahat memenuhi batas minimum.");
    return true;
  }
  var perubahan = {};
  perubahan[da + "|" + a] = sb;
  perubahan[da + "|" + b] = sa;
  var peringatan = pesanIstirahatTerpendek(view, perubahan, [a, b], da, da);
  el.textContent =
    NAMA[a] +
    ": " +
    NM[sa] +
    " → " +
    NM[sb] +
    "   |   " +
    NAMA[b] +
    ": " +
    NM[sb] +
    " → " +
    NM[sa] +
    (peringatan
      ? ". " + peringatan
      : ". Istirahat memenuhi batas minimum.");
  return true;
}
["tkTglA","tkTglB","tkA","tkB"].forEach(function(id){$(id).addEventListener("change",previewTukar);});
function simpanTukarTerpilih(){
  status("Memproses tukar...");
  var da=+$("tkTglA").value,db=+$("tkTglB").value;
  if(da<=CUT||db<=CUT){status("Tanggal sudah lewat, tidak bisa ditukar",true);return;}
  var a=NAMA[+$("tkA").value],b=NAMA[+$("tkB").value];
  if(tukarList.some(function(t){var ta=t.iA===undefined?t.i:t.iA,tb=t.iB===undefined?ta:t.iB;return ta===da&&tb===db&&((t.a===a&&t.b===b)||(t.a===b&&t.b===a));})){status("Tukar itu sudah ada");return;}
  var current=hitung(idxOf(vy,vm+1,0)+32).res,ia=NAMA.indexOf(a),ib=NAMA.indexOf(b);
  var it={iA:da,iB:db,a:a,b:b,sa:current[da][ia].c,sb:current[db][ib].c};tukarList.push(it);render();
  store.simpanTukar(it,true).then(function(){status(sb?"Tukar tersimpan di Supabase":"Tukar tersimpan di browser");}).catch(function(){
    tukarList=tukarList.filter(function(t){return t!==it;});render();status("Gagal menyimpan tukar, coba lagi",true);
  });
}
$("tkGo").addEventListener("click",function(){
  if(!previewTukar()){
    status($("tkPrev").textContent || "Tukar belum memenuhi syarat.", true);
    return;
  }
  var preview=$("tkPrev").textContent;
  if(preview.indexOf("Peringatan:")>=0||preview.indexOf("Dampak:")>=0){
    bukaKonfirmasiTukar(preview,simpanTukarTerpilih);
    return;
  }
  simpanTukarTerpilih();
});
$("tkList").addEventListener("click",function(e){
  var b=e.target.closest(".tkdel");if(!b)return;
  var da=+b.dataset.ia,db=+b.dataset.ib,it=null;
  tukarList.forEach(function(t){var ta=t.iA===undefined?t.i:t.iA,tb=t.iB===undefined?ta:t.iB;if(ta===da&&tb===db&&t.a===b.dataset.a&&t.b===b.dataset.b)it=t;});
  if(!it)return;
  tukarList=tukarList.filter(function(t){return t!==it;});render();
  store.simpanTukar(it,false).then(function(){status("Tukar dibatalkan");}).catch(function(){tukarList.push(it);render();status("Gagal membatalkan tukar, coba lagi",true);});
});

/* ===== Penyimpanan izin =====
   Kalau config.js diisi (Supabase), data disimpan di database online.
   Kalau kosong, data disimpan di localStorage browser. */
var CFG = window.JADWAL_CONFIG || {},
  sb = null,
  LS = "jadwal-shift-izin-v1",
  LS2 = "jadwal-shift-tukar-v1";
try {
  if (CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY && window.supabase)
    sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
} catch (e) {
  sb = null;
}
function pad2(n) {
  return ("0" + n).slice(-2);
}
function kunciKeRow(k) {
  var p = k.split("|"),
    d = tgl(+p[0]);
  return {
    tanggal:
      d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()),
    orang: NAMA[+p[1]],
  };
}
function rowKeKunci(r) {
  var t = r.tanggal.split("-"),
    n = NAMA.indexOf(r.orang);
  return n < 0 ? null : idxOf(+t[0], +t[1] - 1, +t[2]) + "|" + n;
}
function status(t, bad) {
  var el = document.getElementById("stat");
  el.textContent = t;
  el.style.color = bad ? "var(--It)" : "var(--mut)";
}
var store = {
  muat: function () {
    if (sb)
      return sb
        .from("izin")
        .select("tanggal,orang")
        .then(function (r) {
          if (r.error) throw r.error;
          var o = {};
          r.data.forEach(function (x) {
            var k = rowKeKunci(x);
            if (k) o[k] = 1;
          });
          return o;
        });
    try {
      return Promise.resolve(JSON.parse(localStorage.getItem(LS) || "{}"));
    } catch (e) {
      return Promise.resolve({});
    }
  },
  simpan: function (k, on) {
    if (sb) {
      var row = kunciKeRow(k);
      var q = on
        ? sb.from("izin").upsert(row, {
            onConflict: "tanggal,orang",
            ignoreDuplicates: true,
          })
        : sb
            .from("izin")
            .delete()
            .eq("tanggal", row.tanggal)
            .eq("orang", row.orang);
      return q.then(function (r) {
        if (r.error) throw r.error;
      });
    }
    try {
      localStorage.setItem(LS, JSON.stringify(izin));
    } catch (e) {}
    return Promise.resolve();
  },
 muatTukar:function(){
    if(sb)return sb.from("tukar").select("tanggal,tanggal_b,orang_a,orang_b,shift_a,shift_b").then(function(r){
      if(r.error)return [];
      return r.data.map(function(x){var a=x.tanggal.split("-"),b=(x.tanggal_b||x.tanggal).split("-");return {iA:idxOf(+a[0],+a[1]-1,+a[2]),iB:idxOf(+b[0],+b[1]-1,+b[2]),a:x.orang_a,b:x.orang_b,sa:x.shift_a,sb:x.shift_b};});
    });
    try{return Promise.resolve(JSON.parse(localStorage.getItem(LS2)||"[]"));}catch(e){return Promise.resolve([]);}
  },
  simpanTukar:function(it,on){
    if(sb){
      var da=tgl(it.iA===undefined?it.i:it.iA),db=tgl(it.iB===undefined?da:it.iB),ta=da.getFullYear()+"-"+pad2(da.getMonth()+1)+"-"+pad2(da.getDate()),tb=db.getFullYear()+"-"+pad2(db.getMonth()+1)+"-"+pad2(db.getDate());
      var q=on?sb.from("tukar").upsert({tanggal:ta,tanggal_b:tb,orang_a:it.a,orang_b:it.b,shift_a:it.sa,shift_b:it.sb},{onConflict:"tanggal,orang_a,orang_b",ignoreDuplicates:true}):sb.from("tukar").delete().eq("tanggal",ta).eq("tanggal_b",tb).eq("orang_a",it.a).eq("orang_b",it.b);
      return q.then(function(r){if(r.error)throw r.error;});
    }
    try {
      localStorage.setItem(LS2, JSON.stringify(tukarList));
    } catch (e) {}
    return Promise.resolve();
  },
  hapusSemua: function () {
    if (sb)
      return sb
        .from("izin")
        .delete()
        .neq("orang", "")
        .then(function (r) {
          if (r.error) throw r.error;
        })
        .then(function () {
          return sb.from("tukar").delete().neq("orang_a", "");
        })
        .then(function (r) {
          if (r && r.error) throw r.error;
        });
    try {
      localStorage.removeItem(LS);
      localStorage.removeItem(LS2);
    } catch (e) {}
    return Promise.resolve();
  },
};
function muatIzin() {
  return Promise.all([store.muat(), store.muatTukar()])
    .then(function (r) {
      izin = r[0];
      tukarList = r[1];
      render();
      status(sb ? "Terhubung ke Supabase" : "Tersimpan di browser");
    })
    .catch(function () {
      status("Gagal memuat data izin", true);
    });
}
if (sb) {
  try {
    sb.channel("izin-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "izin" },
        muatIzin,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tukar" },
        muatIzin,
      )
      .subscribe();
  } catch (e) {}
}
function jadwalkanKunciOtomatis() {
  var now = new Date(),
    besok = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  setTimeout(
    function () {
      render();
      jadwalkanKunciOtomatis();
    },
    besok - now + 100,
  );
}
render();
jadwalkanKunciOtomatis();
muatIzin();
