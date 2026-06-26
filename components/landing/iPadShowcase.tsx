import { ContainerScroll } from '../ui/container-scroll-animation';
import BrandLogo from '../ui/BrandLogo';
import { useLang } from './LangContext';

const iPadShowcase = () => {
  const { t, isArabic } = useLang();

  return (
    <div className="bg-[#0d1117]">
      <ContainerScroll
        titleComponent={
          <div className="flex flex-col items-center">
            <BrandLogo
              variant="text"
              className="h-16 md:h-24 w-auto object-contain mx-auto"
            />
            <h2
              className="text-3xl md:text-5xl text-[#f3f6ff] font-bold mt-4"
              style={{ fontWeight: 700 }}
            >
              {t('ipad.title')}
            </h2>
            <p
              className="text-[#9aa5bf] text-lg mt-2"
            >
              {t('ipad.subtitle')}
            </p>
          </div>
        }
      >
        <img
          src="/assets/dashboard-preview.png"
          alt="CyberKhana Dashboard"
          className="mx-auto rounded-2xl object-cover h-full object-top"
          draggable={false}
        />
      </ContainerScroll>
    </div>
  );
};

export default iPadShowcase;
