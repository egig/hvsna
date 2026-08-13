import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { Page, Navbar } from "../navigation";
import Block from "../components/block";
import {
  HvCreditCard,
  HvCrown,
  HvExternalLink,
  HvAlertCircle,
} from "@/modules/icons";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useSubscription } from "./use-subscription";
import type { SubscriptionStatus } from "@/domain/subscription/Subscription";

const ACTIVE_STATUSES: SubscriptionStatus[] = ["on_trial", "active", "past_due", "unpaid", "paused"];

export default function Subscription() {
  const { t } = useLanguageContext();
  const [searchParams] = useSearchParams();
  const {
    subscription,
    loading,
    error,
    isStartingCheckout,
    checkoutError,
    startCheckout,
    refresh,
  } = useSubscription();

  useEffect(() => {
    if (searchParams.get("checkout") === "success") refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isPaid = !!subscription && ACTIVE_STATUSES.includes(subscription.status);

  const formatDate = (isoDate: string | null) => {
    if (!isoDate) return null;
    return new Date(isoDate).toLocaleDateString();
  };

  return (
    <Page>
      <Navbar title={t("subscription")} showBackButton={true} />
      <Block>
        <div className="space-y-6">
          <div className="rounded-lg p-4 bg-gray-200">
            <p className="text-sm text-gray-600">{t("subscription_description")}</p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <HvAlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{t("subscription_load_error")}</p>
              </div>
            </div>
          )}

          {!loading && !error && (
            <div className="rounded-lg border-gray-200 border p-6 bg-white">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t("current_plan")}:</span>
                  <span
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-900"
                  >
                    {isPaid && (
                      <HvCrown
                        className="h-4 w-4"
                        style={{ color: "var(--hvsna-primary-color)" }}
                      />
                    )}
                    {isPaid ? t("sync_plan") : t("free_plan")}
                  </span>
                </div>

                {subscription && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{t("status")}:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {t(`status_${subscription.status}` as const)}
                      </span>
                    </div>

                    {subscription.renewsAt && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{t("renews_on")}:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(subscription.renewsAt)}
                        </span>
                      </div>
                    )}

                    {subscription.endsAt && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{t("ends_on")}:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(subscription.endsAt)}
                        </span>
                      </div>
                    )}

                    {subscription.trialEndsAt && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{t("trial_ends_on")}:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(subscription.trialEndsAt)}
                        </span>
                      </div>
                    )}

                    {subscription.cardBrand && subscription.cardLastFour && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{t("payment_method")}:</span>
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {subscription.cardBrand} •••• {subscription.cardLastFour}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {!subscription && (
                  <p className="text-sm text-gray-600">{t("free_plan_description")}</p>
                )}
              </div>
            </div>
          )}

          {checkoutError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">{t("checkout_error")}</p>
            </div>
          )}

          {!loading && !isPaid && (
            <button
              onClick={startCheckout}
              disabled={isStartingCheckout}
              className={`text-sm w-full md:w-fit px-4 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 border ${
                isStartingCheckout
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
                  : "text-white hover:opacity-90"
              }`}
              style={{
                backgroundColor: isStartingCheckout ? undefined : "var(--hvsna-primary-color)",
                borderColor: isStartingCheckout ? undefined : "var(--hvsna-primary-color)",
              }}
            >
              <HvCreditCard className="h-4 w-4" />
              {isStartingCheckout ? t("redirecting_to_checkout") : t("upgrade_to_sync")}
            </button>
          )}

          {isPaid && (subscription?.customerPortalUrl || subscription?.updatePaymentMethodUrl) && (
            <div className="flex flex-col md:flex-row gap-3">
              {subscription.customerPortalUrl && (
                <a
                  href={subscription.customerPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm w-full md:w-fit px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {t("manage_subscription")}
                  <HvExternalLink className="h-4 w-4" />
                </a>
              )}
              {subscription.updatePaymentMethodUrl && (
                <a
                  href={subscription.updatePaymentMethodUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm w-full md:w-fit px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {t("update_payment_method")}
                  <HvExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          )}
        </div>
      </Block>
    </Page>
  );
}
