import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SUPPORT_EMAIL } from "@/config";
import { useSeo } from "@/seo/Seo";

export default function PrivacyPageID() {
  useSeo();
  return (
    <div className="min-h-screen">
      <Header currentLang="id" />
      <main>
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16 lg:py-32">
          <h1 className="text-4xl sm:text-5xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">Kebijakan Privasi</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-12">Terakhir Diperbarui: 3 Maret 2026</p>

          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Kebijakan Privasi (&quot;Kebijakan&quot;) ini menjelaskan bagaimana Hvsna (&quot;kami&quot;) mengumpulkan,
            menggunakan, mengungkapkan, dan melindungi informasi pribadi Anda saat Anda mengakses dan menggunakan
            aplikasi kami (&quot;Aplikasi&quot; atau &quot;Layanan&quot;). Dengan menggunakan Aplikasi kami, Anda
            menyetujui praktik yang dijelaskan dalam Kebijakan ini. Harap baca Kebijakan ini dengan saksama untuk
            memahami praktik kami terkait informasi pribadi Anda.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">1. Informasi yang Kami Kumpulkan</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            1.1 <strong className="text-gray-900 dark:text-white">Informasi Pribadi:</strong> Saat Anda membuat akun
            atau menggunakan Aplikasi kami, kami dapat mengumpulkan informasi pribadi tertentu, seperti nama, alamat
            email, dan informasi identitas lainnya yang Anda berikan secara sukarela.
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            1.2 <strong className="text-gray-900 dark:text-white">Data Penggunaan:</strong> Kami dapat secara otomatis
            mengumpulkan informasi tertentu tentang perangkat Anda, termasuk alamat IP, sistem operasi, jenis
            browser, dan informasi teknis lainnya saat Anda mengakses Aplikasi kami.
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            1.3 <strong className="text-gray-900 dark:text-white">Cookie dan Teknologi Serupa:</strong> Kami dapat
            menggunakan cookie dan teknologi pelacakan serupa untuk meningkatkan pengalaman Anda dengan Aplikasi dan
            untuk mengumpulkan informasi tentang pola penggunaan Anda.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">2. Cara Kami Menggunakan Informasi Anda</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-2 leading-relaxed">
            2.1 Kami menggunakan informasi yang kami kumpulkan untuk tujuan berikut:
          </p>
          <ul className="list-disc list-inside text-lg text-gray-600 dark:text-gray-300 mb-8 space-y-2 pl-4">
            <li>Untuk menyediakan dan memelihara Aplikasi, termasuk manajemen akun dan autentikasi</li>
            <li>Untuk meningkatkan fungsionalitas dan pengalaman pengguna Aplikasi</li>
            <li>Untuk menanggapi pertanyaan, komentar, atau masukan Anda</li>
            <li>Untuk mengirimkan pemberitahuan administratif, pembaruan, dan komunikasi relevan lainnya</li>
            <li>Untuk menganalisis dan memantau pola penggunaan, melakukan analisis data, dan melakukan penelitian</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">3. Pembagian dan Pengungkapan Informasi</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-2 leading-relaxed">
            3.1 Kami dapat membagikan informasi pribadi Anda dalam keadaan berikut:
          </p>
          <ul className="list-disc list-inside text-lg text-gray-600 dark:text-gray-300 mb-8 space-y-2 pl-4">
            <li>Dengan penyedia layanan yang membantu kami mengoperasikan Aplikasi dan menyediakan Layanan</li>
            <li>Untuk mematuhi kewajiban hukum, menegakkan Syarat Layanan kami, dan melindungi hak kami atau hak pihak lain</li>
            <li>
              Dalam hal pengalihan bisnis, seperti merger, akuisisi, atau penjualan, di mana informasi Anda dapat
              menjadi bagian dari aset yang dialihkan
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">4. Keamanan Data</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            4.1 Kami menerapkan langkah-langkah yang wajar untuk melindungi informasi pribadi Anda dari akses,
            pengungkapan, perubahan, atau penghancuran yang tidak sah. Namun, tidak ada metode transmisi melalui
            internet atau penyimpanan elektronik yang sepenuhnya aman, dan kami tidak dapat menjamin keamanan mutlak.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">5. Penyimpanan Informasi</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            5.1 Kami akan menyimpan informasi pribadi Anda selama diperlukan untuk memenuhi tujuan yang diuraikan
            dalam Kebijakan ini, atau sebagaimana diwajibkan oleh hukum.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">6. Tautan dan Layanan Pihak Ketiga</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            6.1 Aplikasi kami mungkin berisi tautan ke situs web atau layanan pihak ketiga. Kami tidak bertanggung
            jawab atas praktik privasi atau konten dari situs web atau layanan pihak ketiga tersebut. Kami mendorong
            Anda untuk meninjau kebijakan privasi pihak ketiga ini sebelum memberikan informasi pribadi kepada
            mereka.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">7. Privasi Anak-Anak</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            7.1 Aplikasi kami tidak ditujukan untuk digunakan oleh individu di bawah usia 13 tahun. Kami tidak secara
            sengaja mengumpulkan informasi pribadi dari anak-anak di bawah 13 tahun. Jika Anda adalah orang tua atau
            wali dan yakin bahwa anak Anda telah memberikan informasi pribadi kepada kami, silakan hubungi kami, dan
            kami akan segera menghapus informasi tersebut.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">8. Perubahan Kebijakan Privasi</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            8.1 Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu, dan setiap perubahan akan diposting
            di halaman ini. Penggunaan Aplikasi yang berkelanjutan setelah perubahan pada Kebijakan ini menandakan
            penerimaan Anda terhadap ketentuan yang diperbarui.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">9. Hubungi Kami</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            9.1 Jika Anda memiliki pertanyaan atau kekhawatiran tentang Kebijakan Privasi ini atau praktik data kami,
            silakan hubungi kami di{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary-600 dark:text-primary-400 underline hover:no-underline">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>

          <p className="text-lg text-gray-600 dark:text-gray-300 mt-12 leading-relaxed">
            Dengan menggunakan Aplikasi kami, Anda mengakui bahwa Anda telah membaca, memahami, dan menyetujui
            Kebijakan Privasi ini.
          </p>
        </article>
      </main>
      <Footer currentLang="id" />
    </div>
  );
}
