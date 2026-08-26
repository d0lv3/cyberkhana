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

  // Product cards (hero)
  'product.platform.name': { en: 'CyberKhana Platform', ar: 'منصة سايبر خانة' },
  'product.platform.cta': { en: 'CyberKhana', ar: 'سايبر خانة' },
  'product.platform.body': {
    en: 'The competition and community model. One student ambassador per university gets admin control of their own campus dashboard, where they author CTF challenges, run competitions, publish announcements, and track how their community is progressing. Each ambassador runs a weekly two hour workshop: one hour of theory on a single topic, then one hour of live capture the flag where students immediately apply it. Six challenge categories, Very Easy to Expert difficulty, dynamic scoring, first blood tracking, purchasable hints, plus per university and national leaderboards. This is the awareness model and the distribution channel. Roughly 300 students at two universities use it today.',
    ar: 'نموذج المنافسة والمجتمع. لكل جامعة سفير طالب واحد يحصل على صلاحيات إدارة لوحة تحكم حرمه الجامعي، حيث يكتب تحديات CTF، ويدير المسابقات، وينشر الإعلانات، ويتابع تقدّم مجتمعه. كل سفير يقدّم ورشة أسبوعية من ساعتين: ساعة نظرية في موضوع واحد، ثم ساعة التقاط أعلام مباشرة يطبّق فيها الطلاب ما تعلّموه فوراً. ست فئات من التحديات، ومستويات من سهل جداً إلى خبير، ونظام نقاط ديناميكي، وتتبّع لأول حل، وتلميحات قابلة للشراء، إضافة إلى لوحات متصدرين على مستوى الجامعة وعلى المستوى الوطني. هذا هو نموذج التوعية وقناة الانتشار. يستخدمه اليوم نحو 300 طالب في جامعتين.',
  },
  'product.academy.name': { en: 'CyberKhana Academy', ar: 'أكاديمية سايبر خانة' },
  'product.academy.cta': { en: 'CyberKhana Academy', ar: 'أكاديمية سايبر خانة' },
  'product.academy.body': {
    en: 'The learning model. A weekly workshop cannot build a security engineer, so the Academy is where students go the other six days of the week. Structured in order: Fundamentals first, then Modules on specific topics, then Paths built around a career track such as SOC Analyst or Penetration Tester. Everything is hands on and runs in the browser: students write and execute real Python, C and Bash inside the lesson, watch packets move through a live network simulation, and practice in an in browser terminal & more.',
    ar: 'نموذج التعلّم. ورشة أسبوعية واحدة لا تصنع مهندس أمن سيبراني، ولذلك فالأكاديمية هي وجهة الطلاب في الأيام الستة الأخرى من الأسبوع. مرتّبة بالتسلسل: الأساسيات أولاً، ثم وحدات في مواضيع محددة، ثم مسارات مبنية على مسار مهني مثل محلل مركز عمليات الأمن أو مختبِر اختراق. كل شيء عملي ويعمل داخل المتصفح: يكتب الطلاب وينفّذون شيفرة حقيقية بلغات Python وC وBash داخل الدرس، ويشاهدون الحزم تتحرك في محاكاة شبكة حية، ويتدربون على طرفية داخل المتصفح والمزيد.',
  },

  // iPad
  'ipad.title': { en: "See What's Inside", ar: 'اكتشف ما بالداخل' },
  'ipad.subtitle': { en: 'A platform built for real hackers.', ar: 'منصة مبنية لمحترفي الأمن السيبراني.' },

  // Features
  'features.heading': { en: 'Your Cyber Arsenal', ar: 'ترسانتك السيبرانية' },
  'features.subtitle': { en: 'Everything you need to become a real hacker.', ar: 'كل ما تحتاجه لتصبح هاكر حقيقي.' },
  'features.ctf.title': { en: 'CTF Challenges', ar: 'تحديات CTF' },
  'features.ctf.desc': {
    en: 'Real-world challenges across Web Exploitation, Pwn, Cryptography, Reverse Engineering, and Forensics. Every flag captured is a skill earned.',
    ar: 'تحديات حقيقية في استغلال الويب، Pwn، التشفير، الهندسة العكسية، والتحقيق الجنائي الرقمي. كل علم تلتقطه هو مهارة جديدة.',
  },
  'features.comp.title': { en: 'Live Competitions', ar: 'مسابقات مباشرة' },
  'features.comp.desc': {
    en: 'Go head-to-head in timed CTF battles. Climb the ranks. Prove your skill under pressure. Real-time leaderboards, real stakes.',
    ar: 'واجه منافسيك في معارك CTF محددة بوقت. تسلق الترتيب. أثبت مهارتك تحت الضغط. لوحات متصدرين مباشرة، تحدي حقيقي.',
  },
  'features.academy.title': { en: 'CyberKhana Academy', ar: 'أكاديمية سايبر خانة' },
  'features.academy.desc': {
    en: 'Structured learning paths from beginner to expert. Interactive modules. Hands-on labs. Courses in both Arabic and English.',
    ar: 'مسارات تعلم منظمة من المبتدئ إلى الخبير. وحدات تفاعلية. مختبرات عملية. دورات بالعربية والإنجليزية.',
  },
  'features.leaderboard.title': { en: 'Leaderboards & Rankings', ar: 'لوحات المتصدرين والتصنيفات' },
  'features.leaderboard.desc': {
    en: 'Real-time rankings, university comparisons, achievement badges, and tier progression. Your reputation, quantified.',
    ar: 'تصنيفات مباشرة، مقارنات بين الجامعات، شارات إنجاز، وتقدم في المستويات. سمعتك، بالأرقام.',
  },

  // Mascots
  'mascots.heading': { en: 'Meet The Categories', ar: 'تعرّف على التخصصات' },
  'mascots.subtitle': { en: 'Six domains. Choose your path.', ar: 'ستة مجالات. اختر تخصصك.' },
  'mascots.web': { en: 'Web Exploitation', ar: 'اختراق الويب' },
  'mascots.web.tag': { en: 'Spin the web. Break the web.', ar: 'اكتشف ثغرات تطبيقات الويب.' },
  'mascots.crypto': { en: 'Cryptography', ar: 'التشفير' },
  'mascots.crypto.tag': { en: 'Every cipher has a weakness.', ar: 'كل شيفرة لها نقطة ضعف.' },
  'mascots.forensics': { en: 'Forensics', ar: 'التحقيق الرقمي' },
  'mascots.forensics.tag': { en: 'The evidence never lies.', ar: 'الأدلة الرقمية لا تكذب.' },
  'mascots.reversing': { en: 'Reverse Engineering', ar: 'الهندسة العكسية' },
  'mascots.reversing.tag': { en: 'Unravel the machine.', ar: 'حلّل البرنامج من الداخل.' },
  'mascots.pwn': { en: 'Binary Exploitation', ar: 'اختراق الأنظمة' },
  'mascots.pwn.tag': { en: 'Own the stack. Own the system.', ar: 'تحكّم بالنظام بالكامل.' },
  'mascots.all': { en: 'All Domains', ar: 'جميع المجالات' },
  'mascots.all.tag': { en: 'Master all. Fear none.', ar: 'أتقن الجميع. بلا حدود.' },

  // Academy
  'academy.heading': { en: 'Learn Cybersecurity. Your Way. Your Language.', ar: 'تعلم الأمن السيبراني. بطريقتك. بلغتك.' },
  'academy.bullet1': { en: 'Interactive hands-on modules', ar: 'وحدات تفاعلية عملية' },
  'academy.bullet2': { en: 'Structured beginner-to-expert paths', ar: 'مسارات منظمة من المبتدئ إلى الخبير' },
  'academy.bullet3': { en: 'Full Arabic language support', ar: 'دعم كامل للغة العربية' },
  'academy.bullet4': { en: 'Linux, Networking, Web Security & more', ar: 'لينكس، الشبكات، أمن الويب والمزيد' },
  'academy.bullet5': { en: 'Progress tracking & achievements', ar: 'تتبع التقدم والإنجازات' },
  'academy.arabicCallout': { en: 'Learn cybersecurity in your language', ar: 'تعلم الأمن السيبراني بلغتك' },
  'academy.cta': { en: 'Start Learning', ar: 'ابدأ التعلم' },

  // Stats
  'stats.heading': { en: 'A Growing Movement', ar: 'حركة متنامية' },
  'stats.students': { en: 'Students', ar: 'طالب' },
  'stats.universities': { en: 'Universities', ar: 'جامعات' },
  'stats.challenges': { en: 'Challenges', ar: 'تحدي' },
  'stats.competitions': { en: 'Competitions', ar: 'مسابقات' },

  // CTA / Footer
  'cta.heading': { en: 'Ready to Level Up?', ar: 'مستعد للتطور؟' },
  'cta.subtitle': { en: 'Join 300+ students already sharpening their skills.', ar: 'انضم لأكثر من 300 طالب يطورون مهاراتهم الآن.' },
  'cta.getStarted': { en: 'Get Started', ar: 'ابدأ الآن' },
  'cta.signIn': { en: 'Sign In', ar: 'تسجيل الدخول' },
  'footer.founded': { en: 'Founded by Abdullah Alnuaimy & Abdulrahman Majid', ar: 'تأسست على يد عبدالله النعيمي وعبدالرحمن ماجد' },
  'footer.builtIn': { en: 'Built in Iraq', ar: 'صُنعت في العراق' },
  'footer.copyright': { en: '© 2026 CyberKhana. All rights reserved.', ar: '© 2026 سايبر خانة. جميع الحقوق محفوظة.' },
  'footer.challenges': { en: 'Challenges', ar: 'التحديات' },
  'footer.competitions': { en: 'Competitions', ar: 'المسابقات' },
  'footer.academy': { en: 'Academy', ar: 'الأكاديمية' },
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
