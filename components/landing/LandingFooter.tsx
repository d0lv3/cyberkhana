import { useLang } from './LangContext';


function Footer() {
  const { t } = useLang();

  return (
    <footer className="bg-deep border-t border-edge">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <img
            src="/assets/brand/cyberkhana-text-logo.png"
            alt="CyberKhana"
            loading="lazy"
            className="h-8 w-auto"
          />
        </div>

        <div className="border-t border-edge/50 my-8" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-faint text-xs">
          <span>{t('footer.founded')}</span>
          <span className="inline-flex items-center gap-1.5">
            {t('footer.builtIn')}
            <img src="/assets/brand/flag-iraq.webp" alt="Iraq" className="h-3.5 w-auto inline-block" />
          </span>
          <span>{t('footer.copyright')}</span>
        </div>
      </div>
    </footer>
  );
}

export default function LandingFooter() {
  return <Footer />;
}
