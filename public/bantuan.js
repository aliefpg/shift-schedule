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
  document.getElementById("pc").hidden = false;
  document.getElementById("pactions").hidden = true;
  document.getElementById("pop").firstChild.scrollTop = 0;
  document.getElementById("pop").hidden = false;
  document.getElementById("pc").focus();
}
Array.prototype.forEach.call(document.querySelectorAll(".info"), function (b) {
  b.addEventListener("click", function () {
    bukaInfo(b.dataset.k);
  });
});
