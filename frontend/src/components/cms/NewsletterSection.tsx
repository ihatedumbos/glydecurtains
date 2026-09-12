import { useState } from 'react';
import { motion } from 'framer-motion';

interface NewsletterSectionProps {
  title?: string;
}

export default function NewsletterSection({ title }: NewsletterSectionProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setEmail('');
    }
  };

  return (
    <section className="py-16 px-4 md:px-8 bg-gradient-to-br from-primary/10 to-primary/5">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto text-center"
      >
        <h2 className="mb-4 font-display text-2xl text-[#2c2c2c] md:text-3xl">{title || 'Stay Updated'}</h2>
        <p className="text-[#6b5d52] mb-8">
          Subscribe to our newsletter for the latest collections, exclusive offers, and home décor inspiration.
        </p>
        {submitted ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-green-600 font-medium"
          >
            Thank you for subscribing! We'll keep you updated.
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 px-4 py-3 rounded-full border border-[#2c2c2c]/15 bg-[#faf5ea] text-[#2c2c2c] text-sm placeholder:text-[#8a7a6b] focus:outline-none focus:ring-2 focus:ring-[#a06b3a]/40"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-primary text-white font-medium rounded-full hover:bg-primary/90 transition-colors text-sm"
            >
              Subscribe
            </button>
          </form>
        )}
      </motion.div>
    </section>
  );
}
