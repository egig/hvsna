import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { SUPPORT_EMAIL, WEB_APP_SIGNUP_URL } from "@/config";
import { useSeo } from "@/seo/Seo";

export default function AboutPageID() {
  useSeo();
  return (
    <div className="min-h-screen">
      <Header currentLang="id" />
      <main>
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16 lg:py-32">
          <h1 className="text-4xl sm:text-5xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-6">Tentang Hvsna</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Hvsna, ejaan kreatif dari kata "Husna", berarti "Terbaik" atau "Paling Baik" dalam bahasa Arab. Nama ini
            dipilih untuk mencerminkan misi aplikasi dalam membantu penggunanya menjadi lebih baik setiap hari.
          </p>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Hvsna membantu Anda mengatur jadwal harian berdasarkan waktu shalat. Karena kami percaya bahwa itulah cara
            terbaik dalam mengatur hari kita. Shalat adalah prioritas utama seorang Muslim, dan seharusnya menjadi hal
            pertama yang kita rencanakan dalam keseharian.
          </p>

          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-12 mb-4">Masalahnya</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Terlalu sering ibadah kita berjalan tanpa rencana — kita menjalani hari tanpa struktur yang jelas untuk
            beribadah. Rapat dan berbagai kesibukan bentrok dengan waktu shalat, sehingga shalat tergeser ke pinggir
            alih-alih menjadi pusat hari kita. Dan untuk amalan-amalan di luar yang wajib, kita kehilangan jejak niat
            sepenuhnya. Tanpa sistem yang dirancang di seputar agama kita, masalah-masalah ini terus berlanjut tanpa
            disadari.
          </p>

          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-12 mb-4">Visi Kami</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Hvsna diniatkan untuk dibangun dengan berlandaskan nilai-nilai Islam. Tugas-tugas disusun berdasarkan
            waktu shalat. Tanggal Hijriah ditampilkan di samping kalender biasa. Semuanya dirancang agar agama Anda
            menjadi yang utama, dan produktivitas mengalir secara alami darinya.
          </p>

          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-12 mb-4">Cara Kerjanya</h2>
          <ul className="space-y-4 mb-8">
            <li className="flex items-start text-lg text-gray-600 dark:text-gray-300">
              <span className="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2.5 mr-3 flex-shrink-0"></span>
              <span>
                <strong className="text-gray-900 dark:text-white">Kalender Hijriah</strong> — Tanggal Islam
                ditampilkan di samping kalender biasa.
              </span>
            </li>
            <li className="flex items-start text-lg text-gray-600 dark:text-gray-300">
              <span className="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2.5 mr-3 flex-shrink-0"></span>
              <span>
                <strong className="text-gray-900 dark:text-white">Berbasis waktu shalat</strong> — Rencanakan tugas
                Anda di antara waktu shalat agar shalat tetap menjadi pusat hari Anda.
              </span>
            </li>
            <li className="flex items-start text-lg text-gray-600 dark:text-gray-300">
              <span className="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2.5 mr-3 flex-shrink-0"></span>
              <span>
                <strong className="text-gray-900 dark:text-white">Tampilan sederhana, aksesibel, dan fokus</strong> —
                Lihat tugas hari ini dan yang akan datang secara sekilas tanpa gangguan.
              </span>
            </li>
            <li className="flex items-start text-lg text-gray-600 dark:text-gray-300">
              <span className="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2.5 mr-3 flex-shrink-0"></span>
              <span>
                <strong className="text-gray-900 dark:text-white">Offline-first</strong> — Berfungsi tanpa koneksi
                internet, dengan Sync antar perangkat opsional saat Anda membutuhkannya.
              </span>
            </li>
          </ul>

          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-12 mb-4">Perkembangan Saat Ini</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Hvsna sudah tersedia sekarang di Android — unduh melalui{" "}
            <a
              href="https://play.google.com/store/apps/details?id=com.hvsna.app"
              target="_blank"
              rel="noreferrer"
              className="text-primary-600 dark:text-primary-400 underline hover:no-underline"
            >
              Google Play
            </a>{" "}
            — dan di{" "}
            <a href={WEB_APP_SIGNUP_URL} className="text-primary-600 dark:text-primary-400 underline hover:no-underline">
              Web
            </a>
            . Sync menjaga tugas Anda tetap sama di keduanya. Aplikasi iOS akan segera hadir. Kami terus membangun
            dan memperbaiki — masukan Anda sangat membantu dalam menentukan langkah selanjutnya.
          </p>

          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-12 mb-4">Hubungi Kami</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Punya pertanyaan, masukan, atau sekadar ingin menyapa? Hubungi kami di{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary-600 dark:text-primary-400 underline hover:no-underline">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </article>
      </main>
      <Footer currentLang="id" />
    </div>
  );
}
