import { SignUp } from "@clerk/clerk-react";
import { useNavigate } from "react-router";
import { useAuth } from "../modules/auth/use-auth";
import { Page } from "src/modules/navigation";
import { Navbar } from "src/modules/navigation";
import Block from "src/components/block";

import "./signup.css";

export default function SignUpPage() {
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
        <SignUp
          path="/signup"
          signInUrl="/signin"
          routing="path"
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
      </Block>
    </Page>
  );
}
