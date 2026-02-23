import { UserProfile } from "@clerk/clerk-react";
import { Page } from "../../navigation";
import { Navbar } from "../../navigation";
import { useLanguageContext } from "../../i18n/LanguageContext";

export default function Profile() {
  const { t } = useLanguageContext();

  return (
    <Page>
      <Navbar title={t("account")} showBackButton={true} />
      <div className="w-fit m-auto">
        <UserProfile 
          path="/profile"
          routing="path"
        />
      </div>
    </Page>
  );
}
