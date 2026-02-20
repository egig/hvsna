import { SignIn } from "@clerk/clerk-react";
import { useNavigate } from "react-router";
import { Page } from "src/modules/navigation";
import { Navbar } from "src/modules/navigation";
import Block from "src/ui/block";

import "./signin.css";
import { useAuth } from "../use-auth";

export default function SignInPage() {
  const navigate = useNavigate();
  const { isSignedIn, isAuthenticated } = useAuth();

  // // Redirect to home if already authenticated
  // useEffect(() => {
  //   if (isSignedIn && isAuthenticated) {
  //     navigate("/", { replace: true });
  //   }
  // }, [isSignedIn, isAuthenticated, navigate]);

  return (
    <Page>
      <Navbar title="" />
      <Block>
        <div className="mx-auto w-fit">
          <SignIn
            path="/signin"
            routing="path"
            signUpUrl="/signup"
            appearance={{
              layout: {
                socialButtonsVariant: "blockButton",
                showOptionalFields: false,
              },
              variables: {
                colorPrimary: "var(--hvsna-primary-color)",
              },
            }}
          />
        </div>
      </Block>
    </Page>
  );
}
