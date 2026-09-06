import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SUPPORT_EMAIL } from "@/config";
import { useSeo } from "@/seo/Seo";

export default function TermsPageID() {
  useSeo();
  return (
    <div className="min-h-screen">
      <Header currentLang="id" />
      <main>
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-24">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">Syarat Layanan</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-12">Terakhir Diperbarui: 2 Juni 2026</p>

          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Syarat Layanan (&quot;Syarat&quot;) ini mengatur penggunaan aplikasi Hvsna (&quot;Aplikasi&quot; atau
            &quot;Layanan&quot;) yang disediakan oleh Hvsna (&quot;kami&quot;). Dengan mengakses atau menggunakan
            Aplikasi kami, Anda setuju untuk terikat oleh Syarat ini. Jika Anda tidak setuju dengan Syarat ini, harap
            tidak menggunakan Layanan kami.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">1. Pendaftaran Akun dan Kelayakan</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            1.1 Untuk menggunakan Aplikasi kami, Anda mungkin perlu membuat akun. Dengan mendaftar, Anda menyatakan
            bahwa Anda berusia minimal 18 tahun atau telah cukup umur secara hukum di wilayah Anda untuk mengikatkan
            diri dalam perjanjian ini.
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            1.2 Anda setuju untuk memberikan informasi yang akurat, lengkap, dan terkini selama proses pendaftaran.
            Anda bertanggung jawab penuh untuk menjaga kerahasiaan akun dan kata sandi Anda, serta untuk setiap
            aktivitas yang terjadi di bawah akun Anda.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">2. Penggunaan Aplikasi</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            2.1 Aplikasi kami disediakan untuk penggunaan pribadi. Anda tidak boleh menggunakan Aplikasi untuk tujuan
            yang tidak sah atau ilegal.
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            2.2 Anda bertanggung jawab atas konten yang Anda buat, unggah, atau simpan menggunakan Aplikasi. Anda
            memiliki semua hak kekayaan intelektual atas konten Anda, tetapi Anda memberikan kami lisensi
            non-eksklusif, di seluruh dunia, dan bebas royalti untuk menggunakan, memproduksi ulang, dan
            mendistribusikan konten Anda semata-mata untuk tujuan menyediakan Layanan.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">3. Perilaku yang Dilarang</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-2 leading-relaxed">
            3.1 Anda setuju untuk tidak melakukan aktivitas berikut saat menggunakan Aplikasi kami:
          </p>
          <ul className="list-disc list-inside text-lg text-gray-600 dark:text-gray-300 mb-8 space-y-2 pl-4">
            <li>Melanggar hukum atau peraturan yang berlaku</li>
            <li>Mengganggu keamanan Aplikasi atau mencoba mendapatkan akses tidak sah ke sistem kami</li>
            <li>
              Mengunggah, mengirimkan, atau mendistribusikan konten yang melanggar hukum, berbahaya, memfitnah,
              melanggar hak cipta, atau tidak pantas
            </li>
            <li>Menyamar sebagai orang atau entitas lain atau memberikan informasi palsu tentang afiliasi Anda</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">4. Langganan dan Pembayaran</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            4.1 Fitur tertentu dari Aplikasi memerlukan langganan berbayar (&quot;Pro&quot;). Dengan berlangganan,
            Anda setuju untuk membayar biaya yang berlaku sebagaimana ditampilkan pada saat pembelian.
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            4.2 Langganan diperpanjang secara otomatis kecuali dibatalkan sebelum akhir periode penagihan saat ini.
            Anda dapat membatalkan kapan saja melalui pengaturan akun Anda.
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            4.3 Kami berhak mengubah harga langganan. Perubahan harga akan berlaku pada awal siklus penagihan
            berikutnya setelah pemberitahuan kepada Anda.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">5. Hak Kekayaan Intelektual</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            5.1 Kami memiliki semua hak, kepemilikan, dan kepentingan atas Aplikasi, termasuk semua hak kekayaan
            intelektual terkait. Anda mengakui bahwa Aplikasi dan teknologi yang mendasarinya mungkin mengandung
            informasi rahasia dan hak milik yang dilindungi oleh hukum kekayaan intelektual yang berlaku.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">6. Kebijakan Privasi</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            6.1{" "}
            <a href="/id/privacy" className="text-primary-600 dark:text-primary-400 underline hover:no-underline">
              Kebijakan Privasi
            </a>{" "}
            kami mengatur pengumpulan, penggunaan, dan pengungkapan informasi pribadi yang Anda berikan. Dengan
            menggunakan Aplikasi, Anda menyetujui praktik yang dijelaskan dalam Kebijakan Privasi kami.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">7. Penafian Jaminan</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            7.1 Aplikasi disediakan dengan dasar &quot;apa adanya&quot; dan &quot;sebagaimana tersedia&quot;. Kami
            tidak memberikan jaminan apa pun, baik tersurat maupun tersirat, termasuk namun tidak terbatas pada
            jaminan kelayakan jual, kesesuaian untuk tujuan tertentu, dan non-pelanggaran. Kami tidak menjamin bahwa
            Aplikasi akan bebas dari kesalahan atau tanpa gangguan.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">8. Tidak Mewakili Pihak Resmi</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            8.1 Aplikasi ini bukan merupakan produk resmi, saluran resmi, juru bicara, atau perwakilan dari individu,
            komunitas, organisasi, merek, otoritas pemerintah, gerakan politik, entitas keagamaan, atau kelompok
            mana pun. Setiap kemiripan, referensi, atau penyebutan tidak mengimplikasikan dukungan, persetujuan,
            kemitraan, sponsor, atau asosiasi resmi.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">9. Tidak Ada Otoritas Keagamaan atau Sertifikasi Ilmiah</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            9.1 Meskipun Aplikasi ini dapat menyediakan fitur, konten, atau alat yang dimaksudkan untuk mendukung gaya
            hidup Islami, Aplikasi tidak mengklaim otoritas keagamaan dan belum divalidasi, diaudit, disetujui, atau
            diawasi secara formal oleh ulama Islam, mufti, dewan Syariah, atau lembaga keagamaan kecuali dinyatakan
            secara tegas.
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            9.2 Konten yang dihasilkan, ditampilkan, atau disarankan oleh Aplikasi mungkin tidak lengkap, terlalu
            umum, atau tidak akurat dari perspektif keagamaan. Pengguna harus memverifikasi sendiri masalah keagamaan
            dan berkonsultasi dengan ulama Islam yang berkualifikasi untuk mendapatkan panduan, interpretasi, atau
            pengambilan keputusan keagamaan yang mengikat.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">10. Batasan Tanggung Jawab</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            10.1 Dalam keadaan apa pun kami tidak bertanggung jawab atas kerugian tidak langsung, insidental, khusus,
            atau konsekuensial yang timbul dari atau sehubungan dengan penggunaan Aplikasi, bahkan jika kami telah
            diberitahu tentang kemungkinan kerugian tersebut.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">11. Ganti Rugi</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            11.1 Anda setuju untuk mengganti rugi dan membebaskan kami dari segala klaim, tanggung jawab, kerugian,
            dan biaya, termasuk biaya pengacara, yang timbul dari penggunaan Aplikasi oleh Anda, pelanggaran terhadap
            Syarat ini, atau pelanggaran terhadap hak pihak lain.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">12. Perubahan Syarat</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            12.1 Kami berhak memperbarui atau mengubah Syarat ini kapan saja tanpa pemberitahuan sebelumnya. Versi
            terbaru dari Syarat ini akan tersedia di situs web kami. Penggunaan Aplikasi yang berkelanjutan setelah
            perubahan pada Syarat ini merupakan penerimaan Anda terhadap perubahan tersebut.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">13. Pengakhiran</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            13.1 Kami dapat, atas kebijakan kami sendiri, mengakhiri atau menangguhkan akses Anda ke Aplikasi kapan
            saja dan untuk alasan apa pun, tanpa tanggung jawab atau pemberitahuan sebelumnya.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">14. Hukum yang Berlaku</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            14.1 Syarat ini diatur oleh dan ditafsirkan sesuai dengan hukum Indonesia, tanpa memperhatikan
            prinsip-prinsip konflik hukumnya.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">15. Hubungi Kami</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            15.1 Jika Anda memiliki pertanyaan atau kekhawatiran tentang Syarat ini atau Layanan kami, silakan hubungi
            kami di{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary-600 dark:text-primary-400 underline hover:no-underline">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>

          <p className="text-lg text-gray-600 dark:text-gray-300 mt-12 leading-relaxed">
            Dengan menggunakan Aplikasi kami, Anda mengakui bahwa Anda telah membaca, memahami, dan menyetujui Syarat
            Layanan ini.
          </p>
        </article>
      </main>
      <Footer currentLang="id" />
    </div>
  );
}
