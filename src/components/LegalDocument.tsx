import type { ReactNode } from "react";

/** The inbox for privacy, deletion and terms questions; also Google's consent-screen support email. */
export const CONTACT_EMAIL = "chauhanvaibhav1105@gmail.com";

export function LegalDocument({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl px-gutter-mobile py-space-2xl lg:px-gutter-desktop">
      <h1 className="font-headline-xl text-headline-xl-mobile text-on-surface lg:text-headline-xl">
        {title}
      </h1>
      <p className="font-body-sm text-body-sm mt-space-sm text-on-surface-variant">
        Last updated {updated}
      </p>
      <div className="mt-space-xl space-y-space-xl">{children}</div>
    </main>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="font-headline-md text-headline-md text-on-surface">{heading}</h2>
      <div className="font-body-lg text-body-lg mt-space-sm space-y-space-sm text-on-surface-variant [&_a]:font-semibold [&_a]:text-primary [&_a:hover]:underline [&_li]:ml-space-lg [&_li]:list-disc">
        {children}
      </div>
    </section>
  );
}
