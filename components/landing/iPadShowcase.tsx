import { ContainerScroll } from '../ui/container-scroll-animation';
import BrandLogo from '../ui/BrandLogo';
import { useLang } from './LangContext';

const iPadShowcase = () => {
  const { t } = useLang();

  return (
    <div className="bg-canvas">
      <ContainerScroll
        // A lighter bezel than the default zinc-700/800: the frame sat almost
        // the same value as the page behind it, so the device read as a flat
        // rectangle rather than something holding a screen.
        frameClassName="border-zinc-500 bg-zinc-700"
        screenClassName="bg-zinc-800"
        titleComponent={
          <div className="flex flex-col items-center">
            <BrandLogo
              variant="text"
              className="h-16 md:h-24 w-auto object-contain mx-auto"
            />
            <h2
              className="text-2xl sm:text-3xl md:text-5xl text-fg font-bold mt-4"
              style={{ fontWeight: 700 }}
            >
              {t('ipad.title')}
            </h2>
            <p
              className="text-muted text-lg mt-2"
            >
              {t('ipad.subtitle')}
            </p>
          </div>
        }
      >
        {/* w-full as well as h-full: with height alone the shot sat at its own
            aspect ratio and left a bar of bezel down each side. Covering from
            the top crops a sliver off the foot of the page — the activity log
            — and never the header or the stat row. */}
        <img
          src="/assets/landing/platform-dashboard.png"
          alt="The CyberKhana dashboard: rank, captured flags and recent activity"
          className="mx-auto h-full w-full rounded-2xl object-cover object-top"
          draggable={false}
        />
      </ContainerScroll>
    </div>
  );
};

export default iPadShowcase;
