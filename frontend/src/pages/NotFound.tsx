import { ArrowLeft } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Seo } from "@/components/ui/Seo";

export default function NotFoundPage() {
  return (
    <>
      <Seo title="Page not found" />
      <meta name="robots" content="noindex" />
      <PageHeader title="This page has shipped elsewhere" subtitle="The page you're looking for doesn't exist or has been moved." />
      <section className="container-page py-16">
        <ButtonLink href="/" variant="navy">
          <ArrowLeft className="size-4" aria-hidden /> Back to home
        </ButtonLink>
      </section>
    </>
  );
}
