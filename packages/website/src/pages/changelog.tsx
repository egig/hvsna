import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useSeo } from "@/seo/Seo";

interface ChangelogChanges {
  new: string[];
  improved: string[];
  fixed: string[];
}

interface Release {
  platform: string;
  version: string;
  changes: ChangelogChanges;
}

interface ChangelogEntry {
  date: string;
  releases: Release[];
}

const changelogData: ChangelogEntry[] = [
  {
    date: "September 14, 2026",
    releases: [
      {
        platform: "Web",
        version: "v1.1.1",
        changes: {
          new: [],
          improved: [],
          fixed: ["Fixed a bug where turning a task into a repeating task could create a duplicate for that same day"],
        },
      },
    ],
  },
  {
    date: "September 11, 2026",
    releases: [
      {
        platform: "Web",
        version: "v1.1.0",
        changes: {
          new: [
            "Tags, so you can organize and filter your tasks your way",
            "Sync your tasks across devices (Sync plan)",
            "Redesigned layouts for phone and desktop, each tuned for its screen",
          ],
          improved: [
            "Refreshed icons and dark mode colors for better readability",
            "Smoother recurring task editing",
            "More reliable login sessions",
            "Pricing and sync info on the website is now always up to date",
          ],
          fixed: [
            "Fixed a bug where having multiple tabs open at once could mix up your data",
            "Fixed prayer time edge cases around sunrise",
            "Fixed subscription checkout emails not always going out",
          ],
        },
      },
      {
        platform: "Android",
        version: "v2.2.0",
        changes: {
          new: [
            "Tags, so you can organize and filter your tasks your way",
            "Light, dark, and system appearance settings",
            "Bahasa Indonesia language support",
          ],
          improved: [
            "Native Android navigation for a snappier feel",
            "Quick undo feedback when you complete or delete a task",
            "Smoother recurring task editing",
          ],
          fixed: ["Various small bug fixes"],
        },
      },
    ],
  },
  {
    date: "August 14, 2026",
    releases: [
      {
        platform: "Web",
        version: "v1.0.1",
        changes: {
          new: ["Subscription checkout via Lemon Squeezy in Settings"],
          improved: ["Email verification moved into a global announcement bar", "Sync now requires a verified email"],
          fixed: ["Webhook event handling"],
        },
      },
      {
        platform: "Android",
        version: "v2.1.0",
        changes: {
          new: ["Authentication", "Sync"],
          improved: ["UI Improvement"],
          fixed: [],
        },
      },
    ],
  },
  {
    date: "July 16, 2026",
    releases: [
     {
        platform: "Android (Beta)",
        version: "v2.0.0",
        changes: {
          new: [],
          improved: ["UI Revamp using android native"],
          fixed: [],
        },
      }, 
    ]
  },
  {
    date: "June 15, 2026",
    releases: [
      {
        platform: "Android (Early Access)",
        version: "v1.1.10",
        changes: {
          new: [],
          improved: [],
          fixed: ["Various bug fixes"],
        },
      },
    ],
  },
  {
    date: "June 12, 2026",
    releases: [
      {
        platform: "Android (Early Access)",
        version: "v1.1.9",
        changes: {
          new: ["Recurring Tasks", "Tags", "And More"],
          improved: [],
          fixed: ["Various bug fixes"],
        },
      },
    ],
  },
  {
    date: "April 4, 2026",
    releases: [
      {
        platform: "Android",
        version: "v1.1.4 (Early Access)",
        changes: {
          new: ["Initial core feature: Prayer-anchored task scheduleing", "Basic task management with prayer-based reminders", "Pages: Today, Upcoming, Search"],
          improved: [],
          fixed: [],
        },
      },
    ],
  },
];

const getCategoryColor = (category: string) => {
  switch (category) {
    case "new":
      return "text-green-600 dark:text-green-400";
    case "improved":
      return "text-blue-600 dark:text-blue-400";
    case "fixed":
      return "text-yellow-600 dark:text-yellow-400";
    default:
      return "text-gray-600 dark:text-gray-400";
  }
};

const getBulletColor = (category: string) => {
  switch (category) {
    case "new":
      return "text-green-500";
    case "improved":
      return "text-blue-500";
    case "fixed":
      return "text-yellow-500";
    default:
      return "text-gray-500";
  }
};

export default function ChangelogsPage() {
  useSeo();
  return (
    <div className="min-h-screen">
      <Header currentLang="en" />
      <main>
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-24">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">Changelog</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 leading-relaxed">Track the latest updates and improvements to Hvsna.</p>

          <div className="space-y-16">
            {changelogData.map((entry) => (
              <section key={entry.date}>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">{entry.date}</h2>

                {entry.releases.map((release) => (
                  <div key={`${release.platform}-${release.version}`} className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      {release.platform} {release.version}
                    </h3>

                    <div className="space-y-6">
                      {(Object.entries(release.changes) as [string, string[]][]).map(
                        ([category, items]) =>
                          items.length > 0 && (
                            <div key={category}>
                              <h4 className={`text-lg font-semibold ${getCategoryColor(category)} mb-3 capitalize`}>{category}</h4>
                              <ul className="space-y-2">
                                {items.map((item, index) => (
                                  <li key={index} className="flex items-start text-gray-600 dark:text-gray-300">
                                    <span className={`${getBulletColor(category)} mr-2`}>•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ),
                      )}
                    </div>
                  </div>
                ))}
              </section>
            ))}
          </div>
        </article>
      </main>
      <Footer currentLang="en" />
    </div>
  );
}
