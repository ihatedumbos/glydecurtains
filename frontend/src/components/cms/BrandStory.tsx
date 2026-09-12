import { motion } from 'framer-motion';
import WindowOutlinedIcon from '@mui/icons-material/WindowOutlined';

interface BrandStoryStat {
  value: string;
  label: string;
}

interface BrandStoryProps {
  title?: string;
  config?: Record<string, unknown>;
}

export default function BrandStory({ title, config }: BrandStoryProps) {
  const heading = title || 'Our Story';
  const description =
    (config?.description as string) ||
    'Glyde Curtains manufactures curtain track runners, ceiling and wall fittings, and finishing hardware direct from our own facilities, backed by a real network of stores where you can see the product before you buy.';
  const imageBase64 = config?.imageBase64 as string | undefined;
  // Stats are shown only when a real figure was supplied via CMS config -
  // never a hardcoded placeholder number (PRODUCT.md: never fabricate business figures).
  const stats = Array.isArray(config?.stats) ? (config.stats as BrandStoryStat[]) : [];

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
            <h2 className="mb-6 font-display text-3xl text-[#2c2c2c] md:text-4xl">{heading}</h2>
            <p className="text-[#6b5d52] leading-relaxed text-lg">{description}</p>
            {stats.length > 0 && (
              <div className="mt-8 flex gap-8">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <div className="text-2xl font-display text-[#a06b3a]">{stat.value}</div>
                    <div className="text-sm text-[#6b5d52]">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
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
                <WindowOutlinedIcon sx={{ fontSize: 64, opacity: 0.35, color: 'primary.main' }} />
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
