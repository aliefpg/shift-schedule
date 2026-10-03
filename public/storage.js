/* ===== Penyimpanan izin dan tukar =====
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
  muatTukar: function () {
    if (sb)
      return sb
        .from("tukar")
        .select("tanggal,tanggal_b,orang_a,orang_b,shift_a,shift_b")
        .then(function (r) {
          if (r.error) return [];
          return r.data.map(function (x) {
            var a = x.tanggal.split("-"),
              b = (x.tanggal_b || x.tanggal).split("-");
            return {
              iA: idxOf(+a[0], +a[1] - 1, +a[2]),
              iB: idxOf(+b[0], +b[1] - 1, +b[2]),
              a: x.orang_a,
              b: x.orang_b,
              sa: x.shift_a,
              sb: x.shift_b,
            };
          });
        });
    try {
      return Promise.resolve(JSON.parse(localStorage.getItem(LS2) || "[]"));
    } catch (e) {
      return Promise.resolve([]);
    }
  },
  simpanTukar: function (it, on) {
    if (sb) {
      var da = tgl(it.iA === undefined ? it.i : it.iA),
        db = tgl(it.iB === undefined ? da : it.iB),
        ta = da.getFullYear() + "-" + pad2(da.getMonth() + 1) + "-" + pad2(da.getDate()),
        tb = db.getFullYear() + "-" + pad2(db.getMonth() + 1) + "-" + pad2(db.getDate());
      var q = on
        ? sb.from("tukar").upsert(
            {
              tanggal: ta,
              tanggal_b: tb,
              orang_a: it.a,
              orang_b: it.b,
              shift_a: it.sa,
              shift_b: it.sb,
            },
            { onConflict: "tanggal,orang_a,orang_b", ignoreDuplicates: true },
          )
        : sb
            .from("tukar")
            .delete()
            .eq("tanggal", ta)
            .eq("tanggal_b", tb)
            .eq("orang_a", it.a)
            .eq("orang_b", it.b);
      return q.then(function (r) {
        if (r.error) throw r.error;
      });
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
