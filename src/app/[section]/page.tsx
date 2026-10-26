import { notFound } from "next/navigation";
import HomePage from "@/components/home-page";

const sections = [
  "opportunities",
  "how-it-works",
  "community",
  "membership",
];

export function generateStaticParams() {
  return sections.map((section) => ({ section }));
}

export default async function SectionPage(props: PageProps<"/[section]">) {
  const { section } = await props.params;

  if (!sections.includes(section)) {
    notFound();
  }

  return <HomePage />;
}
