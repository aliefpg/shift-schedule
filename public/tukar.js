/* Fitur pengaturan dan pencatatan tukar jadwal yang disepakati. */
function $(id) {
  return document.getElementById(id);
}
function isiPilihanTukar(i0, i1) {
  var h = "";
  for (var i = Math.max(i0, CUT + 1); i <= i1; i++) {
    var d = tgl(i);
    h += "<option value='" + i + "'>" + HR[d.getDay()] + " " + fmt(d) + "</option>";
  }
  ["tkTglA", "tkTglB"].forEach(function (id) {
    var sel = $(id),
      cur = sel.value;
    sel.innerHTML = h;
    if (cur && sel.querySelector("option[value='" + cur + "']")) sel.value = cur;
  });
  ["tkA", "tkB"].forEach(function (id, k) {
    var s = $(id),
      c = s.value;
    if (!s.options.length) {
      s.innerHTML = NAMA.slice(0, CAD).map(function (n, j) {
        return "<option value='" + j + "'>" + n + "</option>";
      }).join("");
      s.value = k;
    } else if (c) s.value = c;
  });
  previewTukar();
  $("tkList").innerHTML = tukarList.filter(function (t) {
    var da = t.iA === undefined ? t.i : t.iA;
    return da >= i0 && da <= i1;
  }).map(function (t) {
    var ia = NAMA.indexOf(t.a),
      ib = NAMA.indexOf(t.b),
      da = t.iA === undefined ? t.i : t.iA,
      db = t.iB === undefined ? da : t.iB;
    return "<div class='tkit'><span>" + t.a + " " + NM[t.sa || base(ia, da)] + " (" + fmt(tgl(da)) + ") ↔ " + t.b + " " + NM[t.sb || base(ib, db)] + " (" + fmt(tgl(db)) + ")</span><button type='button' class='tkdel' data-ia='" + da + "' data-ib='" + db + "' data-a='" + t.a + "' data-b='" + t.b + "' aria-label='Batalkan tukar'>✕</button></div>";
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
  var jamMin = Math.min.apply(null, jeda.map(function (x) { return x.jam; }));
  if (jamMin >= minRest()) return "";
  var orangTerpendek = [];
  jeda.forEach(function (x) {
    if (x.jam === jamMin && orangTerpendek.indexOf(x.orang) < 0)
      orangTerpendek.push(x.orang);
  });
  return "Peringatan: " + orangTerpendek.map(function (orang) {
    return NAMA[orang];
  }).join(" dan ") + " istirahatnya hanya " + Math.max(0, jamMin) + " jam.";
}
function previewTukar() {
  var da = +$("tkTglA").value,
    db = +$("tkTglB").value,
    a = +$("tkA").value,
    b = +$("tkB").value,
    el = $("tkPrev");
  if (!$("tkTglA").value || !$("tkTglB").value) {
    el.textContent = "Semua tanggal bulan ini sudah lewat, tidak bisa ditukar.";
    return false;
  }
  if (a === b) {
    el.textContent = "Pilih dua orang yang berbeda.";
    return false;
  }
  var view = hitung(idxOf(vy, vm + 1, 0) + 32).res,
    ca = view[da][a],
    cb = view[db][b],
    sa = ca.c,
    sb = cb.c;
  if (ca.lock || cb.lock) {
    el.textContent = "Salah satu shift itu sudah termasuk tukar lain.";
    return false;
  }
  if (da === db && sa === sb) {
    el.textContent = "Shift mereka sama (" + NM[sa] + "), tidak ada yang ditukar.";
    return false;
  }
  if (da !== db) {
    var bAtA = view[da][b],
      aAtB = view[db][a];
    if (sa === "L" || sa === "I" || sb === "L" || sb === "I") {
      el.textContent = "Untuk tukar beda tanggal, kedua sel yang ditukar harus berisi shift kerja.";
      return false;
    }
    if (bAtA.c === "I" || aAtB.c === "I" || bAtA.lock || aAtB.lock || bAtA.sub || aAtB.sub || bAtA.freed || aAtB.freed) {
      el.textContent = "Salah satu shift penerima sedang izin atau sudah termasuk tukar lain.";
      return false;
    }
    var shiftKosong = [];
    if (bAtA.c !== "L" && bAtA.c !== sa)
      shiftKosong.push(NM[bAtA.c] + " milik " + NAMA[b] + " " + fmt(tgl(da)) + " akan menjadi kosong");
    if (aAtB.c !== "L" && aAtB.c !== sb)
      shiftKosong.push(NM[aAtB.c] + " milik " + NAMA[a] + " " + fmt(tgl(db)) + " akan menjadi kosong");
    var perubahan = {};
    perubahan[da + "|" + a] = "L";
    perubahan[da + "|" + b] = sa;
    perubahan[db + "|" + b] = "L";
    perubahan[db + "|" + a] = sb;
    var peringatan = pesanIstirahatTerpendek(view, perubahan, [a, b], Math.min(da, db), Math.max(da, db));
    el.textContent = NAMA[a] + " " + NM[sa] + " " + fmt(tgl(da)) + " → libur; " + NAMA[b] + " mengisi " + NM[sa] + ". Lalu " + NAMA[b] + " " + NM[sb] + " " + fmt(tgl(db)) + " → libur; " + NAMA[a] + " mengisi " + NM[sb] + "." + (shiftKosong.length ? " Dampak: " + shiftKosong.join("; ") + "." : "") + (peringatan ? " " + peringatan : " Istirahat memenuhi batas minimum.");
    return true;
  }
  var perubahan = {};
  perubahan[da + "|" + a] = sb;
  perubahan[da + "|" + b] = sa;
  var peringatan = pesanIstirahatTerpendek(view, perubahan, [a, b], da, da);
  el.textContent = NAMA[a] + ": " + NM[sa] + " → " + NM[sb] + "   |   " + NAMA[b] + ": " + NM[sb] + " → " + NM[sa] + (peringatan ? ". " + peringatan : ". Istirahat memenuhi batas minimum.");
  return true;
}
["tkTglA", "tkTglB", "tkA", "tkB"].forEach(function (id) {
  $(id).addEventListener("change", previewTukar);
});
function simpanTukarTerpilih() {
  status("Memproses tukar...");
  var da = +$("tkTglA").value,
    db = +$("tkTglB").value;
  if (da <= CUT || db <= CUT) {
    status("Tanggal sudah lewat, tidak bisa ditukar", true);
    return;
  }
  var a = NAMA[+$("tkA").value],
    b = NAMA[+$("tkB").value];
  if (tukarList.some(function (t) {
    var ta = t.iA === undefined ? t.i : t.iA,
      tb = t.iB === undefined ? ta : t.iB;
    return ta === da && tb === db && ((t.a === a && t.b === b) || (t.a === b && t.b === a));
  })) {
    status("Tukar itu sudah ada");
    return;
  }
  var current = hitung(idxOf(vy, vm + 1, 0) + 32).res,
    ia = NAMA.indexOf(a),
    ib = NAMA.indexOf(b);
  var it = { iA: da, iB: db, a: a, b: b, sa: current[da][ia].c, sb: current[db][ib].c };
  tukarList.push(it);
  render();
  store.simpanTukar(it, true).then(function () {
    status(sb ? "Tukar tersimpan" : "Tukar tersimpan di browser");
  }).catch(function () {
    tukarList = tukarList.filter(function (t) { return t !== it; });
    render();
    status("Gagal menyimpan tukar, coba lagi", true);
  });
}
$("tkGo").addEventListener("click", function () {
  if (!previewTukar()) {
    status($("tkPrev").textContent || "Tukar belum memenuhi syarat.", true);
    return;
  }
  var preview = $("tkPrev").textContent;
  if (preview.indexOf("Peringatan:") >= 0 || preview.indexOf("Dampak:") >= 0) {
    bukaKonfirmasiTukar(preview, simpanTukarTerpilih);
    return;
  }
  simpanTukarTerpilih();
});
$("tkList").addEventListener("click", function (e) {
  var b = e.target.closest(".tkdel");
  if (!b) return;
  var da = +b.dataset.ia,
    db = +b.dataset.ib,
    it = null;
  tukarList.forEach(function (t) {
    var ta = t.iA === undefined ? t.i : t.iA,
      tb = t.iB === undefined ? ta : t.iB;
    if (ta === da && tb === db && t.a === b.dataset.a && t.b === b.dataset.b) it = t;
  });
  if (!it) return;
  tukarList = tukarList.filter(function (t) { return t !== it; });
  render();
  store.simpanTukar(it, false).then(function () {
    status("Tukar dibatalkan");
  }).catch(function () {
    tukarList.push(it);
    render();
    status("Gagal membatalkan tukar, coba lagi", true);
  });
});
