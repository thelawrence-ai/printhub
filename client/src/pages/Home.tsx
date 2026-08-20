/* Paper Street Studio: editorial print-desk layout, paper surfaces, ink contrast, print-coral actions, decisive micro-interactions. */
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Clock3,
  FileText,
  MapPin,
  Menu,
  PackageCheck,
  Printer,
  QrCode,
  ScanLine,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";

const heroImage = "/manus-storage/printhub-hero_bb68bdee.jpg";
const notesImage = "/manus-storage/printhub-notes_3b8bc3e9.jpg";
const deliveryImage = "/manus-storage/printhub-delivery_7a434c37.jpg";
const logoImage = "/manus-storage/printhub-logo_fb7f9664.png";

const printOptions = [
  { title: "Black & white", detail: "From ₹1 / side", tag: "Most popular" },
  { title: "Colour notes", detail: "From ₹5 / side", tag: "For diagrams" },
  { title: "Spiral binding", detail: "From ₹40 / book", tag: "Exam ready" },
];

const steps = [
  { no: "01", title: "Send your file", copy: "Upload PDFs, slides, or clear photos from your phone." },
  { no: "02", title: "Choose the finish", copy: "Pick pages, sides, colour, and binding — we’ll flag anything unclear." },
  { no: "03", title: "Collect or deliver", copy: "Get a WhatsApp update when your stack is ready." },
];

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState("Black & white");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  const handleFile = (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    toast.success("File added to your print list", { description: "Choose your finish, then send the details on WhatsApp." });
  };

  return (
    <div className="min-h-screen bg-[#f7f3eb] text-[#151412] selection:bg-[#e9604c] selection:text-white">
      <header className="sticky top-0 z-40 border-b border-[#151412]/10 bg-[#f7f3eb]/90 backdrop-blur-xl">
        <div className="container flex h-[76px] items-center justify-between">
          <button className="flex items-center gap-3" onClick={() => scrollTo("top")} aria-label="Go to top">
            <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-[#e9604c]">
              <img src={logoImage} alt="" className="h-7 w-7 object-contain mix-blend-multiply" />
            </span>
            <span className="font-display text-[22px] font-semibold tracking-[-0.04em]">PrintHub<span className="text-[#e9604c]">.</span></span>
          </button>

          <nav className="hidden items-center gap-8 text-[12px] font-bold uppercase tracking-[0.12em] text-[#151412]/60 md:flex">
            <button onClick={() => scrollTo("how-it-works")} className="transition-colors hover:text-[#e9604c]">How it works</button>
            <button onClick={() => scrollTo("delivery")} className="transition-colors hover:text-[#e9604c]">Delivery</button>
            <button onClick={() => scrollTo("prices")} className="transition-colors hover:text-[#e9604c]">Prices</button>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <span className="hidden text-[11px] font-bold uppercase tracking-[0.12em] text-[#151412]/50 lg:block">Open today · 8am–8pm</span>
            <button onClick={() => scrollTo("order")} className="group inline-flex items-center gap-2 rounded-full bg-[#151412] px-5 py-3 text-[12px] font-bold uppercase tracking-[0.12em] text-[#f7f3eb] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e9604c] active:scale-[.97]">
              Print your notes <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>
          <button className="md:hidden" onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle menu">
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {mobileOpen && <div className="border-t border-[#151412]/10 px-5 py-5 md:hidden"><div className="flex flex-col gap-5 text-sm font-bold uppercase tracking-[0.1em]"><button onClick={() => scrollTo("how-it-works")} className="text-left">How it works</button><button onClick={() => scrollTo("delivery")} className="text-left">Delivery</button><button onClick={() => scrollTo("prices")} className="text-left">Prices</button><button onClick={() => scrollTo("order")} className="rounded-full bg-[#e9604c] px-4 py-3 text-left text-white">Print your notes →</button></div></div>}
      </header>

      <main id="top">
        <section className="container grid gap-12 pb-20 pt-12 md:grid-cols-[1.02fr_.98fr] md:items-end md:gap-16 md:pb-28 md:pt-20">
          <div className="relative z-10">
            <div className="mb-7 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#e9604c] animate-in fade-in slide-in-from-bottom-2 duration-500"><span className="h-2 w-2 rounded-full bg-[#e9604c]" /> Your campus copy desk</div>
            <h1 className="font-display max-w-[680px] text-[clamp(3.6rem,8vw,7.8rem)] font-semibold leading-[.87] tracking-[-0.07em]">Your notes,<br /><em className="font-normal text-[#e9604c]">ready</em> before<br />the next lecture.</h1>
            <div className="mt-9 flex max-w-[500px] items-start gap-4 border-l-2 border-[#e9604c] pl-5"><p className="text-[17px] leading-[1.55] text-[#151412]/68">Print, bind, and collect your study material without the queue. Send us a file, tell us what you need, and keep moving.</p></div>
            <div className="mt-9 flex flex-wrap items-center gap-4"><button onClick={() => scrollTo("order")} className="group inline-flex items-center gap-3 rounded-full bg-[#e9604c] px-6 py-4 text-sm font-bold text-white shadow-[0_8px_0_#bc4537] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_0_#bc4537] active:translate-y-1 active:shadow-[0_3px_0_#bc4537]">Start an order <ArrowUpRight className="h-4 w-4" /></button><button onClick={() => scrollTo("how-it-works")} className="inline-flex items-center gap-2 px-2 py-3 text-sm font-bold text-[#151412]/70 transition-colors hover:text-[#e9604c]">See how it works <span className="text-[#e9604c]">↓</span></button></div>
            <div className="mt-14 flex gap-9 border-t border-[#151412]/15 pt-5"><div><p className="font-display text-3xl font-semibold tracking-[-.05em]">2 hr</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[.13em] text-[#151412]/45">Express ready</p></div><div><p className="font-display text-3xl font-semibold tracking-[-.05em]">₹1<span className="text-lg">/side</span></p><p className="mt-1 text-[10px] font-bold uppercase tracking-[.13em] text-[#151412]/45">B&amp;W printing</p></div><div><p className="font-display text-3xl font-semibold tracking-[-.05em]">6 days</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[.13em] text-[#151412]/45">Open every week</p></div></div>
          </div>
          <div className="relative min-h-[430px] md:min-h-[600px]">
            <div className="absolute -right-4 top-0 z-10 w-[86%] rotate-[3deg] overflow-hidden rounded-[3px] bg-white p-3 shadow-[14px_18px_0_rgba(21,20,18,.08)] md:-right-8 md:w-[90%]"><img src={heroImage} alt="Printed study notes and a desktop printer" className="h-[390px] w-full object-cover md:h-[540px]" /></div>
            <div className="absolute bottom-4 left-0 z-20 w-[190px] -rotate-6 bg-[#e9604c] p-5 text-white shadow-[8px_8px_0_rgba(21,20,18,.13)]"><ScanLine className="mb-8 h-7 w-7" /><p className="text-[10px] font-bold uppercase tracking-[.14em]">Print / bind / deliver</p><p className="mt-2 font-display text-2xl leading-none">No queue<br />required.</p></div>
            <div className="absolute -bottom-4 right-5 z-10 h-24 w-24 rounded-full border border-[#151412]/30 bg-[#f7f3eb] p-3 text-center text-[9px] font-bold uppercase tracking-[.12em] text-[#151412]/65"><div className="grid h-full place-items-center rounded-full border border-dashed border-[#151412]/30">Made for<br />campus life</div></div>
          </div>
        </section>

        <section id="order" className="border-y border-[#151412]/10 bg-[#ebe5d9] py-20 md:py-24"><div className="container grid gap-12 md:grid-cols-[.72fr_1.28fr] md:gap-20"><div><p className="eyebrow">01 / Quick order</p><h2 className="section-title mt-5">Upload once.<br /><em>We handle</em><br />the stack.</h2><p className="mt-6 max-w-sm leading-7 text-[#151412]/65">Drop your notes below or send them to us on WhatsApp. We’ll confirm the count and total before printing.</p><div className="mt-8 flex items-center gap-3 text-sm font-bold"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#9caf8f] text-white"><ShieldCheck className="h-4 w-4" /></span> No files printed without your go-ahead.</div></div><div className="paper-card relative p-5 md:p-8"><div className="flex items-center justify-between border-b border-[#151412]/10 pb-5"><div><p className="eyebrow">File check</p><h3 className="font-display mt-1 text-2xl font-semibold">Build your print list</h3></div><FileText className="h-7 w-7 text-[#e9604c]" /></div><button onClick={() => fileRef.current?.click()} className="mt-6 flex w-full flex-col items-center justify-center border-2 border-dashed border-[#151412]/20 bg-[#f7f3eb] px-5 py-10 text-center transition-colors hover:border-[#e9604c] hover:bg-white"><span className="grid h-12 w-12 place-items-center rounded-full bg-[#151412] text-[#f7f3eb]"><Upload className="h-5 w-5" /></span><span className="mt-4 font-bold">{fileName || "Drop a PDF here, or browse files"}</span><span className="mt-1 text-sm text-[#151412]/45">PDF, PPT, JPG · up to 25 MB</span></button><input ref={fileRef} type="file" accept=".pdf,.ppt,.pptx,.jpg,.jpeg,.png" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} /><div className="mt-7 grid gap-3 md:grid-cols-3">{printOptions.map((option) => <button key={option.title} onClick={() => { setSelectedOption(option.title); toast(`Selected ${option.title}`); }} className={`relative border p-4 text-left transition-all duration-200 hover:-translate-y-1 ${selectedOption === option.title ? "border-[#e9604c] bg-[#fffaf2] shadow-[4px_4px_0_#e9604c]" : "border-[#151412]/15 bg-[#f7f3eb]"}`}><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#e9604c]">{option.tag}</span><p className="mt-3 font-bold">{option.title}</p><p className="mt-1 text-xs text-[#151412]/50">{option.detail}</p>{selectedOption === option.title && <Check className="absolute right-3 top-3 h-4 w-4 text-[#e9604c]" />}</button>)}</div><button onClick={() => toast.success("Ready when you are", { description: "Send your file on WhatsApp and mention: " + selectedOption })} className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-[#151412] px-5 py-4 text-sm font-bold text-white transition-all hover:bg-[#e9604c] active:scale-[.98]">Continue with {selectedOption} <ArrowUpRight className="h-4 w-4" /></button></div></div></section>

        <section id="how-it-works" className="container py-20 md:py-28"><div className="grid gap-12 md:grid-cols-[.62fr_1.38fr] md:gap-20"><div><p className="eyebrow">02 / The easy bit</p><h2 className="section-title mt-5">Three moves.<br /><em>Zero guesswork.</em></h2></div><div className="divide-y divide-[#151412]/15 border-t border-[#151412]/15">{steps.map((step) => <div key={step.no} className="group grid gap-4 py-7 md:grid-cols-[70px_1fr_1.3fr] md:items-center"><span className="font-display text-4xl font-semibold text-[#e9604c]">{step.no}</span><h3 className="font-display text-2xl font-semibold tracking-[-.03em] transition-transform group-hover:translate-x-1">{step.title}</h3><p className="max-w-sm text-sm leading-6 text-[#151412]/60">{step.copy}</p></div>)}</div></div></section>

        <section id="delivery" className="bg-[#151412] py-20 text-[#f7f3eb] md:py-24"><div className="container grid gap-10 md:grid-cols-[1fr_.8fr] md:items-center"><div><p className="eyebrow text-[#f5a094]">03 / Pickup & delivery</p><h2 className="section-title mt-5 text-[#f7f3eb]">Meet your notes<br /><em className="text-[#e9604c]">where you are.</em></h2><p className="mt-7 max-w-md text-lg leading-8 text-[#f7f3eb]/60">Collect from our desk between classes, or let us bring the stack to your hostel, library, or department gate.</p><div className="mt-10 grid gap-4 sm:grid-cols-2"><div className="border border-[#f7f3eb]/15 p-5"><MapPin className="h-6 w-6 text-[#e9604c]" /><p className="mt-7 font-bold">Counter pickup</p><p className="mt-2 text-sm leading-6 text-[#f7f3eb]/55">Free · Ready in 2 hours<br />Campus Gate 2, Shop 04</p></div><div className="border border-[#f7f3eb]/15 p-5"><PackageCheck className="h-6 w-6 text-[#e9604c]" /><p className="mt-7 font-bold">Campus drop</p><p className="mt-2 text-sm leading-6 text-[#f7f3eb]/55">From ₹20 · Same day<br />Order before 5:00 pm</p></div></div></div><div className="relative"><div className="paper-card rotate-2 bg-[#f7f3eb] p-3"><img src={deliveryImage} alt="Printed notes prepared for campus delivery" className="h-[420px] w-full object-cover" /></div><div className="absolute -bottom-5 -left-5 flex items-center gap-3 bg-[#e9604c] px-5 py-4 text-sm font-bold text-white"><Clock3 className="h-5 w-5" /> Live updates on WhatsApp</div></div></div></section>

        <section id="prices" className="container py-20 md:py-28"><div className="flex flex-col justify-between gap-5 border-b border-[#151412]/15 pb-8 md:flex-row md:items-end"><div><p className="eyebrow">04 / Straightforward pricing</p><h2 className="section-title mt-5">Small prices.<br /><em>Big relief.</em></h2></div><p className="max-w-xs text-sm leading-6 text-[#151412]/55">No setup fees. No minimum pages. Final totals are confirmed before we press print.</p></div><div className="mt-8 grid gap-4 md:grid-cols-3"><div className="price-tile"><Printer className="h-6 w-6 text-[#e9604c]" /><p className="mt-9 font-display text-5xl font-semibold tracking-[-.06em]">₹1</p><p className="mt-2 font-bold">B&amp;W / side</p><p className="mt-1 text-sm text-[#151412]/50">Single or double-sided</p></div><div className="price-tile bg-[#e9604c] text-white"><QrCode className="h-6 w-6" /><p className="mt-9 font-display text-5xl font-semibold tracking-[-.06em]">₹5</p><p className="mt-2 font-bold">Colour / side</p><p className="mt-1 text-sm text-white/65">Sharp diagrams, clear charts</p></div><div className="price-tile"><PackageCheck className="h-6 w-6 text-[#9caf8f]" /><p className="mt-9 font-display text-5xl font-semibold tracking-[-.06em]">₹40</p><p className="mt-2 font-bold">Spiral binding</p><p className="mt-1 text-sm text-[#151412]/50">Clean covers, exam-ready stack</p></div></div></section>

        <section className="border-t border-[#151412]/10 bg-[#ebe5d9] py-16"><div className="container flex flex-col items-start justify-between gap-8 md:flex-row md:items-center"><div><p className="eyebrow">Still deciding?</p><h2 className="font-display mt-3 text-4xl font-semibold tracking-[-.05em] md:text-5xl">Send the file. We’ll sort the rest.</h2></div><button onClick={() => scrollTo("order")} className="group inline-flex items-center gap-3 rounded-full bg-[#151412] px-6 py-4 text-sm font-bold text-white transition-all hover:bg-[#e9604c]">Start your print list <ArrowUpRight className="h-4 w-4" /></button></div></section>
      </main>

      <footer className="bg-[#151412] py-10 text-[#f7f3eb]"><div className="container flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#e9604c]"><img src={logoImage} alt="" className="h-6 w-6 mix-blend-multiply" /></span><span className="font-display text-2xl font-semibold tracking-[-.04em]">PrintHub<span className="text-[#e9604c]">.</span></span></div><p className="mt-4 max-w-xs text-sm leading-6 text-white/45">The student-first copy desk for notes, assignments, and everything in between.</p></div><div className="grid gap-2 text-right text-sm text-white/55"><a href="https://wa.me/919999999999" className="font-bold text-[#f7f3eb] hover:text-[#e9604c]">WhatsApp us →</a><span>Campus Gate 2 · Shop 04</span><span>Mon–Sat · 8am–8pm</span></div></div><div className="container mt-10 border-t border-white/10 pt-5 text-[10px] font-bold uppercase tracking-[.14em] text-white/30">© 2026 PrintHub · Made for campus life</div></footer>
    </div>
  );
}
