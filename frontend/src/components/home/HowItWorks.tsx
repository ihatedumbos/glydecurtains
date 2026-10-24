const steps = [
  { title: 'Pick your hardware', detail: 'Browse the catalogue, or filter by product type, and choose sizes and colours.' },
  { title: 'Add it to the cart', detail: 'Build your list in the cart. Nothing to pay online.' },
  { title: 'Send it on WhatsApp', detail: 'Your order opens as a WhatsApp message to us. We reply to confirm price, stock and delivery.' },
];

/** Three-step explainer that matches how ordering actually works on the site. */
export default function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="border-y border-[#dbe1e4] bg-white">
      <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-8 md:py-14">
        <h2 id="how-heading" className="text-2xl font-bold text-[#14232b] md:text-3xl">
          How ordering works
        </h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3 md:gap-6">
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-4 rounded-xl border border-[#dbe1e4] bg-[#f3f5f6] p-5">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#14232b] font-bold text-white"
              >
                {i + 1}
              </span>
              <div>
                <h3 className="font-bold text-[#14232b]">{step.title}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-[#3c4c54]">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
