/* Interaksi penandaan izin dan penghapusan data izin/tukar. */
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
