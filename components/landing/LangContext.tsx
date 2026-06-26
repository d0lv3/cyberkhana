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

  // iPad
  'ipad.title': { en: "See What's Inside", ar: 'اكتشف ما بالداخل' },
  'ipad.subtitle': { en: 'A platform built for real hackers.', ar: 'منصة مبنية لمحترفي الأمن السيبراني.' },

  // Story
  'story.heading': { en: 'Born From Frustration, Built With Fire', ar: 'ولدت من الإحباط، وبُنيت بالشغف' },
  'story.subtitle': { en: 'The story of how two students decided to change everything.', ar: 'قصة طالبين قررا تغيير كل شيء.' },
  'story.node1.title': { en: 'The Spark', ar: 'الشرارة' },
  'story.node1.text': {
    en: 'Abdullah Alnuaimy, a cybersecurity engineering student, looked around his lecture hall and saw a disconnect. Outdated slides. Theoretical exams. Zero hands-on practice. He knew there had to be a better way to learn how to hack — and how to defend.',
    ar: 'عبدالله النعيمي، طالب هندسة أمن سيبراني، نظر حوله في قاعة المحاضرات ورأى فجوة كبيرة. شرائح قديمة، امتحانات نظرية، ولا أي تطبيق عملي. أدرك أنه لا بد من طريقة أفضل.',
  },
  'story.node2.title': { en: 'The First Move', ar: 'الخطوة الأولى' },
  'story.node2.text': {
    en: "He launched a cybersecurity club with a dead-simple formula: one hour of theory, one hour of live CTF practice. Every week. No excuses. Word spread fast — students who had never touched a terminal were submitting flags within weeks.",
    ar: 'أطلق نادي أمن سيبراني بمعادلة بسيطة: ساعة نظري وساعة تطبيق عملي CTF كل أسبوع. انتشر الخبر بسرعة — طلاب لم يفتحوا Terminal من قبل بدأوا يحلون تحديات خلال أسابيع.',
  },
  'story.node3.title': { en: 'The Alliance', ar: 'الشراكة' },
  'story.node3.text': {
    en: 'Abdulrahman Majid, a fellow cybersecurity student from the University of Mosul, heard about the movement. Two minds, one mission. Together they began building a platform that could scale beyond a single classroom.',
    ar: 'عبدالرحمن ماجد، طالب أمن سيبراني من جامعة الموصل، سمع عن الفكرة وأعجبته. عقلان بهدف واحد. معاً بدأوا ببناء منصة تصل لكل الطلاب.',
  },
  'story.node4.title': { en: 'The Platform', ar: 'المنصة' },
  'story.node4.text': {
    en: 'CyberKhana was born — a full-stack CTF platform with real challenges, live competitions, and leaderboards. Over 300 students joined from across Iraqi universities. It was no longer just a club. It was a movement.',
    ar: 'ولدت سايبر خانة — منصة CTF متكاملة بتحديات حقيقية، مسابقات مباشرة، ولوحة متصدرين. أكثر من 300 طالب انضموا من جامعات عراقية مختلفة. لم تعد مجرد نادي، بل أصبحت حركة.',
  },
  'story.node5.title': { en: 'The Academy', ar: 'الأكاديمية' },
  'story.node5.text': {
    en: "CyberKhana Academy launched with interactive modules, structured courses, guided learning paths, and full Arabic language support. The vision: every student in Iraq — and eventually the Middle East — deserves world-class cybersecurity education, in their own language.",
    ar: 'أطلقنا أكاديمية سايبر خانة بدورات تفاعلية، مسارات تعلم منظمة، ودعم كامل للعربية. الرؤية: كل طالب في العراق والشرق الأوسط يستحق تعليم أمن سيبراني بمستوى عالمي، بلغته.',
  },

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
