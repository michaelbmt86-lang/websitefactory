import { getHero, getHeroAnimated } from "@/lib/site";

export function HeroSection() {
  const hero = getHero();
  const anim = getHeroAnimated();

  return (
    <section className="relative -mt-[106px] flex min-h-[100vh] items-center justify-center overflow-hidden bg-[#05203C] pt-[106px]">

      <video
        autoPlay
        loop
        muted
        playsInline
        poster={hero.poster}
        className="absolute inset-0 h-full w-full object-cover opacity-60"
      >
        <source src={hero.video} type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(5,32,60,0.4)] via-[rgba(5,32,60,0.7)] to-[#05203C]" />

      <div className="relative z-10 flex flex-col items-center px-6 text-center">

        <h1 className="font-sans text-[48px] font-bold leading-[1] tracking-[-1.6px] text-white md:text-[64px] lg:text-[80px]">
          {hero.title1}
        </h1>

        <h1 className="font-sans text-[48px] font-bold leading-[1] tracking-[-1.6px] text-white md:text-[64px] lg:text-[80px]">
          {hero.title2}
        </h1>

        <div className="relative mt-6 h-[100px] overflow-hidden md:h-[140px] lg:h-[188px]">
          <h1 className="absolute inset-0 flex items-center justify-center font-sans text-[80px] font-black leading-[0.95] tracking-[-2px] text-white transition-all duration-700 md:text-[140px] lg:text-[188px]">
            {anim.word1}
          </h1>
          <h1 className="absolute inset-0 flex items-center justify-center font-sans text-[80px] font-black leading-[0.95] tracking-[-2px] text-white transition-all duration-700 md:text-[140px] lg:text-[188px] animate-[slideUp_4s_ease-in-out_infinite]">
            {anim.word2}
          </h1>
        </div>

      </div>

    </section>
  );
}
