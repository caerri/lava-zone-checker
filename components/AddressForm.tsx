"use client";
// This special Next.js directive tells the framework that the component must run in the browser.
// Client components can use state, event handlers, and browser APIs; they also get bundled separately.

import { useState } from "react";
// Standard ES module import statement from JavaScript.
// We pull in React’s useState hook so the component can remember values between renders.

interface AddressFormProps {
  /**
   * onSubmit is a function that receives the cleaned-up address string.
   * It returns a Promise that resolves to nothing because the caller just needs to finish work;
   * we only care whether it completes or throws an error, not about a return payload.
   */
  onSubmit: (address: string) => Promise<void>;

  /**
   * submitting is a boolean the parent passes down to tell us whether a lookup is in progress.
   * When true we disable the button and show loading text to avoid duplicate requests.
   * When false the form is ready for another user submission.
   */
  submitting: boolean;
}
// This interface is pure TypeScript: it enforces the shape of the props at compile time.
// During runtime these types disappear, which keeps the React component lean.

export default function AddressForm(
  { onSubmit, submitting }: AddressFormProps
) {
  /**
   * address holds the current text entered by the user.
   * useState("") creates component state with a default empty string.
   * setAddress lets us update that state whenever the input field changes.
   */
  const [address, setAddress] = useState("");

  /**
   * touched tracks whether the user has interacted with the input or submission.
   * We use it to decide when to show validation messages, so the UI stays friendly.
   * setTouched flips the flag on blur or submit, which signals the user tried to use the form.
   */
  const [touched, setTouched] = useState(false);

  /**
   * handleSubmit runs when the user submits the form.
   * React.FormEvent<HTMLFormElement> is a TypeScript annotation describing the event object.
   * We prevent the browser’s default form behaviour, validate the address, and invoke onSubmit.
   */
  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    // preventDefault stops the browser from doing a full-page refresh.
    // That keeps control within React and lets us handle everything in JavaScript.

    setTouched(true);
    // Mark that the user attempted to submit, which will trigger validation feedback.

    if (!address.trim()) {
      // trim removes leading/trailing whitespace so blank strings become empty.
      // If the address is still empty, we bail out and silently refuse to submit.
      return;
    }

    await onSubmit(address.trim());
    // We pass the cleaned address up to the parent.
    // Await ensures we respect the parent’s async work and can handle errors if they bubble up.
  };

  /**
   * The JSX below describes the UI tree for the form.
   * JSX is a syntax extension that looks like HTML but compiles into React.createElement calls.
   */
  return (
    <form
      onSubmit={handleSubmit}
      style={{
        marginTop: "1.5rem",
      }}
    >
      <label htmlFor="address">
        Street address
        <input
          id="address"
          name="address"
          type="text"
          placeholder="1234 Example St, Hilo, HI"
          value={address}
          onChange={(event) => {
            // The onChange handler runs every time the user types.
            // event.target.value carries the latest text, which we store in state.
            setAddress(event.target.value);
          }}
          onBlur={() => {
            // onBlur fires when the input loses focus (e.g., user tabs away).
            // Marking touched here helps surface validation once the user leaves the field.
            setTouched(true);
          }}
          style={{
                display: "block",
                width: "100%",
                marginTop: "0.5rem",
                padding: "0.75rem",
          }}
        />
      </label>

      {touched && !address.trim() && (
        <p
          style={{
                color: "#c0392b",
                marginTop: "0.5rem",
          }}
        >
          Please enter an address.
        </p>
      )}
      {/* This conditional block renders only when the user touched the field
          and the trimmed address is still empty, giving gentle feedback. */}

      <button
        type="submit"
        disabled={submitting}
        style={{
              marginTop: "1rem",
              padding: "0.75rem 1.25rem",
        }}
      >
        {submitting ? "Looking up…" : "Check Lava Zone"}
        {/* Ternary expression swaps the button text based on the submitting flag.
            When true the user sees a loading hint; otherwise they see the normal label. */}
      </button>
    </form>
  );
}