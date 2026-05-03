import type { Metadata } from "next";
import ForgotPassword from "./ForgotPasswordClient";

export const metadata: Metadata = {
  title: "Forgot Password",
};

export default function Page() {
  return <ForgotPassword />;
}