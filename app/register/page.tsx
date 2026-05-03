import type { Metadata } from "next";
import RegisterClient from "./RegisterClient";

export const metadata: Metadata = {
  title: "Register | Notes App",
};

export default function Page() {
  return <RegisterClient />;
}