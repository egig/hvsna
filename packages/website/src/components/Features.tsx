import { Calendar, Clock, Smartphone, Cloud } from "lucide-react";

export default function Features({ currentLang = "en" }: { currentLang?: string }) {
  const content = {
    en: {
      title: "Built for Muslims",
      subtitle: "Every feature designed to align with your Islamic values and daily routine",
      features: [
        {
          icon: Calendar,
          title: "Hijri Awareness",
          description: "Islamic dates displayed alongside civil calendar for complete awareness",
          details: ["Automatic Hijri date display", "Dual calendar view", "Islamic month awareness"],
        },
        {
          icon: Clock,
          title: "Prayer-Anchored",
          description: "Tasks organized around prayer times",
          details: ["Task scheduling between prayers", "Prayer time auto-sorted", "View whats completed today"],
        },
        {
          icon: Smartphone,
          title: "Accessible Focused UI",
          description: "Clean, simple interface showing today and upcoming tasks",
          details: ["Minimal distractions", "Today-focused, upcoming for planning", "Mobile and large screen support"],
        },
        {
          icon: Cloud,
          title: "Offline First",
          description: "Works perfectly offline on Android and Web, with optional cross-device Sync",
          details: ["Full offline functionality", "Cross-device Sync (Sync plan)", "Data privacy protection"],
        },
      ],
    },
    id: {
      title: "Dibuat untuk Muslim",
      subtitle: "Setiap fitur dirancang untuk selaras dengan nilai-nilai Islam dan rutinitas harianmu",
      features: [
        {
          icon: Calendar,
          title: "Kalender Hijriah",
          description: "Tanggal Islam ditampilkan di samping kalender biasa",
          details: ["Tampilan tanggal Hijriah otomatis", "Tampilan dual kalender", "Kalender Hijriah dalam keseharian"],
        },
        {
          icon: Clock,
          title: "Berbasis Waktu Sholat",
          description: "Tugas diatur sekitar waktu sholat untuk menjaga fokus spiritual",
          details: ["Pengingat waktu sholat", "Penjadwalan tugas antara sholat", "Pelacakan produktivitas spiritual"],
        },
        {
          icon: Smartphone,
          title: "UI yang memudahkan",
          description: "Antarmuka bersih dan sederhana menampilkan tugas hari ini dan mendatang",
          details: ["Minimal gangguan", "Tampilan fokus hari ini", "Pratinjau tugas mendatang"],
        },
        {
          icon: Cloud,
          title: "Dukungan offline",
          description: "Bekerja sempurna tanpa internet di Android dan Web, dengan Sync antar perangkat (opsional)",
          details: ["Fungsionalitas offline penuh", "Sync antar perangkat (paket Sync)", "Perlindungan privasi data"],
        },
      ],
    },
  };

  const t = content[currentLang as keyof typeof content];

  return (
    <section id={currentLang === "id" ? "fitur" : "features"} className="py-14 sm:py-20 bg-white dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">{t.title}</h2>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-pretty">{t.subtitle}</p>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          {t.features.map((feature, index) => (
            <div key={index} className="group">
              <div className="dark:bg-gray-800 rounded-2xl p-6 sm:p-8 h-full border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 hover:shadow-lg">
                {/* Icon & Title */}
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-12 sm:h-12 bg-primary-100 dark:bg-primary-900 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{feature.title}</h3>
                </div>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-300 mb-4 sm:mb-6">{feature.description}</p>

                {/* Details List */}
                <ul className="space-y-2">
                  {feature.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-start text-sm text-gray-500 dark:text-gray-400">
                      <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
