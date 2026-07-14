import Image from "next/image";
import { getTeamMembers, getTeamSectionText } from "@/lib/site";

export function ExecutiveTeamSection() {

  const members = getTeamMembers();
  const text = getTeamSectionText();

  return (
    <section
      id="team"
      className="relative overflow-hidden py-16 lg:py-24"
      style={{
        backgroundImage:
          "linear-gradient(rgba(5,32,60,.6),rgba(5,32,60,.8)),url(/images/www.solidhydrogen.tech/bg-team.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="mx-auto max-w-[980px] px-6 lg:px-0">

        <h1 className="mb-4 whitespace-pre-line text-center font-sans text-[40px] font-bold leading-[1.1] tracking-[-0.8px] text-white md:text-[56px] lg:text-[70px]">
          {text.heading_1}{"\n"}{text.heading_2}{"\n"}{text.heading_3}
        </h1>

        <h5 className="mb-16 whitespace-pre-line text-center font-sans text-[18px] font-bold uppercase tracking-[0.05em] text-[#F26329]">
          {text.subheading_1}{"\n"}{text.subheading_2}{"\n"}{text.subheading_3}
        </h5>

        <div className="grid gap-12 md:grid-cols-2">

          {members.map((member) => (

            <div
              key={member.id}
              className="flex flex-col items-center text-center"
            >

              <Image
                src={member.image}
                alt={member.name}
                width={250}
                height={250}
                className="mb-6 h-[250px] w-[250px] rounded-full object-cover"
              />

              <h2 className="mb-2 whitespace-pre-line font-sans text-[30px] font-bold leading-[24px] tracking-[-0.6px] text-[#F26329]">
                {member.name}
              </h2>

              <h5 className="mb-4 font-sans text-[18px] font-bold uppercase tracking-[0.05em] text-[#F26329]">
                {member.position}
              </h5>

              <p className="max-w-[400px] font-sans text-[16px] font-light leading-[22.4px] tracking-[-0.16px] text-white">
                {member.bio}
              </p>

            </div>

          ))}

        </div>

      </div>

    </section>
  );
}