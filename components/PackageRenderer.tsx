"use client";

import { TEMPLATE_MAP, DEFAULT_TEMPLATE_ID } from "./templates/index";
import type { TPackage, TAgency, Lang } from "./templates/types";

type Props = {
  pkg: TPackage;
  agency: TAgency;
  templateId?: string;
  onWhatsApp: () => void;
  onMessenger: () => void;
  lang: Lang;
};

export default function PackageRenderer({ pkg, agency, templateId, onWhatsApp, onMessenger, lang }: Props) {
  const id = templateId || agency.activeTemplate || DEFAULT_TEMPLATE_ID;
  const template = TEMPLATE_MAP[id] || TEMPLATE_MAP[DEFAULT_TEMPLATE_ID];
  const Page = template.Page;
  return <Page pkg={pkg} agency={agency} onWhatsApp={onWhatsApp} onMessenger={onMessenger} lang={lang} />;
}
