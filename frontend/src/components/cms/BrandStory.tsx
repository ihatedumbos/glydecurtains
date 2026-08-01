import { motion } from 'framer-motion';

interface BrandStoryProps {
  title?: string;
  config?: Record<string, unknown>;
}

export default function BrandStory({ title, config }: BrandStoryProps) {
  const heading = title || 'Our Story';
  const description =
    (config?.description as string) ||
    'At Glyde Curtains, we bring elegance and comfort to your living spaces. With years of expertise in premium window furnishings, we curate the finest curtains, blinds, and accessories that transform your home.';
  const imageBase64 = config?.imageBase64 as string | undefined;

  return (
    <section className="py-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">{heading}</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">{description}</p>
            <div className="mt-8 flex gap-8">
              <div>
                <div className="text-2xl font-bold text-primary">10+</div>
                <div className="text-sm text-gray-500">Years Experience</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">5000+</div>
                <div className="text-sm text-gray-500">Happy Customers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">1000+</div>
                <div className="text-sm text-gray-500">Products</div>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            {imageBase64 ? (
              <img
                src={`data:image/jpeg;base64,${imageBase64}`}
                alt="Brand story"
                className="rounded-2xl shadow-xl w-full h-80 object-cover"
              />
            ) : (
              <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 w-full h-80 flex items-center justify-center">
                <span className="text-6xl opacity-50">🪟</span>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
