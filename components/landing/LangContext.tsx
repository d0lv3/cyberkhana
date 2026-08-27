import React, { createContext, useContext, useState } from 'react';

type Lang = 'en' | 'ar';

interface LangContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
  isArabic: boolean;
}

const translations: Record<string, Record<Lang, string>> = {
  // Navbar
  'nav.login': { en: 'Login', ar: 'تسجيل الدخول' },
  'nav.getStarted': { en: 'Get Started', ar: 'ابدأ الآن' },

  // Hero
  'hero.headline': { en: "Revolutionizing Cybersecurity Education in Iraq", ar: 'تغيير واقع تعليم الامن السبراني في العراق' },
  'hero.cta.enter': { en: 'Get Started', ar: 'ابدأ الآن' },
  'hero.cta.login': { en: 'I Have An Account', ar: 'لدي حساب' },

  // The model, in the hero. Short on purpose — the section below walks it
  // through properly, and a hero that has to be read is a hero nobody reads.
  'hero.model': {
    en: 'One student ambassador per university, running their own campus dashboard: authoring CTF challenges, holding a weekly workshop, and taking their community up the national leaderboard.',
    ar: 'سفير طالب واحد لكل جامعة، يدير لوحة تحكم حرمه الجامعي: يكتب تحديات CTF، ويقيم ورشة أسبوعية، ويرتقي بمجتمعه في لوحة المتصدرين الوطنية.',
  },

  // iPad
  'ipad.title': { en: "See What's Inside", ar: 'اكتشف ما بالداخل' },
  'ipad.subtitle': { en: 'A platform built for real hackers.', ar: 'منصة مبنية لمحترفي الأمن السيبراني.' },

  // How it works
  'how.heading': { en: 'How It Works', ar: 'كيف تعمل' },
  'how.subtitle': {
    en: 'Four steps, repeating every week on every campus.',
    ar: 'أربع خطوات، تتكرر كل أسبوع في كل حرم جامعي.',
  },
  'how.step1.title': { en: 'A student takes their campus', ar: 'طالب يتولّى حرمه الجامعي' },
  'how.step1.body': {
    en: 'One ambassador per university, given admin control of their own campus dashboard — not a shared one.',
    ar: 'سفير واحد لكل جامعة، يحصل على صلاحيات إدارة لوحة تحكم حرمه الجامعي — لا لوحة مشتركة.',
  },
  'how.step2.title': { en: 'They build the challenges', ar: 'يبني التحديات' },
  'how.step2.body': {
    en: 'Authoring CTF challenges across six categories, from Very Easy to Expert, plus competitions and announcements for their community.',
    ar: 'يكتب تحديات CTF في ست فئات، من سهل جداً إلى خبير، إضافة إلى المسابقات والإعلانات لمجتمعه.',
  },
  'how.step3.title': { en: 'Two hours, every week', ar: 'ساعتان كل أسبوع' },
  'how.step3.body': {
    en: 'An hour of theory on a single topic, then an hour of live capture the flag where students apply it immediately.',
    ar: 'ساعة نظرية في موضوع واحد، ثم ساعة التقاط أعلام مباشرة يطبّق فيها الطلاب ما تعلّموه فوراً.',
  },
  'how.step4.title': { en: 'The scores go national', ar: 'النتائج تصل للمستوى الوطني' },
  'how.step4.body': {
    en: 'Dynamic scoring, first blood tracking and purchasable hints feed both a campus leaderboard and a national one.',
    ar: 'نظام نقاط ديناميكي، وتتبّع لأول حل، وتلميحات قابلة للشراء، تغذّي لوحة متصدري الجامعة ولوحة المتصدرين الوطنية.',
  },

  // Ambassadors
  'amb.eyebrow': { en: 'Bring CyberKhana to your university', ar: 'أحضر سايبر خانة إلى جامعتك' },
  'amb.heading': { en: 'Become Your Campus Ambassador', ar: 'كن سفير حرمك الجامعي' },
  'amb.body': {
    en: 'Every university on CyberKhana started with one student who asked. You get admin control of your campus dashboard, the challenge authoring tools, and a community that grows around what you build. No prior teaching experience needed — just the willingness to run two hours a week.',
    ar: 'كل جامعة على سايبر خانة بدأت بطالب واحد سأل. ستحصل على صلاحيات إدارة لوحة تحكم حرمك الجامعي، وأدوات كتابة التحديات، ومجتمع ينمو حول ما تبنيه. لا حاجة لخبرة تدريس سابقة — فقط الاستعداد لتقديم ساعتين أسبوعياً.',
  },
  'amb.cta': { en: 'Apply to be an ambassador', ar: 'قدّم لتكون سفيراً' },
  'amb.note': {
    en: 'Tell us your university, your year, and why you want to run it.',
    ar: 'أخبرنا باسم جامعتك، وسنتك الدراسية، ولماذا تريد أن تقودها.',
  },

  // Stats
  'stats.heading': { en: 'A Growing Movement', ar: 'حركة متنامية' },
  'stats.students': { en: 'Students', ar: 'طالب' },
  'stats.universities': { en: 'Universities', ar: 'جامعات' },
  'stats.challenges': { en: 'Challenges', ar: 'تحدي' },
  'stats.competitions': { en: 'Competitions', ar: 'مسابقات' },

  // CTA / Footer
  'footer.founded': { en: 'Founded by Abdullah Alnuaimy', ar: 'تأسست على يد عبدالله النعيمي' },
  'footer.builtIn': { en: 'Built in Iraq', ar: 'صُنعت في العراق' },
  'footer.copyright': { en: '© 2026 CyberKhana. All rights reserved.', ar: '© 2026 سايبر خانة. جميع الحقوق محفوظة.' },
  'footer.challenges': { en: 'Challenges', ar: 'التحديات' },
  'footer.competitions': { en: 'Competitions', ar: 'المسابقات' },
  'footer.leaderboard': { en: 'Leaderboard', ar: 'المتصدرين' },
};

const LangContext = createContext<LangContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key: string) => key,
  isArabic: false,
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');

  const t = (key: string): string => {
    return translations[key]?.[lang] ?? key;
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t, isArabic: lang === 'ar' }}>
      <div dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        {children}
      </div>
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
