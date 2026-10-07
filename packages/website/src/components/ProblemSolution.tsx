import { AlertCircle, CheckCircle, Heart } from "lucide-react";

export default function ProblemSolution({ currentLang = "en" }: { currentLang?: string }) {
  const content = {
    en: {
      problem: {
        title: "The Problem",
        subtitle: "Without the right tools, staying consistent with our deen becomes an uphill battle",
        challenges: [
          "Worship goes unstructured — days pass without a clear plan for ibadah",
          "Schedules fill up with commitments that push salah to the sidelines",
          "Voluntary acts of worship slip away — intentions fade without tracking",
          "Existing tools were never built with our faith in mind",
        ],
      },
      solution: {
        title: "The Vision",
        subtitle: "Designed from scratch around Islamic principles — not patched onto a generic template",
        benefits: [
          "Prayer-first scheduling — organize tasks around salah, keeping faith at the center",
          "Hijri calendar awareness — view Islamic dates alongside civil calendar",
          "Clean, focused interface — see what matters today at a glance, distraction-free",
          "Offline-first — fully functional without internet",
        ],
      },
      education: {
        title: "Why This Matters",
        subtitle: "Put your deen first, and let productivity follow naturally",
        points: [
          {
            icon: Heart,
            title: "Deen First",
            description: "Every feature is shaped so your faith leads the way, and productivity becomes a natural outcome",
          },
          {
            icon: AlertCircle,
            title: "Salah at the Center",
            description: "Structure your day around prayer — the cornerstone of a Muslim's routine and the anchor of your schedule",
          },
          {
            icon: CheckCircle,
            title: "Grow Every Day",
            description: 'Hvsna means "Best" in Arabic — a reminder to strive for excellence in everything you do',
          },
        ],
      },
    },
    id: {
      problem: {
        title: "Permasalahan",
        subtitle: "Tanpa alat yang tepat, menjaga konsistensi ibadah menjadi sulit",
        challenges: [
          "Ibadah tidak terstruktur - hari berlalu tanpa rencana ibadah yang jelas",
          "Jadwal penuh dengan aktivitas yang menggeser waktu sholat",
          "Amalan sunnah terabaikan - niat memudar tanpa pencatatan",
          "Aplikasi yang ada tidak pernah dibuat dengan mempertimbangkan keimanan kita",
        ],
      },
      solution: {
        title: "Solusi Kami",
        subtitle: "Dirancang dari awal berdasarkan prinsip Islam - bukan modifikasi template umum",
        benefits: [
          "Penjadwalan berbasis sholat — atur tugas di sekitar waktu sholat, menjadikan iman sebagai pusat",
          "Kalender Hijriah — lihat tanggal Islam di samping kalender biasa",
          "Tampilan bersih dan fokus - lihat yang penting hari ini dalam sekali lihat, tanpa gangguan",
          "Offline-first - berfungsi penuh tanpa internet, sinkron otomatis saat terhubung kembali",
        ],
      },
      education: {
        title: "Mengapa Ini Penting",
        subtitle: "Prioritaskan agama Anda, produktivitas akan mengikuti dengan sendirinya",
        points: [
          {
            icon: Heart,
            title: "Iman sebagai Prioritas",
            description: "Setiap fitur dirancang agar iman Anda menjadi landasan, produktivitas akan datang sebagai hasilnya",
          },
          {
            icon: AlertCircle,
            title: "Sholat yang Utama",
            description: "Atur hari Anda di sekitar waktu sholat - fondasi rutinitas Muslim dan penjangga jadwal Anda",
          },
          {
            icon: CheckCircle,
            title: "Tumbuh, Setiap Hari",
            description: 'Hvsna artinya "Terbaik" dalam bahasa Arab - pengingat untuk terus berusaha lebih baik setiap saat',
          },
        ],
      },
    },
  };

  const t = content[currentLang as keyof typeof content];

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Problem Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">{t.problem.title}</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">{t.problem.subtitle}</p>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8">
            <div className="flex items-start space-x-4">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-4">
                  {currentLang === "id" ? "Tantangan yang Dihadapi:" : "The Challenges:"}
                </h3>
                <ul className="space-y-3">
                  {t.problem.challenges.map((challenge, index) => (
                    <li key={index} className="flex items-start text-red-800 dark:text-red-200">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      {challenge}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Solution Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">{t.solution.title}</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">{t.solution.subtitle}</p>
          </div>

          <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-2xl p-8">
            <div className="flex items-start space-x-4">
              <CheckCircle className="w-6 h-6 text-primary-600 dark:text-primary-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-primary-900 dark:text-primary-100 mb-4">
                  {currentLang === "id" ? "Manfaat Hvsna:" : "Hvsna Benefits:"}
                </h3>
                <ul className="space-y-3">
                  {t.solution.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start text-primary-800 dark:text-primary-200">
                      <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Education Section */}
        <div>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">{t.education.title}</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">{t.education.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {t.education.points.map((point, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-6">
                  <point.icon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{point.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{point.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
