import React from 'react';
import { Language } from '../types';
import { X, BookOpen, CheckCircle2 } from 'lucide-react';

interface TheoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const TheoryDrawer: React.FC<TheoryDrawerProps> = ({ isOpen, onClose, lang }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in">
      <div className="w-full max-w-2xl bg-white border-l border-slate-200 text-slate-800 h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {lang === 'bn' ? 'তত্ত্ব ও গাণিতিক প্রতিপাদন (P-38 & P-40)' : 'Theoretical Foundations & Derivations (P-38 & P-40)'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {lang === 'bn' ? 'উদ্ভাসের পদার্থবিজ্ঞান সিলেবাস অনুযায়ী সম্পূর্ণ প্রমাণ' : 'Comprehensive syllabus reference for Gravitational Dynamics'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 text-sm leading-relaxed bg-slate-50/60">
          {/* Section 1: Solid Earth & Tunnel SHM */}
          <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-600"></span>
              <h3 className="font-bold text-cyan-900 text-base">
                {lang === 'bn' ? '১. পৃথিবীর অভ্যন্তরে সুড়ঙ্গ ও সরল ছন্দিত স্পন্দন (SHM)' : '1. Solid Earth Interior & Tunnel SHM Engine'}
              </h3>
            </div>
            
            <p className="text-slate-600 mb-3">
              {lang === 'bn'
                ? 'গাউসের সূত্র ও নিউটনের শেল উপপাদ্য অনুসারে, পৃথিবী পৃষ্ঠ থেকে r ব্যাসার্ধে অবস্থানকালে শুধুমাত্র r ব্যাসার্ধের ভেতরের গোলকের ভর M(r) কণাটিকে কেন্দ্রের দিকে আকর্ষণ করে। বাইরের খোলকের লব্ধি আকর্ষণ শূন্য।'
                : 'According to Gauss\'s Law for gravity and Newton\'s Shell Theorem, when a body is at radial distance r from Earth\'s center (r < R), only the enclosed sphere of radius r exerts net gravitational attraction:'}
            </p>

            <div className="p-3.5 bg-slate-50 rounded-lg font-mono text-xs text-cyan-900 border border-slate-200 space-y-1.5 font-semibold">
              <div>M(r) = M · (r / R)³</div>
              <div>g(r) = G · M(r) / r² = (G · M / R³) · r = g₀ · (r / R)</div>
              <div>F(r) = -m · g₀ · (r / R) = -k · r &nbsp;&nbsp;[যেখানে k = m · g₀ / R]</div>
            </div>

            <p className="text-slate-600 mt-3 mb-2">
              {lang === 'bn'
                ? 'যেহেতু প্রত্যয়নী বল দূরত্বের সমানুপাতিক ও বিপরীতমুখী (F = -kr), কণাটির গতি হবে বিশুদ্ধ সরল ছন্দিত স্পন্দন (Simple Harmonic Motion):'
                : 'Since restoring force is directly proportional to displacement and directed towards the center (F = -kr), the capsule undergoes pure Simple Harmonic Motion:'}
            </p>

            <div className="p-3.5 bg-slate-50 rounded-lg font-mono text-xs text-emerald-900 border border-slate-200 space-y-1.5 font-semibold">
              <div>কৌণিক কম্পাঙ্ক: ω = √(k / m) = √(g₀ / R) ≈ 1.24 × 10⁻³ rad/s</div>
              <div>পূর্ণ পর্যায়কাল: T = 2π √(R / g₀) ≈ 2π √(6.371×10⁶ / 9.8) ≈ 5076 s ≈ 84.6 মিনিট</div>
              <div>এক মেরু থেকে অপর মেরু গমনকাল: t = T / 2 ≈ 42.3 মিনিট</div>
              <div>কেন্দ্রে সর্বোচ্চ বেগ: v_max = √(g₀ · R) ≈ 7902 m/s ≈ 7.9 km/s</div>
            </div>
          </section>

          {/* Section 2: Universal Earth Field & Shielding Theorem */}
          <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-600"></span>
              <h3 className="font-bold text-cyan-900 text-base">
                {lang === 'bn' ? '২. পৃথিবীর অভ্যন্তরে ও বাইরে g এর তারতম্য এবং মহাকর্ষীয় শিল্ডিং' : '2. Variation of g with Depth/Altitude & Newton\'s Shielding'}
              </h3>
            </div>

            <p className="text-slate-600 mb-3">
              {lang === 'bn'
                ? 'নিউটনের শেল উপপাদ্য (Newton\'s Shell Theorem) অনুসারে, সমসত্ত্ব গোলকের ভেতরে যেকোনো গভীরতায় d অবস্থানকালে বাইরের d বেধের সমকেন্দ্রিক গোলকাকার খোলকটি কণাটির ওপর কোনো লব্ধি বল প্রয়োগ করে না (মহাকর্ষীয় শিল্ডিং):'
                : 'According to Newton\'s Shell Theorem, at any depth d inside Earth, the outer concentric spherical shell of thickness d exerts net ZERO gravitational force (Gravitational Shielding):'}
            </p>

            <div className="p-3.5 bg-slate-50 rounded-lg font-mono text-xs text-amber-900 border border-slate-200 space-y-1.5 font-semibold">
              <div>অভ্যন্তরে (r &lt; R, গভীরতা d = R - r):</div>
              <div>শিল্ডেড বাইরের খোলকের লব্ধি বল: Σ F_shell ≡ 0 N</div>
              <div>কার্যকর আবদ্ধ ভর: M_enc = M · (r / R)³</div>
              <div>অভ্যন্তরীণ ত্বরণ: g(d) = g₀ · (1 - d / R) = g₀ · (r / R) &nbsp;[রৈখিক হ্রাস]</div>
              <div>কেন্দ্রে (d = R, r = 0): g ≡ 0.00 m/s² (সম্পূর্ণ ওজনহীনতা)</div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-lg font-mono text-xs text-cyan-900 border border-slate-200 space-y-1.5 font-semibold mt-2.5">
              <div>বাইরে (r ≥ R, উচ্চতা h = r - R):</div>
              <div>সম্পূর্ণ ভর কেন্দ্রে পুঞ্জীভূত বিন্দু ভরের ন্যায় আকর্ষণ করে:</div>
              <div>g(h) = G · M / (R + h)² = g₀ · [R / (R + h)]² &nbsp;[ব্যস্তানুপাতিক সূত্র]</div>
              <div>কক্ষীয় দ্রুতি: v_orb = √(G · M / r) &nbsp;&nbsp;|&nbsp;&nbsp; মুক্তিবেগ: v_esc = √(2G · M / r)</div>
            </div>

            <p className="text-xs text-slate-500 mt-3">
              {lang === 'bn'
                ? 'ঘনকোণ প্রতিপাদন (Solid Angle Proof): যেকোনো বিন্দুগামী বিপরীতমুখী দুটি শঙ্কুর বিপরীত পৃষ্ঠতল উপাদান dM ∝ r² এবং মহাকর্ষ বল F ∝ dM / r² ∝ r² / r² = ধ্রুবক। ফলে প্রতিটি বিপরীতে থাকা উপাদানের আকর্ষণ বল পরস্পরকে নিখুঁতভাবে নাকচ (F₁ = -F₂) করে দেয়!'
                : 'Solid Angle Proof: For two opposing cone pencils through any interior point, mass dM ∝ r² while Newton attraction F ∝ dM/r² ∝ r²/r² = const. Opposing gravitational pulls cancel out identically (F₁ = -F₂), resulting in zero net shell force!'}
            </p>
          </section>

          {/* Section 3: Earth's Rotation & Latitude Variations */}
          <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
              <h3 className="font-bold text-rose-900 text-base">
                {lang === 'bn' ? '৩. পৃথিবীর আহ্নিক গতি ও অক্ষাংশের প্রভাব (g_λ ও সংকট ঘূর্ণন)' : '3. Earth\'s Diurnal Rotation & Latitude Variations (g_λ)'}
              </h3>
            </div>

            <p className="text-slate-600 mb-3">
              {lang === 'bn'
                ? 'পৃথিবীর নিজ অক্ষের চারদিকে কৌণিক বেগ ω এর কারণে অক্ষাংশ λ তে অবস্থিত যেকোনো বস্তু একটি কেন্দ্রাতিগ ত্বরণ a_c অনুভব করে, যা ব্যাসার্ধ বরাবর অভিকর্ষের বিপরীতে কার্যকর হয়।'
                : 'Due to Earth\'s rotation at angular speed ω, a body at latitude λ experiences a centrifugal acceleration a_c acting perpendicular to the axis of rotation:'}
            </p>

            <div className="p-3.5 bg-slate-50 rounded-lg font-mono text-xs text-rose-900 border border-slate-200 space-y-1.5 font-semibold">
              <div>কেন্দ্রাতিগ ত্বরণ: a_c = ω² · (R · cos λ)</div>
              <div>ব্যাসার্ধমুখী হ্রাসকৃত মান: Δg = a_c · cos λ = ω² · R · cos² λ</div>
              <div>কার্যকর অভিকর্ষজ ত্বরণ: g\' = g₀ - ω² · R · cos² λ</div>
              <div>আপাত ওজন: W_app = m · g\'</div>
            </div>

            <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-lg space-y-2">
              <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-rose-600" />
                <span>{lang === 'bn' ? '১৭ গুণ গতিতে বিষুবরেখায় ওজনহীনতা:' : '17× Critical Rotation Condition at Equator:'}</span>
              </div>
              <p className="text-xs text-rose-950 font-mono font-medium">
                বিষুবরেখায় (λ = 0°): g\' = g₀ - ω² · R = 0
                <br />
                ⟹ ω_crit = √(g₀ / R) ≈ 1.24 × 10⁻³ rad/s
                <br />
                ⟹ ω_crit / ω₀ ≈ (1.24 × 10⁻³) / (7.292 × 10⁻⁵) ≈ 17.02 গুণ!
              </p>
              <p className="text-xs text-slate-600">
                {lang === 'bn'
                  ? 'অর্থাৎ পৃথিবী বর্তমানের চেয়ে ১৭ গুণ দ্রুত ঘুরলে বিষুবরেখায় বস্তুর আপাত ওজন শূন্য হয়ে যাবে এবং তা মহাশূন্যে ভাসতে শুরু করবে!'
                  : 'If Earth spun 17 times faster than its current rate, objects at the Equator would experience zero effective gravity and float off the surface!'}
              </p>
            </div>
          </section>

          {/* Section 4: Shape of the Earth */}
          <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-800 text-sm mb-2">
              {lang === 'bn' ? '৪. পৃথিবীর আকৃতির প্রভাব (কমলালেবুর মতো চাপা)' : '4. Earth\'s Oblate Spheroid Shape'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {lang === 'bn'
                ? 'পৃথিবীর মেরু ব্যাসার্ধ R_p ≈ ৬৩৫৭ কিমি এবং বিষুবীয় ব্যাসার্ধ R_e ≈ ৬৩৭৮ কিমি। g ∝ 1/R² হওয়ায় মেরুতে ব্যাসার্ধ কম থাকায় g এর মান বেশি (~৯.৮৩ m/s²) এবং বিষুবীয় অঞ্চলে ব্যাসার্ধ বেশি হওয়ায় g এর মান কম (~৯.৭৮ m/s²)।'
                : 'Polar radius R_p ≈ 6357 km and Equatorial radius R_e ≈ 6378 km. Since g ∝ 1/R², polar gravity is higher (~9.83 m/s²) while equatorial gravity is lower (~9.78 m/s²) even independent of diurnal rotation.'}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
