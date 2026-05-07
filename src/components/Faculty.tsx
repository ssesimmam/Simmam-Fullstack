import { Mail, Phone } from "lucide-react";
import { SectionHeader } from "./Dashboard";

const faculty = [
  { name: "Dr. R. Sundaram", role: "Chief Coordinator", dept: "CSE", phone: "+91 98765 11111", email: "sundaram@simats.edu" },
  { name: "Dr. S. Manikandan", role: "Cultural Lead", dept: "MECH", phone: "+91 98765 22222", email: "mani@simats.edu" },
  { name: "Dr. K. Vasanthi", role: "Events Director", dept: "ECE", phone: "+91 98765 33333", email: "vasanthi@simats.edu" },
  { name: "Dr. P. Lakshmi", role: "Tech Coordinator", dept: "IT", phone: "+91 98765 44444", email: "lakshmi@simats.edu" },
  { name: "Dr. A. Mohan", role: "Stage Manager", dept: "EEE", phone: "+91 98765 55555", email: "mohan@simats.edu" },
  { name: "Dr. T. Bhaskar", role: "Logistics Lead", dept: "CIVIL", phone: "+91 98765 66666", email: "bhaskar@simats.edu" },
];

const initials = (n: string) =>
  n
    .replace("Dr. ", "")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2);

export function Faculty() {
  return (
    <section id="faculty" className="relative py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader
          eyebrow="Faculty Coordinators"
          title="The Conductors of SIMMAM"
          subtitle="Mentors guiding every spotlight, every score, every standing ovation."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {faculty.map((f) => (
            <div
              key={f.name}
              className="group relative glass rounded-2xl p-6 hover-lift overflow-hidden text-center"
            >
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  background:
                    "radial-gradient(circle at 50% 0%, oklch(0.78 0.16 80 / 0.3), transparent 60%)",
                }}
              />
              <div className="relative inline-block">
                <div className="absolute inset-0 rounded-full animate-spin-slow">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle
                      cx="50"
                      cy="50"
                      r="48"
                      fill="none"
                      stroke="oklch(0.78 0.16 80 / 0.6)"
                      strokeWidth="0.6"
                      strokeDasharray="2 6"
                    />
                  </svg>
                </div>
                <div className="w-24 h-24 rounded-full grid place-items-center bg-gradient-to-br from-[var(--crimson)] to-[var(--gold)] font-display text-2xl font-bold text-background shadow-[var(--shadow-glow-gold)] m-2">
                  {initials(f.name)}
                </div>
              </div>
              <div className="relative mt-3">
                <div className="font-display text-xl font-bold text-gradient-gold">{f.name}</div>
                <div className="text-xs tracking-[0.25em] text-foreground/55 mt-1">
                  {f.role.toUpperCase()} • {f.dept}
                </div>
                <div className="mt-4 flex items-center justify-center gap-3 text-xs">
                  <a
                    href={`tel:${f.phone.replace(/\s/g, "")}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-gold hover:text-gold/80"
                  >
                    <Phone className="w-3 h-3" /> Call
                  </a>
                  <a
                    href={`mailto:${f.email}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-gold hover:text-gold/80"
                  >
                    <Mail className="w-3 h-3" /> Email
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
