"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type Language =
  | "en"
  | "bn";

type LanguageContextType = {
  lang: Language;
  setLanguage: (
    language: Language
  ) => void;
  toggleLanguage: () => void;
};

const LanguageContext =
  createContext<
    LanguageContextType
    | undefined
  >(undefined);

type Props = {
  children: ReactNode;
};

export default function LanguageProvider({
  children,
}: Props) {
  const [lang, setLang] =
    useState<Language>(
      "en"
    );

  /*
   * Load saved language
   */
  useEffect(() => {
    const saved =
      localStorage.getItem(
        "jiplance-lang"
      );

    if (
      saved === "en" ||
      saved === "bn"
    ) {
      setLang(saved);
    }
  }, []);

  /*
   * Listen to Header language changes
   */
  useEffect(() => {
    const handleLanguageChange =
      (
        event: Event
      ) => {
        const customEvent =
          event as CustomEvent<
            Language
          >;

        const next =
          customEvent.detail;

        if (
          next === "en" ||
          next === "bn"
        ) {
          setLang(next);
        }
      };

    window.addEventListener(
      "jiplance-language-change",
      handleLanguageChange
    );

    return () => {
      window.removeEventListener(
        "jiplance-language-change",
        handleLanguageChange
      );
    };
  }, []);

  const setLanguage =
    (
      language:
        Language
    ) => {
      setLang(
        language
      );

      localStorage.setItem(
        "jiplance-lang",
        language
      );

      window.dispatchEvent(
        new CustomEvent(
          "jiplance-language-change",
          {
            detail:
              language,
          }
        )
      );
    };

  const toggleLanguage =
    () => {
      setLanguage(
        lang === "en"
          ? "bn"
          : "en"
      );
    };

  const value =
    useMemo(
      () => ({
        lang,
        setLanguage,
        toggleLanguage,
      }),
      [lang]
    );

  return (
    <LanguageContext.Provider
      value={value}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context =
    useContext(
      LanguageContext
    );

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider"
    );
  }

  return context;
}