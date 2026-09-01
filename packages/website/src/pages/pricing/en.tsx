import { Check } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SUPPORT_EMAIL, WEB_APP_SIGNUP_URL } from "@/config";
import { useSeo } from "@/seo/Seo";
import { usePricing, formatPrice } from "@/hooks/use-pricing";

export default function PricingPage() {
  useSeo();
  const pricing = usePricing();

  const plans = [
    {
      name: "Free",
      price: "Free",
      period: "",
      description: "Available now on Android and Web",
      features: [
        "Hijri calendar awareness",
        "Prayer-anchored scheduling",
        "Unlimited tasks",
        "Offline support",
        "Android and Web apps available now, iOS app (coming soon)",
      ],
      cta: "Get it on Google Play",
      href: "https://play.google.com/store/apps/details?id=com.hvsna.app",
      highlighted: false,
      badge: true,
      secondaryCta: "Try it on Web",
      secondaryHref: WEB_APP_SIGNUP_URL,
    },
    {
      name: "Sync",
      price: pricing ? formatPrice(pricing) : "Simple, transparent pricing",
      period: "",
      description: "Sync your tasks across devices",
      features: [
        "All Free features",
        "Sync across Android & Web",
        "Priority support",
        "Support the development",
      ],
      cta: "Get Sync",
      href: WEB_APP_SIGNUP_URL,
      highlighted: true,
    },
  ];

  const faqs = [
    {
      question: "Is there a free plan?",
      answer:
        "Yes! The free plan gives you full access to core features on both Android and Web, including Hijri calendar awareness, prayer-anchored scheduling, and unlimited tasks. Sync unlocks keeping that data in step across devices.",
    },
    {
      question: "Do you sell my data?",
      answer:
        "Never. We keep the lights on by offering a Sync plan, not by selling your data. Your data stays private and you can export or delete it at any time.",
    },
    {
      question: "Do you offer a student discount?",
      answer: `Yes! Reach out to ${SUPPORT_EMAIL} and we will get you a discount code.`,
    },
    {
      question: "What platforms do you support?",
      answer: "Hvsna is available now on Android and Web. iOS is coming soon.",
    },
    {
      question: "How do I start syncing?",
      answer: "Create an account on Web or in the Android app, then subscribe to Sync from Settings to keep your tasks in step across devices.",
    },
  ];

  return (
    <div className="min-h-screen">
      <Header currentLang="en" />
      <main>
        {/* Hero */}
        <section className="py-16 lg:py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">A plan for everyone</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">No credit card required to sign up, cancel anytime</p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="pb-16 lg:pb-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {plans.map((plan, index) => (
                <div
                  key={index}
                  className={`rounded-2xl p-6 flex flex-col ${
                    plan.highlighted
                      ? "bg-primary-600 text-white ring-2 ring-primary-600 shadow-xl scale-[1.02]"
                      : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="mb-6">
                    <h3 className={`text-lg font-semibold mb-2 ${plan.highlighted ? "text-primary-100" : "text-gray-500 dark:text-gray-400"}`}>
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline">
                      <span className={`text-4xl font-bold ${plan.highlighted ? "text-white" : "text-gray-900 dark:text-white"}`}>
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className={`ml-1 text-sm ${plan.highlighted ? "text-primary-200" : "text-gray-500 dark:text-gray-400"}`}>
                          {plan.period}
                        </span>
                      )}
                    </div>
                    <p className={`mt-2 text-sm ${plan.highlighted ? "text-primary-100" : "text-gray-500 dark:text-gray-400"}`}>
                      {plan.description}
                    </p>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start space-x-3">
                        <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.highlighted ? "text-yellow-300" : "text-primary-500"}`} />
                        <span className={`text-sm ${plan.highlighted ? "text-white" : "text-gray-700 dark:text-gray-300"}`}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.badge ? (
                    <div className="space-y-3">
                      <a href={plan.href} className="flex justify-center">
                        <img src="/GetItOnGooglePlay_Badge_Web_color_English.svg" alt={plan.cta} className="h-14 w-auto" />
                      </a>
                      {plan.secondaryHref && (
                        <a
                          href={plan.secondaryHref}
                          className="block w-full text-center py-3 px-4 rounded-lg font-semibold border border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                        >
                          {plan.secondaryCta}
                        </a>
                      )}
                    </div>
                  ) : (
                    <a
                      href={plan.href}
                      className={`block w-full text-center py-3 px-4 rounded-lg font-semibold transition-colors ${
                        plan.highlighted ? "bg-white text-primary-600 hover:bg-primary-50" : "bg-primary-600 text-white hover:bg-primary-700"
                      }`}
                    >
                      {plan.cta}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="pb-16 lg:pb-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">Frequently asked questions</h2>
            <div className="space-y-8">
              {faqs.map((faq, index) => (
                <div key={index}>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{faq.question}</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer currentLang="en" />
    </div>
  );
}
