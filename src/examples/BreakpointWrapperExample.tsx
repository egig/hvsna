import React from "react";
import { BreakpointWrapper } from "../components/BreakpointWrapper";

/**
 * Example usage of BreakpointWrapper component
 *
 * This example shows how to wrap your main application content
 * with the BreakpointWrapper to handle desktop and tablet screen sizes.
 */
export const AppWithBreakpointWrapper: React.FC = () => {
  const handleClose = () => {
    console.log("Breakpoint wrapper closed");
  };

  return (
    <BreakpointWrapper
      onClose={handleClose}
      showCloseButton={true}
      className="custom-breakpoint-wrapper"
    >
      {/* Your main application content goes here */}
      <div className="app-content">
        <h1>Your Mobile App</h1>
        <p>This content will only show on mobile devices.</p>
        <p>On desktop/tablet, users will see the breakpoint warning.</p>
      </div>
    </BreakpointWrapper>
  );
};

/**
 * Alternative usage without close button
 */
export const AppWithMandatoryBreakpoint: React.FC = () => {
  return (
    <BreakpointWrapper showCloseButton={false}>
      <div className="app-content">
        <h1>Mobile Only App</h1>
        <p>Desktop users cannot dismiss this warning.</p>
      </div>
    </BreakpointWrapper>
  );
};
