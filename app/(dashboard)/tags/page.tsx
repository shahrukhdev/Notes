import type { Metadata } from "next";
import TagsClient from "./TagsClient";

export const metadata: Metadata = {
  title: "Tags",
};

export default function Page() {
  return <TagsClient />;
}