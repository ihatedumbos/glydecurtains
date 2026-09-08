import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import axiosInstance from '@/api/axiosInstance';

interface StoreLocationSummary {
  id: number;
  city: string;
}

/**
 * Closing trust module for the home page: real store network (never a placeholder
 * count) plus a distinct entry point for trade/bulk buyers, per PRODUCT.md's two
 * equally-important audiences and its "never fabricate store locations" constraint.
 */
export default function TrustBar() {
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get('/stores/public')
      .then((res) => {
        const data: StoreLocationSummary[] = res.data?.data || res.data || [];
        const uniqueCities = Array.from(new Set(data.map((store) => store.city))).filter(Boolean);
        setCities(uniqueCities);
      })
      .catch(() => setCities([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || cities.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="border-t border-[#2c2c2c]/15 bg-[#faf5ea] px-4 py-10 md:px-8"
    >
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
        <Link
          to="/stores"
          className="group flex items-start gap-4 rounded-sm border border-[#2c2c2c]/15 p-5 transition-colors hover:border-[#a06b3a]/50 hover:bg-[#a06b3a]/5"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dashed border-[#a06b3a]/45 text-[#a06b3a]">
            <StorefrontOutlinedIcon fontSize="small" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-[#2c2c2c]">
              Manufacturer-direct, with real stores you can visit
            </span>
            <span className="mt-1 block text-sm text-[#6b5d52]">
              {cities.length === 1
                ? `See our hardware in person in ${cities[0]}.`
                : `See our hardware in person in ${cities.slice(0, -1).join(', ')} and ${cities[cities.length - 1]}.`}
              {' '}
              <span className="font-semibold text-[#a06b3a] group-hover:underline">Find your nearest store →</span>
            </span>
          </span>
        </Link>

        <Link
          to="/contact"
          className="group flex items-start gap-4 rounded-sm border border-[#2c2c2c]/15 p-5 transition-colors hover:border-[#a06b3a]/50 hover:bg-[#a06b3a]/5"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dashed border-[#a06b3a]/45 text-[#a06b3a]">
            <HandshakeOutlinedIcon fontSize="small" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-[#2c2c2c]">
              Sourcing hardware in volume?
            </span>
            <span className="mt-1 block text-sm text-[#6b5d52]">
              Installers and dealers get direct bulk pricing and support.{' '}
              <span className="font-semibold text-[#a06b3a] group-hover:underline">Talk to us →</span>
            </span>
          </span>
        </Link>
      </div>
    </motion.section>
  );
}
