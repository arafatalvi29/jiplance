"use client";

import {
  ReactNode,
} from "react";

import {
  useLanguage,
} from "@/components/LanguageProvider";

type Props = {
  en: ReactNode;
  bn: ReactNode;
};

export default function BilingualText({
  en,
  bn,
}: Props) {
  const {
    lang,
  } =
    useLanguage();

  return (
    <>
      {lang === "bn"
        ? bn
        : en}
    </>
  );
}