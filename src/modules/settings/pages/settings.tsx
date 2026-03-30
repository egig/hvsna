import { Show, useClerk } from "@clerk/react";
import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import {
  LogIn,
  Trash,
  Cog,
  Info,
  RefreshCw,
  User,
  LogOut,
  Clock,
  List,
  ListIcon,
} from "lucide-react";
import { Page } from "../../navigation";
import { MenuItem } from "../../../ui/menu-item";
import { Navbar } from "../../navigation";
import { useLanguageContext } from "../../i18n/LanguageContext";
import { useFeatureFlag } from "src/modules/feature-flags/useFeatureFlags";

export default function Settings() {
  const { t } = useLanguageContext();
  const { signOut } = useClerk();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <Page>
      <Navbar title={t("settings")} showBackButton={true} />
      <Show when="signed-in">
        <MenuItem title={t("account")} icon={User} to="/profile" />
      </Show>
      <Show when="signed-out">
        <MenuItem title={t("sign_in")} icon={LogIn} to="/signin" />
      </Show>
      <MenuItem title={t("general")} icon={Cog} to="/settings/general" />
      <MenuItem
        title={t("prayer_time_fallback") || "Prayer Time Fallback"}
        icon={Clock}
        to="/settings/prayer-time-fallback"
      />
      <Show when="signed-in">
        <MenuItem title={t("sync")} icon={RefreshCw} to="/sync" />
      </Show>
      <MenuItem title={t("reset_device_data")} icon={Trash} to="/wipe-local" />
      <MenuItem title={t("about")} icon={Info} to="/about" />
      <Show when="signed-in">
        <MenuItem
          title={t("sign_out")}
          icon={LogOut}
          onClick={() => setConfirmOpen(true)}
        />
        <Dialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
            <Dialog.Viewport className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
              <Dialog.Popup className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm p-6 outline-none">
                <Dialog.Title className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {t("sign_out")}
                </Dialog.Title>
                <Dialog.Description className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  {t("sign_out_confirm")}
                </Dialog.Description>
                <div className="flex gap-3 justify-end">
                  <Dialog.Close className="px-4 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    {t("cancel")}
                  </Dialog.Close>
                  <button
                    onClick={() => signOut()}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-danger-500 text-white hover:bg-red-600 transition-colors"
                  >
                    {t("sign_out")}
                  </button>
                </div>
              </Dialog.Popup>
            </Dialog.Viewport>
          </Dialog.Portal>
        </Dialog.Root>
      </Show>
    </Page>
  );
}
